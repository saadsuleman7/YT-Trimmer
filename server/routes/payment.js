const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { stripe, PLANS } = require('../config/stripe');
const { paypal, client: paypalClient } = require('../config/paypal');
const https = require('https');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const Payment = require('../models/Payment');
const PaymentConfig = require('../models/PaymentConfig');
const User = require('../models/User');
const PromoCode = require('../models/PromoCode');
const { sendApprovalEmail } = require('../utils/emailService');

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
  body('plan').isIn(Object.keys(PLANS)).withMessage('Invalid plan'),
], validate, async (req, res) => {
  try {
    const { plan } = req.body;
    const planConfig = PLANS[plan];

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
        },
        quantity: 1,
      }],
      mode: 'payment',
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
      expiry.setDate(expiry.getDate() + (PLANS[plan]?.days || 30));

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

// ============ PAYPAL AUTOMATIC PAYMENT ============

// Helper: activate premium for a user
async function activatePremium(userId, plan, paypalOrderId, amountUsd) {
  const expiry = new Date();
  if (await User.findById(userId).then(u => u?.isPremium && u.premiumExpiry > new Date())) {
    const current = await User.findById(userId);
    expiry.setTime(new Date(current.premiumExpiry).getTime());
  }
  expiry.setDate(expiry.getDate() + (PLANS[plan]?.days || 30));

  await User.findByIdAndUpdate(userId, {
    isPremium: true,
    premiumPlan: plan,
    premiumExpiry: expiry,
    warningEmailSent: false,
  });

  const existing = await Payment.findOne({ stripePaymentId: paypalOrderId });
  if (!existing) {
    await Payment.create({
      user: userId,
      amount: amountUsd,
      plan,
      method: 'paypal',
      status: 'completed',
      stripePaymentId: paypalOrderId,
      transactionId: paypalOrderId,
    });
  }
  return expiry;
}

// POST /api/payments/paypal/create-order
router.post('/paypal/create-order', protect, [
  body('plan').isIn(Object.keys(PLANS)).withMessage('Invalid plan'),
], validate, async (req, res) => {
  try {
    const { plan } = req.body;
    const planConfig = PLANS[plan];
    const amountUsd = (planConfig.price / 100).toFixed(2);

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: amountUsd,
        },
        description: `${planConfig.name} — YT-Trimmer`,
        custom_id: `${req.user._id.toString()}|${plan}`,
      }],
      application_context: {
        brand_name: 'YT-Trimmer',
        user_action: 'PAY_NOW',
        return_url: `${process.env.CLIENT_URL}/account?payment=success`,
        cancel_url: `${process.env.CLIENT_URL}/pricing?payment=cancelled`,
      },
    });

    const response = await paypalClient().execute(request);
    res.json({ orderID: response.result.id });
  } catch (error) {
    console.error('PayPal create order error:', error.message || error);
    res.status(500).json({ error: 'Failed to create PayPal order' });
  }
});

// POST /api/payments/paypal/capture-order
router.post('/paypal/capture-order', protect, [
  body('orderID').notEmpty().withMessage('Order ID is required'),
  body('plan').isIn(Object.keys(PLANS)).withMessage('Invalid plan'),
], validate, async (req, res) => {
  try {
    const { orderID, plan } = req.body;
    const planConfig = PLANS[plan];
    const expectedAmount = (planConfig.price / 100).toFixed(2);

    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    const response = await paypalClient().execute(request);
    const result = response.result;

    if (result.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    const capture = result.purchase_units[0].payments.captures[0];
    const paidAmount = capture.amount.value;
    const paidCurrency = capture.amount.currency_code;

    if (paidCurrency !== 'USD' || parseFloat(paidAmount) < parseFloat(expectedAmount)) {
      console.error(`PayPal amount mismatch: expected ${expectedAmount} USD, got ${paidAmount} ${paidCurrency}`);
      return res.status(400).json({ error: `Incorrect amount. Expected $${expectedAmount} USD.` });
    }

    const customId = result.purchase_units[0].custom_id || '';
    const [customUserId, customPlan] = customId.split('|');
    if (customUserId !== req.user._id.toString() || customPlan !== plan) {
      return res.status(400).json({ error: 'Order does not belong to this user/plan' });
    }

    const expiry = await activatePremium(req.user._id, plan, orderID, parseFloat(paidAmount));

    res.json({
      message: 'Payment successful! Premium activated.',
      premiumExpiry: expiry,
      plan,
    });
  } catch (error) {
    console.error('PayPal capture error:', error.message || error);
    res.status(500).json({ error: 'Failed to capture PayPal payment' });
  }
});

// POST /api/payments/paypal/webhook - safety net for asynchronous verification
router.post('/paypal/webhook', async (req, res) => {
  try {
    const headers = req.headers;
    const rawBody = req.body instanceof Buffer ? req.body.toString() : JSON.stringify(req.body);
    const event = typeof req.body === 'string' || req.body instanceof Buffer
      ? JSON.parse(rawBody)
      : req.body;

    // Verify webhook signature with PayPal
    const verifyReq = {
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: process.env.PAYPAL_WEBHOOK_ID,
      webhook_event: event,
    };

    const accessToken = await new Promise((resolve, reject) => {
      const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
      const host = (process.env.PAYPAL_MODE || 'sandbox') === 'live'
        ? 'api-m.paypal.com'
        : 'api-m.sandbox.paypal.com';
      const postData = 'grant_type=client_credentials';
      const opts = {
        host, path: '/v1/oauth2/token', method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
        },
      };
      const r = https.request(opts, r2 => {
        let data = '';
        r2.on('data', c => data += c);
        r2.on('end', () => {
          try { resolve(JSON.parse(data).access_token); } catch (e) { reject(e); }
        });
      });
      r.on('error', reject);
      r.write(postData);
      r.end();
    });

    const verified = await new Promise((resolve) => {
      const host = (process.env.PAYPAL_MODE || 'sandbox') === 'live'
        ? 'api-m.paypal.com'
        : 'api-m.sandbox.paypal.com';
      const body = JSON.stringify(verifyReq);
      const opts = {
        host, path: '/v1/notifications/verify-webhook-signature', method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      };
      const r = https.request(opts, r2 => {
        let data = '';
        r2.on('data', c => data += c);
        r2.on('end', () => {
          try { resolve(JSON.parse(data).verification_status === 'SUCCESS'); } catch { resolve(false); }
        });
      });
      r.on('error', () => resolve(false));
      r.write(body);
      r.end();
    });

    if (!verified) {
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }

    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const capture = event.resource;
      const orderId = capture.supplementary_data?.related_ids?.order_id || capture.id;
      const amount = parseFloat(capture.amount?.value || 0);
      const currency = capture.amount?.currency_code;
      const customId = capture.custom_id || '';
      const [userId, plan] = customId.split('|');

      if (userId && plan && PLANS[plan] && currency === 'USD') {
        const expected = PLANS[plan].price / 100;
        if (amount >= expected) {
          await activatePremium(userId, plan, orderId, amount);
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('PayPal webhook error:', error.message || error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// POST /api/payments/manual - Manual payment submission (requires admin approval)
router.post('/manual', protect, upload.single('proof'), [
  body('plan').isIn(Object.keys(PLANS)).withMessage('Invalid plan'),
  body('method').isIn(['bank_transfer', 'upi']).withMessage('Invalid payment method'),
  body('transactionId').trim().notEmpty().withMessage('Transaction ID is required'),
  body('senderDetails').optional().trim(),
], validate, async (req, res) => {
  try {
    const { plan, method, transactionId, senderDetails } = req.body;
    const expectedAmount = PLANS[plan].price / 100;

    if (!req.file) {
      return res.status(400).json({ error: 'Proof of payment (screenshot) is required' });
    }

    const payment = await Payment.create({
      user: req.user._id,
      amount: expectedAmount,
      plan,
      method,
      status: 'pending',
      transactionId,
      senderDetails: senderDetails || null,
      proofImage: `/uploads/proofs/${req.file.filename}`,
    });

    res.status(201).json({
      message: 'Payment submitted! Admin will review your proof and approve shortly.',
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

// DELETE /api/payments/cancel-subscription
router.delete('/cancel-subscription', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      isPremium: false,
      premiumPlan: null,
      premiumExpiry: null,
      warningEmailSent: false,
    });
    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel subscription' });
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

// POST /api/payments/redeem-promo - Redeem a promo code
router.post('/redeem-promo', protect, [
  body('code').trim().notEmpty().withMessage('Promo code is required'),
], validate, async (req, res) => {
  try {
    const code = req.body.code.toUpperCase().trim();
    const promo = await PromoCode.findOne({ code });

    if (!promo) {
      return res.status(404).json({ error: 'Invalid promo code' });
    }
    if (!promo.isActive) {
      return res.status(400).json({ error: 'This promo code is no longer active' });
    }
    if (promo.expiresAt < new Date()) {
      return res.status(400).json({ error: 'This promo code has expired' });
    }
    if (promo.currentUses >= promo.maxUses) {
      return res.status(400).json({ error: 'This promo code has reached its usage limit' });
    }
    if (promo.usedBy.includes(req.user._id)) {
      return res.status(400).json({ error: 'You have already used this promo code' });
    }

    const expiry = new Date();
    if (req.user.isPremium && req.user.premiumExpiry > new Date()) {
      expiry.setTime(new Date(req.user.premiumExpiry).getTime());
    }
    expiry.setDate(expiry.getDate() + promo.premiumDays);

    await User.findByIdAndUpdate(req.user._id, {
      isPremium: true,
      premiumPlan: promo.premiumDays <= 7 ? 'weekly' : 'monthly',
      premiumExpiry: expiry,
      warningEmailSent: false,
    });

    promo.currentUses += 1;
    promo.usedBy.push(req.user._id);
    await promo.save();

    res.json({
      message: `Promo code applied! You have ${promo.premiumDays} days of premium added.`,
      premiumExpiry: expiry,
      premiumDays: promo.premiumDays,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to redeem promo code' });
  }
});

module.exports = router;
