import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { formatDate, formatDateTime } from '../utils/helpers';
import { FiUser, FiMail, FiLock, FiSave, FiClock, FiDownload, FiStar, FiTrash2, FiXCircle, FiRefreshCw } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const AccountSettings = () => {
  const { user, updateUser } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [downloads, setDownloads] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    api.get('/downloads/history?limit=10')
      .then(res => setDownloads(res.data.downloads))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { username };
      if (currentPassword && newPassword) {
        data.currentPassword = currentPassword;
        data.newPassword = newPassword;
      }
      const res = await api.put('/auth/settings', data);
      updateUser(res.data.user);
      toast.success('Settings updated!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in">
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile info */}
        <div className="lg:col-span-1">
          <div className="card p-6 text-center">
            <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-dark-900 font-bold text-2xl">
                {user?.username?.[0]?.toUpperCase()}
              </span>
            </div>
            <h2 className="font-bold text-lg">{user?.username}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>

            <div className="mt-4 space-y-2">
              {user?.isPremium ? (
                <>
                  <div className="bg-gradient-primary text-dark-900 px-3 py-1.5 rounded-lg text-sm font-bold">
                    PREMIUM - {user.premiumPlan}
                  </div>
                  {user.premiumExpiry && (() => {
                    const daysLeft = Math.ceil((new Date(user.premiumExpiry) - new Date()) / (1000 * 60 * 60 * 24));
                    return (
                      <p className={`text-xs font-medium ${daysLeft <= 3 ? 'text-red-500' : 'text-gray-500'}`}>
                        {daysLeft > 0 ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining` : 'Expired'}
                      </p>
                    );
                  })()}
                  <Link to="/pricing" className="flex items-center justify-center space-x-1.5 btn-outline text-xs py-1.5">
                    <FiRefreshCw size={12} />
                    <span>Renew Now</span>
                  </Link>
                  <button
                    onClick={async () => {
                      if (!window.confirm('Cancel your premium subscription? You will lose premium access immediately.')) return;
                      try {
                        await api.delete('/payments/cancel-subscription');
                        updateUser({ ...user, isPremium: false, premiumPlan: null, premiumExpiry: null });
                        toast.success('Subscription cancelled');
                      } catch {
                        toast.error('Failed to cancel subscription');
                      }
                    }}
                    className="flex items-center justify-center space-x-1.5 w-full text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <FiXCircle size={12} />
                    <span>Cancel Subscription</span>
                  </button>
                </>
              ) : (
                <Link to="/pricing" className="block btn-outline text-sm">
                  Upgrade to Premium
                </Link>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-dark-700">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <FiDownload size={16} />
                <span>{user?.totalDownloads || 0} downloads</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Member since {formatDate(user?.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Settings form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave}>
            <div className="card p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center space-x-2">
                <FiUser />
                <span>Profile Settings</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="input-field opacity-50 cursor-not-allowed"
                  />
                </div>
              </div>

              <h3 className="font-semibold text-lg mt-6 mb-4 flex items-center space-x-2">
                <FiLock />
                <span>Change Password</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="input-field"
                  />
                </div>
              </div>

              <button type="submit" disabled={saving} className="btn-primary mt-6 flex items-center space-x-2">
                {saving ? (
                  <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiSave size={18} />
                )}
                <span>Save Changes</span>
              </button>
            </div>
          </form>

          {/* Download History */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center space-x-2">
                <FiClock />
                <span>Download History</span>
              </h3>
              {downloads.length > 0 && (
                <button
                  onClick={async () => {
                    if (!window.confirm('Are you sure you want to clear all download history?')) return;
                    try {
                      await api.delete('/downloads/history');
                      setDownloads([]);
                      toast.success('Download history cleared');
                    } catch {
                      toast.error('Failed to clear history');
                    }
                  }}
                  className="flex items-center space-x-1.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <FiTrash2 size={14} />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {loadingHistory ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : downloads.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No downloads yet</p>
            ) : (
              <div className="space-y-3">
                {downloads.map(d => (
                  <div key={d._id} className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 dark:bg-dark-700">
                    {d.videoThumbnail && (
                      <img src={d.videoThumbnail} alt="" className="w-16 h-10 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{d.videoTitle}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {d.format.toUpperCase()} - {d.quality}p - {formatDateTime(d.createdAt)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      d.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      d.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
