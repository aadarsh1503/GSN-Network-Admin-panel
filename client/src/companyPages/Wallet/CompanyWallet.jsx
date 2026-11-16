import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCreditCard, FiPlus, FiArrowDownLeft, FiArrowUpRight, FiRefreshCw,
  FiGift, FiClock, FiCheckCircle, FiXCircle, FiUpload, FiInfo, FiExternalLink
} from 'react-icons/fi';
import { FaPaypal, FaUniversity } from 'react-icons/fa';
import { api, walletAPI, getPaypalClientId } from '../../utils/api';
import { useCurrency } from '../../contexts/CurrencyContext';
import toast from 'react-hot-toast';

const TYPE_META = {
  deposit:            { label: 'Wallet Deposit',       color: 'text-emerald-600', sign: '+' },
  referral_reward:    { label: 'Referral Reward',      color: 'text-[#bca142]',   sign: '+' },
  subscription_payment:{ label: 'Subscription Payment', color: 'text-red-500',    sign: '-' },
  subscription_wallet:{ label: 'Subscription Payment', color: 'text-red-500',     sign: '-' },
  refund:             { label: 'Refund',               color: 'text-emerald-600', sign: '+' },
  admin_adjustment:   { label: 'Admin Adjustment',     color: 'text-blue-600',    sign: ''  },
  credit:             { label: 'Credit',               color: 'text-emerald-600', sign: '+' },
  debit:              { label: 'Debit',                color: 'text-red-500',     sign: '-' },
  expiry:             { label: 'Expired',              color: 'text-gray-400',    sign: '-' },
};

const StatusBadge = ({ status }) => {
  const map = {
    completed: { cls: 'bg-green-100 text-green-700', icon: FiCheckCircle },
    approved:  { cls: 'bg-green-100 text-green-700', icon: FiCheckCircle },
    pending:   { cls: 'bg-yellow-100 text-yellow-700', icon: FiClock },
    rejected:  { cls: 'bg-red-100 text-red-700', icon: FiXCircle },
    failed:    { cls: 'bg-red-100 text-red-700', icon: FiXCircle },
    cancelled: { cls: 'bg-gray-100 text-gray-500', icon: FiXCircle },
  };
  const cfg = map[status] || map.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      <Icon className="w-3 h-3" />
      {String(status || '').charAt(0).toUpperCase() + String(status || '').slice(1)}
    </span>
  );
};

const CompanyWallet = () => {
  const { format, formatUsd } = useCurrency();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('transactions');

  const fmtBhd = (v) => format(v);

  const [txns, setTxns] = useState([]);
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [topups, setTopups] = useState([]);

  const [showAddFunds, setShowAddFunds] = useState(false);

  const loadWallet = useCallback(async () => {
    try {
      const d = await walletAPI.getWallet();
      setData(d);
    } catch (e) {
      toast.error(e.message || 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTxns = useCallback(async (page = 1) => {
    try {
      const d = await walletAPI.getTransactions({ page, limit: 15 });
      setTxns(d.transactions || []);
      setTxTotalPages(d.pagination?.totalPages || 1);
    } catch (e) {
      toast.error(e.message || 'Failed to load transactions');
    }
  }, []);

  const loadTopups = useCallback(async () => {
    try {
      setTopups(await walletAPI.getMyTopups() || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load top-up requests');
    }
  }, []);

  useEffect(() => { loadWallet(); }, [loadWallet]);
  useEffect(() => { if (tab === 'transactions') loadTxns(txPage); }, [tab, txPage, loadTxns]);
  useEffect(() => { if (tab === 'topups') loadTopups(); }, [tab, loadTopups]);

  const refreshRate = async () => {
    try {
      await walletAPI.getCurrencyRate(true);
      await loadWallet();
      toast.success('Currency rate refreshed');
    } catch {
      toast.error('Could not refresh rate');
    }
  };

  const onTopupDone = async () => {
    setShowAddFunds(false);
    await loadWallet();
    if (tab === 'topups') loadTopups();
    else loadTxns(txPage);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bca142]" />
      </div>
    );
  }

  const balance = Number(data?.balance || 0);
  const rates = data?.rates || {};
  const rate = Number(rates.bhdToUsd || 2.6526);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Company Wallet</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Add funds, earn referral rewards and pay for subscriptions using your wallet balance.
          </p>
        </div>
        <button
          onClick={() => setShowAddFunds(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
          style={{ background: 'linear-gradient(135deg, #bca142 0%, #9d8635 100%)' }}
        >
          <FiPlus /> Add Funds
        </button>
      </div>

      {/* Balance + stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl p-6 text-white shadow-lg"
          style={{ background: 'linear-gradient(135deg, #bca142 0%, #9d8635 100%)' }}>
          <div className="flex items-center justify-between">
            <span className="text-sm opacity-90">Available Balance</span>
            <button onClick={refreshRate} title="Refresh currency rate"
              className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg transition">
              <FiRefreshCw className="w-3 h-3" /> {rate.toFixed(4)}
            </button>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold leading-tight break-words mt-1">{fmtBhd(balance)}</p>
          <p className="text-sm opacity-80 mt-0.5">≈ {formatUsd(balance)} <span className="opacity-70">(live rate)</span></p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-white/15 rounded-xl px-4 py-2.5">
              <p className="text-xs opacity-80">Lifetime Earned</p>
              <p className="font-semibold">
                {fmtBhd(data?.lifetimeEarned)}
                <span className="block text-[10px] opacity-70">{formatUsd(data?.lifetimeEarned)}</span>
              </p>
            </div>
            <div className="bg-white/15 rounded-xl px-4 py-2.5">
              <p className="text-xs opacity-80">Lifetime Used</p>
              <p className="font-semibold">
                {fmtBhd(data?.lifetimeUsed)}
                <span className="block text-[10px] opacity-70">{formatUsd(data?.lifetimeUsed)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Referral card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <div className="flex items-center gap-2 text-[#bca142] mb-2">
            <FiGift className="w-5 h-5" />
            <span className="font-semibold">Referral Rewards</span>
          </div>
          <p className="text-sm text-gray-500 flex-1">
            {data?.settings?.referralEnabled
              ? 'Refer a company and earn wallet rewards automatically. Track your referrals and rewards.'
              : 'The referral reward program is currently disabled by the administrator.'}
          </p>
          <Link to="/company/referrals"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#bca142] hover:underline">
            Go to Referral Program <FiExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {!data?.settings?.walletSubscriptionEnabled && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
          <FiInfo className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-700">
            Paying for subscriptions with your wallet is currently disabled by the administrator.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {[
            { key: 'transactions', label: 'Transaction History' },
            { key: 'topups', label: 'Top-Up Requests' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? 'border-[#bca142] text-[#bca142]' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Transactions */}
      {tab === 'transactions' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {txns.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <FiCreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No transactions yet.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Description</th>
                      <th className="px-4 py-3 text-left">Ref</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {txns.map(t => {
                      const meta = TYPE_META[t.type] || { label: t.type, color: 'text-gray-600', sign: '' };
                      return (
                        <tr key={t.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                            {new Date(t.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-medium ${meta.color}`}>{meta.label}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{t.description || '—'}</td>
                          <td className="px-4 py-3 text-gray-400 font-mono text-xs">{t.transaction_ref || '—'}</td>
                          <td className={`px-4 py-3 text-right font-semibold ${meta.color}`}>
                            {meta.sign || (Number(t.amount_bhd) < 0 ? '-' : '+')}
                            {fmtBhd(Math.abs(Number(t.amount_bhd)))}
                            <span className="block text-[10px] text-gray-400 font-normal">{formatUsd(Math.abs(Number(t.amount_bhd)))}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500">
                            {t.balance_after != null ? fmtBhd(t.balance_after) : '—'}
                            {t.balance_after != null && (
                              <span className="block text-[10px] text-gray-400 font-normal">{formatUsd(t.balance_after)}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {txTotalPages > 1 && (
                <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100 text-sm">
                  <button disabled={txPage === 1} onClick={() => setTxPage(p => p - 1)}
                    className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">← Prev</button>
                  <span className="text-gray-400">Page {txPage} / {txTotalPages}</span>
                  <button disabled={txPage >= txTotalPages} onClick={() => setTxPage(p => p + 1)}
                    className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Top-up requests */}
      {tab === 'topups' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {topups.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <FiArrowDownLeft className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No top-up requests yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Method</th>
                    <th className="px-4 py-3 text-left">Ref</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topups.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(t.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3 capitalize text-gray-600">{String(t.method).replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{t.transaction_ref || '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-700">
                        {fmtBhd(t.amount_bhd)}
                        <span className="block text-[10px] text-gray-400 font-normal">{formatUsd(t.amount_bhd)}</span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{t.admin_note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showAddFunds && (
        <AddFundsModal
          rate={rate}
          settings={data?.settings || {}}
          onClose={() => setShowAddFunds(false)}
          onDone={onTopupDone}
        />
      )}
    </div>
  );
};

// ─── Add Funds Modal ──────────────────────────────────────────────────────────
const AddFundsModal = ({ rate, settings, onClose, onDone }) => {
  const { format, formatUsd } = useCurrency();
  const fmtBhd = (v) => format(v);
  const [method, setMethod] = useState('paypal');
  const [amount, setAmount] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [proof, setProof] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [paypalReady, setPaypalReady] = useState(false);
  const [paypalClientId, setPaypalClientId] = useState('');
  const [adminPaypalId, setAdminPaypalId] = useState('');
  const paypalRef = useRef(null);

  const minTopup = Number(settings.minTopupBhd || 1);
  const maxTopup = Number(settings.maxTopupBhd || 5000);
  const amountBhd = Number(amount) || 0;
  const amountUsd = amountBhd * rate;

  // Admin PayPal receiving id (from admin panel)
  useEffect(() => {
    api.get('/api/bank-details/active')
      .then((d) => setAdminPaypalId(d?.paypal_id || ''))
      .catch(() => {});
  }, []);

  // Load PayPal SDK (client id comes from the admin panel)
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const clientId = await getPaypalClientId();
      if (cancelled) return;
      setPaypalClientId(clientId);
      if (window.paypal) { setPaypalReady(true); return; }
      if (!clientId) return;
      const existing = document.querySelector('script[data-wallet-paypal]');
      if (existing) { existing.addEventListener('load', () => setPaypalReady(true)); return; }
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
      script.async = true;
      script.dataset.walletPaypal = 'true';
      script.onload = () => setPaypalReady(true);
      script.onerror = () => toast.error('Failed to load PayPal. Please use bank transfer.');
      document.body.appendChild(script);
    };
    init();
    return () => { cancelled = true; };
  }, []);

  // Render PayPal buttons for top-up
  useEffect(() => {
    if (method !== 'paypal' || !paypalReady || !window.paypal || !paypalRef.current) return;
    if (!(amountBhd >= minTopup)) { paypalRef.current.innerHTML = ''; return; }
    paypalRef.current.innerHTML = '';
    window.paypal.Buttons({
      createOrder: (d, actions) => actions.order.create({
        purchase_units: [{
          description: `GSN Wallet Top-Up (${amountBhd.toFixed(3)} BHD)`,
          amount: { currency_code: 'USD', value: amountUsd.toFixed(2) },
        }],
      }),
      onApprove: async (d, actions) => {
        try {
          const order = await actions.order.capture();
          setSubmitting(true);
          await walletAPI.createPaypalTopup({
            amountBhd,
            orderId: order.id,
            payerId: order.payer?.payer_id,
          });
          toast.success(`Wallet topped up with ${fmtBhd(amountBhd)}`);
          onDone();
        } catch (e) {
          toast.error(e.message || 'Top-up failed');
        } finally {
          setSubmitting(false);
        }
      },
      onError: () => toast.error('PayPal payment failed. Please try again.'),
      style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },
    }).render(paypalRef.current);
  }, [method, paypalReady, amountBhd, amountUsd, minTopup, onDone]);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error('File too large (max 10MB)'); return; }
    setProof(f);
  };

  const submitBank = async (e) => {
    e.preventDefault();
    if (!(amountBhd >= minTopup)) { toast.error(`Minimum top-up is ${minTopup} BHD`); return; }
    if (maxTopup > 0 && amountBhd > maxTopup) { toast.error(`Maximum top-up is ${maxTopup} BHD`); return; }
    if (!proof) { toast.error('Please upload the payment proof'); return; }
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append('amountBhd', String(amountBhd));
      if (transactionRef) fd.append('transactionRef', transactionRef);
      fd.append('paymentProof', proof);
      await walletAPI.createBankTopup(fd);
      toast.success('Top-up request submitted. Admin will review and credit your wallet.', { duration: 6000 });
      onDone();
    } catch (e2) {
      toast.error(e2.message || 'Failed to submit top-up request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-800">Add Funds to Wallet</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>

          {/* Method toggle */}
          <div className="flex gap-2 p-1 rounded-xl bg-black/5 mb-5">
            {[{ key: 'paypal', label: 'PayPal', Icon: FaPaypal }, { key: 'bank', label: 'Bank Transfer', Icon: FaUniversity }].map(({ key, label, Icon }) => (
              <button key={key} onClick={() => setMethod(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  method === key ? 'bg-white text-[#9d8635] shadow-sm' : 'text-gray-500'
                }`}>
                <Icon size={14} />{label}
              </button>
            ))}
          </div>

          {/* Amount */}
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Amount (BHD)</label>
          <input type="number" min={minTopup} max={maxTopup} step="0.001" value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder={`Min ${minTopup} BHD`}
            className="w-full px-4 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#bca142] mb-1"
            style={{ border: '1px solid #ddd8c8' }} />
          <p className="text-xs text-gray-400 mb-4">
            {amountBhd > 0 ? `${fmtBhd(amountBhd)} ≈ ${formatUsd(amountBhd)} (rate ${rate.toFixed(4)})` : `Limits: ${minTopup} – ${maxTopup} BHD`}
          </p>

          {method === 'paypal' && (
            <div className="space-y-3">
              {adminPaypalId && (
                <div className="rounded-xl px-4 py-3 bg-black/5" style={{ border: '1px solid rgba(0,0,0,0.10)' }}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Payment received by</p>
                  <p className="text-sm font-semibold text-gray-700 break-all">{adminPaypalId}</p>
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-100">
                <FiInfo className="text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700">PayPal is charged in <strong>USD</strong> using the live BHD→USD rate. Your wallet is credited instantly.</p>
              </div>
              {amountBhd < minTopup ? (
                <p className="text-sm text-gray-400 text-center py-6">Enter an amount of at least {minTopup} BHD to continue.</p>
              ) : !paypalClientId ? (
                <p className="text-sm text-red-500 text-center py-4">PayPal is not configured. Please use bank transfer.</p>
              ) : (
                <div ref={paypalRef} className="pt-1" />
              )}
            </div>
          )}

          {method === 'bank' && (
            <form onSubmit={submitBank} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Transaction / Reference ID</label>
                <input type="text" value={transactionRef} onChange={e => setTransactionRef(e.target.value)}
                  placeholder="Bank reference number (optional)"
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#bca142]"
                  style={{ border: '1px solid #ddd8c8' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Payment Proof *</label>
                <label className="cursor-pointer block">
                  <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                  <div className="rounded-xl p-5 text-center bg-white transition-all"
                    style={{ border: `2px dashed ${proof ? '#bca142' : '#ddd8c8'}` }}>
                    <FiUpload className={`w-5 h-5 mx-auto mb-1.5 ${proof ? 'text-[#bca142]' : 'text-gray-300'}`} />
                    <p className={`text-sm font-medium ${proof ? 'text-[#bca142]' : 'text-gray-400'}`}>
                      {proof ? proof.name : 'Click to upload screenshot / receipt'}
                    </p>
                    <p className="text-xs text-gray-300 mt-0.5">PNG, JPG up to 10 MB</p>
                  </div>
                </label>
              </div>
              <p className="text-xs text-gray-400">Bank top-ups are credited after admin approval.</p>
              <button type="submit" disabled={submitting}
                className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #bca142 0%, #9d8635 100%)' }}>
                {submitting ? 'Submitting…' : 'Submit Top-Up Request'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyWallet;
