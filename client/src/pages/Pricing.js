import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { FiCheck, FiX, FiCreditCard, FiDollarSign } from 'react-icons/fi';
import ManualPayment from '../components/payment/ManualPayment';

const Pricing = () => {
  const { isAuthenticated, isPremium } = useAuth();
  const [loading, setLoading] = useState(null);
  const [showManual, setShowManual] = useState(null);

  const handleStripeCheckout = async (plan) => {
    if (!isAuthenticated) {
      toast.info('Please log in first');
      return;
    }

    setLoading(plan);
    try {
      const res = await api.post('/payments/create-checkout', { plan });
      window.location.href = res.data.url;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start checkout');
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        { text: 'Up to 720p quality', included: true },
        { text: '24fps maximum', included: true },
        { text: 'MP4 & MP3 formats', included: true },
        { text: 'Video trimming', included: true },
        { text: 'Download history', included: false },
        { text: '1080p, 1440p, 4K', included: false },
        { text: 'High frame rates', included: false },
      ],
    },
    {
      id: 'weekly',
      name: 'Weekly Premium',
      price: '$2',
      period: 'per week',
      popular: true,
      features: [
        { text: 'Up to 4K quality', included: true },
        { text: 'High frame rates (60fps+)', included: true },
        { text: 'MP4 & MP3 formats', included: true },
        { text: 'Video trimming', included: true },
        { text: 'Download history', included: true },
        { text: 'Priority processing', included: true },
        { text: 'Cancel anytime', included: true },
      ],
    },
    {
      id: 'monthly',
      name: 'Monthly Premium',
      price: '$6',
      period: 'per month',
      bestValue: true,
      features: [
        { text: 'Up to 4K quality', included: true },
        { text: 'High frame rates (60fps+)', included: true },
        { text: 'MP4 & MP3 formats', included: true },
        { text: 'Video trimming', included: true },
        { text: 'Download history', included: true },
        { text: 'Priority processing', included: true },
        { text: 'Best value - save 25%', included: true },
      ],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 animate-fade-in">
      <div className="text-center mb-16">
        <h1 className="text-3xl sm:text-5xl font-bold mb-4">
          Simple, Transparent <span className="gradient-text">Pricing</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
          Start free, upgrade when you need more. Cancel anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map(plan => (
          <div
            key={plan.id}
            className={`card p-8 relative ${
              plan.popular ? 'border-2 border-primary-500 shadow-glow' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-primary text-dark-900 px-4 py-1 rounded-full text-sm font-bold">
                POPULAR
              </div>
            )}
            {plan.bestValue && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                BEST VALUE
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
              <div className="flex items-end justify-center">
                <span className="text-4xl font-extrabold">{plan.price}</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1 mb-1">/{plan.period}</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, i) => (
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

            {plan.id === 'free' ? (
              <Link to="/tool" className="btn-secondary w-full text-center block">
                Get Started Free
              </Link>
            ) : isPremium ? (
              <button disabled className="btn-secondary w-full opacity-50 cursor-not-allowed">
                Current Plan
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => handleStripeCheckout(plan.id)}
                  disabled={loading === plan.id}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  {loading === plan.id ? (
                    <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiCreditCard size={16} />
                      <span>Pay with Card</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowManual(plan.id)}
                  className="btn-outline w-full flex items-center justify-center space-x-2 text-sm"
                >
                  <FiDollarSign size={16} />
                  <span>Other Methods</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-center mt-12">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          We accept Stripe (Cards), PayPal, Crypto, Easypaisa, and Bank Transfer.
          <br />
          Manual payments with the exact amount are verified instantly.
        </p>
      </div>

      {/* Manual payment modal */}
      {showManual && (
        <ManualPayment
          plan={showManual}
          onClose={() => setShowManual(null)}
        />
      )}
    </div>
  );
};

export default Pricing;
