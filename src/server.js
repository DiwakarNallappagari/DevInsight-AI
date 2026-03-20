require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { connectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & CORS
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later.',
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', analysisRoutes);
app.use('/api', dashboardRoutes);

// ======================
// Health check
// ======================
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ======================
// 🔥 TRACKING ROUTE (DevInsight)
// ======================
app.get('/track-devinsight', (req, res) => {
    console.log("🔥 DevInsight AI Opened!");
    console.log("Time:", new Date());
    console.log("IP:", req.headers["x-forwarded-for"] || req.socket.remoteAddress);

    res.redirect("https://dev-insight-ai-five.vercel.app");
});

// ======================
// Error handling
// ======================
app.use(errorHandler);

// ======================
// Start
// ======================
const start = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
};

start();