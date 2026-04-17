const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const Download = require('../models/Download');
const Payment = require('../models/Payment');
const Rating = require('../models/Rating');
const Contact = require('../models/Contact');
const PaymentConfig = require('../models/PaymentConfig');

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalUsers,
      premiumUsers,
      totalDownloads,
      todayDownloads,
      weekDownloads,
      totalRevenue,
      monthRevenue,
      avgRating,
      recentUsers,
      formatStats,
      qualityStats,
      dailyDownloads,
      topCountries,
      pendingPayments,
      paymentsByMethod,
      dailyRevenue,
      paymentsByPlan,
      totalPayments,
      dailyUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isPremium: true }),
      Download.countDocuments(),
      Download.countDocuments({ createdAt: { $gte: today } }),
      Download.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Payment.aggregate([
        { $match: { status: { $in: ['completed', 'approved'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: { status: { $in: ['completed', 'approved'] }, createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Rating.aggregate([
        { $match: { isApproved: true } },
        { $group: { _id: null, avg: { $avg: '$stars' } } },
      ]),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Download.aggregate([
        { $group: { _id: '$format', count: { $sum: 1 } } },
      ]),
      Download.aggregate([
        { $group: { _id: '$quality', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Download.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Download.aggregate([
        { $match: { country: { $ne: null } } },
        { $group: { _id: '$country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Payment.countDocuments({ status: 'pending' }),
      Payment.aggregate([
        { $match: { status: { $in: ['completed', 'approved'] } } },
        { $group: { _id: '$method', count: { $sum: 1 }, total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
      ]),
      Payment.aggregate([
        { $match: { status: { $in: ['completed', 'approved'] }, createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Payment.aggregate([
        { $match: { status: { $in: ['completed', 'approved'] } } },
        { $group: { _id: '$plan', count: { $sum: 1 }, total: { $sum: '$amount' } } },
      ]),
      Payment.countDocuments({ status: { $in: ['completed', 'approved'] } }),
      User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      stats: {
        totalUsers,
        premiumUsers,
        totalDownloads,
        todayDownloads,
        weekDownloads,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthRevenue: monthRevenue[0]?.total || 0,
        averageRating: avgRating[0] ? Math.round(avgRating[0].avg * 10) / 10 : 0,
        newUsersThisWeek: recentUsers,
        pendingPayments,
      },
      analytics: {
        formatStats: formatStats.map(f => ({ format: f._id, count: f.count })),
        qualityStats: qualityStats.map(q => ({ quality: q._id, count: q.count })),
        dailyDownloads: dailyDownloads.map(d => ({ date: d._id, count: d.count })),
        topCountries: topCountries.map(c => ({ country: c._id, count: c.count })),
        paymentsByMethod: paymentsByMethod.map(p => ({ method: p._id, count: p.count, total: p.total })),
        dailyRevenue: dailyRevenue.map(d => ({ date: d._id, total: d.total, count: d.count })),
        paymentsByPlan: paymentsByPlan.map(p => ({ plan: p._id, count: p.count, total: p.total })),
        totalPayments,
        dailyUsers: dailyUsers.map(d => ({ date: d._id, count: d.count })),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const query = search
      ? {
          $or: [
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ]);

    res.json({
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT /api/admin/users/:id/ban
router.put('/users/:id/ban', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ error: 'Cannot ban an admin' });

    user.isBanned = !user.isBanned;
    await user.save();
    res.json({ message: `User ${user.isBanned ? 'banned' : 'unbanned'}`, user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// PUT /api/admin/users/:id/upgrade
router.put('/users/:id/upgrade', async (req, res) => {
  try {
    const { plan, days } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + (days || (plan === 'weekly' ? 7 : 30)));

    user.isPremium = true;
    user.premiumPlan = plan || 'monthly';
    user.premiumExpiry = expiry;
    await user.save();

    res.json({ message: 'User upgraded to premium', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upgrade user' });
  }
});

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Role updated', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// GET /api/admin/payments
router.get('/payments', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const query = status ? { status } : {};

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('user', 'username email')
        .populate('reviewedBy', 'username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(query),
    ]);

    res.json({
      payments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// PUT /api/admin/payments/:id/approve
router.put('/payments/:id/approve', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.status !== 'pending') {
      return res.status(400).json({ error: 'Payment already processed' });
    }

    payment.status = 'approved';
    payment.reviewedBy = req.user._id;
    payment.reviewedAt = new Date();
    payment.adminNotes = req.body.notes || '';
    await payment.save();

    // Activate premium
    const expiry = new Date();
    if (payment.plan === 'weekly') expiry.setDate(expiry.getDate() + 7);
    else expiry.setMonth(expiry.getMonth() + 1);

    await User.findByIdAndUpdate(payment.user, {
      isPremium: true,
      premiumPlan: payment.plan,
      premiumExpiry: expiry,
    });

    res.json({ message: 'Payment approved and premium activated', payment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve payment' });
  }
});

// PUT /api/admin/payments/:id/reject
router.put('/payments/:id/reject', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.status !== 'pending') {
      return res.status(400).json({ error: 'Payment already processed' });
    }

    payment.status = 'rejected';
    payment.reviewedBy = req.user._id;
    payment.reviewedAt = new Date();
    payment.adminNotes = req.body.notes || '';
    await payment.save();

    res.json({ message: 'Payment rejected', payment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject payment' });
  }
});

// GET /api/admin/reviews
router.get('/reviews', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Rating.find()
        .populate('user', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Rating.countDocuments(),
    ]);

    res.json({
      reviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// PUT /api/admin/reviews/:id
router.put('/reviews/:id', async (req, res) => {
  try {
    const { isApproved, isVisible } = req.body;
    const review = await Rating.findByIdAndUpdate(
      req.params.id,
      { isApproved, isVisible },
      { new: true }
    );
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json({ message: 'Review updated', review });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// GET /api/admin/downloads
router.get('/downloads', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [downloads, total] = await Promise.all([
      Download.find()
        .populate('user', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Download.countDocuments(),
    ]);

    res.json({
      downloads,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch downloads' });
  }
});

// GET /api/admin/contacts
router.get('/contacts', async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 }).lean();
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// PUT /api/admin/contacts/:id/read
router.put('/contacts/:id/read', async (req, res) => {
  try {
    await Contact.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// Payment configuration management
// GET /api/admin/payment-config
router.get('/payment-config', async (req, res) => {
  try {
    const configs = await PaymentConfig.find().lean();
    res.json({ configs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment configs' });
  }
});

// PUT /api/admin/payment-config/:method
router.put('/payment-config/:method', async (req, res) => {
  try {
    const { isEnabled, details, instructions } = req.body;
    const config = await PaymentConfig.findOneAndUpdate(
      { method: req.params.method },
      { isEnabled, details, instructions },
      { new: true, upsert: true }
    );
    res.json({ message: 'Payment config updated', config });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update payment config' });
  }
});

module.exports = router;
