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
    price: 500, // $5.00 in cents
    interval: '2 months',
    days: 60,
    priceId: process.env.STRIPE_2MONTHS_PRICE_ID,
  },
  '3months': {
    name: '3 Months Premium',
    price: 700, // $7.00 in cents
    interval: '3 months',
    days: 90,
    priceId: process.env.STRIPE_3MONTHS_PRICE_ID,
  },
  '6months': {
    name: '6 Months Premium',
    price: 1200, // $12.00 in cents
    interval: '6 months',
    days: 180,
    priceId: process.env.STRIPE_6MONTHS_PRICE_ID,
  },
  yearly: {
    name: 'Yearly Premium',
    price: 2000, // $20.00 in cents
    interval: 'year',
    days: 365,
    priceId: process.env.STRIPE_YEARLY_PRICE_ID,
  },
};

module.exports = { stripe, PLANS };
