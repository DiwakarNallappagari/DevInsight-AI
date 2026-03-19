const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");

dotenv.config();

const { connectDB } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const analysisRoutes = require("./routes/analysisRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const findAvailablePort = require("./utils/portFinder");
const getDashboardHtml = require("./utils/dashboardHtml");
const mongoose = require("mongoose");
const os = require("os");

const app = express();

// ======================
// Security Middleware
// ======================
app.use(helmet());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

app.use(express.json());

// ======================
// Rate Limiting
// ======================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased to 500 to allow for telemetry polling
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later.",
});

app.use("/api", apiLimiter);

// ======================
// Root Route (Wow Feature #1: Stunning Interactive Dashboard)
// ======================
app.get("/", (req, res) => {
  const dbState = mongoose.connection.readyState;
  let dbStatus = "Disconnected";
  if (dbState === 1) dbStatus = "Connected";
  else if (dbState === 2) dbStatus = "Connecting";

  const html = getDashboardHtml(req.app.locals.port || process.env.PORT || 5000, dbStatus);
  res.send(html);
});

// ======================
// System Monitor Route (Wow Feature #2: Telemetry API)
// ======================
app.get("/api/system-monitor", (req, res) => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  
  res.status(200).json({
    status: "success",
    data: {
      uptime: process.uptime(),
      memory: {
        total: totalMem,
        free: freeMem,
        used: totalMem - freeMem,
        usagePercent: (((totalMem - freeMem) / totalMem) * 100).toFixed(2)
      },
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0].model,
        loadavg: os.loadavg()
      },
      os: {
        platform: os.platform(),
        release: os.release()
      },
      timestamp: new Date()
    }
  });
});

// ======================
// Health Check
// ======================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "DevInsight AI API",
    time: new Date(),
  });
});

// ======================
// API Routes
// ======================
app.use("/api/auth", authRoutes);
app.use("/api", analysisRoutes);
app.use("/api", dashboardRoutes);

// ======================
// Error Middleware
// ======================
app.use(notFound);
app.use(errorHandler);

// ======================
// Server Start
// ======================
const startServer = async () => {
  try {
    const initialPort = parseInt(process.env.PORT || 5000, 10);
    const PORT = await findAvailablePort(initialPort);
    app.locals.port = PORT; // Save dynamic port for the dashboard

    app.listen(PORT, "0.0.0.0", () => {
      console.log("=================================");
      console.log("🚀 DevInsight AI Backend Started");
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`❤️ Health Check: http://localhost:${PORT}/health`);
      console.log("=================================");
    });
  } catch (err) {
    console.error("❌ Failed to bind port:", err.message);
  }
};

startServer();

// Then connect DB (separately)
connectDB().catch((err) => {
  console.error("❌ MongoDB Connection Error:", err.message);
});

module.exports = app;