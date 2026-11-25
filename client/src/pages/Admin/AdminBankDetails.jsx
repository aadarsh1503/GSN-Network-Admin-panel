import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiCheck, 
  FiCreditCard, FiGlobe, FiMapPin, FiInfo, FiAlertCircle, FiZap, FiRefreshCw
} from 'react-icons/fi';
import { api, settingsAPI, getPaypalFeeConfig } from '../../utils/api';
import { adminToast } from '../../utils/adminToast';

const AdminBankDetails = () => {
  const [bankDetails, setBankDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    bank_name: '',
    branch_name: '',
    iban_number: '',
    account_number: '',
    account_holder_name: '',
    swift_code: '',
    payment_instructions: '',
    is_active: false
  });
  const [paypalForm, setPaypalForm] = useState({
    admin_paypal_id: '',
    paypal_client_id: '',
    paypal_client_secret: '',
    paypal_webhook_id: '',
    paypal_env: 'sandbox',
  });
  const [paypalStatus, setPaypalStatus] = useState({ secretSet: false, webhookSet: false, configured: false });
  const [paypalSaving, setPaypalSaving] = useState(false);
  const [paypalTesting, setPaypalTesting] = useState(false);
  const [paypalTest, setPaypalTest] = useState(null);
  // PayPal processing fee added on top of every checkout (see paypalFeeService).
  const [feeForm, setFeeForm] = useState({
    enabled: true,
    merchantCountry: 'Bahrain',
    intlPct: 4.9,
    intlFixed: 0.3,
    domesticPct: 4.9,
    domesticFixed: 0.3,
  });
  const [feeMeta, setFeeMeta] = useState({ source: 'default', lastSync: null });
  const [feeSaving, setFeeSaving] = useState(false);
  const [feeSyncing, setFeeSyncing] = useState(false);
  const [feeMessage, setFeeMessage] = useState(null);

  useEffect(() => {
    fetchBankDetails();
    fetchPaypalSettings();
    fetchPaypalFee();
  }, []);

  // The secret is never sent back by the API, so this field always starts empty
  // and is only written when the admin types a new value.
  const applyPaypalSettings = (data) => {
    setPaypalForm((prev) => ({
      ...prev,
      admin_paypal_id: data?.admin_paypal_id || '',
      paypal_client_id: data?.paypal_client_id || '',
      paypal_client_secret: '',
      paypal_webhook_id: '',
      paypal_env: data?.paypal_env === 'live' ? 'live' : 'sandbox',
    }));
    setPaypalStatus({
      secretSet: Boolean(data?.paypal_secret_set),
      webhookSet: Boolean(data?.paypal_webhook_set),
      configured: Boolean(data?.paypal_configured),
    });
  };

  const fetchPaypalSettings = async () => {
    try {
      const res = await settingsAPI.getPaypalSettings();
      applyPaypalSettings(res?.data);
    } catch (error) {
      console.error('Error fetching PayPal settings:', error);
    }
  };

  // ── PayPal processing fee ────────────────────────────────────────────────
  // Read through the public endpoint so the panel sees exactly what checkout
  // uses, not a separate admin-only copy.
  const fetchPaypalFee = async () => {
    try {
      const res = await fetch('/api/general-settings/paypal-fee');
      const json = res.ok ? await res.json() : null;
      const d = json?.data;
      if (!d) return;
      setFeeForm({
        enabled: d.enabled !== false,
        merchantCountry: d.merchantCountry || 'Bahrain',
        intlPct: Number(d.intlPct) || 0,
        intlFixed: Number(d.intlFixed) || 0,
        domesticPct: Number(d.domesticPct) || 0,
        domesticFixed: Number(d.domesticFixed) || 0,
      });
      setFeeMeta({ source: d.source || 'default', lastSync: d.lastSync || null });
    } catch (error) {
      console.error('Error fetching PayPal fee settings:', error);
    }
  };

  const handleSaveFee = async () => {
    try {
      setFeeSaving(true);
      setFeeMessage(null);
      const res = await settingsAPI.updatePaypalFee({
        enabled: feeForm.enabled,
        merchantCountry: (feeForm.merchantCountry || '').trim() || 'Bahrain',
        intlPct: Number(feeForm.intlPct) || 0,
        intlFixed: Number(feeForm.intlFixed) || 0,
        domesticPct: Number(feeForm.domesticPct) || 0,
        domesticFixed: Number(feeForm.domesticFixed) || 0,
      });
      const d = res?.data;
      if (d) setFeeMeta({ source: d.source || 'manual', lastSync: d.lastSync || null });
      setFeeMessage({ ok: true, message: 'Processing fee saved. New checkouts use these rates immediately.' });
      getPaypalFeeConfig({ refresh: true }).catch(() => {});
    } catch (error) {
      setFeeMessage({ ok: false, message: error.message || 'Could not save the processing fee' });
    } finally {
      setFeeSaving(false);
    }
  };

  const handleSyncFee = async () => {
    try {
      setFeeSyncing(true);
      setFeeMessage(null);
      const res = await settingsAPI.syncPaypalFee(30);
      const d = res?.data;
      if (d) {
        setFeeForm({
          enabled: d.enabled !== false,
          merchantCountry: d.merchantCountry || 'Bahrain',
          intlPct: Number(d.intlPct) || 0,
          intlFixed: Number(d.intlFixed) || 0,
          domesticPct: Number(d.domesticPct) || 0,
          domesticFixed: Number(d.domesticFixed) || 0,
        });
        setFeeMeta({ source: d.source || 'learned', lastSync: d.lastSync || null });
        getPaypalFeeConfig({ refresh: true }).catch(() => {});
      }
      const learned = d?.learned;
      const bits = [];
      if (learned?.international) {
        bits.push(`international ${learned.international.pct}% + $${Number(learned.international.fixed).toFixed(2)} (${learned.international.samples} txns)`);
      }
      if (learned?.domestic) {
        bits.push(`domestic ${learned.domestic.pct}% + $${Number(learned.domestic.fixed).toFixed(2)} (${learned.domestic.samples} txns)`);
      }
      setFeeMessage({
        ok: true,
        message: bits.length
          ? `Learned from ${learned.usable} of ${learned.scanned} transaction(s): ${bits.join(', ')}`
          : (res?.message || 'Fee rates updated'),
      });
    } catch (error) {
      setFeeMessage({ ok: false, message: error.message || 'Could not read your PayPal transactions' });
    } finally {
      setFeeSyncing(false);
    }
  };

  // Worked example so the numbers are tangible: what a $100 international
  // payment becomes once the fee is grossed up.
  const feePreview = (() => {
    const pct = Math.min(Math.max(Number(feeForm.intlPct) || 0, 0), 99) / 100;
    const fixed = Number(feeForm.intlFixed) || 0;
    const total = Math.round(((100 + fixed) / (1 - pct)) * 100) / 100;
    return { total, fee: Math.round((total - 100) * 100) / 100 };
  })();

  const handleSavePaypalSettings = async () => {
    try {
      setPaypalSaving(true);
      const res = await settingsAPI.updatePaypalSettings({
        admin_paypal_id: paypalForm.admin_paypal_id.trim(),
        paypal_client_id: paypalForm.paypal_client_id.trim(),
        paypal_client_secret: paypalForm.paypal_client_secret.trim(),
        paypal_webhook_id: paypalForm.paypal_webhook_id.trim(),
        paypal_env: paypalForm.paypal_env,
      });
      applyPaypalSettings(res?.data);
      setPaypalTest(null); // credentials changed — an earlier test no longer applies
      adminToast.success(res?.message || 'PayPal settings saved successfully');
    } catch (error) {
      adminToast.error(error.response?.data?.message || error.message || 'Failed to save PayPal settings');
    } finally {
      setPaypalSaving(false);
    }
  };

  const handleTestPaypal = async () => {
    try {
      setPaypalTesting(true);
      setPaypalTest(null);
      const res = await settingsAPI.testPaypalConnection();
      setPaypalTest({ ok: true, message: res?.message || 'Connected to PayPal.' });
      adminToast.success(res?.message || 'PayPal connection OK');
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'PayPal connection failed';
      setPaypalTest({ ok: false, message });
      adminToast.error(message);
    } finally {
      setPaypalTesting(false);
    }
  };

  const fetchBankDetails = async () => {
    try {
      const data = await api.get('/api/bank-details/admin/all');
      setBankDetails(data);
    } catch (error) {
      console.error('Error fetching bank details:', error);
      adminToast.error('Failed to load bank details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await api.put(`/api/bank-details/admin/${editingId}`, formData);
        adminToast.success('Bank details updated successfully');
      } else {
        await api.post('/api/bank-details/admin', formData);
        adminToast.success('Bank details created successfully');
      }
      
      resetForm();
      fetchBankDetails();
    } catch (error) {
      console.error('Error saving bank details:', error);
      adminToast.error(error.response?.data?.message || 'Failed to save bank details');
    }
  };

  const handleEdit = (bankDetail) => {
    setFormData({
      bank_name: bankDetail.bank_name || '',
      branch_name: bankDetail.branch_name || '',
      iban_number: bankDetail.iban_number || '',
      account_number: bankDetail.account_number || '',
      account_holder_name: bankDetail.account_holder_name || '',
      swift_code: bankDetail.swift_code || '',
      payment_instructions: bankDetail.payment_instructions || '',
      is_active: bankDetail.is_active || false
    });
    setEditingId(bankDetail.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bank detail?')) {
      return;
    }

    try {
      await api.delete(`/api/bank-details/admin/${id}`);
      adminToast.success('Bank details deleted successfully');
      fetchBankDetails();
    } catch (error) {
      console.error('Error deleting bank details:', error);
      adminToast.error('Failed to delete bank details');
    }
  };

  const resetForm = () => {
    setFormData({
      bank_name: '',
      branch_name: '',
      iban_number: '',
      account_number: '',
      account_holder_name: '',
      swift_code: '',
      payment_instructions: '',
      is_active: false
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bca142]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <FiCreditCard className="text-[#bca142]" />
                Bank Details Management
              </h1>
              <p className="text-gray-500 mt-1">Manage bank account details for customer payments</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-[#bca142] text-white rounded-lg hover:bg-[#B8941F] transition-colors flex items-center gap-2"
            >
              <FiPlus />
              Add Bank Details
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <FiInfo className="text-blue-500 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-800 mb-1">Bank Details Information</h3>
              <p className="text-blue-700 text-sm mb-2">
                Configure bank account details that customers will use for payments. You can have multiple bank accounts but only one can be active at a time.
              </p>
              <div className="text-blue-700 text-sm">
                <strong>Field Guidelines:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><strong>IBAN Number:</strong> Required for all bank accounts (e.g., GB29 NWBK 6016 1331 9268 19)</li>
                  <li><strong>SWIFT Code:</strong> Required for all transfers (e.g., SBININBB123)</li>
                  <li><strong>Payment Instructions:</strong> Additional guidance for customers making payments</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* PayPal Settings */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <FiGlobe className="text-[#bca142]" />
              <h2 className="text-lg font-semibold text-gray-800">PayPal Settings</h2>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              paypalStatus.configured ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              <FiCheck className={paypalStatus.configured ? '' : 'hidden'} />
              {paypalStatus.configured ? 'Payments auto-verified' : 'Not configured — manual review'}
            </span>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            Set the PayPal account that receives payments from companies, and the REST API credentials used to
            verify those payments. Once the credentials are saved, company memberships and wallet top-ups are
            <strong> activated automatically</strong> — no receipt upload or admin approval. Bank transfers stay manual.
            No server restart or <code>.env</code> change is needed.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Admin PayPal ID (Receiving Account)
              </label>
              <input
                type="text"
                value={paypalForm.admin_paypal_id}
                onChange={(e) => setPaypalForm((p) => ({ ...p, admin_paypal_id: e.target.value }))}
                placeholder="e.g. payments@gulfstarnetwork.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">PayPal email or PayPal.me link shown to companies as the payment receiver.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  PayPal REST Client ID
                </label>
                <input
                  type="text"
                  value={paypalForm.paypal_client_id}
                  onChange={(e) => setPaypalForm((p) => ({ ...p, paypal_client_id: e.target.value }))}
                  placeholder="Client ID from developer.paypal.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent text-sm font-mono"
                />
                <p className="text-xs text-gray-400 mt-1">Public value — it is also used by the checkout in the browser.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  PayPal REST Client Secret
                </label>
                <input
                  type="password"
                  value={paypalForm.paypal_client_secret}
                  onChange={(e) => setPaypalForm((p) => ({ ...p, paypal_client_secret: e.target.value }))}
                  placeholder={paypalStatus.secretSet ? '•••••••• saved — type to replace' : 'Client Secret from developer.paypal.com'}
                  autoComplete="new-password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent text-sm font-mono"
                />
                <p className="text-xs text-gray-400 mt-1">Server-only. Leave empty to keep the saved secret unchanged.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Environment
                </label>
                <select
                  value={paypalForm.paypal_env}
                  onChange={(e) => setPaypalForm((p) => ({ ...p, paypal_env: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent text-sm"
                >
                  <option value="sandbox">Sandbox (testing)</option>
                  <option value="live">Live (real payments)</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">Must match the credentials above — sandbox keys only work in sandbox.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  PayPal Webhook ID (optional)
                </label>
                <input
                  type="text"
                  value={paypalForm.paypal_webhook_id}
                  onChange={(e) => setPaypalForm((p) => ({ ...p, paypal_webhook_id: e.target.value }))}
                  placeholder={paypalStatus.webhookSet ? '•••••••• saved — type to replace' : 'Webhook ID from the PayPal app'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent text-sm font-mono"
                />
                <p className="text-xs text-gray-400 mt-1">Only used to verify webhook signatures (backup path). Optional.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleSavePaypalSettings}
                disabled={paypalSaving}
                className="px-5 py-2 bg-[#bca142] text-white rounded-lg hover:bg-[#B8941F] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <FiSave />
                {paypalSaving ? 'Saving…' : 'Save PayPal Settings'}
              </button>

              <button
                onClick={handleTestPaypal}
                disabled={paypalTesting || paypalSaving}
                className="px-5 py-2 bg-white text-[#bca142] border border-[#bca142] rounded-lg hover:bg-[#bca142]/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <FiZap />
                {paypalTesting ? 'Testing…' : 'Test Connection'}
              </button>
              <span className="text-xs text-gray-400">
                Checks the saved Client ID + Secret against PayPal. Save first if you just changed them.
              </span>
            </div>

            {paypalTest && (
              <div
                className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                  paypalTest.ok
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                {paypalTest.ok ? <FiCheck className="mt-0.5 shrink-0" /> : <FiAlertCircle className="mt-0.5 shrink-0" />}
                <span>{paypalTest.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* PayPal Processing Fee */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <FiZap className="text-[#bca142]" />
              <h2 className="text-lg font-semibold text-gray-800">PayPal Processing Fee</h2>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              feeForm.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {feeForm.enabled ? 'Added to checkout' : 'Disabled'}
            </span>
          </div>
          <p className="text-gray-500 text-sm mb-2">
            PayPal takes a cut on every payment. These rates are added <strong>on top of</strong> the membership or
            wallet top-up, so the full price still reaches the account. PayPal publishes no API for its fee rates, so
            keep them in line with the account agreement — or let the system learn them from the fees PayPal already
            charged on past payments.
          </p>
          <p className="text-gray-500 text-sm mb-4">
            <strong>Set any value you need</strong> — for example 4.5, 5 or 10. Whatever you enter is applied to every
            new checkout immediately (up to 99%). Everyone outside the merchant country pays the international rate.
          </p>

          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={feeForm.enabled}
                onChange={(e) => setFeeForm((p) => ({ ...p, enabled: e.target.checked }))}
                className="w-4 h-4 accent-[#bca142]"
              />
              <span className="text-sm text-gray-700">Charge the processing fee to the buyer at checkout</span>
            </label>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Merchant country
              </label>
              <input
                type="text"
                value={feeForm.merchantCountry}
                onChange={(e) => setFeeForm((p) => ({ ...p, merchantCountry: e.target.value }))}
                placeholder="e.g. Bahrain"
                className="w-full md:w-72 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Buyers registered in this country are charged the domestic rate; everyone else the international rate.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">International</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Fee %</label>
                    <input
                      type="number" step="0.01" min="0" max="99"
                      value={feeForm.intlPct}
                      onChange={(e) => setFeeForm((p) => ({ ...p, intlPct: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Fixed (USD)</label>
                    <input
                      type="number" step="0.01" min="0" max="100"
                      value={feeForm.intlFixed}
                      onChange={(e) => setFeeForm((p) => ({ ...p, intlFixed: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Domestic</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Fee %</label>
                    <input
                      type="number" step="0.01" min="0" max="99"
                      value={feeForm.domesticPct}
                      onChange={(e) => setFeeForm((p) => ({ ...p, domesticPct: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Fixed (USD)</label>
                    <input
                      type="number" step="0.01" min="0" max="100"
                      value={feeForm.domesticFixed}
                      onChange={(e) => setFeeForm((p) => ({ ...p, domesticFixed: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleSaveFee}
                disabled={feeSaving}
                className="px-5 py-2 bg-[#bca142] text-white rounded-lg hover:bg-[#B8941F] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <FiSave />
                {feeSaving ? 'Saving…' : 'Save Fee Settings'}
              </button>

              <button
                onClick={handleSyncFee}
                disabled={feeSyncing || feeSaving}
                className="px-5 py-2 bg-white text-[#bca142] border border-[#bca142] rounded-lg hover:bg-[#bca142]/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <FiRefreshCw className={feeSyncing ? 'animate-spin' : ''} />
                {feeSyncing ? 'Reading PayPal…' : 'Learn From PayPal'}
              </button>
              <span className="text-xs text-gray-400">
                Reads the fee PayPal actually charged on your last 30 days of USD payments and derives the rates.
              </span>
            </div>

            <p className="text-xs text-gray-400">
              Example: a $100 international payment is charged{' '}
              <strong className="text-gray-600">${feePreview.total.toFixed(2)}</strong>
              {' '}($100 plus ${feePreview.fee.toFixed(2)} of fee). Rates in use:{' '}
              <strong>
                {feeMeta.source === 'learned'
                  ? 'learned from your transactions'
                  : feeMeta.source === 'default'
                    ? 'defaults — not confirmed against your PayPal agreement yet'
                    : 'set manually'}
              </strong>
              {feeMeta.lastSync ? ` · last learned ${new Date(feeMeta.lastSync).toLocaleString()}` : ''}
            </p>

            {feeMessage && (
              <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                feeMessage.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {feeMessage.ok ? <FiCheck className="mt-0.5 shrink-0" /> : <FiAlertCircle className="mt-0.5 shrink-0" />}
                <span>{feeMessage.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bank Details List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Current Bank Details</h2>
          </div>
          
          {bankDetails.length === 0 ? (
            <div className="p-8 text-center">
              <FiCreditCard className="mx-auto text-4xl text-gray-400 mb-4" />
              <p className="text-gray-500">No bank details configured yet</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 bg-[#bca142] text-white rounded-lg hover:bg-[#B8941F] transition-colors"
              >
                Add First Bank Details
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Info</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Codes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bankDetails.map((bank) => (
                    <tr key={bank.id} className={bank.is_active ? 'bg-green-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          bank.is_active 
                            ? 'bg-[#bca142] text-white' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {bank.is_active ? (
                            <>
                              <FiCheck className="mr-1" />
                              Active
                            </>
                          ) : (
                            'Inactive'
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{bank.bank_name}</div>
                          <div className="text-sm text-gray-500">{bank.branch_name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{bank.account_holder_name}</div>
                          <div className="text-sm text-gray-500 font-mono">{bank.account_number}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {bank.iban_number && (
                            <div className="flex items-center gap-2">
                              <FiGlobe className="text-gray-400 text-xs" />
                              <span className="text-xs text-gray-500">IBAN: {bank.iban_number}</span>
                            </div>
                          )}
                          {bank.swift_code && (
                            <div className="flex items-center gap-2">
                              <FiGlobe className="text-gray-400 text-xs" />
                              <span className="text-xs text-gray-500">SWIFT: {bank.swift_code}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(bank)}
                            className="text-indigo-600 hover:text-indigo-900 p-1"
                            title="Edit"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDelete(bank.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">
                    {editingId ? 'Edit Bank Details' : 'Add New Bank Details'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bank Name *
                      </label>
                      <input
                        type="text"
                        name="bank_name"
                        value={formData.bank_name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#bca142]"
                        placeholder="e.g., State Bank of India"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Branch Name *
                      </label>
                      <input
                        type="text"
                        name="branch_name"
                        value={formData.branch_name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#bca142]"
                        placeholder="e.g., Mumbai Central Branch"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Holder Name *
                      </label>
                      <input
                        type="text"
                        name="account_holder_name"
                        value={formData.account_holder_name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#bca142]"
                        placeholder="e.g., GSN Network Services Pvt Ltd"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Number *
                      </label>
                      <input
                        type="text"
                        name="account_number"
                        value={formData.account_number}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#bca142]"
                        placeholder="e.g., 12345678901234"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        IBAN Number *
                      </label>
                      <input
                        type="text"
                        name="iban_number"
                        value={formData.iban_number}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#bca142]"
                        placeholder="e.g., GB29 NWBK 6016 1331 9268 19"
                      />
                      <p className="text-xs text-gray-500 mt-1">Required for all bank accounts</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SWIFT Code *
                      </label>
                      <input
                        type="text"
                        name="swift_code"
                        value={formData.swift_code}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#bca142]"
                        placeholder="e.g., SBININBB123"
                      />
                      <p className="text-xs text-gray-500 mt-1">Required for all transfers</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Instructions (Optional)
                    </label>
                    <textarea
                      name="payment_instructions"
                      value={formData.payment_instructions}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#bca142]"
                      placeholder="Additional instructions for customers making payments..."
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-[#bca142] focus:ring-[#bca142] border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                      Set as active bank account
                    </label>
                  </div>

                  {(!formData.iban_number || !formData.swift_code) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <div className="flex items-center gap-2">
                        <FiAlertCircle className="text-yellow-600" />
                        <p className="text-sm text-yellow-800">
                          {!formData.iban_number && !formData.swift_code 
                            ? 'Please provide both IBAN number and SWIFT code for the bank account'
                            : !formData.iban_number 
                            ? 'Please provide the IBAN number for the bank account'
                            : 'Please provide the SWIFT code for the bank account'
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!formData.iban_number || !formData.swift_code}
                      className="px-4 py-2 bg-[#bca142] text-white rounded-md hover:bg-[#B8941F] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiSave />
                      {editingId ? 'Update' : 'Create'} Bank Details
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBankDetails;
