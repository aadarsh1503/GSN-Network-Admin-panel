import { useState, useEffect, useCallback } from 'react';
import { Copy, Users, Gift, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, Wallet } from 'lucide-react';
import referralApi from '../../utils/referralApi';
import { walletAPI } from '../../utils/api';
import { useCurrency } from '../../contexts/CurrencyContext';
import toast from 'react-hot-toast';

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
    <div className="bg-[#bca142]/10 p-3 rounded-xl">
      <Icon className="w-6 h-6 text-[#bca142]" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    rewarded: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
    pending:  { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    rejected: { color: 'bg-red-100 text-red-700',   icon: XCircle },
    qualified:{ color: 'bg-blue-100 text-blue-700',  icon: AlertCircle },
    expired:  { color: 'bg-gray-100 text-gray-500',  icon: XCircle },
    available:{ color: 'bg-green-100 text-green-700', icon: CheckCircle },
    used:      { color: 'bg-gray-200 text-gray-600',   icon: CheckCircle },
    disabled: { color: 'bg-red-100 text-red-700',     icon: XCircle },
  };
  const cfg = map[status] || map.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const ReferralPage = () => {
  const { format, formatUsd, currency } = useCurrency();
  const [info, setInfo]         = useState(null);
  const [history, setHistory]   = useState([]);
  const [tab, setTab]           = useState('overview');
  const [loading, setLoading]   = useState(true);
  const [validating, setValidating] = useState(false);
  const [codeInput, setCodeInput]   = useState('');
  const [codeResult, setCodeResult] = useState(null);
  const [histPage, setHistPage] = useState(1);
  const [histTotal, setHistTotal] = useState(0);
  const [walletBalance, setWalletBalance] = useState(null);
  const LIMIT = 10;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const infoData = await referralApi.getMyCode();
      setInfo(infoData);
    } catch {
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async (page = 1) => {
    try {
      const data = await referralApi.getHistory(page, LIMIT);
      setHistory(data.referrals || []);
      setHistTotal(data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load referral history');
    }
  }, []);

  const fetchWalletBalance = useCallback(async () => {
    try {
      const w = await walletAPI.getWallet();
      setWalletBalance(Number(w?.balance || 0));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchAll(); fetchWalletBalance(); }, [fetchAll, fetchWalletBalance]);
  useEffect(() => { if (tab === 'history') fetchHistory(histPage); }, [tab, histPage, fetchHistory]);

  const copyCode = () => {
    if (!info?.referralCode) return;
    navigator.clipboard.writeText(info.referralCode);
    toast.success('Referral code copied!');
  };

  const copyLink = () => {
    if (!info?.shareLink) return;
    navigator.clipboard.writeText(info.shareLink);
    toast.success('Share link copied!');
  };

  const validateCode = async () => {
    if (!codeInput.trim()) return;
    setValidating(true);
    setCodeResult(null);
    try {
      const data = await referralApi.validateCode(codeInput.trim(), info?.role);
      setCodeResult(data);
    } catch {
      setCodeResult({ valid: false, reason: 'Server error' });
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bca142]" />
      </div>
    );
  }

  const stats = info?.stats || {};

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Referral Program</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Invite other companies and earn wallet rewards when they register and subscribe.
        </p>
      </div>

      {/* Referral Code Card */}
      <div className="bg-gradient-to-r from-[#bca142] to-[#9d8635] rounded-2xl p-6 text-white shadow-lg">
        <p className="text-sm opacity-80 mb-1">Your Referral Code</p>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-3xl font-mono font-bold tracking-widest bg-white/20 px-4 py-2 rounded-xl">
            {info?.referralCode || '—'}
          </span>
          <button
            onClick={copyCode}
            className="flex items-center gap-2 bg-white text-[#bca142] font-semibold px-4 py-2 rounded-xl hover:bg-white/90 transition-all text-sm"
          >
            <Copy className="w-4 h-4" /> Copy Code
          </button>
        </div>
        <div className="mt-4 bg-white/10 rounded-xl px-4 py-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs opacity-75 break-all flex-1">{info?.shareLink}</span>
          <button
            onClick={copyLink}
            className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-all font-medium flex-shrink-0"
          >
            Copy Link
          </button>
        </div>
        <p className="mt-3 text-xs opacity-70">
          The referral program is for companies only. Share with other companies — every qualifying referral adds a reward to your wallet.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users}      label="Total Referrals" value={stats.totalReferrals || 0} />
        <StatCard icon={CheckCircle} label="Rewarded"       value={stats.totalRewarded || 0} />
        <StatCard icon={Clock}       label="Pending"        value={stats.pendingReferrals || 0} />
        <StatCard icon={Wallet}      label="Wallet Balance" value={walletBalance == null ? '—' : format(walletBalance)} sub={walletBalance == null ? 'reward earnings' : `≈ ${formatUsd(walletBalance)} · reward earnings`} />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'history',  label: 'Referral History' },
            { key: 'validate', label: 'Validate a Code' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-[#bca142] text-[#bca142]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab: Overview */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#bca142]" /> How It Works
            </h2>
            <ol className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[#bca142] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                <span>Share your unique referral code or invite link with <strong>another company</strong>.</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[#bca142] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                <span>They register using your code. The referral is recorded immediately.</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[#bca142] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                <span>Once they complete the qualifying step (registration or subscription, as configured), <strong>a reward is credited to your wallet</strong>.</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[#bca142] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                <span>Use your wallet balance to pay for subscription plans, fully or partially.</span>
              </li>
            </ol>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <strong>Important:</strong> The referral program is available for <strong>companies only</strong>.
            Company → Company ✅ &nbsp;|&nbsp; User / Business ❌
          </div>
        </div>
      )}

      {/* Tab: History */}
      {tab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {history.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No referrals yet. Share your code to get started!</p>
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Referred</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Reward ({currency})</th>
                    <th className="px-4 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {history.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{r.referred_name}</td>
                      <td className="px-4 py-3 capitalize text-gray-500">{r.referred_role}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3 text-[#bca142] font-semibold">
                        {r.reward_amount ? `+${format(r.reward_amount)}` : '—'}
                        {r.reward_amount ? (
                          <span className="block text-[10px] text-gray-400 font-normal">≈ {formatUsd(r.reward_amount)}</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {new Date(r.registered_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination */}
              {histTotal > LIMIT && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm">
                  <span className="text-gray-400">{histTotal} total</span>
                  <div className="flex gap-2">
                    <button
                      disabled={histPage === 1}
                      onClick={() => setHistPage(p => p - 1)}
                      className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >← Prev</button>
                    <button
                      disabled={histPage * LIMIT >= histTotal}
                      onClick={() => setHistPage(p => p + 1)}
                      className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >Next →</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}



      {/* Tab: Validate */}
      {tab === 'validate' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-md">
          <h2 className="font-semibold text-gray-700 mb-4">Check a Referral Code</h2>
          <p className="text-sm text-gray-500 mb-4">
            Enter a referral code to see if it is valid and compatible with your account type.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={codeInput}
              onChange={e => setCodeInput(e.target.value.toUpperCase())}
              placeholder="e.g. CMP-A1B2C3-4D"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#bca142]"
            />
            <button
              onClick={validateCode}
              disabled={validating || !codeInput.trim()}
              className="bg-[#bca142] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#9d8635] disabled:opacity-50 transition-colors"
            >
              {validating ? '...' : 'Check'}
            </button>
          </div>
          {codeResult && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${codeResult.valid ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {codeResult.valid
                ? `✅ Valid code from ${codeResult.referrerName} (${codeResult.referrerRole})`
                : `❌ ${codeResult.reason || 'Invalid code'}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReferralPage;
