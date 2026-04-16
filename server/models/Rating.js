const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  guestName: {
    type: String,
    default: 'Anonymous',
  },
  stars: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    maxlength: 500,
    default: '',
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  isVisible: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Rating', ratingSchema);
