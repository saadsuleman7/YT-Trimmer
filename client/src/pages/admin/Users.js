import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { formatDate } from '../../utils/helpers';
import { FiSearch, FiShield, FiSlash, FiArrowUp, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1 });

  const fetchUsers = (p = page, s = search) => {
    setLoading(true);
    api.get(`/admin/users?page=${p}&limit=15&search=${s}`)
      .then(res => {
        setUsers(res.data.users);
        setPagination(res.data.pagination);
      })
      .catch(() => toast.error('Failed to fetch users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(1, search);
  };

  const handleBan = async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/ban`);
      toast.success(res.data.message);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update user');
    }
  };

  const handleUpgrade = async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/upgrade`, { plan: 'monthly', days: 30 });
      toast.success(res.data.message);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to upgrade user');
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      const res = await api.put(`/admin/users/${userId}/role`, { role });
      toast.success(res.data.message);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update role');
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl font-bold">User Management</h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="input-field pl-9 py-2 text-sm w-60"
            />
          </div>
          <button type="submit" className="btn-primary py-2 text-sm">Search</button>
        </form>
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
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Downloads</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Joined</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id} className="border-b border-gray-100 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800/50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        user.role === 'admin'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-dark-600 dark:text-gray-300'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {user.isPremium && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 font-medium w-fit">
                            Premium
                          </span>
                        )}
                        {user.isBanned && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium w-fit">
                            Banned
                          </span>
                        )}
                        {!user.isPremium && !user.isBanned && (
                          <span className="text-xs text-gray-500">Free</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {user.totalDownloads || 0}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleBan(user._id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.isBanned
                              ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30'
                              : 'text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30'
                          }`}
                          title={user.isBanned ? 'Unban' : 'Ban'}
                        >
                          <FiSlash size={16} />
                        </button>
                        {!user.isPremium && (
                          <button
                            onClick={() => handleUpgrade(user._id)}
                            className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                            title="Upgrade to Premium"
                          >
                            <FiArrowUp size={16} />
                          </button>
                        )}
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleRoleChange(user._id, 'admin')}
                            className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                            title="Make Admin"
                          >
                            <FiShield size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-dark-700">
            <p className="text-sm text-gray-500">
              Page {page} of {pagination.pages} ({pagination.total} users)
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 disabled:opacity-50"
              >
                <FiChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 disabled:opacity-50"
              >
                <FiChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
