const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const path       = require('path');
const fs         = require('fs');
require('dotenv').config();

const authRoutes      = require('./routes/auth');
const driveRoutes     = require('./routes/drives');
const studentRoutes   = require('./routes/students');
const activityRoutes  = require('./routes/activity');
const analyticsRoutes = require('./routes/analytics');
const tpoRoutes       = require('./routes/tpo');
const companyRoutes   = require('./routes/company');
const reportRoutes    = require('./routes/reports');
const resumeRoutes    = require('./routes/resume');
const careerRoutes    = require('./routes/career');

const app = express();

// ── Ensure uploads dir exists ──────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ── Middleware ─────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow no-origin (Postman, mobile, etc.) or whitelisted origins
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/drives',    driveRoutes);
app.use('/api/students',  studentRoutes);
app.use('/api/activity',  activityRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/tpo',       tpoRoutes);
app.use('/api/company',   companyRoutes);
app.use('/api/reports',   reportRoutes);
app.use('/api/resume',    resumeRoutes);
app.use('/api/career',    careerRoutes);

// ── Health check ───────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ message: 'CareerConnect API is running 🚀', timestamp: new Date() });
});

// ── Global error handler ───────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

// ── MongoDB + server start ─────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placementDB';
const PORT      = process.env.PORT || 5000;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected:', MONGO_URI);
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
