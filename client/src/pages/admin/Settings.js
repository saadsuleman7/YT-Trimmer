import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { FiSave, FiToggleLeft, FiToggleRight, FiDollarSign, FiCreditCard } from 'react-icons/fi';

const methodLabels = {
  crypto: 'Cryptocurrency',
  easypaisa: 'Easypaisa / JazzCash',
  paypal: 'PayPal',
  bank_transfer: 'Bank Transfer',
};

const defaultDetails = {
  crypto: { walletAddress: '', network: '', coinType: 'USDT' },
  easypaisa: { accountTitle: '', phoneNumber: '' },
  paypal: { email: '' },
  bank_transfer: { bankName: '', accountTitle: '', accountNumber: '', iban: '' },
};

const Settings = () => {
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});

  useEffect(() => {
    api.get('/admin/payment-config')
      .then(res => {
        const map = {};
        (res.data.configs || []).forEach(c => { map[c.method] = c; });
        Object.keys(defaultDetails).forEach(method => {
          if (!map[method]) {
            map[method] = {
              method,
              isEnabled: false,
              details: { ...defaultDetails[method] },
              instructions: '',
            };
          }
        });
        setConfigs(map);
      })
      .catch(() => toast.error('Failed to load payment settings'))
      .finally(() => setLoading(false));
  }, []);

  const updateField = (method, field, value) => {
    setConfigs(prev => ({
      ...prev,
      [method]: { ...prev[method], [field]: value },
    }));
  };

  const updateDetail = (method, key, value) => {
    setConfigs(prev => ({
      ...prev,
      [method]: {
        ...prev[method],
        details: { ...prev[method].details, [key]: value },
      },
    }));
  };

  const toggleEnabled = (method) => {
    updateField(method, 'isEnabled', !configs[method].isEnabled);
  };

  const saveMethod = async (method) => {
    setSaving(prev => ({ ...prev, [method]: true }));
    try {
      const { isEnabled, details, instructions } = configs[method];
      await api.put(`/admin/payment-config/${method}`, { isEnabled, details, instructions });
      toast.success(`${methodLabels[method]} settings saved`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(prev => ({ ...prev, [method]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold mb-1">Payment Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configure your payment accounts. Users will see these details when making manual payments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.keys(methodLabels).map(method => {
          const config = configs[method];
          if (!config) return null;

          return (
            <div key={method} className={`card p-6 border-2 transition-colors ${config.isEnabled ? 'border-primary-500/50' : 'border-transparent'}`}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.isEnabled ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'bg-gray-100 dark:bg-dark-700 text-gray-400'}`}>
                    <FiCreditCard size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{methodLabels[method]}</h3>
                    <p className="text-xs text-gray-500">{config.isEnabled ? 'Active' : 'Disabled'}</p>
                  </div>
                </div>
                <button onClick={() => toggleEnabled(method)} className="text-2xl">
                  {config.isEnabled
                    ? <FiToggleRight size={28} className="text-primary-500" />
                    : <FiToggleLeft size={28} className="text-gray-400" />
                  }
                </button>
              </div>

              <div className="space-y-4">
                {method === 'crypto' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Coin Type</label>
                      <input
                        type="text"
                        value={config.details.coinType || ''}
                        onChange={e => updateDetail(method, 'coinType', e.target.value)}
                        placeholder="e.g. USDT, BTC, ETH"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Network</label>
                      <input
                        type="text"
                        value={config.details.network || ''}
                        onChange={e => updateDetail(method, 'network', e.target.value)}
                        placeholder="e.g. TRC20, ERC20, BEP20"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Wallet Address</label>
                      <input
                        type="text"
                        value={config.details.walletAddress || ''}
                        onChange={e => updateDetail(method, 'walletAddress', e.target.value)}
                        placeholder="Your wallet address"
                        className="input-field font-mono text-sm"
                      />
                    </div>
                  </>
                )}

                {method === 'easypaisa' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Account Title</label>
                      <input
                        type="text"
                        value={config.details.accountTitle || ''}
                        onChange={e => updateDetail(method, 'accountTitle', e.target.value)}
                        placeholder="Account holder name"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Phone Number</label>
                      <input
                        type="text"
                        value={config.details.phoneNumber || ''}
                        onChange={e => updateDetail(method, 'phoneNumber', e.target.value)}
                        placeholder="e.g. 03001234567"
                        className="input-field"
                      />
                    </div>
                  </>
                )}

                {method === 'paypal' && (
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">PayPal Email</label>
                    <input
                      type="email"
                      value={config.details.email || ''}
                      onChange={e => updateDetail(method, 'email', e.target.value)}
                      placeholder="your@paypal.com"
                      className="input-field"
                    />
                  </div>
                )}

                {method === 'bank_transfer' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Bank Name</label>
                      <input
                        type="text"
                        value={config.details.bankName || ''}
                        onChange={e => updateDetail(method, 'bankName', e.target.value)}
                        placeholder="e.g. HBL, UBL, Meezan"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Account Title</label>
                      <input
                        type="text"
                        value={config.details.accountTitle || ''}
                        onChange={e => updateDetail(method, 'accountTitle', e.target.value)}
                        placeholder="Account holder name"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Account Number</label>
                      <input
                        type="text"
                        value={config.details.accountNumber || ''}
                        onChange={e => updateDetail(method, 'accountNumber', e.target.value)}
                        placeholder="Account number"
                        className="input-field font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">IBAN</label>
                      <input
                        type="text"
                        value={config.details.iban || ''}
                        onChange={e => updateDetail(method, 'iban', e.target.value)}
                        placeholder="e.g. PK00ABCD0000000000000000"
                        className="input-field font-mono text-sm"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Instructions for Users</label>
                  <textarea
                    value={config.instructions || ''}
                    onChange={e => updateField(method, 'instructions', e.target.value)}
                    placeholder="Payment instructions shown to users..."
                    rows={3}
                    className="input-field resize-none"
                  />
                </div>

                <button
                  onClick={() => saveMethod(method)}
                  disabled={saving[method]}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  {saving[method] ? (
                    <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiSave size={16} />
                      <span>Save {methodLabels[method]}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Settings;
