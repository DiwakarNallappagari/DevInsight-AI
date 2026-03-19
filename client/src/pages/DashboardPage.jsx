import React, { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../utils/api';

const PIE_COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const ScoreRing = ({ score }) => {
  const radius = 36;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <svg width="88" height="88" className="rotate-[-90deg]">
      <circle cx="44" cy="44" r={radius} stroke="#1e293b" strokeWidth="8" fill="none" />
      <circle
        cx="44"
        cy="44"
        r={radius}
        stroke={color}
        strokeWidth="8"
        fill="none"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text
        x="44"
        y="44"
        dominantBaseline="middle"
        textAnchor="middle"
        fill={color}
        fontSize="16"
        fontWeight="bold"
        style={{ transform: 'rotate(90deg)', transformOrigin: '44px 44px' }}
      >
        {score}
      </text>
    </svg>
  );
};

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data);
      } catch (err) {
        if (err?.response?.status === 429) {
          setError('Rate limit exceeded. System is cooling down, please wait a minute.');
        } else {
          setError(err?.response?.data?.message || 'Failed to load stats');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
          <span className="text-xs text-slate-400">Loading dashboard…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="rounded-lg bg-rose-950/40 p-4 text-sm text-rose-400 border border-rose-900/50">{error}</div>;
  }

  const {
    totalAnalyses,
    weeklyUsage,
    mostUsedLanguage,
    remainingUsage,
    averageScore,
    languageDistribution,
    topIssues,
    recentActivity,
    aiInsight,
  } = stats || {};

  const isLimitZero = remainingUsage === 0;

  // Score colour helper
  const scoreColor = (s) =>
    s >= 80 ? 'text-emerald-400' : s >= 60 ? 'text-yellow-400' : 'text-rose-400';
  const scoreBg = (s) =>
    s >= 80
      ? 'bg-emerald-500/10 border-emerald-500/30'
      : s >= 60
      ? 'bg-yellow-500/10 border-yellow-500/30'
      : 'bg-rose-500/10 border-rose-500/30';

  return (
    <div className="space-y-5">
      {/* ── Top stat cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Analyses */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 flex flex-col gap-1">
          <div className="text-xs text-slate-400">Total Analyses</div>
          <div className="text-3xl font-bold text-slate-50">{totalAnalyses ?? 0}</div>
          <div className="text-[10px] text-slate-500">all time</div>
        </div>

        {/* Average Score */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 flex flex-col gap-1">
          <div className="text-xs text-slate-400">Average Score</div>
          {averageScore != null ? (
            <div className={`text-3xl font-bold ${scoreColor(averageScore)}`}>{averageScore}</div>
          ) : (
            <div className="text-3xl font-bold text-slate-600">—</div>
          )}
          <div className="text-[10px] text-slate-500">out of 100</div>
        </div>

        {/* Most Used Language */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 flex flex-col gap-1">
          <div className="text-xs text-slate-400">Top Language</div>
          <div className="text-xl font-semibold text-slate-100 truncate">
            {mostUsedLanguage || '—'}
          </div>
          <div className="text-[10px] text-slate-500">most analyzed</div>
        </div>

        {/* Remaining analyses */}
        <div
          className={`rounded-xl border p-4 flex flex-col gap-1 ${
            isLimitZero
              ? 'border-rose-500/40 bg-rose-950/20'
              : 'border-slate-800 bg-slate-950/80'
          }`}
        >
          <div className="text-xs text-slate-400">Remaining Today</div>
          {remainingUsage === null ? (
            <div className="text-xl font-semibold text-sky-400">Unlimited</div>
          ) : (
            <div className={`text-3xl font-bold ${isLimitZero ? 'text-rose-400' : 'text-sky-400'}`}>
              {remainingUsage}
            </div>
          )}
          {isLimitZero ? (
            <div className="mt-1 rounded bg-rose-600/20 border border-rose-500/30 px-2 py-1 text-[10px] text-rose-300 font-medium">
              ⛔ Limit reached — Upgrade for unlimited
            </div>
          ) : (
            <div className="text-[10px] text-slate-500">free analyses left</div>
          )}
        </div>
      </div>

      {/* ── AI Insight Panel ─────────────────────────────────────────────── */}
      {aiInsight && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4 flex items-start gap-3">
          <div className="text-2xl">🤖</div>
          <div>
            <div className="text-xs font-bold text-purple-300 uppercase tracking-wide mb-1">
              AI Insight — Personalized for You
            </div>
            <p className="text-sm text-purple-100 leading-relaxed">{aiInsight}</p>
          </div>
        </div>
      )}

      {/* ── Weekly usage chart + Language pie ────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Weekly usage area chart */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-950/80 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">📊 Weekly Usage</h2>
            <span className="text-xs text-slate-500">Last 7 days</span>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyUsage || []} margin={{ left: -20, right: 10 }}>
                <defs>
                  <linearGradient id="usage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    border: '1px solid #1e293b',
                    fontSize: 12,
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#0ea5e9"
                  fillOpacity={1}
                  fill="url(#usage)"
                  dot={{ r: 3, fill: '#0ea5e9' }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Language Distribution Pie */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-100">🥧 Language Distribution</h2>
          {languageDistribution && languageDistribution.length > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={languageDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {languageDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      border: '1px solid #1e293b',
                      fontSize: 11,
                      borderRadius: '8px',
                    }}
                    formatter={(value, name) => [`${value} analyses`, name]}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-52 items-center justify-center text-xs text-slate-500 italic">
              No language data yet
            </div>
          )}
        </div>
      </div>

      {/* ── Top Issues + Recent Activity ──────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Issues Tracker */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-100">🧠 Top Issues</h2>
          {topIssues && topIssues.length > 0 ? (
            <div className="space-y-2">
              {topIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-slate-900 px-3 py-2 gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-slate-500 w-4 shrink-0">
                      #{idx + 1}
                    </span>
                    <span className="text-xs text-slate-300 truncate">{issue.issue}</span>
                  </div>
                  <span className="shrink-0 rounded-full bg-rose-600/20 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                    ×{issue.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-xs text-slate-500 italic">
              No issues recorded yet. Run a code analysis to see top issues.
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-100">🕘 Recent Activity</h2>
          {recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-slate-900 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">
                      {item.language === 'Python'
                        ? '🐍'
                        : item.language === 'JavaScript'
                        ? '🟨'
                        : item.language === 'TypeScript'
                        ? '🔷'
                        : item.language === 'Java'
                        ? '☕'
                        : '💻'}
                    </span>
                    <div>
                      <div className="text-xs font-medium text-slate-200">
                        Analyzed {item.language} code
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`rounded border px-2 py-0.5 text-[10px] font-bold ${scoreBg(item.score)} ${scoreColor(item.score)}`}
                  >
                    Score: {item.score}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-xs text-slate-500 italic">
              No activity yet. Analyze your first code snippet!
            </div>
          )}
        </div>
      </div>

      {/* ── Upgrade Banner (shown when limit is 0) ───────────────────────── */}
      {isLimitZero && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-amber-300 mb-1">
              ⚡ You've used all your free analyses today
            </div>
            <p className="text-xs text-amber-200/70">
              Upgrade to Pro for unlimited analyses, priority AI, and advanced reports.
            </p>
          </div>
          <button
            className="shrink-0 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-900 hover:bg-amber-400 transition"
            onClick={() => alert('Upgrade feature coming soon! 🚀')}
          >
            Upgrade to Pro
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
