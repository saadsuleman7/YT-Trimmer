const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const Rating = require('../models/Rating');
const { optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { sanitizeInput } = require('../utils/sanitize');

// POST /api/ratings
router.post('/', optionalAuth, [
  body('stars').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 500 }),
  body('guestName').optional().trim().isLength({ max: 50 }),
], validate, async (req, res) => {
  try {
    const { stars, comment, guestName } = req.body;

    const rating = await Rating.create({
      user: req.user?._id || null,
      guestName: req.user?.username || sanitizeInput(guestName) || 'Anonymous',
      stars,
      comment: comment ? sanitizeInput(comment) : '',
      isApproved: !!req.user, // Auto-approve for logged-in users
    });

    res.status(201).json({ rating });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// GET /api/ratings
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [ratings, total, avgResult] = await Promise.all([
      Rating.find({ isApproved: true, isVisible: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'username')
        .lean(),
      Rating.countDocuments({ isApproved: true, isVisible: true }),
      Rating.aggregate([
        { $match: { isApproved: true, isVisible: true } },
        { $group: { _id: null, avgStars: { $avg: '$stars' }, total: { $sum: 1 } } },
      ]),
    ]);

    const averageRating = avgResult.length > 0 ? Math.round(avgResult[0].avgStars * 10) / 10 : 0;
    const totalRatings = avgResult.length > 0 ? avgResult[0].total : 0;

    res.json({
      ratings: ratings.map(r => ({
        ...r,
        displayName: r.user?.username || r.guestName || 'Anonymous',
      })),
      averageRating,
      totalRatings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

module.exports = router;
