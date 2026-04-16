const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  premiumExpiry: {
    type: Date,
    default: null,
  },
  premiumPlan: {
    type: String,
    enum: ['weekly', 'monthly', null],
    default: null,
  },
  stripeCustomerId: {
    type: String,
    default: null,
  },
  stripeSubscriptionId: {
    type: String,
    default: null,
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'dark',
  },
  country: {
    type: String,
    default: null,
  },
  avatar: {
    type: String,
    default: null,
  },
  totalDownloads: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT
userSchema.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role, isPremium: this.isPremium },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Check if premium is still active
userSchema.methods.checkPremiumStatus = function () {
  if (this.isPremium && this.premiumExpiry && this.premiumExpiry < new Date()) {
    this.isPremium = false;
    this.premiumPlan = null;
    return false;
  }
  return this.isPremium;
};

module.exports = mongoose.model('User', userSchema);
