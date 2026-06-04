require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const passport = require('passport');

const { logger } = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/error');
const { initializeSuperAdmin } = require('./utils/seed');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const goalRoutes = require('./routes/goals');
const habitRoutes = require('./routes/habits');
const noteRoutes = require('./routes/notes');
const focusRoutes = require('./routes/focus');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin');
const superAdminRoutes = require('./routes/superAdmin');
const analyticsRoutes = require('./routes/analytics');
const notificationRoutes = require('./routes/notifications');
const searchRoutes = require('./routes/search');
const activityRoutes = require('./routes/activity');

// Passport config
require('./config/passport');

const app = express();

// --- CRITICAL FIX FOR RENDER DEPLOYMENTS ---
// Tells Express to trust Render's reverse proxy headers (X-Forwarded-For)
// This fixes BOTH your 429 Rate Limiter loops and the secure cookie drop issues.
app.enable('trust proxy');

// Security Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting (Global API)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  // Fix: Explicitly validate proxy behavior so it isolates client IPs
  validate: { trustProxy: true },
});
app.use('/api/', limiter);

// Auth rate limiting (Login/OAuth endpoints)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  // Fix: Explicitly validate proxy behavior so it isolates client IPs
  validate: { trustProxy: true },
});
app.use('/api/auth/', authLimiter);

// Body parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Passport
app.use(passport.initialize());

// Static files
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/activity', activityRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  logger.info(`🚀 VidyutDhar server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV}`);

  // Initialize Super Admin
  try {
    await initializeSuperAdmin();
    logger.info('✅ Super Admin initialized');
  } catch (err) {
    logger.error('❌ Super Admin initialization failed:', err.message);
  }
});

module.exports = app;