const { getDashboardStats, getHistory, getSystemStats } = require('../services/dashboardService');

const getStats = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const stats = await getDashboardStats(user);
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};

const getUserHistory = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const limit = parseInt(req.query.limit, 10) || 20;
    const history = await getHistory(user, limit);

    res.status(200).json({ items: history });
  } catch (error) {
    next(error);
  }
};

const getSystemMonitor = async (req, res, next) => {
  try {
    const stats = await getSystemStats();
    res.status(200).json({ data: stats });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getUserHistory,
  getSystemMonitor,
};


