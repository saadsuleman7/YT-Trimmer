const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { stripe, PLANS } = require('../config/stripe');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const Payment = require('../models/Payment');
const PaymentConfig = require('../models/PaymentConfig');
const User = require('../models/User');

// Configure multer for proof uploads
const uploadsDir = path.join(__dirname, '..', 'uploads', 'proofs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
});

// POST /api/payments/create-checkout - Stripe checkout
router.post('/create-checkout', protect, [
  body('plan').isIn(['weekly', 'monthly']).withMessage('Invalid plan'),
], validate, async (req, res) => {
  try {
    const { plan } = req.body;
    const planConfig = PLANS[plan];

    // Create or get Stripe customer
    let customerId = req.user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        metadata: { userId: req.user._id.toString() },
      });
      customerId = customer.id;
      await User.findByIdAndUpdate(req.user._id, { stripeCustomerId: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: planConfig.name },
          unit_amount: planConfig.price,
          recurring: { interval: planConfig.interval },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/account?payment=success`,
      cancel_url: `${process.env.CLIENT_URL}/pricing?payment=cancelled`,
      metadata: {
        userId: req.user._id.toString(),
        plan,
      },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// POST /api/payments/webhook - Stripe webhook
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata.userId;
      const plan = session.metadata.plan;

      const expiry = new Date();
      if (plan === 'weekly') expiry.setDate(expiry.getDate() + 7);
      else expiry.setMonth(expiry.getMonth() + 1);

      await User.findByIdAndUpdate(userId, {
        isPremium: true,
        premiumPlan: plan,
        premiumExpiry: expiry,
        stripeSubscriptionId: session.subscription,
      });

      await Payment.create({
        user: userId,
        amount: PLANS[plan].price / 100,
        plan,
        method: 'stripe',
        status: 'completed',
        stripePaymentId: session.payment_intent,
        stripeSubscriptionId: session.subscription,
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      await User.findOneAndUpdate(
        { stripeSubscriptionId: subscription.id },
        { isPremium: false, premiumPlan: null, stripeSubscriptionId: null }
      );
      break;
    }
  }

  res.json({ received: true });
});

// POST /api/payments/manual - Manual payment submission
router.post('/manual', protect, upload.single('proof'), [
  body('plan').isIn(['weekly', 'monthly']).withMessage('Invalid plan'),
  body('method').isIn(['crypto', 'easypaisa', 'paypal', 'bank_transfer']).withMessage('Invalid payment method'),
  body('transactionId').trim().notEmpty().withMessage('Transaction ID is required'),
  body('senderDetails').optional().trim(),
], validate, async (req, res) => {
  try {
    const { plan, method, transactionId, senderDetails } = req.body;

    const payment = await Payment.create({
      user: req.user._id,
      amount: PLANS[plan].price / 100,
      plan,
      method,
      status: 'pending',
      transactionId,
      senderDetails: senderDetails || null,
      proofImage: req.file ? `/uploads/proofs/${req.file.filename}` : null,
    });

    res.status(201).json({
      message: 'Payment submitted for review. You will be notified once approved.',
      payment: {
        id: payment._id,
        status: payment.status,
        method: payment.method,
        plan: payment.plan,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit payment' });
  }
});

// GET /api/payments/methods - Get available payment methods
router.get('/methods', async (req, res) => {
  try {
    const configs = await PaymentConfig.find({ isEnabled: true }).lean();
    res.json({ methods: configs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

// GET /api/payments/my-payments - User payment history
router.get('/my-payments', protect, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ payments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

module.exports = router;
