import React, { useEffect, useState } from 'react';
import {
  FaTimes, FaWallet, FaTrash, FaUser, FaBuilding, FaBriefcase,
  FaCreditCard, FaCheckCircle, FaExclamationTriangle,
  FaSignInAlt, FaGift, FaStar, FaChartLine, FaBan, FaFileAlt, FaQuoteRight,
  FaMoneyBillWave, FaSpinner, FaEnvelope, FaPhone, FaGlobe, FaMapMarkerAlt,
  FaCalendarAlt, FaRegClock
} from 'react-icons/fa';
import { api } from '../../utils/api';
import { useCurrency } from '../../contexts/CurrencyContext';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString() : '—');

const ROLE_META = {
  user: { label: 'User', icon: FaUser, gradient: 'from-slate-700 to-black' },
  business: { label: 'Business Owner', icon: FaBriefcase, gradient: 'from-[#8a7525] to-black' },
  company: { label: 'Company Owner', icon: FaBuilding, gradient: 'from-[#bca142] to-black' }
};

const StatusPill = ({ status }) => {
  const s = String(status || '').toLowerCase();
  const map = {
    active: 'bg-emerald-100 text-emerald-700',
    approved: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-emerald-100 text-emerald-700',
    success: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    expired: 'bg-gray-200 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
    rejected: 'bg-red-100 text-red-700',
    failed: 'bg-red-100 text-red-700'
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${map[s] || 'bg-gray-100 text-gray-600'}`}>
      {status || '—'}
    </span>
  );
};

const StatTile = ({ icon: Icon, label, value, sub, accent = 'text-[#bca142]' }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      <Icon className={`${accent} text-lg`} />
    </div>
    <p className="mt-2 text-xl font-bold text-gray-900 truncate">{value}</p>
    {sub && <p className="mt-0.5 text-xs text-gray-400 truncate">{sub}</p>}
  </div>
);

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-2">
    <div className="mt-0.5 h-8 w-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 flex-shrink-0">
      <Icon className="text-sm" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-800 break-words">{value || '—'}</p>
    </div>
  </div>
);

const EmptyState = ({ text = 'No records found' }) => (
  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
    <FaFileAlt className="text-3xl mb-2" />
    <p className="text-sm">{text}</p>
  </div>
);

const DataTable = ({ columns, rows, empty = 'No records found' }) => {
  if (!rows || rows.length === 0) return <EmptyState text={empty} />;
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-3 py-2 text-left font-semibold uppercase text-[11px] tracking-wide whitespace-nowrap">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r, i) => (
            <tr key={r.id ?? i} className="hover:bg-gray-50">
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-2 text-gray-700 whitespace-nowrap">
                  {c.render ? c.render(r) : (r[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const UserDetailModal = ({ isOpen, onClose, role, userId, onDelete }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('overview');
  const { format, formatUsd } = useCurrency();
  const money = (n) => format(n);

  useEffect(() => {
    if (!isOpen || !userId || !role) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      setData(null);
      setTab('overview');
      try {
        const res = await api.get(`/api/user/admin-details/${role}/${userId}`);
        if (active) setData(res);
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Failed to load user details');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [isOpen, userId, role]);

  if (!isOpen) return null;

  const meta = ROLE_META[role] || ROLE_META.user;
  const RoleIcon = meta.icon;
  const p = data?.profile || {};
  const counts = data?.counts || {};
  const isCompany = role === 'company';

  const tabs = [
    { id: 'overview', label: 'Overview' },
    ...(isCompany ? [{ id: 'wallet', label: 'Wallet' }] : []),
    { id: 'referrals', label: 'Referrals' },
    { id: 'records', label: isCompany ? 'Subscriptions' : 'Quotes' },
    { id: 'billing', label: isCompany ? 'Operations' : 'Billing' },
    { id: 'activity', label: 'Activity' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className={`bg-gradient-to-r ${meta.gradient} px-6 py-5 text-white`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4 min-w-0">
              {p.company_logo || p.logo ? (
                <img
                  src={p.company_logo || p.logo}
                  alt="logo"
                  className="h-14 w-14 rounded-xl border-2 border-white/40 object-cover bg-white/10"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 text-2xl">
                  <RoleIcon />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-bold">{p.name || 'Unknown'}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/90">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 font-semibold">
                    <RoleIcon className="text-xs" /> {meta.label}
                  </span>
                  <span className="inline-flex items-center gap-1"><FaEnvelope className="text-xs" /> {p.email || '—'}</span>
                  {p.phone && <span className="inline-flex items-center gap-1"><FaPhone className="text-xs" /> {p.phone}</span>}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              <FaTimes size={18} />
            </button>
          </div>

          {/* Status badges */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full px-3 py-1 font-semibold ${p.status ? 'bg-emerald-400/90 text-emerald-950' : 'bg-red-400/90 text-red-950'}`}>
              {p.status ? 'Active Account' : 'Inactive Account'}
            </span>
            {p.is_blacklisted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-3 py-1 font-semibold text-white">
                <FaBan className="text-[10px]" /> Blacklisted
              </span>
            )}
            {isCompany && (
              data?.hasActiveSubscription ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 font-semibold text-white">
                  <FaCheckCircle className="text-[10px]" />
                  Subscription: {data.activeSubscription?.plan_name || 'Active'}
                  {data.activeSubscription?.end_date ? ` · till ${fmtDate(data.activeSubscription.end_date)}` : ''}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 font-semibold text-amber-950">
                  <FaExclamationTriangle className="text-[10px]" /> No Active Subscription
                </span>
              )
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-gray-200 bg-gray-50 px-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap px-4 py-3 text-sm font-semibold transition ${
                tab === t.id
                  ? 'border-b-2 border-[#bca142] text-[#bca142]'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-gray-50/60 p-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <FaSpinner className="animate-spin text-3xl mb-3 text-[#bca142]" />
              <p className="text-sm">Loading full profile…</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-24 text-red-500">
              <FaExclamationTriangle className="text-3xl mb-3" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* OVERVIEW */}
              {tab === 'overview' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {isCompany && <StatTile icon={FaWallet} label="Wallet Balance" value={money(data.wallet?.balance)} sub={formatUsd(data.wallet?.balance)} />}
                    {isCompany ? (
                      <>
                        <StatTile icon={FaGift} label="Referrals" value={counts.referralsMade ?? 0} />
                        <StatTile icon={FaQuoteRight} label="Quote Responses" value={counts.quoteResponses ?? 0} />
                        <StatTile icon={FaMoneyBillWave} label="Transactions" value={counts.transactions ?? 0} />
                      </>
                    ) : (
                      <>
                        <StatTile icon={FaFileAlt} label="Quotes" value={counts.quotes ?? 0} />
                        <StatTile icon={FaMoneyBillWave} label="Transactions" value={counts.transactions ?? 0} />
                        <StatTile icon={FaCreditCard} label="Invoices" value={counts.invoices ?? 0} />
                        <StatTile icon={FaCheckCircle} label="Tickets" value={counts.tickets ?? 0} />
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">Contact & Location</h4>
                      <InfoRow icon={FaEnvelope} label="Email" value={p.email} />
                      <InfoRow icon={FaPhone} label="Phone" value={p.phone} />
                      <InfoRow icon={FaGlobe} label="Country" value={p.country} />
                      <InfoRow icon={FaMapMarkerAlt} label="City / State" value={[p.city, p.state].filter(Boolean).join(', ')} />
                      <InfoRow icon={FaCalendarAlt} label="Registered" value={fmtDateTime(p.created_at)} />
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
                        {isCompany ? 'Company Profile' : 'Profile'}
                      </h4>
                      {isCompany ? (
                        <>
                          <InfoRow icon={FaBriefcase} label="Category" value={p.category} />
                          <InfoRow icon={FaUser} label="Owner" value={p.owner_name} />
                          <InfoRow icon={FaGlobe} label="Website" value={p.website} />
                          <InfoRow icon={FaMapMarkerAlt} label="Address" value={p.company_address} />
                          <InfoRow icon={FaCreditCard} label="PayPal" value={data.paypalEmail} />
                        </>
                      ) : (
                        <>
                          <InfoRow icon={FaUser} label="Role" value={meta.label} />
                          <InfoRow icon={FaCheckCircle} label="Email Verified" value={p.email_verified ? 'Yes' : 'No'} />
                          <InfoRow icon={FaGift} label="Referral Code" value={p.referral_code} />
                          <InfoRow icon={FaQuoteRight} label="Quotes Submitted" value={counts.quotes ?? 0} />
                          <InfoRow icon={FaFileAlt} label="Invoices" value={counts.invoices ?? 0} />
                        </>
                      )}
                    </div>
                  </div>

                  {isCompany && data.activeSubscription && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <FaCheckCircle />
                        <span className="font-bold">Active Subscription</span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                        <div><p className="text-xs uppercase text-emerald-600">Plan</p><p className="font-semibold">{data.activeSubscription.plan_name || '—'}</p></div>
                        <div><p className="text-xs uppercase text-emerald-600">Started</p><p className="font-semibold">{fmtDate(data.activeSubscription.start_date)}</p></div>
                        <div><p className="text-xs uppercase text-emerald-600">Expires</p><p className="font-semibold">{fmtDate(data.activeSubscription.end_date)}</p></div>
                        <div><p className="text-xs uppercase text-emerald-600">Status</p><p className="font-semibold capitalize">{data.activeSubscription.status}</p></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* WALLET */}
              {tab === 'wallet' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <StatTile icon={FaWallet} label="Current Balance" value={money(data.wallet?.balance)} sub={formatUsd(data.wallet?.balance)} />
                    <StatTile icon={FaChartLine} label="Lifetime Earned" value={money(data.wallet?.lifetimeEarned)} sub={formatUsd(data.wallet?.lifetimeEarned)} />
                    <StatTile icon={FaMoneyBillWave} label="Lifetime Used" value={money(data.wallet?.lifetimeUsed)} sub={formatUsd(data.wallet?.lifetimeUsed)} />
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">Wallet Ledger</h4>
                    <DataTable
                      empty="No wallet transactions"
                      rows={data.walletTransactions}
                      columns={[
                        { key: 'created_at', label: 'Date', render: (r) => fmtDate(r.created_at) },
                        { key: 'type', label: 'Type', render: (r) => <span className="capitalize">{r.type || '—'}</span> },
                        { key: 'amount_bhd', label: 'Amount', render: (r) => (<>{money(r.amount_bhd)}<div className="text-xs text-gray-400">{formatUsd(r.amount_bhd)}</div></>) },
                        { key: 'balance_after', label: 'Balance After', render: (r) => (<>{money(r.balance_after)}<div className="text-xs text-gray-400">{formatUsd(r.balance_after)}</div></>) },
                        { key: 'description', label: 'Description' },
                        { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> }
                      ]}
                    />
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">Top-up Requests</h4>
                    <DataTable
                      empty="No top-up requests"
                      rows={data.topupRequests}
                      columns={[
                        { key: 'created_at', label: 'Date', render: (r) => fmtDate(r.created_at) },
                        { key: 'amount_bhd', label: 'Amount', render: (r) => (<>{money(r.amount_bhd)}<div className="text-xs text-gray-400">{formatUsd(r.amount_bhd)}</div></>) },
                        { key: 'method', label: 'Method' },
                        { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> }
                      ]}
                    />
                  </div>
                </div>
              )}

              {/* REFERRALS */}
              {tab === 'referrals' && (
                <div className="space-y-5">
                  <div>
                    <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
                      Referrals Made ({data.referralsMade?.length || 0})
                    </h4>
                    <DataTable
                      empty="No referrals made"
                      rows={data.referralsMade}
                      columns={[
                        { key: 'created_at', label: 'Date', render: (r) => fmtDate(r.created_at) },
                        { key: 'referred_name', label: 'Referred User' },
                        { key: 'referred_email', label: 'Email' },
                        { key: 'referred_role', label: 'Role', render: (r) => <span className="capitalize">{r.referred_role || '—'}</span> },
                        { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> }
                      ]}
                    />
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">Referred By</h4>
                    <DataTable
                      empty="Not referred by anyone"
                      rows={data.referredBy}
                      columns={[
                        { key: 'created_at', label: 'Date', render: (r) => fmtDate(r.created_at) },
                        { key: 'referrer_name', label: 'Referrer' },
                        { key: 'referrer_role', label: 'Role', render: (r) => <span className="capitalize">{r.referrer_role || '—'}</span> },
                        { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> }
                      ]}
                    />
                  </div>
                </div>
              )}

              {/* RECORDS: Subscriptions (company) or Quotes (user/business) */}
              {tab === 'records' && isCompany && (
                <div className="space-y-5">
                  <div>
                    <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
                      Subscription History ({data.subscriptions?.length || 0})
                    </h4>
                    <DataTable
                      empty="No subscriptions found"
                      rows={data.subscriptions}
                      columns={[
                        { key: 'plan_name', label: 'Plan' },
                        { key: 'start_date', label: 'Start', render: (r) => fmtDate(r.start_date) },
                        { key: 'end_date', label: 'End', render: (r) => fmtDate(r.end_date) },
                        { key: 'amount_paid', label: 'Amount', render: (r) => (<>{money(r.final_amount_bhd ?? r.amount_paid)}<div className="text-xs text-gray-400">{formatUsd(r.final_amount_bhd ?? r.amount_paid)}</div></>) },
                        { key: 'payment_method', label: 'Method' },
                        { key: 'payment_status', label: 'Payment', render: (r) => <StatusPill status={r.payment_status} /> },
                        { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> }
                      ]}
                    />
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
                      Quote Responses ({data.quoteResponses?.length || 0})
                    </h4>
                    <DataTable
                      empty="No quote responses"
                      rows={data.quoteResponses}
                      columns={[
                        { key: 'created_at', label: 'Date', render: (r) => fmtDate(r.created_at) },
                        { key: 'route', label: 'Route', render: (r) => [r.departure_city, r.arrival_city].filter(Boolean).join(' → ') || '—' },
                        { key: 'shipping_mode', label: 'Mode' },
                        { key: 'price', label: 'Price' },
                        { key: 'transit_time', label: 'Transit' },
                        { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> }
                      ]}
                    />
                  </div>
                </div>
              )}

              {tab === 'records' && !isCompany && (
                <div>
                  <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
                    Quotes Submitted ({data.quotes?.length || 0})
                  </h4>
                  <DataTable
                    empty="No quotes submitted"
                    rows={data.quotes}
                    columns={[
                      { key: 'created_at', label: 'Date', render: (r) => fmtDate(r.created_at) },
                      { key: 'route', label: 'Route', render: (r) => [r.departure_city, r.arrival_city].filter(Boolean).join(' → ') || '—' },
                      { key: 'shipping_mode', label: 'Mode' },
                      { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> }
                    ]}
                  />
                </div>
              )}

              {/* BILLING / OPERATIONS */}
              {tab === 'billing' && (
                <div className="space-y-5">
                  <div>
                    <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
                      Transactions ({data.transactions?.length || 0})
                    </h4>
                    <DataTable
                      empty="No transactions"
                      rows={data.transactions}
                      columns={[
                        { key: 'created_at', label: 'Date', render: (r) => fmtDate(r.created_at) },
                        { key: 'amount', label: 'Amount', render: (r) => (<>{money(r.amount)}<div className="text-xs text-gray-400">{formatUsd(r.amount)}</div></>) },
                        { key: 'payment_method', label: 'Method' },
                        { key: 'transaction_reference', label: 'Reference' },
                        { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> }
                      ]}
                    />
                  </div>

                  {!isCompany && (
                    <div>
                      <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
                        Invoices ({data.invoices?.length || 0})
                      </h4>
                      <DataTable
                        empty="No invoices"
                        rows={data.invoices}
                        columns={[
                          { key: 'created_at', label: 'Date', render: (r) => fmtDate(r.created_at) },
                          { key: 'invoice_number', label: 'Invoice #' },
                          { key: 'total_amount', label: 'Total', render: (r) => (<>{money(r.total_amount)}<div className="text-xs text-gray-400">{formatUsd(r.total_amount)}</div></>) },
                          { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> }
                        ]}
                      />
                    </div>
                  )}

                  {isCompany && (
                    <>
                      <div>
                        <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">Bank Details</h4>
                        <DataTable
                          empty="No bank details"
                          rows={data.bankDetails}
                          columns={[
                            { key: 'bank_name', label: 'Bank' },
                            { key: 'account_holder_name', label: 'Holder' },
                            { key: 'account_number', label: 'Account No.' },
                            { key: 'swift_code', label: 'SWIFT' },
                            { key: 'iban_number', label: 'IBAN' },
                            { key: 'is_default', label: 'Default', render: (r) => (r.is_default ? 'Yes' : 'No') }
                          ]}
                        />
                      </div>
                      <div>
                        <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
                          Team Members ({data.members?.length || 0})
                        </h4>
                        <DataTable
                          empty="No team members"
                          rows={data.members}
                          columns={[
                            { key: 'member_name', label: 'Name' },
                            { key: 'member_email', label: 'Email' },
                            { key: 'member_phone', label: 'Phone' },
                            { key: 'member_role', label: 'Role' }
                          ]}
                        />
                      </div>
                      <div>
                        <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
                          Branches ({data.branches?.length || 0})
                        </h4>
                        <DataTable
                          empty="No branches"
                          rows={data.branches}
                          columns={[
                            { key: 'branch_name', label: 'Branch' },
                            { key: 'country', label: 'Country' },
                            { key: 'city', label: 'City' },
                            { key: 'branch_email', label: 'Email' },
                            { key: 'branch_phone', label: 'Phone' }
                          ]}
                        />
                      </div>
                    </>
                  )}

                  {!isCompany && (
                    <div>
                      <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
                        Support Tickets ({data.tickets?.length || 0})
                      </h4>
                      <DataTable
                        empty="No support tickets"
                        rows={data.tickets}
                        columns={[
                          { key: 'created_at', label: 'Date', render: (r) => fmtDate(r.created_at) },
                          { key: 'ticket_number', label: 'Ticket #' },
                          { key: 'subject', label: 'Subject' },
                          { key: 'priority', label: 'Priority' },
                          { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> }
                        ]}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ACTIVITY */}
              {tab === 'activity' && (
                <div className="space-y-5">
                  <div>
                    <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
                      Reviews ({data.reviews?.length || 0})
                    </h4>
                    <DataTable
                      empty="No reviews"
                      rows={data.reviews}
                      columns={[
                        { key: 'created_at', label: 'Date', render: (r) => fmtDate(r.created_at) },
                        ...(isCompany ? [{ key: 'reviewer_name', label: 'Reviewer' }] : []),
                        { key: 'rating', label: 'Rating', render: (r) => (
                          <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
                            <FaStar className="text-xs" /> {r.rating ?? '—'}
                          </span>
                        ) },
                        { key: 'review_text', label: 'Comment' },
                        { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> }
                      ]}
                    />
                  </div>

                  <div>
                    <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
                      Disputes ({data.disputes?.length || 0})
                    </h4>
                    <DataTable
                      empty="No disputes"
                      rows={data.disputes}
                      columns={[
                        { key: 'created_at', label: 'Date', render: (r) => fmtDate(r.created_at) },
                        { key: 'title', label: 'Title' },
                        { key: 'priority', label: 'Priority' },
                        { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> }
                      ]}
                    />
                  </div>

                  {isCompany && (
                    <div>
                      <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">Blacklist History</h4>
                      <DataTable
                        empty="No blacklist history"
                        rows={data.blacklistHistory}
                        columns={[
                          { key: 'created_at', label: 'Date', render: (r) => fmtDate(r.created_at) },
                          { key: 'action', label: 'Action' },
                          { key: 'reason', label: 'Reason' }
                        ]}
                      />
                    </div>
                  )}

                  <div>
                    <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
                      <FaSignInAlt className="mr-1 inline text-xs" /> Recent Logins
                    </h4>
                    <DataTable
                      empty="No login history"
                      rows={data.loginHistory}
                      columns={[
                        { key: 'login_time', label: 'Time', render: (r) => fmtDateTime(r.login_time) },
                        { key: 'ip_address', label: 'IP Address' },
                        { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> }
                      ]}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-gray-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <FaRegClock /> ID #{userId} · {role}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
            >
              Close
            </button>
            {onDelete && !loading && data && (
              <button
                onClick={() => onDelete(data?.profile)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-800 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:from-red-700 hover:to-red-900"
              >
                <FaTrash /> Delete User
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
