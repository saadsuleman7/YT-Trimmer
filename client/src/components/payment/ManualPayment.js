import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { FiX, FiUpload, FiDollarSign } from 'react-icons/fi';

const ManualPayment = ({ plan, onClose }) => {
  const { isAuthenticated } = useAuth();
  const [method, setMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [senderDetails, setSenderDetails] = useState('');
  const [proof, setProof] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const price = plan === 'weekly' ? '$2.00' : '$6.00';

  useEffect(() => {
    api.get('/payments/methods').then(res => {
      setPaymentMethods(res.data.methods);
    }).catch(() => {});
  }, []);

  const methods = [
    { id: 'crypto', label: 'Crypto Wallet', icon: '₿' },
    { id: 'easypaisa', label: 'Easypaisa', icon: '📱' },
    { id: 'paypal', label: 'PayPal', icon: '💳' },
    { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  ];

  const priceNum = plan === 'weekly' ? 2 : 6;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please log in first');
      return;
    }

    if (!method || !transactionId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('plan', plan);
      formData.append('method', method);
      formData.append('transactionId', transactionId);
      formData.append('senderDetails', senderDetails);
      formData.append('amountPaid', priceNum.toString());
      if (proof) formData.append('proof', proof);

      const res = await api.post('/payments/manual', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.autoApproved) {
        toast.success('Payment verified! Your premium is now active. Please log out and log back in.');
      } else {
        toast.success('Payment submitted! You will be notified once approved.');
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit payment');
    } finally {
      setLoading(false);
    }
  };

  const selectedMethodConfig = paymentMethods.find(m => m.method === method);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="card p-8 max-w-lg mx-4 w-full max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500"
        >
          <FiX size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <FiDollarSign size={24} className="text-primary-600" />
          </div>
          <h3 className="text-xl font-bold">Manual Payment</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {plan === 'weekly' ? 'Weekly' : 'Monthly'} Premium
          </p>
          <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl p-3">
            <p className="text-amber-800 dark:text-amber-300 font-bold text-lg">{price}</p>
            <p className="text-amber-700 dark:text-amber-400 text-xs mt-1">
              Only the exact amount is accepted. Sending more or less will not activate your premium.
            </p>
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="text-center py-4">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please log in to submit a payment.
            </p>
            <a href="/login" className="btn-primary">Log In</a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Payment method selection */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Payment Method *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {methods.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`p-3 rounded-xl border-2 text-sm font-medium text-left transition-all ${
                      method === m.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-dark-600 hover:border-primary-400'
                    }`}
                  >
                    <span className="text-lg mr-2">{m.icon}</span>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment instructions */}
            {selectedMethodConfig && (
              <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl text-sm">
                <p className="font-medium text-primary-800 dark:text-primary-300 mb-2">Payment Details:</p>
                <p className="text-primary-700 dark:text-primary-400 whitespace-pre-line">
                  {selectedMethodConfig.instructions || `Send ${price} using ${method} and provide the transaction details below.`}
                </p>
                {selectedMethodConfig.details && (
                  <div className="mt-2 p-2 bg-white dark:bg-dark-800 rounded-lg text-gray-700 dark:text-gray-300">
                    {typeof selectedMethodConfig.details === 'string'
                      ? selectedMethodConfig.details
                      : JSON.stringify(selectedMethodConfig.details, null, 2)}
                  </div>
                )}
              </div>
            )}

            {/* Transaction ID */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Transaction ID / Reference *
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                required
                placeholder="Enter your transaction ID"
                className="input-field"
              />
            </div>

            {/* Sender details */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Sender Details (optional)
              </label>
              <input
                type="text"
                value={senderDetails}
                onChange={(e) => setSenderDetails(e.target.value)}
                placeholder="Your payment account name/number"
                className="input-field"
              />
            </div>

            {/* Proof upload */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Proof of Payment (screenshot)
              </label>
              <label className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-xl cursor-pointer hover:border-primary-400 transition-colors">
                <FiUpload className="text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {proof ? proof.name : 'Click to upload screenshot'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProof(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !method || !transactionId}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Submit Payment for Review</span>
              )}
            </button>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Payments with the exact amount are verified instantly. After submitting, log out and log back in.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ManualPayment;
