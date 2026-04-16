const mongoose = require('mongoose');

const downloadSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  videoUrl: {
    type: String,
    required: true,
  },
  videoTitle: {
    type: String,
    required: true,
  },
  videoThumbnail: {
    type: String,
    default: null,
  },
  format: {
    type: String,
    enum: ['mp4', 'mp3'],
    required: true,
  },
  quality: {
    type: String,
    required: true,
  },
  fps: {
    type: Number,
    default: null,
  },
  trimStart: {
    type: Number,
    default: 0,
  },
  trimEnd: {
    type: Number,
    default: null,
  },
  duration: {
    type: Number,
    default: null,
  },
  fileSize: {
    type: Number,
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  ipAddress: {
    type: String,
    default: null,
  },
  country: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

downloadSchema.index({ user: 1, createdAt: -1 });
downloadSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Download', downloadSchema);
