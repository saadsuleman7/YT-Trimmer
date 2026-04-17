import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { FiShield, FiMail, FiKey } from 'react-icons/fi';

const AdminSetup = () => {
  const [email, setEmail] = useState('');
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/setup-admin', { email, secret });
      toast.success(res.data.message);
      setSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to setup admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="card p-8 sm:p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4 shadow-glow">
            <FiShield size={24} className="text-dark-900" />
          </div>
          <h1 className="text-2xl font-bold">Admin Setup</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Make your account an admin
          </p>
        </div>

        {success ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiShield size={28} className="text-green-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Admin Access Granted!</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Log out and log back in to access the admin panel.
            </p>
            <a href="/login" className="btn-primary inline-block">Go to Login</a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Your Account Email
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Email you signed up with"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Setup Secret Key
              </label>
              <div className="relative">
                <FiKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  required
                  placeholder="Enter the secret key"
                  className="input-field pl-10"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Default key: yt-trimmer-admin-2025
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FiShield size={18} />
                  <span>Make Admin</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminSetup;
