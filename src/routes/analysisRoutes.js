const express = require('express');
const { analyze, explain, explainSimply, refactor, analyzeGithub } = require('../controllers/analysisController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/analyze
router.post('/analyze', authMiddleware, analyze);

// POST /api/explain
router.post('/explain', authMiddleware, explain);

// POST /api/explain-simple
router.post('/explain-simple', authMiddleware, explainSimply);

// POST /api/refactor
router.post('/refactor', authMiddleware, refactor);

// POST /api/github/analyze
router.post('/github/analyze', authMiddleware, analyzeGithub);

module.exports = router;
