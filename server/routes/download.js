const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const geoip = require('geoip-lite');
const { downloadVideo, deleteFile } = require('../utils/videoProcessor');
const { optionalAuth, protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const Download = require('../models/Download');
const User = require('../models/User');

// POST /api/downloads/start
router.post('/start', optionalAuth, [
  body('url').isURL().withMessage('Please provide a valid URL'),
  body('format').isIn(['mp4', 'mp3']).withMessage('Invalid format'),
  body('quality').optional().isString(),
  body('trimStart').optional().isNumeric(),
  body('trimEnd').optional().isNumeric(),
  body('fps').optional().isNumeric(),
  body('title').optional().isString(),
  body('thumbnail').optional().isString(),
  body('mute').optional().isBoolean(),
], validate, async (req, res) => {
  try {
    const { url, format, quality, trimStart, trimEnd, fps, title, thumbnail, mute } = req.body;

    const isPremium = req.user?.isPremium || false;
    const requestedHeight = parseInt(quality, 10) || 720;
    const requestedFps = fps || 24;

    // Enforce quality restrictions
    if (!isPremium) {
      if (requestedHeight > 720) {
        return res.status(403).json({
          error: 'Premium subscription required for quality above 720p',
          requiresUpgrade: true,
        });
      }
      if (requestedFps > 24) {
        return res.status(403).json({
          error: 'Premium subscription required for frame rates above 24fps',
          requiresUpgrade: true,
        });
      }
    }

    // Resolve country from IP
    const rawIp = req.ip || req.connection?.remoteAddress || '';
    const cleanIp = rawIp.replace(/^::ffff:/, '');
    const geo = geoip.lookup(cleanIp);
    const country = geo?.country || null;

    // Create download record
    const download = await Download.create({
      user: req.user?._id || null,
      videoUrl: url,
      videoTitle: title || 'Unknown',
      videoThumbnail: thumbnail || null,
      format,
      quality: quality || '720',
      fps: requestedFps,
      trimStart: trimStart || 0,
      trimEnd: trimEnd || null,
      status: 'processing',
      ipAddress: cleanIp,
      country,
    });

    // Process download
    const result = await downloadVideo({
      url,
      quality: isPremium ? (quality || '720') : Math.min(requestedHeight, 720).toString(),
      format,
      trimStart,
      trimEnd,
      fps: isPremium ? requestedFps : Math.min(requestedFps, 24),
      mute: format !== 'mp3' ? !!mute : false,
    });

    // Update download record
    download.status = 'completed';
    download.fileSize = result.fileSize;
    await download.save();

    // Update user download count
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { $inc: { totalDownloads: 1 } });
    }

    res.json({
      downloadId: download._id,
      fileName: result.fileName,
      fileSize: result.fileSize,
      downloadUrl: `/api/downloads/file/${result.fileName}`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Download failed' });
  }
});

// GET /api/downloads/file/:filename
router.get('/file/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  // Prevent path traversal
  if (filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  const filePath = path.join(__dirname, '..', 'downloads', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found or expired' });
  }

  const ext = path.extname(filename).slice(1);
  const contentType = ext === 'mp3' ? 'audio/mpeg' : 'video/mp4';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.sendFile(filePath);
});

// DELETE /api/downloads/file/:filename — cleanup on demand
router.delete('/file/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  if (filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  deleteFile(filename);
  res.json({ message: 'File deleted' });
});

// POST /api/downloads/cleanup/:filename — for sendBeacon on page close
router.post('/cleanup/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  if (filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  deleteFile(filename);
  res.json({ message: 'File deleted' });
});

// GET /api/downloads/history
router.get('/history', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [downloads, total] = await Promise.all([
      Download.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Download.countDocuments({ user: req.user._id }),
    ]);

    res.json({
      downloads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch download history' });
  }
});

// DELETE /api/downloads/history
router.delete('/history', protect, async (req, res) => {
  try {
    const result = await Download.deleteMany({ user: req.user._id });
    await User.findByIdAndUpdate(req.user._id, { totalDownloads: 0 });
    res.json({ message: 'Download history cleared', deleted: result.deletedCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear download history' });
  }
});

module.exports = router;
