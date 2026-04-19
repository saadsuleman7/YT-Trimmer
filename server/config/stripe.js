const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLANS = {
  weekly: {
    name: 'Weekly Premium',
    price: 100, // $1.00 in cents
    interval: 'week',
    days: 7,
    priceId: process.env.STRIPE_WEEKLY_PRICE_ID,
  },
  monthly: {
    name: 'Monthly Premium',
    price: 300, // $3.00 in cents
    interval: 'month',
    days: 30,
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID,
  },
  '2months': {
    name: '2 Months Premium',
    price: 600, // $6.00 in cents
    interval: '2 months',
    days: 60,
    priceId: process.env.STRIPE_2MONTHS_PRICE_ID,
  },
  '3months': {
    name: '3 Months Premium',
    price: 800, // $8.00 in cents
    interval: '3 months',
    days: 90,
    priceId: process.env.STRIPE_3MONTHS_PRICE_ID,
  },
};

module.exports = { stripe, PLANS };
