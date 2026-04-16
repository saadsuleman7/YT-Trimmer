import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiUser, FiMail, FiLock, FiArrowRight } from 'react-icons/fi';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signup(username, email, password);
      toast.success('Account created successfully!');
      navigate('/tool');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="card p-8 sm:p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4 shadow-glow">
            <span className="text-dark-900 font-bold text-xl">YT</span>
          </div>
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Join YT-Trimmer today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Username</label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={30}
                placeholder="Choose a username"
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Email</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="At least 6 characters"
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Confirm Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm your password"
                className="input-field pl-10"
              />
            </div>
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
                <span>Create Account</span>
                <FiArrowRight />
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
