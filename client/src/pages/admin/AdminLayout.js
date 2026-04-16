import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FiGrid, FiUsers, FiCreditCard, FiStar, FiDownload, FiSettings } from 'react-icons/fi';

const AdminLayout = () => {
  const links = [
    { to: '/admin', icon: <FiGrid size={18} />, label: 'Dashboard', end: true },
    { to: '/admin/users', icon: <FiUsers size={18} />, label: 'Users' },
    { to: '/admin/payments', icon: <FiCreditCard size={18} />, label: 'Payments' },
    { to: '/admin/reviews', icon: <FiStar size={18} />, label: 'Reviews' },
    { to: '/admin/downloads', icon: <FiDownload size={18} />, label: 'Downloads' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
          <FiSettings size={20} className="text-dark-900" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your platform</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <nav className="lg:w-56 flex-shrink-0">
          <div className="card p-2 lg:sticky lg:top-20">
            <div className="flex lg:flex-col gap-1 overflow-x-auto">
              {links.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-gradient-primary text-dark-900 shadow-md'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700'
                    }`
                  }
                >
                  {link.icon}
                  <span>{link.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
