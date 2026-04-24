const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'usd',
  },
  plan: {
    type: String,
    required: true,
  },
  method: {
    type: String,
    enum: ['stripe', 'crypto', 'easypaisa', 'paypal', 'bank_transfer', 'upi'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'refunded'],
    default: 'pending',
  },
  stripePaymentId: {
    type: String,
    default: null,
  },
  stripeSubscriptionId: {
    type: String,
    default: null,
  },
  // Manual payment fields
  transactionId: {
    type: String,
    default: null,
  },
  proofImage: {
    type: String,
    default: null,
  },
  senderDetails: {
    type: String,
    default: null,
  },
  adminNotes: {
    type: String,
    default: null,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
