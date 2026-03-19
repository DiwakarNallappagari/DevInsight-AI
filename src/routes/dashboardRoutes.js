const express = require('express');
const { getStats, getUserHistory } = require('../controllers/dashboardController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/dashboard/stats
router.get('/dashboard/stats', authMiddleware, getStats);

// GET /api/history
router.get('/history', authMiddleware, getUserHistory);

module.exports = router;


