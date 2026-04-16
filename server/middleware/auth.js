const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token - required
const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authorized, no token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Your account has been suspended' });
    }

    // Check and update premium status
    user.checkPremiumStatus();
    if (user.isModified()) {
      await user.save();
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Not authorized, invalid token' });
  }
};

// Optional auth - sets req.user if token present but doesn't require it
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && !user.isBanned) {
        user.checkPremiumStatus();
        if (user.isModified()) {
          await user.save();
        }
        req.user = user;
      }
    }
    next();
  } catch {
    next();
  }
};

// Admin only
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Admin access required' });
};

// Premium only
const premiumOnly = (req, res, next) => {
  if (req.user && req.user.isPremium) {
    return next();
  }
  return res.status(403).json({ error: 'Premium subscription required' });
};

module.exports = { protect, optionalAuth, adminOnly, premiumOnly };
