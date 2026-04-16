import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { formatDateTime, truncateText } from '../../utils/helpers';
import { FiChevronLeft, FiChevronRight, FiExternalLink } from 'react-icons/fi';

const Downloads = () => {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1 });

  const fetchDownloads = () => {
    setLoading(true);
    api.get(`/admin/downloads?page=${page}&limit=20`)
      .then(res => {
        setDownloads(res.data.downloads);
        setPagination(res.data.pagination);
      })
      .catch(() => toast.error('Failed to fetch downloads'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDownloads(); }, [page]);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-xl font-bold">Download Logs</h2>

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
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Video</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Format</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Quality</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {downloads.map(dl => (
                  <tr key={dl._id} className="border-b border-gray-100 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800/50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{dl.user?.username || 'Guest'}</p>
                      {dl.ipAddress && (
                        <p className="text-xs text-gray-500">{dl.ipAddress}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        {dl.videoThumbnail && (
                          <img src={dl.videoThumbnail} alt="" className="w-12 h-8 rounded object-cover flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[200px]">{dl.videoTitle || 'Unknown'}</p>
                          <a
                            href={dl.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center space-x-1"
                          >
                            <span>{truncateText(dl.videoUrl, 30)}</span>
                            <FiExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 uppercase font-medium">{dl.format}</td>
                    <td className="px-4 py-3">
                      {dl.quality}p
                      {dl.fps && <span className="text-gray-500 ml-1">@{dl.fps}fps</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[dl.status] || ''}`}>
                        {dl.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(dl.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-dark-700">
            <p className="text-sm text-gray-500">Page {page} of {pagination.pages} ({pagination.total} downloads)</p>
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

export default Downloads;
