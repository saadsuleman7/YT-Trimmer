import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { FiX } from 'react-icons/fi';

const PAYPAL_CLIENT_ID = process.env.REACT_APP_PAYPAL_CLIENT_ID || 'sb';

const priceMap = { weekly: 1, monthly: 3, '3months': 8, '5months': 13 };
const labelMap = { weekly: 'Weekly', monthly: 'Monthly', '3months': '3 Months', '5months': '5 Months' };

const PayPalCheckout = ({ plan, onClose, onSuccess }) => {
  const { updateUser } = useAuth();
  const price = priceMap[plan] || 0;

  const createOrder = async () => {
    try {
      const res = await api.post('/payments/paypal/create-order', { plan });
      return res.data.orderID;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start PayPal checkout');
      throw err;
    }
  };

  const onApprove = async (data) => {
    try {
      const res = await api.post('/payments/paypal/capture-order', {
        orderID: data.orderID,
        plan,
      });
      toast.success('Payment successful! Premium activated.');
      updateUser({ isPremium: true, premiumExpiry: res.data.premiumExpiry, premiumPlan: plan });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment verification failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="card p-6 sm:p-8 max-w-md mx-4 w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500"
        >
          <FiX size={20} />
        </button>

        <div className="text-center mb-6">
          <h3 className="text-xl font-bold">{labelMap[plan]} Premium</h3>
          <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl p-3">
            <p className="text-amber-800 dark:text-amber-300 font-bold text-2xl">${price.toFixed(2)}</p>
            <p className="text-amber-700 dark:text-amber-400 text-xs mt-1">
              Complete payment to instantly activate premium
            </p>
          </div>
        </div>

        <PayPalScriptProvider options={{ 'client-id': PAYPAL_CLIENT_ID, currency: 'USD', intent: 'capture' }}>
          <PayPalButtons
            style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' }}
            createOrder={createOrder}
            onApprove={onApprove}
            onError={(err) => {
              console.error('PayPal error:', err);
              toast.error('PayPal error. Please try again.');
            }}
            onCancel={() => toast.info('Payment cancelled')}
          />
        </PayPalScriptProvider>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
          Payments are processed securely via PayPal. Premium activates automatically.
        </p>
      </div>
    </div>
  );
};

export default PayPalCheckout;
