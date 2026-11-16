import { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiPlus, FiMinus, FiUsers } from 'react-icons/fi';
import { walletAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../../contexts/CurrencyContext';

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-100 shadow-sm ${className}`}>{children}</div>
);

const statusLabel = (s) => (Number(s) === 1 ? 'Active' : 'Pending');

const EMPTY = { search: '', status: '', minBalance: '', maxBalance: '' };

const AdminGiveMoney = () => {
  const { formatUsd } = useCurrency();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState(EMPTY);
  const [draft, setDraft] = useState(EMPTY);

  const [selected, setSelected] = useState([]);
  const [adjustFor, setAdjustFor] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.status !== '') params.status = filters.status;
      if (filters.minBalance !== '') params.minBalance = filters.minBalance;
      if (filters.maxBalance !== '') params.maxBalance = filters.maxBalance;
      const d = await walletAPI.admin.listWallets(params);
      setRows(d.wallets || []);
      setTotal(d.pagination?.total || 0);
      setSelected([]);
    } catch (e) { toast.error(e.message || 'Failed to load companies'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const apply = () => setFilters({ ...draft });
  const reset = () => { setDraft(EMPTY); setFilters(EMPTY); };

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const allSelected = rows.length > 0 && rows.every(r => selected.includes(r.user_id));
  const toggleAll = () => setSelected(allSelected ? [] : rows.map(r => r.user_id));

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Give Money</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Credit or debit company wallets — one company, several selected, or all at once.
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Search</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={draft.search}
                onChange={e => setDraft(d => ({ ...d, search: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && apply()}
                placeholder="Name, email or company ID…"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
            <select value={draft.status} onChange={e => setDraft(d => ({ ...d, status: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]">
              <option value="">All statuses</option>
              <option value="1">Active</option>
              <option value="0">Pending</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Min balance</label>
              <input type="number" min="0" step="0.001" value={draft.minBalance}
                onChange={e => setDraft(d => ({ ...d, minBalance: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Max balance</label>
              <input type="number" min="0" step="0.001" value={draft.maxBalance}
                onChange={e => setDraft(d => ({ ...d, maxBalance: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]" />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <button onClick={apply}
            className="px-4 py-2 rounded-xl bg-[#bca142] text-white text-sm font-medium">Apply filters</button>
          <button onClick={reset}
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">Reset</button>
          <div className="flex-1" />
          <button onClick={() => setBulkOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #bca142 0%, #9d8635 100%)' }}>
            <FiUsers /> Give money {selected.length > 0 ? `(${selected.length} selected)` : 'to all'}
          </button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-gray-400">No companies found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-[#bca142]" />
                  </th>
                  <th className="px-4 py-3 text-left">Company</th>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Balance (BHD)</th>
                  <th className="px-4 py-3 text-right">Earned</th>
                  <th className="px-4 py-3 text-right">Used</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map(w => (
                  <tr key={w.user_id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.includes(w.user_id)}
                        onChange={() => toggle(w.user_id)} className="accent-[#bca142]" />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{w.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">#{w.user_id}</td>
                    <td className="px-4 py-3">
                      <p className="text-gray-600">{w.email}</p>
                      <p className="text-xs text-gray-400">{w.phone || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        Number(w.status) === 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>{statusLabel(w.status)}</span>
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
                        className="text-xs font-semibold text-[#bca142] hover:underline">Give money</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-gray-400">
          {total} company{total === 1 ? '' : 'ies'} total
        </div>
      </Card>

      {adjustFor && (
        <AdjustModal wallet={adjustFor} onClose={() => setAdjustFor(null)}
          onDone={() => { setAdjustFor(null); load(); }} />
      )}

      {bulkOpen && (
        <BulkModal selectedIds={selected} onClose={() => setBulkOpen(false)}
          onDone={() => { setBulkOpen(false); load(); }} />
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
          <h3 className="text-lg font-bold text-gray-800">Give Money</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {wallet.name} · Current balance <span className="font-semibold text-[#bca142]">{fmtBhd(wallet.balance_bhd)}</span>{' '}
          <span className="text-xs text-gray-400">≈ {formatUsd(wallet.balance_bhd)}</span>
        </p>
        <form onSubmit={submit} className="space-y-4">
          <TypeToggle type={type} setType={setType} />
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

const BulkModal = ({ selectedIds, onClose, onDone }) => {
  const [target, setTarget] = useState(selectedIds.length ? 'selected' : 'all');
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
      const payload = { type, amountBhd: amt, description };
      if (target === 'selected') payload.userIds = selectedIds;
      else payload.all = true;
      const d = await walletAPI.admin.bulkAdjust(payload);
      toast.success(d.message || 'Wallets updated');
      onDone();
    } catch (e2) {
      toast.error(e2.message || 'Bulk update failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Give Money — Bulk</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Apply to</label>
            <div className="flex gap-2 p-1 rounded-xl bg-black/5">
              {[
                { k: 'selected', l: `Selected (${selectedIds.length})`, disabled: selectedIds.length === 0 },
                { k: 'all', l: 'All companies', disabled: false },
              ].map(({ k, l, disabled }) => (
                <button key={k} type="button" disabled={disabled} onClick={() => setTarget(k)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${
                    target === k ? 'bg-white shadow-sm text-[#9d8635]' : 'text-gray-500'
                  }`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <TypeToggle type={type} setType={setType} />
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Amount per company (BHD)</label>
            <input type="number" min="0.001" step="0.001" value={amount} onChange={e => setAmount(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Reason / Note</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Promotional credit"
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

const TypeToggle = ({ type, setType }) => (
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
);

export default AdminGiveMoney;
