const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { sanitizeInput } = require('../utils/sanitize');

// POST /api/auth/signup
router.post('/signup', [
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], validate, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username: sanitizeInput(username) }],
    });

    if (existingUser) {
      return res.status(400).json({
        error: existingUser.email === email
          ? 'Email already registered'
          : 'Username already taken',
      });
    }

    const user = await User.create({
      username: sanitizeInput(username),
      email,
      password,
    });

    const token = user.generateToken();

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
        theme: user.theme,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
], validate, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Your account has been suspended' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    user.checkPremiumStatus();
    if (user.isModified()) {
      await user.save();
    }

    const token = user.generateToken();

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
        premiumPlan: user.premiumPlan,
        premiumExpiry: user.premiumExpiry,
        theme: user.theme,
        totalDownloads: user.totalDownloads,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
        premiumPlan: user.premiumPlan,
        premiumExpiry: user.premiumExpiry,
        theme: user.theme,
        totalDownloads: user.totalDownloads,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/auth/settings
router.put('/settings', protect, [
  body('username').optional().trim().isLength({ min: 3, max: 30 }),
  body('theme').optional().isIn(['light', 'dark']),
  body('currentPassword').optional(),
  body('newPassword').optional().isLength({ min: 6 }),
], validate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    const { username, theme, currentPassword, newPassword } = req.body;

    if (username && username !== user.username) {
      const existing = await User.findOne({ username: sanitizeInput(username) });
      if (existing) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      user.username = sanitizeInput(username);
    }

    if (theme) {
      user.theme = theme;
    }

    if (currentPassword && newPassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      user.password = newPassword;
    }

    await user.save();

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
        theme: user.theme,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error updating settings' });
  }
});

module.exports = router;
