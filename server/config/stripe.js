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
  '3months': {
    name: '3 Months Premium',
    price: 800, // $8.00 in cents
    interval: '3 months',
    days: 90,
    priceId: process.env.STRIPE_3MONTHS_PRICE_ID,
  },
  '5months': {
    name: '5 Months Premium',
    price: 1300, // $13.00 in cents
    interval: '5 months',
    days: 150,
    priceId: process.env.STRIPE_5MONTHS_PRICE_ID,
  },
};

module.exports = { stripe, PLANS };
