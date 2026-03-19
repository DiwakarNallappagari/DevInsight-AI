const Analysis = require('../models/Analysis');

const FREE_USER_DAILY_LIMIT = 50;

const getTodayRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { start, end };
};

const getLastNDaysRange = (days) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { start, end };
};

const getRemainingUsage = async (userId, role) => {
  if (role === 'admin') {
    return null;
  }
  const { start, end } = getTodayRange();
  const todayCount = await Analysis.countDocuments({
    user: userId,
    createdAt: { $gte: start, $lt: end },
  });
  return Math.max(0, FREE_USER_DAILY_LIMIT - todayCount);
};

const getDashboardStats = async (user) => {
  const userId = user.id || user._id;

  // Total analyses for this user
  const totalAnalyses = await Analysis.countDocuments({ user: userId });

  // Weekly usage (last 7 days, grouped per day)
  const { start, end } = getLastNDaysRange(7);
  const rawWeek = await Analysis.aggregate([
    {
      $match: {
        user: userId,
        createdAt: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  // Normalize to an ordered array for the last 7 days
  const dayMap = {};
  rawWeek.forEach((item) => {
    const { year, month, day } = item._id;
    const key = `${year}-${month}-${day}`;
    dayMap[key] = item.count;
  });

  const weeklyUsage = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    weeklyUsage.push({
      date: d.toISOString().slice(0, 10),
      count: dayMap[key] || 0,
    });
  }

  // Most used language for this user
  const langAgg = await Analysis.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: '$language',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 1 },
  ]);

  const mostUsedLanguage = langAgg[0]?._id || null;

  // ── Average Score ─────────────────────────────────────────────────────────
  const scoreAgg = await Analysis.aggregate([
    { $match: { user: userId } },
    { $group: { _id: null, avg: { $avg: '$score' } } },
  ]);
  const averageScore = scoreAgg[0]?.avg != null ? Math.round(scoreAgg[0].avg) : null;

  // ── Language Distribution (pie chart data) ────────────────────────────────
  const langDistAgg = await Analysis.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: '$language',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);
  const languageDistribution = langDistAgg
    .filter((l) => l._id && l._id !== 'unknown')
    .map((l) => ({ name: l._id, value: l.count }));

  // ── Top Issues Tracker ─────────────────────────────────────────────────────
  // Aggregate all bugs + improvements across user analyses to find most common
  const allAnalyses = await Analysis.find({ user: userId })
    .select('bugs improvements security')
    .lean();

  const issueCountMap = {};
  allAnalyses.forEach((a) => {
    const allIssues = [
      ...(a.bugs || []),
      ...(a.improvements || []),
      ...(a.security || []),
    ];
    allIssues.forEach((issue) => {
      // Normalize issue text: strip emoji and take first 80 chars as key
      const cleaned = issue.replace(/[^\w\s]/g, '').trim().slice(0, 80).toLowerCase();
      if (cleaned.length > 5) {
        issueCountMap[cleaned] = (issueCountMap[cleaned] || 0) + 1;
      }
    });
  });

  const topIssues = Object.entries(issueCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([issue, count]) => ({
      // Capitalize first letter for display
      issue: issue.charAt(0).toUpperCase() + issue.slice(1),
      count,
    }));

  // ── Recent Activity (last 5 analyses) ────────────────────────────────────
  const recentRaw = await Analysis.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('language score createdAt')
    .lean();

  const recentActivity = recentRaw.map((a) => ({
    language: a.language || 'Unknown',
    score: a.score || 0,
    createdAt: a.createdAt,
  }));

  // ── AI Insights Panel ─────────────────────────────────────────────────────
  let aiInsight = null;
  if (allAnalyses.length >= 2) {
    // Find the most common category of issue
    const bugCount = allAnalyses.reduce((sum, a) => sum + (a.bugs?.length || 0), 0);
    const improvCount = allAnalyses.reduce((sum, a) => sum + (a.improvements?.length || 0), 0);
    const secCount = allAnalyses.reduce((sum, a) => sum + (a.security?.length || 0), 0);

    const hasPoorNaming = allAnalyses.some((a) =>
      (a.improvements || []).some((i) => i.toLowerCase().includes('naming') || i.toLowerCase().includes('variable name'))
    );
    const hasMissingComments = allAnalyses.some((a) =>
      (a.improvements || []).some((i) => i.toLowerCase().includes('comment') || i.toLowerCase().includes('docstring'))
    );
    const hasSecurityIssues = secCount > 0;
    const hasBugs = bugCount > 0;

    const insights = [];
    if (hasPoorNaming) insights.push('You frequently use poor variable names. Focus on descriptive naming for readability.');
    if (hasMissingComments) insights.push('Your code often lacks comments or docstrings. Add documentation to improve maintainability.');
    if (hasSecurityIssues) insights.push('You have recurring security issues. Always sanitize inputs and avoid eval().');
    if (hasBugs && bugCount > improvCount) insights.push('Critical bugs appear often in your code. Focus on error handling and edge cases.');
    if (averageScore !== null && averageScore < 70) insights.push(`Your average score is ${averageScore}/100. Focus on reducing bugs and improving code structure.`);
    if (averageScore !== null && averageScore >= 90) insights.push(`Excellent work! Your average score is ${averageScore}/100. Keep writing clean, well-structured code.`);

    aiInsight = insights.length > 0 ? insights[0] : `You have analyzed ${totalAnalyses} code snippet(s). Keep reviewing code regularly to spot patterns!`;
  } else if (totalAnalyses === 1) {
    aiInsight = 'Great start! Run more analyses to unlock personalized AI insights about your coding patterns.';
  }

  const remainingUsage = await getRemainingUsage(userId, user.role);

  return {
    totalAnalyses,
    weeklyUsage,
    mostUsedLanguage,
    remainingUsage,
    averageScore,
    languageDistribution,
    topIssues,
    recentActivity,
    aiInsight,
  };
};

const getHistory = async (user, limit = 20) => {
  const userId = user.id || user._id;

  const analyses = await Analysis.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return analyses.map((a) => ({
    id: a._id,
    createdAt: a.createdAt,
    language: a.language,
    summary: a.summary || a.result?.summary || null,
    qualityScore: a.score || a.result?.score || 0,
    code: a.code,
    bugs: a.bugs || [],
    improvements: a.improvements || [],
    security: a.security || [],
    suggestions: a.suggestions || [],
  }));
};

module.exports = {
  getDashboardStats,
  getHistory,
};
