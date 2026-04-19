import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { FiMail, FiUser, FiMessageSquare, FiSend } from 'react-icons/fi';
import { FaDiscord } from 'react-icons/fa';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/contact', form);
      toast.success('Message sent successfully!');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      const data = err.response?.data;
      const detailMsg = data?.details?.[0]?.message;
      toast.error(detailMsg || data?.error || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 animate-fade-in">
      <div className="text-center mb-16">
        <h1 className="text-3xl sm:text-5xl font-bold mb-4">
          Get in <span className="gradient-text">Touch</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Have a question or feedback? We'd love to hear from you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* Contact info */}
        <div className="space-y-4">
          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                <FaDiscord className="text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold">Support</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Join Discord for help &amp; complaints</p>
              </div>
            </div>
            <a
              href="https://discord.gg/SVbCbYQ7xN"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline text-sm w-full text-center block mt-3"
            >
              Join Discord
            </a>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <FiMessageSquare className="text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Response Time</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Usually within 24 hours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="card p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Name</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="Your name"
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
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    placeholder="your@email.com"
                    className="input-field pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
                placeholder="What's this about?"
                className="input-field"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Message</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
                rows={6}
                placeholder="Tell us more..."
                className="input-field resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">Minimum 10 characters.</p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary flex items-center space-x-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiSend size={18} />
              )}
              <span>Send Message</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
