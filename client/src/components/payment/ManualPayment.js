import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { FiX, FiUpload, FiDollarSign, FiCopy } from 'react-icons/fi';

const ManualPayment = ({ plan, onClose }) => {
  const { isAuthenticated } = useAuth();
  const [method, setMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [senderDetails, setSenderDetails] = useState('');
  const [proof, setProof] = useState(null);
  const [loading, setLoading] = useState(false);

  const priceMap = {
    weekly: 1, monthly: 3, '3months': 8, '5months': 13,
  };
  const labelMap = {
    weekly: 'Weekly', monthly: 'Monthly', '3months': '3 Months', '5months': '5 Months',
  };
  const priceNum = priceMap[plan] || 0;
  const price = `$${priceNum.toFixed(2)}`;

  const methods = [
    { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
    { id: 'upi', label: 'UPI', icon: '📱' },
  ];

  const paymentDetails = {
    bank_transfer: {
      title: 'Bank Transfer Details',
      lines: [
        { label: 'Account Name', value: 'Ms. Hingu Disha Bharatbhai' },
        { label: 'Account Number', value: '10176623667' },
        { label: 'IFSC Code', value: 'IDFB0042277' },
        { label: 'SWIFT Code', value: 'IDFBINBBMUM' },
        { label: 'Bank Name', value: 'IDFC FIRST Bank' },
        { label: 'Branch', value: 'Surat - Magob Branch' },
      ],
      note: `Transfer exactly ${price} (or equivalent INR) to the account above. After transfer, paste transaction reference below.`,
    },
    upi: {
      title: 'UPI Payment',
      lines: [
        { label: 'UPI ID', value: 'dishahingu3007-3@okaxis' },
      ],
      note: `Send exactly ${price} (or equivalent INR) to the UPI ID above. After payment, paste UPI reference/UTR number below.`,
    },
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

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

    if (!proof) {
      toast.error('Please upload proof of payment (screenshot)');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('plan', plan);
      formData.append('method', method);
      formData.append('transactionId', transactionId);
      formData.append('senderDetails', senderDetails);
      formData.append('proof', proof);

      await api.post('/payments/manual', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Payment submitted! Admin will review and approve shortly.');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit payment');
    } finally {
      setLoading(false);
    }
  };

  const details = paymentDetails[method];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="card p-6 sm:p-8 max-w-lg mx-4 w-full max-h-[90vh] overflow-y-auto relative">
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
          <h3 className="text-xl font-bold">{labelMap[plan]} Premium</h3>
          <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl p-3">
            <p className="text-amber-800 dark:text-amber-300 font-bold text-2xl">{price}</p>
            <p className="text-amber-700 dark:text-amber-400 text-xs mt-1">
              Send exactly this amount. No more, no less.
            </p>
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="text-center py-4">
            <p className="text-gray-600 dark:text-gray-400 mb-4">Please log in to submit a payment.</p>
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
                    className={`p-3 rounded-xl border-2 text-sm font-medium text-center transition-all ${
                      method === m.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-dark-600 hover:border-primary-400'
                    }`}
                  >
                    <span className="text-lg block mb-1">{m.icon}</span>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment details display */}
            {details && (
              <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl text-sm space-y-2">
                <p className="font-bold text-primary-800 dark:text-primary-300 mb-3">{details.title}</p>
                {details.lines.map((line, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 bg-white dark:bg-dark-800 p-2.5 rounded-lg">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">{line.label}</p>
                      {line.isLink ? (
                        <a
                          href={line.value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 dark:text-primary-400 font-medium text-sm break-all hover:underline"
                        >
                          {line.value}
                        </a>
                      ) : (
                        <p className="font-medium text-gray-800 dark:text-gray-200 text-sm break-all">{line.value}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(line.value)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-400 flex-shrink-0"
                      title="Copy"
                    >
                      <FiCopy size={14} />
                    </button>
                  </div>
                ))}
                <p className="text-primary-700 dark:text-primary-400 text-xs mt-2">{details.note}</p>
              </div>
            )}

            {/* Transaction ID */}
            {method && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                    Transaction ID / Reference *
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    required
                    placeholder="Paste your transaction ID here"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                    Sender Name / Account (optional)
                  </label>
                  <input
                    type="text"
                    value={senderDetails}
                    onChange={(e) => setSenderDetails(e.target.value)}
                    placeholder="Your name or account used to send payment"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                    Payment Screenshot *
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
                  disabled={loading || !transactionId || !proof}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Submit Payment for Review</span>
                  )}
                </button>

                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Admin will verify your payment and activate premium within 24 hours.
                </p>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default ManualPayment;
