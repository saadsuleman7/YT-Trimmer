import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatDateTime } from '../../utils/helpers';
import { FiUsers, FiDownload, FiDollarSign, FiStar, FiTrendingUp, FiClock, FiAlertCircle, FiCreditCard, FiUserCheck, FiSlash, FiCheckCircle, FiPercent } from 'react-icons/fi';

const StatCard = ({ icon, label, value, sub, color = 'primary' }) => {
  const colors = {
    primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600',
  };

  return (
    <div className="card p-5">
      <div className="flex items-center space-x-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {sub && <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
        </div>
      </div>
    </div>
  );
};

const BarChart = ({ data, labelKey, valueKey, title, color = 'primary', formatValue }) => {
  if (!data || data.length === 0) return <p className="text-gray-500 text-sm">No data yet</p>;
  const maxVal = Math.max(...data.map(d => d[valueKey]));
  return (
    <div>
      <h3 className="font-semibold text-lg mb-4">{title}</h3>
      <div className="flex items-end space-x-1 h-40">
        {data.map((d, i) => {
          const height = maxVal > 0 ? (d[valueKey] / maxVal) * 100 : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center group relative">
              <div
                className={`w-full ${color === 'green' ? 'bg-gradient-to-t from-green-500 to-emerald-400' : color === 'blue' ? 'bg-gradient-to-t from-blue-500 to-cyan-400' : 'bg-gradient-primary'} rounded-t-sm transition-all hover:opacity-80 min-h-[2px]`}
                style={{ height: `${Math.max(height, 2)}%` }}
              />
              <div className="hidden group-hover:block absolute -top-8 bg-dark-800 text-white text-xs px-2 py-1 rounded z-10 whitespace-nowrap">
                {d[labelKey]}: {formatValue ? formatValue(d[valueKey]) : d[valueKey]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ProgressBar = ({ items, labelKey, countKey, totalKey, colorClass }) => {
  if (!items || items.length === 0) return <p className="text-gray-500 text-sm">No data yet</p>;
  const total = items.reduce((sum, s) => sum + s[countKey], 0);
  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const pct = total > 0 ? Math.round((item[countKey] / total) * 100) : 0;
        return (
          <div key={i}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium capitalize">{(String(item[labelKey]) || 'unknown').replace('_', ' ')}</span>
              <span className="text-gray-500">
                {item[countKey]} ({pct}%)
                {totalKey && item[totalKey] != null && ` - $${item[totalKey].toFixed(2)}`}
              </span>
            </div>
            <div className="h-2.5 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${colorClass || 'bg-gradient-primary'}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card p-8 text-center">
        <FiAlertCircle size={32} className="mx-auto mb-3 text-gray-400" />
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  const { stats, analytics } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard icon={<FiUsers size={20} />} label="Total Users" value={stats.totalUsers?.toLocaleString()} sub={`${stats.newUsersThisWeek} new this week`} color="blue" />
        <StatCard icon={<FiUserCheck size={20} />} label="Premium Users" value={stats.premiumUsers?.toLocaleString()} sub={`${stats.conversionRate}% conversion`} color="purple" />
        <StatCard icon={<FiDownload size={20} />} label="Total Downloads" value={stats.totalDownloads?.toLocaleString()} sub={`${stats.todayDownloads} today`} color="green" />
        <StatCard icon={<FiDollarSign size={20} />} label="Revenue (Month)" value={`$${stats.monthRevenue?.toFixed(2)}`} sub={`$${stats.totalRevenue?.toFixed(2)} total`} color="primary" />
        <StatCard icon={<FiStar size={20} />} label="Avg Rating" value={stats.averageRating || 'N/A'} color="orange" />
        <StatCard icon={<FiClock size={20} />} label="Downloads (Week)" value={stats.weekDownloads?.toLocaleString()} color="blue" />
        <StatCard icon={<FiCheckCircle size={20} />} label="Success Rate" value={`${stats.successRate}%`} color="green" />
        <StatCard icon={<FiAlertCircle size={20} />} label="Pending Payments" value={stats.pendingPayments?.toLocaleString()} color="red" />
        <StatCard icon={<FiCreditCard size={20} />} label="Total Payments" value={analytics.totalPayments?.toLocaleString() || '0'} color="green" />
        <StatCard icon={<FiSlash size={20} />} label="Banned Users" value={stats.bannedUsers?.toLocaleString() || '0'} color="red" />
      </div>

      {/* Charts Row 1: Downloads + Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <BarChart data={analytics.dailyDownloads} labelKey="date" valueKey="count" title="Daily Downloads (30 Days)" />
        </div>
        <div className="card p-6">
          <BarChart data={analytics.dailyRevenue} labelKey="date" valueKey="total" title="Daily Revenue (30 Days)" color="green" formatValue={v => `$${v.toFixed(2)}`} />
        </div>
      </div>

      {/* Charts Row 2: Users + Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <BarChart data={analytics.dailyUsers} labelKey="date" valueKey="count" title="New Users (30 Days)" color="blue" />
        </div>
        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-4">Revenue by Payment Method</h3>
          <ProgressBar items={analytics.paymentsByMethod} labelKey="method" countKey="count" totalKey="total" colorClass="bg-gradient-to-r from-green-500 to-emerald-400" />
        </div>
      </div>

      {/* Charts Row 3: Format + Quality + FPS + Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-4">Downloads by Format</h3>
          <ProgressBar items={analytics.formatStats} labelKey="format" countKey="count" />
        </div>
        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-4">Downloads by Quality</h3>
          <ProgressBar items={analytics.qualityStats} labelKey="quality" countKey="count" colorClass="bg-gradient-to-r from-blue-500 to-purple-500" />
        </div>
        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-4">Downloads by FPS</h3>
          <ProgressBar items={analytics.fpsStats} labelKey="fps" countKey="count" colorClass="bg-gradient-to-r from-orange-500 to-amber-400" />
        </div>
        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-4">Subscriptions by Plan</h3>
          <ProgressBar items={analytics.paymentsByPlan} labelKey="plan" countKey="count" totalKey="total" colorClass="bg-gradient-to-r from-purple-500 to-pink-500" />
        </div>
      </div>

      {/* Bottom Row: Top Videos + Recent Payments + Countries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Videos */}
        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-4">Most Downloaded Videos</h3>
          {analytics.topVideos?.length > 0 ? (
            <div className="space-y-2">
              {analytics.topVideos.map((v, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-dark-700">
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-xs font-bold text-primary-600 flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium truncate">{v.title || 'Unknown'}</span>
                  </div>
                  <span className="text-sm text-gray-500 flex-shrink-0 ml-2">{v.count}x</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No data yet</p>
          )}
        </div>

        {/* Recent Payments */}
        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-4">Recent Payments</h3>
          {analytics.recentPayments?.length > 0 ? (
            <div className="space-y-2">
              {analytics.recentPayments.map((p, i) => {
                const statusColor = {
                  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                }[p.status] || '';
                return (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-dark-700">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{p.user?.username || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{p.method?.replace('_', ' ')} - {formatDateTime(p.createdAt)}</p>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className="text-sm font-bold">${p.amount}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>{p.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No payments yet</p>
          )}
        </div>
      </div>

      {/* Top Countries */}
      <div className="card p-6">
        <h3 className="font-semibold text-lg mb-4">Top Countries</h3>
        {analytics.topCountries?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {analytics.topCountries.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-dark-700">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-xs font-bold text-primary-600">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium">{c.country}</span>
                </div>
                <span className="text-sm text-gray-500">{c.count} downloads</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No data yet</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
