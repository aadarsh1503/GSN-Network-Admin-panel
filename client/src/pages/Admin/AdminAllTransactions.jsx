// src/pages/Admin/AdminAllTransactions.jsx
// One page, no tabs: every transaction (subscriptions, wallet top-ups, user
// payments, wallet activity) in a single newest-first feed with a headline total.

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FiRefreshCw, FiSearch, FiTrendingUp, FiInbox, FiEye, FiX,
  FiCreditCard, FiDollarSign, FiUsers, FiActivity,
} from 'react-icons/fi';
import { api } from '../../utils/api';
import { useCurrency } from '../../contexts/CurrencyContext';
import toast from 'react-hot-toast';

const SOURCE_META = {
  subscription: { label: 'Subscription', icon: FiCreditCard, cls: 'bg-[#bca142]/15 text-[#8a7620]' },
  wallet_topup: { label: 'Wallet Top-Up', icon: FiDollarSign, cls: 'bg-emerald-100 text-emerald-700' },
  transaction: { label: 'Transaction', icon: FiUsers, cls: 'bg-blue-100 text-blue-700' },
  wallet_activity: { label: 'Wallet', icon: FiActivity, cls: 'bg-purple-100 text-purple-700' },
};

// Sources that appear in the feed for the record but never add to the money
// total: user (quote) payments and internal wallet movements such as referral
// rewards, manual credits/debits and expiry.
const NOT_COUNTED_SOURCES = new Set(['transaction', 'wallet_activity']);

const STATUS_CLS = {
  active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-emerald-100 text-emerald-700',
  approved: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
  failed: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-gray-100 text-gray-600',
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// Keys already shown in the modal header or purely internal — hidden from the
// generic detail list so the modal stays readable.
const HIDDEN_KEYS = new Set([
  'id', 'user_id', 'plan_id', 'company_id', 'subscription_id',
  'quote_response_id', 'quote_id', 'coupon_redemption_id', 'old_subscription_id',
  'processed_by', 'created_at', 'status', 'user_name', 'user_email', 'user_country',
]);

const LABELS = {
  user_phone: 'Phone', company_name: 'Company', plan_name: 'Plan',
  plan_price: 'Plan Price', duration_months: 'Duration (months)',
  amount_paid: 'Amount Paid', final_amount_bhd: 'Final Amount',
  external_amount_bhd: 'External Amount', coupon_code: 'Coupon Code',
  coupon_discount_bhd: 'Coupon Discount', wallet_amount_applied: 'Wallet Applied',
  proration_applied: 'Proration Applied', proration_details: 'Proration Details',
  payment_method: 'Payment Method', payment_status: 'Payment Status',
  transaction_id: 'Transaction ID', transaction_ref: 'Transaction Ref',
  transaction_reference: 'Transaction Reference', method: 'Method',
  paypal_order_id: 'PayPal Order ID', paypal_payer_id: 'PayPal Payer ID',
  payment_proof_url: 'Payment Proof', admin_note: 'Admin Note',
  processed_at: 'Processed At', start_date: 'Start Date', end_date: 'End Date',
  description: 'Description', amount: 'Amount', amount_bhd: 'Amount (BHD)',
  balance_after: 'Balance After', trigger_event: 'Trigger', type: 'Type',
  is_upgrade: 'Upgrade', reference: 'Reference',
};

const prettyKey = (k) => LABELS[k] || k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const isEmpty = (v) =>
  v === null || v === undefined || v === '' || (typeof v === 'string' && !v.trim());

const isBoolishKey = (k) => /^(is_|has_)/.test(k) || /_applied$/.test(k) || /_enabled$/.test(k);

const formatDetailValue = (k, v, row, format, formatUsd) => {
  if (typeof v === 'object') return JSON.stringify(v);
  const s = String(v);
  if (/^https?:\/\//i.test(s)) {
    return (
      <a href={s} target="_blank" rel="noreferrer" className="text-[#bca142] underline break-all">
        {s}
      </a>
    );
  }
  if (/(date|_at)$/.test(k)) {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return formatDateTime(v);
  }
  if (isBoolishKey(k)) return Number(v) ? 'Yes' : 'No';
  if (/(amount|price|discount|balance|bhd|usd|paid)/i.test(k) && !isNaN(Number(v))) {
    if (/usd/i.test(k)) return formatUsd(Number(v), 'USD');
    if (/bhd/i.test(k)) return format(Number(v), 'BHD');
    if (k === 'amount') {
      return row.currency === 'USD' ? formatUsd(Number(v), 'USD') : format(Number(v), 'BHD');
    }
    return format(Number(v), 'BHD');
  }
  return s;
};

const AdminAllTransactions = () => {
  const { format, formatUsd, formatIn } = useCurrency();
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({ bhd: 0, usd: 0, count: 0, bySource: {}, counts: {} });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('all');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/admin-panel/all-transactions');
      setRows(data?.transactions || []);
      setTotals(data?.totals || { bhd: 0, usd: 0, count: 0, bySource: {}, counts: {} });
    } catch (err) {
      toast.error('Failed to load transactions');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (source !== 'all' && r.source !== source) return false;
      if (!q) return true;
      return [r.user_name, r.user_email, r.description, r.reference, r.type, r.status]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [rows, search, source]);

  const filteredTotalBhd = useMemo(
    () => filtered.reduce((sum, r) => sum + Number(r.amountBhd || 0), 0),
    [filtered],
  );

  const amountCell = (r) => {
    const out = r.direction === 'out';
    const main = r.currency === 'USD' ? formatUsd(r.amount, 'USD') : format(r.amount, 'BHD');
    const sub = r.currency === 'USD' ? format(r.amountBhd, 'BHD') : formatUsd(r.amountBhd, 'BHD');
    return (
      <div className={`text-right ${out ? 'text-red-600' : 'text-gray-900'}`}>
        <div className="font-bold text-sm">{out ? `- ${main}` : main}</div>
        <div className="text-[11px] text-gray-400">≈ {sub}</div>
      </div>
    );
  };

  const detailEntries = (r) => {
    const d = r.details || {};
    return Object.entries(d).filter(([k, v]) => !HIDDEN_KEYS.has(k) && !isEmpty(v));
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-black">All Transactions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Every subscription, wallet top-up, user payment and wallet activity in one feed — newest first.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#bca142] text-white text-sm font-semibold hover:bg-[#a8892f] disabled:opacity-60 transition"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Headline total */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="sm:col-span-2 rounded-2xl p-5 bg-gradient-to-r from-[#bca142] to-[#8a7620] text-white shadow-sm">
          <div className="flex items-center gap-2 text-white/85 text-xs font-semibold uppercase tracking-wide">
            <FiTrendingUp /> Total Received
          </div>
          <div className="mt-2 text-3xl sm:text-4xl font-extrabold">
            {format(totals.bhd, 'BHD')}
          </div>
          <div className="text-sm text-white/85 mt-1">≈ {formatUsd(totals.usd, 'USD')} · USD equivalent</div>
          <div className="text-xs text-white/70 mt-2">
            Only successfully received money counts (subscriptions + wallet top-ups).
            Transactions with Users and Wallet activity are shown but excluded from this total.
          </div>
        </div>
        <div className="rounded-2xl p-5 bg-white border border-gray-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase tracking-wide">
            <FiInbox /> Transactions
          </div>
          <div className="mt-2 text-3xl font-extrabold text-black">{totals.count}</div>
          <div className="text-xs text-gray-500 mt-1">all records in the feed</div>
        </div>
      </div>

      {/* Per-source summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {Object.entries(SOURCE_META).map(([key, meta]) => {
          const Icon = meta.icon;
          const count = totals.counts?.[key] || 0;
          const amount = totals.bySource?.[key] || 0;
          return (
            <div key={key} className="rounded-xl bg-white border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-600 text-xs font-semibold">
                <Icon className="text-[#bca142]" /> {meta.label}
              </div>
              <div className="mt-2 text-lg font-bold text-black">{count}</div>
              <div className="text-[11px] text-gray-500">
                {NOT_COUNTED_SOURCES.has(key) ? 'not counted in total' : `${format(amount, 'BHD')} received`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user, email, reference or status…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]/40"
          />
        </div>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]/40"
        >
          <option value="all">All sources</option>
          {Object.entries(SOURCE_META).map(([key, meta]) => (
            <option key={key} value={key}>{meta.label}</option>
          ))}
        </select>
        {(search || source !== 'all') && (
          <span className="text-xs text-gray-500">
            Showing {filtered.length} · {format(filteredTotalBhd, 'BHD')}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Date</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Reference</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Amount</th>
                <th className="px-4 py-3 font-semibold text-center">View</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-gray-400">Loading transactions…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-gray-400">No transactions found.</td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const meta = SOURCE_META[r.source] || SOURCE_META.transaction;
                  const TypeIcon = meta.icon;
                  return (
                    <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50/70">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDateTime(r.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${meta.cls}`}>
                          <TypeIcon /> {meta.label}
                        </span>
                        <div className="text-xs text-gray-500 mt-1 max-w-[260px] truncate" title={r.description}>
                          {r.description}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.user_name || '—'}</div>
                        <div className="text-xs text-gray-400">{r.user_email || ''}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[160px] truncate" title={r.reference || ''}>
                        {r.reference || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${STATUS_CLS[r.status] || 'bg-gray-100 text-gray-600'}`}>
                          {String(r.status || '—').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">{amountCell(r)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelected(r)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#bca142]/40 text-[#8a7620] text-xs font-semibold hover:bg-[#bca142]/10 transition"
                        >
                          <FiEye /> View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full-info modal */}
      {selected && (() => {
        const meta = SOURCE_META[selected.source] || SOURCE_META.transaction;
        const TypeIcon = meta.icon;
        const entries = detailEntries(selected);
        return (
          <div
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${meta.cls}`}>
                    <TypeIcon /> {meta.label}
                  </span>
                  <h2 className="font-bold text-black">Transaction Details</h2>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  <FiX />
                </button>
              </div>

              {/* Modal body */}
              <div className="p-5 overflow-y-auto">
                <div className="rounded-xl bg-[#bca142]/10 border border-[#bca142]/25 p-4 mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">User</p>
                    <p className="text-sm font-semibold text-black">{selected.user_name || '—'}</p>
                    <p className="text-xs text-gray-500">{selected.user_email || ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Amount</p>
                    <p className="text-lg font-extrabold text-black">
                      {selected.currency === 'USD'
                        ? formatUsd(selected.amount, 'USD')
                        : format(selected.amount, 'BHD')}
                    </p>
                    <p className="text-xs text-gray-500">≈ {format(selected.amountBhd, 'BHD')}</p>
                  </div>
                  {selected.user_country && selected.local_currency
                    && selected.local_currency !== selected.currency && (
                    <div className="w-full border-t border-[#bca142]/25 pt-2 text-xs text-gray-600">
                      Amount in the user's local currency{' '}
                      <span className="font-semibold text-black">
                        ({selected.user_country} · {selected.local_currency})
                      </span>
                      :{' '}
                      <span className="font-bold text-black">
                        {formatIn(selected.amountBhd, selected.local_currency, 'BHD')}
                      </span>
                      <span className="text-gray-400"> — shown for reference only, does not affect the admin total.</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  <DetailRow label="Date" value={formatDateTime(selected.created_at)} />
                  <DetailRow
                    label="Status"
                    value={
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${STATUS_CLS[selected.status] || 'bg-gray-100 text-gray-600'}`}>
                        {String(selected.status || '—').replace('_', ' ')}
                      </span>
                    }
                  />
                  <DetailRow
                    label="Type"
                    value={
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${meta.cls}`}>
                        <TypeIcon /> {meta.label}
                      </span>
                    }
                  />
                  <DetailRow label="Reference" value={selected.reference} />
                  {entries.map(([k, v]) => (
                    <DetailRow key={k} label={prettyKey(k)} value={formatDetailValue(k, v, selected, format, formatUsd)} />
                  ))}
                </div>

                {entries.length === 0 && (
                  <p className="text-sm text-gray-400 mt-4">No further details available for this record.</p>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
    <div className="text-sm text-gray-900 break-words mt-0.5">
      {isEmpty(value) ? <span className="text-gray-300">—</span> : value}
    </div>
  </div>
);

export default AdminAllTransactions;
