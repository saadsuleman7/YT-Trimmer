const mongoose = require('mongoose');

const paymentConfigSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['crypto', 'easypaisa', 'paypal', 'bank_transfer'],
    required: true,
    unique: true,
  },
  isEnabled: {
    type: Boolean,
    default: true,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  instructions: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('PaymentConfig', paymentConfigSchema);
