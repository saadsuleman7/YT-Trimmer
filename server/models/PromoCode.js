const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  premiumDays: {
    type: Number,
    required: true,
    min: 1,
  },
  maxUses: {
    type: Number,
    required: true,
    min: 1,
  },
  currentUses: {
    type: Number,
    default: 0,
  },
  usedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  expiresAt: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

promoCodeSchema.index({ code: 1 });
promoCodeSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('PromoCode', promoCodeSchema);
