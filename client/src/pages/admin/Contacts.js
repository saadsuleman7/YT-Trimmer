import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { formatDateTime } from '../../utils/helpers';
import { FiInbox, FiMail, FiCheck, FiTrash2, FiUser, FiClock } from 'react-icons/fi';

const Contacts = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchMessages = () => {
    api.get('/admin/contacts')
      .then(res => setMessages(res.data.messages))
      .catch(() => toast.error('Failed to load messages'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMessages(); }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/admin/contacts/${id}/read`);
      setMessages(prev => prev.map(m => m._id === id ? { ...m, isRead: true } : m));
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await api.delete(`/admin/contacts/${id}`);
      setMessages(prev => prev.filter(m => m._id !== id));
      if (selected?._id === id) setSelected(null);
      toast.success('Message deleted');
    } catch {
      toast.error('Failed to delete message');
    }
  };

  const handleSelect = (msg) => {
    setSelected(msg);
    if (!msg.isRead) markAsRead(msg._id);
  };

  const filtered = filter === 'all' ? messages : filter === 'unread' ? messages.filter(m => !m.isRead) : messages.filter(m => m.isRead);
  const unreadCount = messages.filter(m => !m.isRead).length;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center space-x-2">
          <FiInbox />
          <span>Support Inbox</span>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </h2>
        <div className="flex space-x-1 bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
          {['all', 'unread', 'read'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-md text-sm capitalize transition-colors ${
                filter === f
                  ? 'bg-white dark:bg-dark-600 shadow-sm font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Message List */}
        <div className="lg:col-span-1 card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FiInbox size={32} className="mx-auto mb-3 opacity-40" />
              <p>{filter === 'unread' ? 'No unread messages' : 'No messages yet'}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-dark-700 max-h-[600px] overflow-y-auto">
              {filtered.map(msg => (
                <button
                  key={msg._id}
                  onClick={() => handleSelect(msg)}
                  className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors ${
                    selected?._id === msg._id ? 'bg-primary-50 dark:bg-primary-900/10' : ''
                  } ${!msg.isRead ? 'border-l-3 border-l-primary-500' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        {msg.isRead ? (
                          <FiCheck size={14} className="text-gray-400 flex-shrink-0" />
                        ) : (
                          <FiMail size={14} className="text-primary-500 flex-shrink-0" />
                        )}
                        <span className={`text-sm truncate ${!msg.isRead ? 'font-bold' : 'font-medium'}`}>
                          {msg.name}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 truncate mt-0.5">{msg.subject}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDateTime(msg.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2 card p-6">
          {selected ? (
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">{selected.subject}</h3>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center space-x-1.5">
                      <FiUser size={14} />
                      <span>{selected.name}</span>
                    </span>
                    <span className="flex items-center space-x-1.5">
                      <FiMail size={14} />
                      <span>{selected.email}</span>
                    </span>
                    <span className="flex items-center space-x-1.5">
                      <FiClock size={14} />
                      <span>{formatDateTime(selected.createdAt)}</span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(selected._id)}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Delete"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
              <div className="border-t border-gray-200 dark:border-dark-700 pt-4">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {selected.message}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-dark-700">
                <a
                  href={`mailto:${selected.email}?subject=Re: ${selected.subject}`}
                  className="btn-primary inline-flex items-center space-x-2 text-sm"
                >
                  <FiMail size={14} />
                  <span>Reply via Email</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <FiInbox size={40} className="mx-auto mb-3 opacity-40" />
              <p>Select a message to read</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contacts;
