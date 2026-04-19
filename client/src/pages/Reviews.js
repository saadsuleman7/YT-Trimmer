import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { FiStar, FiUser } from 'react-icons/fi';
import { formatDate } from '../utils/helpers';
import SEO from '../components/SEO';

const StarDisplay = ({ rating, size = 16 }) => (
  <div className="flex">
    {[1,2,3,4,5].map(s => (
      <FiStar
        key={s}
        size={size}
        className={s <= rating ? 'text-primary-500 fill-primary-500' : 'text-gray-300 dark:text-dark-600'}
      />
    ))}
  </div>
);

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    api.get(`/ratings?page=${page}&limit=12`)
      .then(res => {
        setReviews(res.data.ratings);
        setAvgRating(res.data.averageRating);
        setTotalRatings(res.data.totalRatings);
        setTotalPages(res.data.pagination.pages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const reviewSchema = totalRatings > 0 ? [{
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'YT-Trimmer',
    description: 'Online video downloader and trimmer.',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: avgRating.toString(),
      reviewCount: totalRatings.toString(),
      bestRating: '5',
      worstRating: '1',
    },
  }] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 animate-fade-in">
      <SEO
        title="User Reviews &amp; Ratings"
        description={`See what ${totalRatings > 0 ? totalRatings + ' users' : 'our users'} say about YT-Trimmer. ${avgRating > 0 ? 'Rated ' + avgRating + '/5 stars. ' : ''}Real reviews from the community.`}
        canonical="/reviews"
        schemas={reviewSchema}
      />
      <div className="text-center mb-16">
        <h1 className="text-3xl sm:text-5xl font-bold mb-4">
          What Users <span className="gradient-text">Say</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
          Real reviews from our community
        </p>

        {totalRatings > 0 && (
          <div className="inline-flex items-center space-x-3 bg-white dark:bg-dark-800 px-6 py-3 rounded-2xl shadow-lg">
            <StarDisplay rating={Math.round(avgRating)} size={24} />
            <span className="text-2xl font-bold">{avgRating}</span>
            <span className="text-gray-500 dark:text-gray-400">/ 5 ({totalRatings} reviews)</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No reviews yet. Be the first to leave one!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map(review => (
              <div key={review._id} className="card p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                    <FiUser size={18} className="text-dark-900" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{review.displayName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(review.createdAt)}</p>
                  </div>
                </div>
                <StarDisplay rating={review.stars} />
                {review.comment && (
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{review.comment}</p>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-8 space-x-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                    page === i + 1
                      ? 'bg-gradient-primary text-dark-900'
                      : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-600'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reviews;
