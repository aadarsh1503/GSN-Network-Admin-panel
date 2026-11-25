import { useState, useEffect, useCallback } from 'react';
import {
  FiCreditCard, FiGift, FiSettings, FiUsers, FiList, FiClock,
  FiCheck, FiX, FiRefreshCw, FiPlus, FiMinus, FiInfo
} from 'react-icons/fi';
import { walletAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../../contexts/CurrencyContext';

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-100 shadow-sm ${className}`}>{children}</div>
);

const Stat = ({ icon: Icon, label, value, sub, tone = 'gold' }) => (
  <Card className="p-5 flex items-center gap-4">
    <div className={`p-3 rounded-xl ${tone === 'green' ? 'bg-emerald-50' : 'bg-[#bca142]/10'}`}>
      <Icon className={`w-6 h-6 ${tone === 'green' ? 'text-emerald-600' : 'text-[#bca142]'}`} />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </Card>
);

const Toggle = ({ checked, onChange, label, hint }) => (
  <label className="flex items-start justify-between gap-4 py-2 cursor-pointer">
    <span>
      <span className="block text-sm font-medium text-gray-700">{label}</span>
      {hint && <span className="block text-xs text-gray-400 mt-0.5">{hint}</span>}
    </span>
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 mt-0.5 ${checked ? 'bg-[#bca142]' : 'bg-gray-300'}`}>
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  </label>
);

const AdminWalletSettings = () => {
  const [tab, setTab] = useState('overview');

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Wallet &amp; Referral Settings</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Configure referral rewards, wallet rules, monitor balances and manage transactions.
        </p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-5 flex-wrap">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'settings', label: 'Configuration' },
            { key: 'wallets', label: 'Company Wallets' },
            { key: 'topups', label: 'Top-Up Requests' },
            { key: 'transactions', label: 'Transaction Ledger' },
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

      {tab === 'overview' && <OverviewTab />}
      {tab === 'settings' && <SettingsTab />}
      {tab === 'wallets' && <WalletsTab />}
      {tab === 'topups' && <TopupsTab />}
      {tab === 'transactions' && <TransactionsTab />}
    </div>
  );
};

// ─── Overview ─────────────────────────────────────────────────────────────────
const OverviewTab = () => {
  const { format, formatUsd } = useCurrency();
  const fmtBhd = (v) => format(v);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setData(await walletAPI.admin.getOverview()); }
    catch (e) { toast.error(e.message || 'Failed to load overview'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="py-16 text-center text-gray-400">Loading…</div>;
  if (!data) return null;

  const rate = data.rates?.bhdToUsd || 2.6526;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={FiCreditCard} label="Total Wallet Balance" value={fmtBhd(data.totalWalletBalance)} sub={`≈ ${formatUsd(data.totalWalletBalance)}`} />
        <Stat icon={FiGift} label="Lifetime Earned" value={fmtBhd(data.totalEarned)} tone="green" sub={`≈ ${formatUsd(data.totalEarned)}`} />
        <Stat icon={FiUsers} label="Active Wallets" value={data.walletCount} />
        <Stat icon={FiClock} label="Pending Top-Ups" value={data.pendingTopups} tone={data.pendingTopups > 0 ? 'green' : 'gold'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold text-gray-700 mb-4">Referral Activity</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-xl bg-gray-50 py-4">
              <p className="text-2xl font-bold text-gray-800">{data.referrals.total}</p>
              <p className="text-xs text-gray-500 mt-1">Total Referrals</p>
            </div>
            <div className="rounded-xl bg-emerald-50 py-4">
              <p className="text-2xl font-bold text-emerald-600">{data.referrals.rewarded}</p>
              <p className="text-xs text-gray-500 mt-1">Rewarded</p>
            </div>
            <div className="rounded-xl bg-amber-50 py-4">
              <p className="text-2xl font-bold text-amber-600">{data.referrals.pending}</p>
              <p className="text-xs text-gray-500 mt-1">Pending</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-gray-700 mb-2">Exchange Rate</h3>
          <p className="text-sm text-gray-500">1 BHD = <span className="font-bold text-gray-800">{rate.toFixed(4)} USD</span></p>
          <p className="text-xs text-gray-400 mt-1">Source: {data.rates?.source || 'default'}</p>
          <p className="text-xs text-gray-400">Updated: {data.rates?.updatedAt ? new Date(data.rates.updatedAt).toLocaleString() : '—'}</p>
          <button
            onClick={async () => { await walletAPI.admin.refreshRate(); toast.success('Rate refreshed'); load(); }}
            className="mt-3 flex items-center gap-2 text-sm font-medium text-[#bca142] hover:underline">
            <FiRefreshCw className="w-3.5 h-3.5" /> Refresh live rate
          </button>
        </Card>
      </div>
    </div>
  );
};

// ─── Settings ─────────────────────────────────────────────────────────────────
const SettingsTab = () => {
  const [s, setS] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await walletAPI.admin.getSettings();
      // Percentage-based rewards are no longer supported — rewards are a fixed BHD amount.
      setS({
        ...d.settings,
        registrationRewardType: 'fixed',
        subscriptionRewardType: 'fixed',
      });
    } catch (e) { toast.error(e.message || 'Failed to load settings'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setS(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    try {
      setSaving(true);
      await walletAPI.admin.updateSettings(s);
      toast.success('Settings saved successfully');
    } catch (e) {
      toast.error(e.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-16 text-center text-gray-400">Loading…</div>;
  if (!s) return null;

  return (
    <div className="space-y-4">
      {/* Referral system */}
      <Card className="p-5">
        <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2"><FiGift className="text-[#bca142]" /> Referral Reward System</h3>
        <Toggle label="Enable referral reward system"
          hint="Master switch — turning this off stops all referral rewards."
          checked={!!s.referralEnabled} onChange={v => set('referralEnabled', v)} />
      </Card>

      {/* Registration reward */}
      <Card className="p-5">
        <h3 className="font-semibold text-gray-700 mb-2">Reward on Company Registration</h3>
        <Toggle label="Credit reward when a referred company registers"
          hint="Reward is credited as soon as the new company signs up using a referral code."
          checked={!!s.registrationRewardEnabled} onChange={v => set('registrationRewardEnabled', v)} />
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 ${!s.registrationRewardEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Referrer reward (BHD)</label>
            <input type="number" min="0" step="0.001" value={s.registrationRewardValue}
              onChange={e => set('registrationRewardValue', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Referred company reward (BHD)</label>
            <input type="number" min="0" step="0.001" value={s.registrationReferredRewardValue}
              onChange={e => set('registrationReferredRewardValue', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]" />
          </div>
        </div>
      </Card>

      {/* Welcome bonus */}
      <Card className="p-5">
        <h3 className="font-semibold text-gray-700 mb-2">Welcome Bonus</h3>
        <Toggle label="Give a welcome bonus to every new company"
          hint="Credited automatically when a new company registers — whether or not they used a referral code."
          checked={!!s.welcomeBonusEnabled} onChange={v => set('welcomeBonusEnabled', v)} />
        <div className={`mt-1 ${!s.welcomeBonusEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Welcome bonus amount (BHD)</label>
          <input type="number" min="0" step="0.001" value={s.welcomeBonusValue}
            onChange={e => set('welcomeBonusValue', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]" />
        </div>
      </Card>

      {/* Subscription reward */}
      <Card className="p-5">
        <h3 className="font-semibold text-gray-700 mb-2">Reward on Subscription Purchase</h3>
        <Toggle label="Credit reward when a referred company purchases a subscription"
          hint="Reward is credited to the referring company's wallet after the referred company's subscription is approved."
          checked={!!s.subscriptionRewardEnabled} onChange={v => set('subscriptionRewardEnabled', v)} />
        <RewardFields
          disabled={!s.subscriptionRewardEnabled}
          value={s.subscriptionRewardValue}
          onValue={v => set('subscriptionRewardValue', v)}
        />
      </Card>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #bca142 0%, #9d8635 100%)' }}>
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

const RewardFields = ({ disabled, value, onValue }) => (
  <div className={`mt-1 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Reward amount (BHD)</label>
    <input type="number" min="0" step="0.001" value={value} onChange={e => onValue(e.target.value)}
      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]" />
  </div>
);

// ─── Company Wallets ────────────────────────────────────────────────────────
const WalletsTab = () => {
  const { formatUsd } = useCurrency();
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [adjustFor, setAdjustFor] = useState(null);

  const load = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const d = await walletAPI.admin.listWallets(q ? { search: q } : {});
      setWallets(d.wallets || []);
    } catch (e) { toast.error(e.message || 'Failed to load wallets'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load(search)}
          placeholder="Search by company name or email…"
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]" />
        <button onClick={() => load(search)} className="px-4 py-2.5 rounded-xl bg-[#bca142] text-white text-sm font-medium">Search</button>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400">Loading…</div>
        ) : wallets.length === 0 ? (
          <div className="py-16 text-center text-gray-400">No wallets found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Company</th>
                  <th className="px-4 py-3 text-right">Balance (BHD)</th>
                  <th className="px-4 py-3 text-right">Earned</th>
                  <th className="px-4 py-3 text-right">Used</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {wallets.map(w => (
                  <tr key={w.user_id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{w.name}</p>
                      <p className="text-xs text-gray-400">{w.email}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#bca142]">
                      {Number(w.balance_bhd).toFixed(3)}
                      <div className="text-xs text-gray-400 font-normal">≈ {formatUsd(w.balance_bhd)}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {Number(w.lifetime_earned).toFixed(3)}
                      <div className="text-xs text-gray-400">≈ {formatUsd(w.lifetime_earned)}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {Number(w.lifetime_used).toFixed(3)}
                      <div className="text-xs text-gray-400">≈ {formatUsd(w.lifetime_used)}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setAdjustFor(w)}
                        className="text-xs font-semibold text-[#bca142] hover:underline">Adjust</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {adjustFor && (
        <AdjustModal wallet={adjustFor} onClose={() => setAdjustFor(null)}
          onDone={() => { setAdjustFor(null); load(search); }} />
      )}
    </div>
  );
};

const AdjustModal = ({ wallet, onClose, onDone }) => {
  const { format, formatUsd } = useCurrency();
  const fmtBhd = (v) => format(v);
  const [type, setType] = useState('credit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!(amt > 0)) { toast.error('Enter a valid amount'); return; }
    try {
      setSubmitting(true);
      await walletAPI.admin.adjust({ userId: wallet.user_id, type, amountBhd: amt, description });
      toast.success(`Wallet ${type === 'credit' ? 'credited' : 'debited'} successfully`);
      onDone();
    } catch (e2) {
      toast.error(e2.message || 'Adjustment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Adjust Wallet</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {wallet.name} · Current balance <span className="font-semibold text-[#bca142]">{fmtBhd(wallet.balance_bhd)}</span>{' '}
          <span className="text-xs text-gray-400">≈ {formatUsd(wallet.balance_bhd)}</span>
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex gap-2 p-1 rounded-xl bg-black/5">
            {[{ k: 'credit', l: 'Credit', Icon: FiPlus }, { k: 'debit', l: 'Debit', Icon: FiMinus }].map(({ k, l, Icon }) => (
              <button key={k} type="button" onClick={() => setType(k)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
                  type === k ? 'bg-white shadow-sm text-[#9d8635]' : 'text-gray-500'
                }`}>
                <Icon size={14} />{l}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Amount (BHD)</label>
            <input type="number" min="0.001" step="0.001" value={amount} onChange={e => setAmount(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Reason / Note</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Goodwill credit"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]" />
          </div>
          <button type="submit" disabled={submitting}
            className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #bca142 0%, #9d8635 100%)' }}>
            {submitting ? 'Processing…' : `Confirm ${type === 'credit' ? 'Credit' : 'Debit'}`}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── Top-Up Requests ─────────────────────────────────────────────────────────
const TopupsTab = () => {
  const { formatUsd } = useCurrency();
  const [topups, setTopups] = useState([]);
  const [loading, setLoading] = useState(true);
  // Default to "all" so PayPal top-ups (auto-credited with status 'completed')
  // are never hidden behind the 'pending' filter. Pending rows still sort first.
  const [status, setStatus] = useState('');

  const load = useCallback(async (st) => {
    setLoading(true);
    try {
      const d = await walletAPI.admin.listTopups(st ? { status: st } : {});
      setTopups(d.topups || []);
    } catch (e) { toast.error(e.message || 'Failed to load top-ups'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(status); }, [status, load]);

  const approve = async (id) => {
    try { await walletAPI.admin.approveTopup(id); toast.success('Top-up approved and wallet credited'); load(status); }
    catch (e) { toast.error(e.message || 'Failed to approve'); }
  };
  const reject = async (id) => {
    const reason = window.prompt('Reason for rejection (optional):') || undefined;
    try { await walletAPI.admin.rejectTopup(id, reason); toast.success('Top-up rejected'); load(status); }
    catch (e) { toast.error(e.message || 'Failed to reject'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {['pending', 'completed', 'approved', 'rejected', ''].map(s => (
          <button key={s || 'all'} onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              status === s ? 'bg-[#bca142] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {s || 'all'}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400">Loading…</div>
        ) : topups.length === 0 ? (
          <div className="py-16 text-center text-gray-400">No top-up requests.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Company</th>
                  <th className="px-4 py-3 text-left">Method</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-left">Proof</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topups.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(t.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{t.user_name}</p>
                      <p className="text-xs text-gray-400">{t.user_email}</p>
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-600">{String(t.method).replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[#bca142]">
                      {Number(t.amount_bhd).toFixed(3)}
                      <div className="text-xs text-gray-400 font-normal">≈ {formatUsd(t.amount_bhd)}</div>
                    </td>
                    <td className="px-4 py-3">
                      {t.payment_proof_url
                        ? <a href={t.payment_proof_url} target="_blank" rel="noreferrer" className="text-xs text-[#bca142] hover:underline">View</a>
                        : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{t.status}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {t.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => approve(t.id)} title="Approve"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"><FiCheck /></button>
                          <button onClick={() => reject(t.id)} title="Reject"
                            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"><FiX /></button>
                        </div>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

// ─── Transaction Ledger ─────────────────────────────────────────────────────
const TransactionsTab = () => {
  const { formatUsd } = useCurrency();
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const TYPES = [
    { v: '', l: 'All' },
    { v: 'deposit', l: 'Deposits' },
    { v: 'referral_reward', l: 'Referral Rewards' },
    { v: 'subscription_payment', l: 'Subscription Payments' },
    { v: 'refund', l: 'Refunds' },
    { v: 'admin_adjustment', l: 'Admin Adjustments' },
  ];

  const load = useCallback(async (t, p) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (t) params.type = t;
      const d = await walletAPI.admin.listTransactions(params);
      setTxns(d.transactions || []);
      setTotalPages(d.pagination?.totalPages || 1);
    } catch (e) { toast.error(e.message || 'Failed to load transactions'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(type, page); }, [type, page, load]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {TYPES.map(t => (
          <button key={t.v || 'all'} onClick={() => { setType(t.v); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              type === t.v ? 'bg-[#bca142] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {t.l}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400">Loading…</div>
        ) : txns.length === 0 ? (
          <div className="py-16 text-center text-gray-400">No transactions found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Company</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Description</th>
                    <th className="px-4 py-3 text-left">Ref</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {txns.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(t.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{t.user_name}</p>
                        <p className="text-xs text-gray-400">{t.user_email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{String(t.type).replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[220px] truncate" title={t.description}>{t.description || '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{t.transaction_ref || '—'}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${
                        ['deposit', 'referral_reward', 'refund', 'credit'].includes(t.type) ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                        {['deposit', 'referral_reward', 'refund', 'credit'].includes(t.type) ? '+' : '-'}
                        {Number(t.amount_bhd).toFixed(3)}
                        <div className="text-xs text-gray-400 font-normal">≈ {formatUsd(t.amount_bhd)}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {Number(t.balance_after).toFixed(3)}
                        <div className="text-xs text-gray-400">≈ {formatUsd(t.balance_after)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100 text-sm">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">← Prev</button>
                <span className="text-gray-400">Page {page} / {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default AdminWalletSettings;
