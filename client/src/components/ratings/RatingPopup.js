import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { FiStar, FiX } from 'react-icons/fi';

const RatingPopup = ({ onClose }) => {
  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [comment, setComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (stars === 0) {
      toast.error('Please select a rating');
      return;
    }

    setLoading(true);
    try {
      await api.post('/ratings', { stars, comment, guestName: guestName || 'Anonymous' });
      setSubmitted(true);
      toast.success('Thank you for your feedback!');
      setTimeout(onClose, 2000);
    } catch (err) {
      toast.error('Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="card p-8 max-w-md mx-4 w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500"
        >
          <FiX size={20} />
        </button>

        {submitted ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiStar size={28} className="text-green-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Thank You!</h3>
            <p className="text-gray-600 dark:text-gray-400">Your feedback helps us improve.</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold mb-1">How was your experience?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Rate your download experience
              </p>
            </div>

            {/* Stars */}
            <div className="flex justify-center space-x-2 mb-6">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onMouseEnter={() => setHoverStars(s)}
                  onMouseLeave={() => setHoverStars(0)}
                  onClick={() => setStars(s)}
                  className="transition-transform hover:scale-125"
                >
                  <FiStar
                    size={36}
                    className={`transition-colors ${
                      s <= (hoverStars || stars)
                        ? 'text-primary-500 fill-primary-500'
                        : 'text-gray-300 dark:text-dark-600'
                    }`}
                  />
                </button>
              ))}
            </div>

            {stars > 0 && (
              <p className="text-center text-sm text-primary-600 dark:text-primary-400 mb-4 font-medium">
                {stars === 1 && 'Poor'}
                {stars === 2 && 'Fair'}
                {stars === 3 && 'Good'}
                {stars === 4 && 'Very Good'}
                {stars === 5 && 'Excellent!'}
              </p>
            )}

            {/* Comment */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Leave a comment (optional)"
              rows={3}
              maxLength={500}
              className="input-field mb-4 resize-none"
            />

            {/* Guest name */}
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Your name (optional)"
              maxLength={50}
              className="input-field mb-6"
            />

            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary flex-1">
                Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || stars === 0}
                className="btn-primary flex-1 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Submit</span>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RatingPopup;
