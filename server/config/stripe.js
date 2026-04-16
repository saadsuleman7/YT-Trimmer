const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLANS = {
  weekly: {
    name: 'Weekly Premium',
    price: 200, // $2.00 in cents
    interval: 'week',
    priceId: process.env.STRIPE_WEEKLY_PRICE_ID,
  },
  monthly: {
    name: 'Monthly Premium',
    price: 600, // $6.00 in cents
    interval: 'month',
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID,
  },
};

module.exports = { stripe, PLANS };
