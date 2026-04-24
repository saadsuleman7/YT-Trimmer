require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/video');
const downloadRoutes = require('./routes/download');
const ratingRoutes = require('./routes/rating');
const paymentRoutes = require('./routes/payment');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');
const secretRoutes = require('./routes/secret');

const app = express();

// Connect to database
connectDB();

// Subscription expiry checker (runs daily at midnight)
try { require('./utils/subscriptionCron'); } catch (err) { console.error('[Cron] Failed to start:', err.message); }

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many authentication attempts, please try again later.' },
});
app.use('/api/auth/', authLimiter);

// Stripe webhook needs raw body - must be before express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
// PayPal webhook also uses JSON body but we verify signature via API call, so regular JSON is fine
// (the verify-webhook-signature endpoint re-signs the event on our behalf)

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/downloads', downloadRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/secret', secretRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
