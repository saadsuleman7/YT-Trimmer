import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { FiCheck, FiX, FiDollarSign, FiGift, FiArrowRight } from 'react-icons/fi';
import ManualPayment from '../components/payment/ManualPayment';
import PayPalCheckout from '../components/payment/PayPalCheckout';
import AnimateIn from '../components/ui/AnimateIn';
import SEO from '../components/SEO';

const PRICING_SCHEMAS = [
  {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'YT-Trimmer Premium',
    description: 'Premium subscription for YT-Trimmer. Unlock 4K downloads, 60fps, download history, and priority processing.',
    url: 'https://yt-trimmer.com/pricing',
    brand: { '@type': 'Brand', name: 'YT-Trimmer' },
    offers: [
      { '@type': 'Offer', name: 'Weekly', price: '1.00', priceCurrency: 'USD', priceValidUntil: '2026-12-31', availability: 'https://schema.org/InStock', description: '7 days of YT-Trimmer Premium' },
      { '@type': 'Offer', name: 'Monthly', price: '3.00', priceCurrency: 'USD', priceValidUntil: '2026-12-31', availability: 'https://schema.org/InStock', description: '30 days of YT-Trimmer Premium' },
      { '@type': 'Offer', name: '3 Months', price: '8.00', priceCurrency: 'USD', priceValidUntil: '2026-12-31', availability: 'https://schema.org/InStock', description: '90 days of YT-Trimmer Premium' },
      { '@type': 'Offer', name: '5 Months', price: '13.00', priceCurrency: 'USD', priceValidUntil: '2026-12-31', availability: 'https://schema.org/InStock', description: '150 days of YT-Trimmer Premium' },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How much does YT-Trimmer Premium cost?',
        acceptedAnswer: { '@type': 'Answer', text: 'Premium plans start at $1/week. Monthly is $3, 3 months is $8, and 5 months is $13 — the longer you commit, the more you save.' },
      },
      {
        '@type': 'Question',
        name: 'Can I cancel my YT-Trimmer premium subscription?',
        acceptedAnswer: { '@type': 'Answer', text: 'Yes, you can cancel anytime. Your premium access continues until the end of your current billing period.' },
      },
      {
        '@type': 'Question',
        name: 'What payment methods does YT-Trimmer accept?',
        acceptedAnswer: { '@type': 'Answer', text: 'We accept PayPal (automatic instant activation), Bank Transfer, and UPI. Bank and UPI payments require a screenshot proof reviewed within 24 hours.' },
      },
      {
        '@type': 'Question',
        name: 'What does YT-Trimmer Premium unlock?',
        acceptedAnswer: { '@type': 'Answer', text: 'Premium unlocks video downloads up to 4K resolution, high frame rates (60fps+), download history, and priority processing.' },
      },
    ],
  },
];

const Pricing = () => {
  const { isAuthenticated, isPremium, updateUser } = useAuth();
  const [showManual, setShowManual] = useState(null);
  const [showPaypal, setShowPaypal] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [redeemingPromo, setRedeemingPromo] = useState(false);

  const handleRedeemPromo = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info('Please log in first');
      return;
    }
    if (!promoCode.trim()) return;
    setRedeemingPromo(true);
    try {
      const res = await api.post('/payments/redeem-promo', { code: promoCode });
      toast.success(res.data.message);
      setPromoCode('');
      updateUser({ isPremium: true, premiumExpiry: res.data.premiumExpiry });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid promo code');
    } finally {
      setRedeemingPromo(false);
    }
  };

  const handlePayPal = (plan) => {
    if (!isAuthenticated) {
      toast.info('Please log in first');
      return;
    }
    setShowPaypal(plan);
  };

  const freeFeatures = [
    { text: 'Up to 720p quality', included: true },
    { text: '24fps maximum', included: true },
    { text: 'MP4 & MP3 formats', included: true },
    { text: 'Video trimming', included: true },
    { text: 'Download history', included: false },
    { text: '1080p, 1440p, 4K', included: false },
    { text: 'High frame rates', included: false },
  ];

  const premiumFeatures = [
    'Up to 4K quality',
    'High frame rates (60fps+)',
    'MP4 & MP3 formats',
    'Video trimming',
    'Download history',
    'Priority processing',
    'Cancel anytime',
  ];

  const paidPlans = [
    { id: 'weekly', name: 'Weekly', price: '$1', period: '/week', monthly: '$4.33/mo', save: null },
    { id: 'monthly', name: 'Monthly', price: '$3', period: '/month', monthly: '$3/mo', save: '31%', popular: true },
    { id: '3months', name: '3 Months', price: '$8', period: '/3 mo', monthly: '$2.67/mo', save: '38%' },
    { id: '5months', name: '5 Months', price: '$13', period: '/5 mo', monthly: '$2.60/mo', save: '40%', best: true },
  ];

  const renderPlanActions = (planId) => {
    if (isPremium) {
      return (
        <button disabled className="btn-secondary w-full opacity-50 cursor-not-allowed">
          Current Plan
        </button>
      );
    }
    return (
      <div className="space-y-2">
        <button
          onClick={() => handlePayPal(planId)}
          className="btn-primary w-full flex items-center justify-center space-x-2"
        >
          <span>Pay with PayPal</span>
        </button>
        <button
          onClick={() => setShowManual(planId)}
          className="btn-outline w-full flex items-center justify-center space-x-2 text-sm"
        >
          <FiDollarSign size={16} />
          <span>Bank / UPI</span>
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <SEO
        title="Pricing Plans — Premium from $1/week"
        description="Start free forever or go premium from $1/week. Unlock 4K video downloads, 60fps, and download history. Cancel anytime. Multiple payment methods accepted."
        canonical="/pricing"
        schemas={PRICING_SCHEMAS}
      />
      <AnimateIn type="fade-up">
        <div className="text-center mb-16">
          <h1 className="text-3xl sm:text-5xl font-bold mb-4">
            Simple, Transparent <span className="gradient-text">Pricing</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Start free, upgrade when you need more. Cancel anytime.
          </p>
        </div>
      </AnimateIn>

      {/* Free vs Premium comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
        <AnimateIn type="fade-right" delay={100}>
          <div className="card p-8 h-full">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2">Free</h3>
              <div className="flex items-end justify-center">
                <span className="text-4xl font-extrabold">$0</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1 mb-1">/forever</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {freeFeatures.map((feature, i) => (
                <li key={i} className="flex items-center space-x-2 text-sm">
                  {feature.included ? (
                    <FiCheck className="text-green-500 flex-shrink-0" />
                  ) : (
                    <FiX className="text-gray-400 flex-shrink-0" />
                  )}
                  <span className={feature.included ? '' : 'text-gray-400'}>{feature.text}</span>
                </li>
              ))}
            </ul>
            <Link to="/tool" className="btn-secondary w-full text-center block">
              Get Started Free
            </Link>
          </div>
        </AnimateIn>

        <AnimateIn type="fade-left" delay={200}>
          <div className="card p-8 border-2 border-primary-500 shadow-glow h-full relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-primary text-dark-900 px-4 py-1 rounded-full text-sm font-bold">
              PREMIUM
            </div>
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2">Premium Plans</h3>
              <div className="flex items-end justify-center">
                <span className="text-4xl font-extrabold">$1</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1 mb-1">- $13</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Choose your duration below</p>
            </div>
            <ul className="space-y-3 mb-8">
              {premiumFeatures.map((text, i) => (
                <li key={i} className="flex items-center space-x-2 text-sm">
                  <FiCheck className="text-green-500 flex-shrink-0" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <a href="#plans" className="btn-primary w-full text-center block flex items-center justify-center space-x-2">
              <span>Choose a Plan</span>
              <FiArrowRight size={16} />
            </a>
          </div>
        </AnimateIn>
      </div>

      {/* All paid plans */}
      <AnimateIn type="fade-up" delay={100}>
        <div id="plans" className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Choose Your Plan</h2>
          <p className="text-gray-600 dark:text-gray-400">The longer you commit, the more you save.</p>
        </div>
      </AnimateIn>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
        {paidPlans.map((plan, i) => (
          <AnimateIn key={plan.id} type="scale" delay={i * 100}>
            <div className={`card p-6 relative h-full flex flex-col ${
              plan.popular ? 'border-2 border-primary-500 animate-glow-pulse' : ''
            } ${plan.best ? 'border-2 border-green-500' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-primary text-dark-900 px-3 py-0.5 rounded-full text-xs font-bold">
                  POPULAR
                </div>
              )}
              {plan.best && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white px-3 py-0.5 rounded-full text-xs font-bold">
                  BEST VALUE
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className="font-semibold mb-1">{plan.name}</h3>
                <div className="flex items-end justify-center">
                  <span className="text-3xl font-extrabold">{plan.price}</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm ml-1 mb-0.5">{plan.period}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{plan.monthly}</p>
                {plan.save && (
                  <span className="inline-block mt-1.5 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                    Save {plan.save}
                  </span>
                )}
              </div>

              <div className="flex-1" />

              {renderPlanActions(plan.id)}
            </div>
          </AnimateIn>
        ))}
      </div>

      {/* Promo Code Section */}
      <AnimateIn type="fade-up" delay={200}>
        <div id="promo" className="max-w-md mx-auto mt-12">
          <form onSubmit={handleRedeemPromo} className="card p-6">
            <h3 className="font-semibold text-center mb-3 flex items-center justify-center space-x-2">
              <FiGift className="text-primary-500" />
              <span>Have a Promo Code?</span>
            </h3>
            <div className="flex space-x-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter promo code"
                className="input-field flex-1 font-mono"
              />
              <button
                type="submit"
                disabled={redeemingPromo || !promoCode.trim()}
                className="btn-primary px-5 flex items-center space-x-2"
              >
                {redeemingPromo ? (
                  <div className="w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Redeem</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </AnimateIn>

      <AnimateIn type="fade" delay={300}>
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            We accept PayPal (automatic), Bank Transfer, and UPI.
            <br />
            Bank/UPI payments require proof (screenshot) and are reviewed by admin within 24 hours.
          </p>
        </div>
      </AnimateIn>

      {showManual && (
        <ManualPayment
          plan={showManual}
          onClose={() => setShowManual(null)}
        />
      )}

      {showPaypal && (
        <PayPalCheckout
          plan={showPaypal}
          onClose={() => setShowPaypal(null)}
        />
      )}
    </div>
  );
};

export default Pricing;
