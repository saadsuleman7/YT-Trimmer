import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { formatDateTime } from '../../utils/helpers';
import { FiGift, FiPlus, FiTrash2, FiToggleLeft, FiToggleRight, FiUsers, FiClock, FiCopy } from 'react-icons/fi';

const PromoCodes = () => {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ code: '', premiumDays: 7, maxUses: 10, expiresAt: '' });
  const [creating, setCreating] = useState(false);

  const fetchCodes = () => {
    api.get('/admin/promo-codes')
      .then(res => setCodes(res.data.codes))
      .catch(() => toast.error('Failed to load promo codes'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCodes(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.code || !form.expiresAt) {
      toast.error('Please fill in all fields');
      return;
    }
    setCreating(true);
    try {
      await api.post('/admin/promo-codes', form);
      toast.success('Promo code created!');
      setForm({ code: '', premiumDays: 7, maxUses: 10, expiresAt: '' });
      setShowCreate(false);
      fetchCodes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create promo code');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await api.put(`/admin/promo-codes/${id}/toggle`);
      toast.success(res.data.message);
      fetchCodes();
    } catch {
      toast.error('Failed to update promo code');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this promo code permanently?')) return;
    try {
      await api.delete(`/admin/promo-codes/${id}`);
      toast.success('Promo code deleted');
      fetchCodes();
    } catch {
      toast.error('Failed to delete promo code');
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied!');
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'YT-';
    for (let i = 0; i < 6; i++) result += chars[Math.floor(Math.random() * chars.length)];
    setForm({ ...form, code: result });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center space-x-2">
          <FiGift />
          <span>Promo Codes</span>
        </h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="btn-primary flex items-center space-x-2 text-sm"
        >
          <FiPlus size={16} />
          <span>Create Code</span>
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="card p-6">
          <h3 className="font-semibold mb-4">New Promo Code</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Code</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. YT-FREE7"
                  className="input-field flex-1"
                  required
                />
                <button type="button" onClick={generateCode} className="btn-outline text-xs px-3">
                  Generate
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Premium Days</label>
              <input
                type="number"
                value={form.premiumDays}
                onChange={(e) => setForm({ ...form, premiumDays: parseInt(e.target.value, 10) || 1 })}
                min="1"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Max Uses (member limit)</label>
              <input
                type="number"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: parseInt(e.target.value, 10) || 1 })}
                min="1"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Expires At</label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="input-field"
                required
              />
            </div>
          </div>
          <div className="flex space-x-3 mt-4">
            <button type="submit" disabled={creating} className="btn-primary flex items-center space-x-2">
              {creating ? (
                <div className="w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiPlus size={16} />
              )}
              <span>Create</span>
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="btn-outline">
              Cancel
            </button>
          </div>
        </form>
      )}

      {codes.length === 0 ? (
        <div className="card p-8 text-center text-gray-500 dark:text-gray-400">
          <FiGift size={32} className="mx-auto mb-3 opacity-40" />
          <p>No promo codes yet. Create one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {codes.map(promo => {
            const isExpired = new Date(promo.expiresAt) < new Date();
            const isFull = promo.currentUses >= promo.maxUses;
            return (
              <div key={promo._id} className="card p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => copyCode(promo.code)}
                        className="flex items-center space-x-1.5 bg-gray-100 dark:bg-dark-700 px-3 py-1.5 rounded-lg font-mono font-bold text-sm hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
                      >
                        <span>{promo.code}</span>
                        <FiCopy size={12} className="text-gray-400" />
                      </button>
                      {!promo.isActive && (
                        <span className="text-xs bg-gray-200 dark:bg-dark-600 text-gray-500 px-2 py-0.5 rounded-full">Disabled</span>
                      )}
                      {isExpired && (
                        <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">Expired</span>
                      )}
                      {isFull && !isExpired && (
                        <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full">Full</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center space-x-1">
                        <FiClock size={12} />
                        <span>{promo.premiumDays} days premium</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <FiUsers size={12} />
                        <span>{promo.currentUses}/{promo.maxUses} used</span>
                      </span>
                      <span>Expires: {formatDateTime(promo.expiresAt)}</span>
                      {promo.createdBy && <span>by {promo.createdBy.username}</span>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggle(promo._id)}
                      className={`p-2 rounded-lg transition-colors ${
                        promo.isActive
                          ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                          : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700'
                      }`}
                      title={promo.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {promo.isActive ? <FiToggleRight size={20} /> : <FiToggleLeft size={20} />}
                    </button>
                    <button
                      onClick={() => handleDelete(promo._id)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PromoCodes;
