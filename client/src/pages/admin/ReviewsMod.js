import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { formatDateTime } from '../../utils/helpers';
import { FiStar, FiEye, FiEyeOff, FiCheck, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const ReviewsMod = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1 });

  const fetchReviews = () => {
    setLoading(true);
    api.get(`/admin/reviews?page=${page}&limit=15`)
      .then(res => {
        setReviews(res.data.reviews);
        setPagination(res.data.pagination);
      })
      .catch(() => toast.error('Failed to fetch reviews'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReviews(); }, [page]);

  const handleToggleApproval = async (reviewId, currentApproval) => {
    try {
      await api.put(`/admin/reviews/${reviewId}`, { isApproved: !currentApproval });
      toast.success(`Review ${!currentApproval ? 'approved' : 'unapproved'}`);
      fetchReviews();
    } catch (err) {
      toast.error('Failed to update review');
    }
  };

  const handleToggleVisibility = async (reviewId, currentVisibility) => {
    try {
      await api.put(`/admin/reviews/${reviewId}`, { isVisible: !currentVisibility });
      toast.success(`Review ${!currentVisibility ? 'shown' : 'hidden'}`);
      fetchReviews();
    } catch (err) {
      toast.error('Failed to update review');
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-xl font-bold">Review Moderation</h2>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-12">No reviews yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-800">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Rating</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Comment</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map(review => (
                  <tr key={review._id} className="border-b border-gray-100 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800/50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{review.user?.username || review.guestName || 'Anonymous'}</p>
                      {review.user?.email && (
                        <p className="text-xs text-gray-500">{review.user.email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex">
                        {[1,2,3,4,5].map(s => (
                          <FiStar key={s} size={14} className={s <= review.stars ? 'text-primary-500 fill-primary-500' : 'text-gray-300'} />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {review.comment || '-'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${
                          review.isApproved
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {review.isApproved ? 'Approved' : 'Pending'}
                        </span>
                        {!review.isVisible && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-dark-600 dark:text-gray-400 font-medium w-fit">
                            Hidden
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(review.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleToggleApproval(review._id, review.isApproved)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            review.isApproved
                              ? 'text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                              : 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30'
                          }`}
                          title={review.isApproved ? 'Unapprove' : 'Approve'}
                        >
                          <FiCheck size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleVisibility(review._id, review.isVisible)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            review.isVisible
                              ? 'text-gray-600 hover:bg-gray-100 dark:hover:bg-dark-700'
                              : 'text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                          }`}
                          title={review.isVisible ? 'Hide' : 'Show'}
                        >
                          {review.isVisible ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                        </button>
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
    </div>
  );
};

export default ReviewsMod;
