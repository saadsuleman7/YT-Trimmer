import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { formatDateTime } from '../../utils/helpers';
import { FiCheck, FiX, FiFilter, FiChevronLeft, FiChevronRight, FiImage } from 'react-icons/fi';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1 });
  const [proofModal, setProofModal] = useState(null);

  const fetchPayments = () => {
    setLoading(true);
    const query = statusFilter ? `&status=${statusFilter}` : '';
    api.get(`/admin/payments?page=${page}&limit=15${query}`)
      .then(res => {
        setPayments(res.data.payments);
        setPagination(res.data.pagination);
      })
      .catch(() => toast.error('Failed to fetch payments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPayments(); }, [page, statusFilter]);

  const handleApprove = async (paymentId) => {
    try {
      const res = await api.put(`/admin/payments/${paymentId}/approve`, { notes: '' });
      toast.success(res.data.message);
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve');
    }
  };

  const handleReject = async (paymentId) => {
    try {
      const res = await api.put(`/admin/payments/${paymentId}/reject`, { notes: '' });
      toast.success(res.data.message);
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject');
    }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    refunded: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl font-bold">Payment Management</h2>
        <div className="flex items-center space-x-2">
          <FiFilter size={16} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input-field py-2 text-sm w-40"
          >
            <option value="">All Payments</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-800">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Plan</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Method</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment._id} className="border-b border-gray-100 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800/50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{payment.user?.username || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{payment.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 capitalize">{payment.plan}</td>
                    <td className="px-4 py-3">
                      <span className="capitalize">{payment.method?.replace('_', ' ')}</span>
                      {payment.transactionId && (
                        <p className="text-xs text-gray-500 truncate max-w-[120px]">
                          ID: {payment.transactionId}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">${payment.amount}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[payment.status] || ''}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(payment.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1">
                        {payment.proofImage && (
                          <button
                            onClick={() => setProofModal(payment.proofImage)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                            title="View Proof"
                          >
                            <FiImage size={16} />
                          </button>
                        )}
                        {payment.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(payment._id)}
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                              title="Approve"
                            >
                              <FiCheck size={16} />
                            </button>
                            <button
                              onClick={() => handleReject(payment._id)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                              title="Reject"
                            >
                              <FiX size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-dark-700">
            <p className="text-sm text-gray-500">Page {page} of {pagination.pages}</p>
            <div className="flex space-x-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 disabled:opacity-50">
                <FiChevronLeft size={18} />
              </button>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 disabled:opacity-50">
                <FiChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Proof modal */}
      {proofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setProofModal(null)}>
          <div className="card p-4 max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Payment Proof</h3>
              <button onClick={() => setProofModal(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700">
                <FiX size={20} />
              </button>
            </div>
            <img
              src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${proofModal}`}
              alt="Payment proof"
              className="w-full rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
