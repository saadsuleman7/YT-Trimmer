const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { fetchMetadata } = require('../utils/videoProcessor');
const { optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

// POST /api/videos/metadata
router.post('/metadata', optionalAuth, [
  body('url').isURL().withMessage('Please provide a valid URL'),
], validate, async (req, res) => {
  try {
    const metadata = await fetchMetadata(req.body.url);

    // Determine user tier for quality filtering
    const isPremium = req.user?.isPremium || false;
    const isGuest = !req.user;

    // Filter formats based on user tier
    const maxHeight = isPremium ? 4320 : 720;
    const maxFps = isPremium ? 120 : 24;

    const filteredFormats = metadata.formats.map(f => ({
      ...f,
      isLocked: f.height > maxHeight,
      requiresPremium: f.height > 720,
    }));

    const fpsOptions = (metadata.availableFps || []).map(fps => ({
      fps,
      isLocked: fps > maxFps,
      requiresPremium: fps > 24,
    }));

    res.json({
      ...metadata,
      formats: filteredFormats,
      fpsOptions,
      userTier: isPremium ? 'premium' : (isGuest ? 'guest' : 'free'),
    });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to fetch video information' });
  }
});

module.exports = router;
