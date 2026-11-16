import { useState, useEffect, useCallback } from 'react';
import {
  FiTag, FiPlus, FiEdit2, FiTrash2, FiSend, FiRefreshCw, FiSave,
  FiChevronLeft, FiChevronRight, FiRotateCcw, FiSettings,
} from 'react-icons/fi';
import { api } from '../../utils/api';
import adminToast from '../../utils/adminToast';

// ─── helpers ───────────────────────────────────────────────────────────────
const DTypeBadge = ({ type }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${type === 'fixed' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
    {type === 'fixed' ? 'Fixed BHD' : 'Percentage %'}
  </span>
);

const StatusBadge = ({ status }) => {
  const map = {
    available: 'bg-green-100 text-green-700',
    used: 'bg-gray-200 text-gray-600',
    expired: 'bg-orange-100 text-orange-700',
    disabled: 'bg-red-100 text-red-700',
    completed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-gray-100 text-gray-500',
    refunded: 'bg-blue-100 text-blue-700',
    restored: 'bg-gray-100 text-gray-500',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-500'}`}>{status}</span>;
};

const fmt = (n) => Number(n || 0).toFixed(3);

// Convert a Date/ISO/datetime value to the 'YYYY-MM-DDTHH:MM' string that
// <input type="datetime-local"> expects, for pre-filling on edit.
const toLocalInput = (v) => {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

// ─── Templates Tab ─────────────────────────────────────────────────────────
const TemplatesTab = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // { mode: 'create'|'edit', data }
  const [distModal, setDistModal] = useState(null); // template to distribute
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/api/coupons/admin/templates?search=${encodeURIComponent(search)}`);
      setRows(Array.isArray(data) ? data : []);
    } catch { adminToast.error('Failed to load coupons'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetch(); }, [fetch]);

  const openCreate = () => setModal({
    mode: 'create',
    data: { name: '', description: '', discount_type: 'fixed', discount_value: '', min_order_amount: '', max_discount_amount: '', valid_from: '', valid_to: '', max_uses_total: '' },
  });
  const openEdit = (r) => setModal({ mode: 'edit', data: { ...r } });

  const save = async () => {
    const d = modal.data;
    if (!d.name || !d.discount_type || d.discount_value === '' || d.discount_value === null) {
      adminToast.error('Name, type and value are required'); return;
    }
    setSaving(true);
    try {
      if (modal.mode === 'create') await api.post('/api/coupons/admin/templates', d);
      else await api.put(`/api/coupons/admin/templates/${d.id}`, d);
      adminToast.success(modal.mode === 'create' ? 'Coupon created' : 'Coupon updated');
      setModal(null); fetch();
    } catch (e) { adminToast.error(e.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const toggle = async (r) => {
    try { await api.put(`/api/coupons/admin/templates/${r.id}/status`, { isActive: !r.is_active }); adminToast.success('Status updated'); fetch(); }
    catch { adminToast.error('Failed to update status'); }
  };

  const remove = async (r) => {
    if (!confirm(`Delete "${r.name}"? If it has been issued it will be deactivated instead.`)) return;
    try { await api.delete(`/api/coupons/admin/templates/${r.id}`); adminToast.success('Coupon removed'); fetch(); }
    catch { adminToast.error('Failed to remove'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search coupons..."
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142] w-64" />
          <button onClick={fetch} className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm hover:bg-gray-50"><FiRefreshCw className="w-4 h-4" /> Refresh</button>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#bca142] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#9d8635]"><FiPlus className="w-4 h-4" /> Create Coupon</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-auto">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No coupons yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Value</th>
                <th className="px-4 py-3 text-left">Min Order</th>
                <th className="px-4 py-3 text-left">Max Disc.</th>
                <th className="px-4 py-3 text-left">Validity</th>
                <th className="px-4 py-3 text-left">Issued</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-800">{r.name}<div className="text-xs text-gray-400">{r.description}</div></td>
                  <td className="px-4 py-3 font-mono text-xs">{r.code}</td>
                  <td className="px-4 py-3"><DTypeBadge type={r.discount_type} /></td>
                  <td className="px-4 py-3 font-semibold">{r.discount_type === 'fixed' ? `${fmt(r.discount_value)} BHD` : `${fmt(r.discount_value)}%`}</td>
                  <td className="px-4 py-3 text-gray-600">{r.min_order_amount > 0 ? `${fmt(r.min_order_amount)}` : '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{r.max_discount_amount > 0 ? `${fmt(r.max_discount_amount)}` : '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{r.valid_to ? new Date(r.valid_to).toLocaleDateString() : 'No expiry'}</td>
                  <td className="px-4 py-3 text-gray-600">{r.issued_count || 0}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(r)} className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>{r.is_active ? 'Active' : 'Inactive'}</button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(r)} className="p-1.5 text-gray-500 hover:text-[#bca142] hover:bg-[#bca142]/10 rounded" title="Edit"><FiEdit2 className="w-4 h-4" /></button>
                      <button onClick={() => setDistModal(r)} className="p-1.5 text-[#bca142] hover:bg-[#bca142]/10 rounded" title="Distribute"><FiSend className="w-4 h-4" /></button>
                      <button onClick={() => remove(r)} className="p-1.5 text-red-400 hover:bg-red-50 rounded" title="Delete"><FiTrash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">{modal.mode === 'create' ? 'Create Coupon' : 'Edit Coupon'}</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Name *</label>
                <input value={modal.data.name || ''} onChange={(e) => setModal(m => ({ ...m, data: { ...m.data, name: e.target.value } }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Description</label>
                <input value={modal.data.description || ''} onChange={(e) => setModal(m => ({ ...m, data: { ...m.data, description: e.target.value } }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Discount Type *</label>
                  <select value={modal.data.discount_type} onChange={(e) => setModal(m => ({ ...m, data: { ...m.data, discount_type: e.target.value } }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]">
                    <option value="fixed">Fixed BHD off</option>
                    <option value="percentage">Percentage % off</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{modal.data.discount_type === 'fixed' ? 'Value (BHD) *' : 'Value (% off) *'}</label>
                  <input type="number" step="0.001" min="0" value={modal.data.discount_value ?? ''} onChange={(e) => setModal(m => ({ ...m, data: { ...m.data, discount_value: e.target.value } }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Min Order Amount (BHD)</label>
                  <input type="number" step="0.001" min="0" value={modal.data.min_order_amount ?? ''} onChange={(e) => setModal(m => ({ ...m, data: { ...m.data, min_order_amount: e.target.value } }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max Discount (BHD, for %)</label>
                  <input type="number" step="0.001" min="0" value={modal.data.max_discount_amount ?? ''} onChange={(e) => setModal(m => ({ ...m, data: { ...m.data, max_discount_amount: e.target.value } }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Valid From <span className="text-gray-300">(optional)</span></label>
                  <div className="flex gap-1">
                    <input type="datetime-local" value={toLocalInput(modal.data.valid_from)} onChange={(e) => setModal(m => ({ ...m, data: { ...m.data, valid_from: e.target.value || null } }))} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]" />
                    {modal.data.valid_from && <button type="button" onClick={() => setModal(m => ({ ...m, data: { ...m.data, valid_from: null } }))} className="px-2 text-gray-400 hover:text-red-400 border border-gray-200 rounded-lg text-xs">✕</button>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Leave blank = valid immediately</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Valid To (Expiry) <span className="text-gray-300">(optional)</span></label>
                  <div className="flex gap-1">
                    <input type="datetime-local" value={toLocalInput(modal.data.valid_to)} onChange={(e) => setModal(m => ({ ...m, data: { ...m.data, valid_to: e.target.value || null } }))} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]" />
                    {modal.data.valid_to && <button type="button" onClick={() => setModal(m => ({ ...m, data: { ...m.data, valid_to: null } }))} className="px-2 text-gray-400 hover:text-red-400 border border-gray-200 rounded-lg text-xs">✕</button>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Leave blank = never expires</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setModal(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving} className="flex items-center gap-2 bg-[#bca142] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#9d8635] disabled:opacity-60"><FiSave className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Distribute modal */}
      {distModal && <DistributeModal template={distModal} onClose={() => setDistModal(null)} onDone={() => { setDistModal(null); adminToast.success('Distribution complete'); }} />}
    </div>
  );
};

// ─── Distribute Modal ───────────────────────────────────────────────────────
const DistributeModal = ({ template, onClose, onDone }) => {
  const [recipientType, setRecipientType] = useState('all');
  const [userIds, setUserIds] = useState('');
  const [role, setRole] = useState('');
  const [expiresAt, setExpiresAt] = useState('');  // always blank by default — no expiry
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    let body = { couponId: template.id, recipientType, expiresAt: expiresAt || null, reason: reason || null };    if (recipientType === 'single' || recipientType === 'selected') {
      const ids = userIds.split(',').map(s => s.trim()).filter(Boolean).map(Number).filter(n => !isNaN(n));
      if (!ids.length) { adminToast.error('Enter at least one user ID'); return; }
      body.userIds = ids;
    } else {
      body.role = role || null;
    }
    setSaving(true);
    try {
      const res = await api.post(`/api/coupons/admin/templates/${template.id}/distribute`, body);
      adminToast.success(`Distributed to ${res.issued} user(s)${res.failed?.length ? ` (${res.failed.length} failed)` : ''}`);
      // Reset form so stale values don't carry over to next distribution
      setExpiresAt('');
      setReason('');
      setUserIds('');
      onDone();
    } catch (e) { adminToast.error(e.message || 'Distribution failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Distribute "{template.name}"</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Recipients *</label>
            <select value={recipientType} onChange={(e) => setRecipientType(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]">
              <option value="all">All eligible users</option>
              <option value="selected">Selected users (by ID)</option>
              <option value="single">Single user (by ID)</option>
            </select>
          </div>
          {(recipientType === 'selected' || recipientType === 'single') && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">{recipientType === 'single' ? 'User ID' : 'User IDs (comma separated)'}</label>
              <input value={userIds} onChange={(e) => setUserIds(e.target.value)} placeholder="e.g. 12 or 12,15,28" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]" />
            </div>
          )}
          {recipientType === 'all' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Filter by role (optional)</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]">
                <option value="">All roles</option>
                <option value="user">Users</option>
                <option value="business">Businesses</option>
                <option value="company">Companies</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Expires at <span className="text-gray-300">(optional — leave blank for no expiry)</span></label>
            <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Reason / note</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Ramadan promo" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex items-center gap-2 bg-[#bca142] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#9d8635] disabled:opacity-60"><FiSend className="w-4 h-4" /> {saving ? 'Distributing…' : 'Distribute'}</button>
        </div>
      </div>
    </div>
  );
};

// ─── Coupon Type Badge ────────────────────────────────────────────────────────
const CouponTypeBadge = ({ source, reason }) => {
  // Welcome coupons are issued as admin_bonus with this specific reason
  const isWelcome = source === 'admin_bonus' && reason && reason.toLowerCase().includes('welcome');
  const isReferral = source === 'referral';

  if (isWelcome)         return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">🎉 Welcome Coupon</span>;
  if (isReferral)        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">🎁 Referral Coupon</span>;
  if (source === 'admin_bonus') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">👤 Admin Bonus</span>;
  if (source === 'campaign')    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">📢 Campaign</span>;
  if (source === 'manual')      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">✏️ Manual</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 capitalize">{source?.replace('_', ' ') || '—'}</span>;
};

// ─── Issued Tab ─────────────────────────────────────────────────────────────
const IssuedTab = () => {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const LIMIT = 20;

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (status) params.status = status;
      if (search) params.search = search;
      if (sourceFilter) params.source = sourceFilter;
      const data = await api.get(`/api/coupons/admin/issued?${new URLSearchParams(params)}`);
      setRows(data.coupons || []); setTotal(data.pagination?.total || 0);
    } catch { adminToast.error('Failed to load issued coupons'); }
    finally { setLoading(false); }
  }, [page, status, search, sourceFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search user/email/code..." className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142] w-64" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]">
          <option value="">All statuses</option>
          <option value="available">Available</option>
          <option value="used">Used</option>
          <option value="expired">Expired</option>
          <option value="disabled">Disabled</option>
        </select>
        <select value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]">
          <option value="">All types</option>
          <option value="referral">🎁 Referral</option>
          <option value="admin_bonus">👤 Admin Bonus / Welcome</option>
          <option value="campaign">📢 Campaign</option>
          <option value="manual">✏️ Manual</option>
        </select>
        <button onClick={fetch} className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm hover:bg-gray-50"><FiRefreshCw className="w-4 h-4" /> Refresh</button>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-auto">
        {loading ? <div className="text-center py-12 text-gray-400">Loading…</div>
          : rows.length === 0 ? <div className="text-center py-12 text-gray-400">No issued coupons</div>
          : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase"><tr>
              <th className="px-4 py-3 text-left">Code</th><th className="px-4 py-3 text-left">Coupon</th><th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Type</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Issued</th><th className="px-4 py-3 text-left">Redeemed</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono text-xs">{r.code}</td>
                  <td className="px-4 py-3"><div className="font-medium text-gray-800">{r.coupon_name}</div><div className="text-xs text-gray-400">{r.discount_type === 'fixed' ? `${fmt(r.discount_value)} BHD off` : `${fmt(r.discount_value)}% off`}</div></td>
                  <td className="px-4 py-3"><div className="font-medium text-gray-800">{r.user_name}</div><div className="text-xs text-gray-400 capitalize">{r.user_role} · {r.user_email}</div></td>
                  <td className="px-4 py-3">
                    <CouponTypeBadge source={r.source} reason={r.issued_reason} />
                    {r.issued_reason && (
                      <div className="text-xs text-gray-400 mt-1 max-w-[160px] truncate" title={r.issued_reason}>{r.issued_reason}</div>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{r.redeemed_at ? new Date(r.redeemed_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {total > LIMIT && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="flex items-center gap-1 px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><FiChevronLeft /> Prev</button>
          <span className="text-gray-500">Page {page} of {Math.ceil(total / LIMIT)}</span>
          <button disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)} className="flex items-center gap-1 px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40">Next <FiChevronRight /></button>
        </div>
      )}
    </div>
  );
};

// ─── History Tab ────────────────────────────────────────────────────────────
const HistoryTab = () => {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const LIMIT = 20;

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      const data = await api.get(`/api/coupons/admin/redemptions?${new URLSearchParams(params)}`);
      setRows(data.redemptions || []); setTotal(data.pagination?.total || 0);
    } catch { adminToast.error('Failed to load history'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetch(); }, [fetch]);

  const restore = async (r) => {
    if (!confirm('Restore this coupon to the user? This makes it available again.')) return;
    try { await api.put(`/api/coupons/admin/redemptions/${r.id}/restore`, { reason: 'Admin manual restore' }); adminToast.success('Coupon restored'); fetch(); }
    catch { adminToast.error('Restore failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search user/email/order..." className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142] w-64" />
        <button onClick={fetch} className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm hover:bg-gray-50"><FiRefreshCw className="w-4 h-4" /> Refresh</button>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-auto">
        {loading ? <div className="text-center py-12 text-gray-400">Loading…</div>
          : rows.length === 0 ? <div className="text-center py-12 text-gray-400">No redemptions yet</div>
          : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase"><tr>
              <th className="px-4 py-3 text-left">Coupon</th><th className="px-4 py-3 text-left">User</th><th className="px-4 py-3 text-left">Order</th>
              <th className="px-4 py-3 text-left">Order Amt</th><th className="px-4 py-3 text-left">Discount</th><th className="px-4 py-3 text-left">Final</th>
              <th className="px-4 py-3 text-left">Payment</th><th className="px-4 py-3 text-left">Redeemed</th><th className="px-4 py-3 text-left">Action</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3"><div className="font-medium text-gray-800">{r.coupon_name}</div><div className="text-xs text-gray-400">{r.discount_type === 'fixed' ? `${fmt(r.discount_value)} BHD` : `${fmt(r.discount_value)}%`}</div></td>
                  <td className="px-4 py-3"><div className="font-medium text-gray-800">{r.user_name}</div><div className="text-xs text-gray-400">{r.user_email}</div></td>
                  <td className="px-4 py-3 text-gray-500 text-xs capitalize">{r.order_type || '—'} #{r.order_id || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{fmt(r.order_amount)}</td>
                  <td className="px-4 py-3 font-semibold text-green-600">-{fmt(r.discount_amount)}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{fmt(r.final_amount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.payment_status} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(r.redeemed_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{r.redemption_status !== 'restored' && <button onClick={() => restore(r)} className="flex items-center gap-1 text-xs text-[#bca142] hover:bg-[#bca142]/10 px-2 py-1 rounded"><FiRotateCcw className="w-3 h-3" /> Restore</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {total > LIMIT && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="flex items-center gap-1 px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><FiChevronLeft /> Prev</button>
          <span className="text-gray-500">Page {page} of {Math.ceil(total / LIMIT)}</span>
          <button disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)} className="flex items-center gap-1 px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40">Next <FiChevronRight /></button>
        </div>
      )}
    </div>
  );
};

// ─── Referral Rules Tab ─────────────────────────────────────────────────────
const ReferralTab = () => {
  const [rules, setRules] = useState([]);
  const [saving, setSaving] = useState({});
  const [loading, setLoading] = useState(true);
  // tracks which entity types have "same as referrer" checked
  const [mirrorMap, setMirrorMap] = useState({});

  useEffect(() => {
    api.get('/api/coupons/admin/referral-rules').then(r => {
      // Referral program is company-only
      const loaded = (Array.isArray(r) ? r : []).filter(rule => rule.entity_type === 'company');
      setRules(loaded);
      // auto-detect mirror: if both sides are identical on load, pre-tick the checkbox
      const initMirror = {};
      loaded.forEach(rule => {
        initMirror[rule.entity_type] =
          rule.referrer_discount_type   === rule.referred_discount_type &&
          String(rule.referrer_discount_value)   === String(rule.referred_discount_value) &&
          String(rule.referrer_min_order_amount) === String(rule.referred_min_order_amount) &&
          String(rule.referrer_max_discount)     === String(rule.referred_max_discount);
      });
      setMirrorMap(initMirror);
    }).catch(() => adminToast.error('Failed to load rules')).finally(() => setLoading(false));
  }, []);

  const change = (et, f, v) => {
    setRules(prev => prev.map(r => {
      if (r.entity_type !== et) return r;
      const updated = { ...r, [f]: v };
      // if mirror is on and we changed a referrer field, sync it to referred too
      if (mirrorMap[et] && f.startsWith('referrer_')) {
        const referredField = f.replace('referrer_', 'referred_');
        updated[referredField] = v;
      }
      return updated;
    }));
  };

  const toggleMirror = (et, checked) => {
    setMirrorMap(m => ({ ...m, [et]: checked }));
    if (checked) {
      // copy referrer → referred immediately
      setRules(prev => prev.map(r => {
        if (r.entity_type !== et) return r;
        return {
          ...r,
          referred_discount_type:    r.referrer_discount_type,
          referred_discount_value:   r.referrer_discount_value,
          referred_min_order_amount: r.referrer_min_order_amount,
          referred_max_discount:     r.referrer_max_discount,
        };
      }));
    }
  };
  const toggle = (et, enabled) => {
    api.put(`/api/coupons/admin/referral-rules/${et}/toggle`, { enabled }).then(() => { change(et, 'referral_coupons_enabled', enabled ? 1 : 0); adminToast.success(`Referral coupons ${enabled ? 'enabled' : 'disabled'} for ${et}`); }).catch(() => adminToast.error('Toggle failed'));
  };
  const save = async (rule) => {
    setSaving(s => ({ ...s, [rule.entity_type]: true }));
    try {
      await api.put(`/api/coupons/admin/referral-rules/${rule.entity_type}`, {
        referrer_discount_type: rule.referrer_discount_type,
        referrer_discount_value: rule.referrer_discount_value,
        referrer_min_order_amount: rule.referrer_min_order_amount,
        referrer_max_discount: rule.referrer_max_discount,
        referred_discount_type: rule.referred_discount_type,
        referred_discount_value: rule.referred_discount_value,
        referred_min_order_amount: rule.referred_min_order_amount,
        referred_max_discount: rule.referred_max_discount,
        max_referrals_per_year: rule.max_referrals_per_year,
        is_active: rule.is_active,
      });
      adminToast.success(`${rule.entity_type} referral rule saved`);
    } catch { adminToast.error('Failed to save rule'); }
    finally { setSaving(s => ({ ...s, [rule.entity_type]: false })); }
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading…</div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Referral program is <strong>company-only</strong>. Configure the coupons issued when a company referral qualifies. The referrer (sharer) and the new company can each get a different coupon type and value. Changes apply to future referrals.</p>
      {rules.map(rule => (
        <div key={rule.entity_type} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 capitalize text-lg">{rule.entity_type} Referrals</h3>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={!!rule.is_active} onChange={(e) => change(rule.entity_type, 'is_active', e.target.checked ? 1 : 0)} className="w-4 h-4 accent-[#bca142]" /> Rule active
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={!!rule.referral_coupons_enabled} onChange={(e) => toggle(rule.entity_type, e.target.checked)} className="w-4 h-4 accent-[#bca142]" /> Issue referral coupons
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['referrer', 'referred'].map(side => (
              <div key={side} className="border border-gray-100 rounded-lg p-4 bg-gray-50/40">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    {side === 'referrer' ? 'Referrer (sharer) coupon' : 'New user coupon'}
                  </p>
                  {side === 'referred' && (
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-[#bca142]">
                      <input
                        type="checkbox"
                        checked={!!mirrorMap[rule.entity_type]}
                        onChange={e => toggleMirror(rule.entity_type, e.target.checked)}
                        className="w-4 h-4 accent-[#bca142]"
                      />
                      Same as referrer
                    </label>
                  )}
                </div>
                <div className={`grid grid-cols-2 gap-3 ${mirrorMap[rule.entity_type] && side === 'referred' ? 'opacity-60 pointer-events-none' : ''}`}>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Type</label>
                    <select value={side === 'referrer' ? rule.referrer_discount_type : rule.referred_discount_type} onChange={(e) => change(rule.entity_type, `${side}_discount_type`, e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]">
                      <option value="fixed">Fixed BHD off</option>
                      <option value="percentage">Percentage % off</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Value</label>
                    <input type="number" step="0.001" min="0" value={side === 'referrer' ? rule.referrer_discount_value : rule.referred_discount_value} onChange={(e) => change(rule.entity_type, `${side}_discount_value`, e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Min order (BHD)</label>
                    <input type="number" step="0.001" min="0" value={side === 'referrer' ? rule.referrer_min_order_amount : rule.referred_min_order_amount} onChange={(e) => change(rule.entity_type, `${side}_min_order_amount`, e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Max discount (BHD)</label>
                    <input type="number" step="0.001" min="0" value={side === 'referrer' ? rule.referrer_max_discount : rule.referred_max_discount} onChange={(e) => change(rule.entity_type, `${side}_max_discount`, e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]" />
                  </div>
                </div>
                {mirrorMap[rule.entity_type] && side === 'referred' && (
                  <p className="text-xs text-[#bca142] mt-2">↑ Mirroring referrer values. Uncheck to set different values.</p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Max referrals / year</label>
              <input type="number" min="1" value={rule.max_referrals_per_year} onChange={(e) => change(rule.entity_type, 'max_referrals_per_year', e.target.value)} className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]" />
            </div>
            <button onClick={() => save(rule)} disabled={saving[rule.entity_type]} className="flex items-center gap-2 bg-[#bca142] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#9d8635] disabled:opacity-60 ml-auto"><FiSave className="w-4 h-4" /> {saving[rule.entity_type] ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Settings Tab ───────────────────────────────────────────────────────────
const SettingsTab = () => {
  const [settings, setSettings] = useState({});
  const [orderReward, setOrderReward] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => {
    api.get('/api/coupons/admin/settings').then(setSettings).catch(() => adminToast.error('Failed to load settings'));
    Promise.all([
      api.get('/api/coupons/admin/order-reward-settings'),
      api.get('/api/coupons/admin/templates?status=active'),
    ]).then(([or, t]) => {
      setOrderReward(or);
      setTemplates(Array.isArray(t) ? t : []);
    }).catch(() => adminToast.error('Failed to load order reward settings'));
  }, []);

  const save = async () => {
    setSaving(true);
    try { await api.put('/api/coupons/admin/settings', settings); adminToast.success('Settings saved'); }
    catch { adminToast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  const saveOrderReward = async () => {
    if (orderReward.enabled && !orderReward.userCouponId && !orderReward.companyCouponId) {
      adminToast.error('Select at least one coupon template'); return;
    }
    setSavingOrder(true);
    try {
      await api.put('/api/coupons/admin/order-reward-settings', orderReward);
      adminToast.success('Order reward settings saved');
    } catch { adminToast.error('Failed to save order reward settings'); }
    finally { setSavingOrder(false); }
  };

  return (
    <div className="max-w-2xl space-y-6">

      {/* ── Order Completion Reward ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <h3 className="font-semibold text-gray-800 text-base">Order Completion Reward</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            When a quote is marked <strong>closed</strong>, automatically issue reward coupons to both
            the user/business who placed the order and the company that fulfilled it.
          </p>
        </div>

        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Enable order completion reward</p>
            <p className="text-xs text-gray-400">Auto-issue coupons when a quote is closed</p>
          </div>
          <button
            onClick={() => setOrderReward(s => ({ ...s, enabled: !s?.enabled }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${orderReward?.enabled ? 'bg-[#bca142]' : 'bg-gray-200'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${orderReward?.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {orderReward && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* User coupon */}
              <div className="border border-gray-100 rounded-lg p-4 bg-gray-50/40">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">User / Business coupon</p>
                <p className="text-xs text-gray-400 mb-2">Issued to the person who placed the order</p>
                <select
                  value={orderReward.userCouponId || ''}
                  onChange={e => setOrderReward(s => ({ ...s, userCouponId: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]"
                >
                  <option value="">— No coupon —</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.discount_type === 'fixed' ? `${Number(t.discount_value).toFixed(3)} BHD off` : `${Number(t.discount_value).toFixed(3)}% off`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Company coupon */}
              <div className="border border-gray-100 rounded-lg p-4 bg-gray-50/40">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Company coupon</p>
                <p className="text-xs text-gray-400 mb-2">Issued to the company that fulfilled the order</p>
                <select
                  value={orderReward.companyCouponId || ''}
                  onChange={e => setOrderReward(s => ({ ...s, companyCouponId: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]"
                >
                  <option value="">— No coupon —</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.discount_type === 'fixed' ? `${Number(t.discount_value).toFixed(3)} BHD off` : `${Number(t.discount_value).toFixed(3)}% off`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valid for (days)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min="0" max="3650"
                    value={orderReward.expiresDays}
                    onChange={e => setOrderReward(s => ({ ...s, expiresDays: Number(e.target.value) || 0 }))}
                    className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]"
                  />
                  <span className="text-xs text-gray-400">days (0 = no expiry)</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max reward per user</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min="0"
                    value={orderReward.maxPerUser}
                    onChange={e => setOrderReward(s => ({ ...s, maxPerUser: Number(e.target.value) || 0 }))}
                    className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]"
                  />
                  <span className="text-xs text-gray-400">times (0 = unlimited)</span>
                </div>
              </div>
            </div>

            {/* Status summary */}
            <div className={`rounded-lg px-4 py-3 text-sm ${orderReward.enabled ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-gray-50 border border-gray-200 text-gray-500'}`}>
              {orderReward.enabled
                ? `✅ Active — coupons will be auto-issued when any quote is closed.`
                : '⏸️ Disabled — no reward coupon is issued on order completion.'}
            </div>
          </>
        )}

        <button
          onClick={saveOrderReward}
          disabled={savingOrder || !orderReward}
          className="flex items-center gap-2 bg-[#bca142] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#9d8635] disabled:opacity-60"
        >
          <FiSave className="w-4 h-4" />
          {savingOrder ? 'Saving…' : 'Save Order Reward Settings'}
        </button>
      </div>

      {/* ── Coupon Restoration Policy ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="font-semibold text-gray-800">Coupon Restoration Policy</h3>
        <label className="flex items-center justify-between">
          <div><p className="text-sm font-medium text-gray-700">Restore coupon on cancel (before payment)</p><p className="text-xs text-gray-400">Always recommended — failed/cancelled payments should not consume a coupon.</p></div>
          <input type="checkbox" checked={settings.restore_on_cancel === '1'} onChange={(e) => setSettings(s => ({ ...s, restore_on_cancel: e.target.checked ? '1' : '0' }))} className="w-5 h-5 accent-[#bca142]" />
        </label>
        <label className="flex items-center justify-between">
          <div><p className="text-sm font-medium text-gray-700">Restore coupon on refund (after successful payment)</p><p className="text-xs text-gray-400">Off by default — a used coupon stays used unless admin enables this. Admins can always restore manually from History.</p></div>
          <input type="checkbox" checked={settings.restore_on_refund === '1'} onChange={(e) => setSettings(s => ({ ...s, restore_on_refund: e.target.checked ? '1' : '0' }))} className="w-5 h-5 accent-[#bca142]" />
        </label>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 bg-[#bca142] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#9d8635] disabled:opacity-60"><FiSave className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Restoration Policy'}</button>
      </div>
    </div>
  );
};

// ─── Welcome Coupon Tab ─────────────────────────────────────────────────────
const WelcomeTab = () => {
  const [settings, setSettings] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  // inline editor state for the selected template's value
  const [editValue, setEditValue] = useState(null);  // { discount_type, discount_value, min_order_amount, max_discount_amount }
  const [savingValue, setSavingValue] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, t] = await Promise.all([
        api.get('/api/coupons/admin/welcome-settings'),
        api.get('/api/coupons/admin/templates?status=active'),
      ]);
      setSettings(s);
      setTemplates(Array.isArray(t) ? t : []);
      // pre-fill edit fields from currently selected template
      if (s.couponId) {
        const tpl = (Array.isArray(t) ? t : []).find(x => x.id === Number(s.couponId));
        if (tpl) setEditValue({ discount_type: tpl.discount_type, discount_value: tpl.discount_value, min_order_amount: tpl.min_order_amount, max_discount_amount: tpl.max_discount_amount });
      }
    } catch { adminToast.error('Failed to load welcome coupon settings'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // when admin picks a different template, load that template's current values into the editor
  const handleTemplateChange = (id) => {
    setSettings(s => ({ ...s, couponId: id ? Number(id) : null }));
    if (id) {
      const tpl = templates.find(x => x.id === Number(id));
      if (tpl) setEditValue({ discount_type: tpl.discount_type, discount_value: tpl.discount_value, min_order_amount: tpl.min_order_amount, max_discount_amount: tpl.max_discount_amount });
    } else {
      setEditValue(null);
    }
  };

  const toggle = (role) => {
    setSettings(s => ({
      ...s,
      roles: s.roles.includes(role)
        ? s.roles.filter(r => r !== role)
        : [...s.roles, role],
    }));
  };

  const saveValue = async () => {
    if (!settings.couponId || !editValue) return;
    setSavingValue(true);
    try {
      await api.put(`/api/coupons/admin/templates/${settings.couponId}`, {
        discount_type: editValue.discount_type,
        discount_value: editValue.discount_value,
        min_order_amount: editValue.min_order_amount,
        max_discount_amount: editValue.max_discount_amount,
      });
      // update the local templates list so the dropdown label reflects new value
      setTemplates(prev => prev.map(t => t.id === settings.couponId ? { ...t, ...editValue } : t));
      adminToast.success('Coupon value updated');
    } catch { adminToast.error('Failed to update coupon value'); }
    finally { setSavingValue(false); }
  };

  const save = async () => {
    if (settings.enabled && !settings.couponId) {
      adminToast.error('Select a coupon template first'); return;
    }
    setSaving(true);
    try {
      await api.put('/api/coupons/admin/welcome-settings', {
        enabled:     settings.enabled,
        couponId:    settings.couponId,
        roles:       settings.roles,
        expiresDays: settings.expiresDays,
      });
      adminToast.success('Welcome coupon settings saved');
    } catch { adminToast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading || !settings) return <div className="text-center py-12 text-gray-400">Loading…</div>;

  const selectedTpl = templates.find(t => t.id === settings.couponId);

  return (
    <div className="max-w-2xl space-y-6">
      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Welcome Coupon:</strong> When this is enabled, every new user who registers gets an automatic coupon from the selected template. You can limit which roles receive it and set how long it's valid.
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
        {/* Enable / Disable */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-800">Enable Welcome Coupon</p>
            <p className="text-xs text-gray-400 mt-0.5">Auto-issue a coupon to every new registrant</p>
          </div>
          <button
            onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.enabled ? 'bg-[#bca142]' : 'bg-gray-200'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${settings.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Coupon template picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Coupon Template <span className="text-red-500">*</span>
          </label>
          <select
            value={settings.couponId || ''}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]"
          >
            <option value="">— Select a coupon —</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.discount_type === 'fixed' ? `${Number(t.discount_value).toFixed(3)} BHD off` : `${Number(t.discount_value).toFixed(3)}% off`}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">Only active coupon templates are shown. Create one in the Coupons tab first.</p>
        </div>

        {/* ── Inline value editor ── appears when a template is selected */}
        {settings.couponId && editValue && (
          <div className="border border-[#bca142]/30 rounded-xl bg-[#bca142]/5 p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">
              Edit "{selectedTpl?.name}" value
              <span className="ml-2 text-xs font-normal text-gray-400">Changes apply to future welcome coupons only</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Discount Type</label>
                <select
                  value={editValue.discount_type}
                  onChange={e => setEditValue(v => ({ ...v, discount_type: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]"
                >
                  <option value="fixed">Fixed BHD off</option>
                  <option value="percentage">Percentage % off</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  {editValue.discount_type === 'fixed' ? 'Value (BHD)' : 'Value (%)'}
                </label>
                <input
                  type="number" step="0.001" min="0"
                  value={editValue.discount_value}
                  onChange={e => setEditValue(v => ({ ...v, discount_value: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Min order amount (BHD)</label>
                <input
                  type="number" step="0.001" min="0"
                  value={editValue.min_order_amount}
                  onChange={e => setEditValue(v => ({ ...v, min_order_amount: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max discount cap (BHD)</label>
                <input
                  type="number" step="0.001" min="0"
                  value={editValue.max_discount_amount}
                  onChange={e => setEditValue(v => ({ ...v, max_discount_amount: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]"
                />
              </div>
            </div>
            <button
              onClick={saveValue}
              disabled={savingValue}
              className="flex items-center gap-2 bg-[#bca142] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#9d8635] disabled:opacity-60"
            >
              <FiSave className="w-4 h-4" />
              {savingValue ? 'Updating…' : 'Update Coupon Value'}
            </button>
          </div>
        )}

        {/* Applicable roles */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Give to which new users</label>
          <div className="flex gap-4 flex-wrap">
            {['user', 'business', 'company'].map(r => (
              <label key={r} className="flex items-center gap-2 cursor-pointer text-sm capitalize">
                <input
                  type="checkbox"
                  checked={settings.roles.includes(r)}
                  onChange={() => toggle(r)}
                  className="w-4 h-4 accent-[#bca142]"
                />
                {r === 'user' ? 'Normal User' : r === 'business' ? 'Business User' : 'Company User'}
              </label>
            ))}
          </div>
        </div>

        {/* Expiry */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Valid for (days after registration)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="3650"
              value={settings.expiresDays}
              onChange={(e) => setSettings(s => ({ ...s, expiresDays: Number(e.target.value) || 30 }))}
              className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]"
            />
            <span className="text-sm text-gray-500">days &nbsp;(set to 0 for no expiry)</span>
          </div>
        </div>

        {/* Current state summary */}
        <div className={`rounded-lg px-4 py-3 text-sm ${settings.enabled ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-gray-50 border border-gray-200 text-gray-500'}`}>
          {settings.enabled
            ? `✅ Active — every new ${settings.roles.join(' / ')} will automatically receive a coupon on signup.`
            : '⏸️ Disabled — no welcome coupon is issued to new users currently.'}
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-[#bca142] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#9d8635] disabled:opacity-60"
        >
          <FiSave className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save Welcome Settings'}
        </button>
      </div>
    </div>
  );
};

// ─── Referral Tracking Tab (merged from AdminReferrals) ─────────────────────
const ReferralTrackingTab = () => {
  const [rows, setRows]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [filterRole, setFilterRole]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const LIMIT = 20;

  const RefStatusBadge = ({ status }) => {
    const map = {
      rewarded: 'bg-green-100 text-green-700',
      pending:  'bg-yellow-100 text-yellow-700',
      rejected: 'bg-red-100 text-red-700',
      qualified:'bg-blue-100 text-blue-700',
      expired:  'bg-gray-100 text-gray-500',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || map.pending}`}>{status}</span>;
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (filterRole)   params.set('role',   filterRole);
      if (filterStatus) params.set('status', filterStatus);
      const data = await api.get(`/api/referrals/admin/all?${params}`);
      setRows(data.referrals || []);
      setTotal(data.pagination?.total || 0);
    } catch { adminToast.error('Failed to load referrals'); }
    finally  { setLoading(false); }
  }, [page, filterRole, filterStatus]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]">
          <option value="">All Roles</option>
          <option value="company">Company</option>
          <option value="admin">Admin</option>
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#bca142]">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="rewarded">Rewarded</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired</option>
        </select>
        <button onClick={load} className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm hover:bg-gray-50"><FiRefreshCw className="w-4 h-4" /> Refresh</button>
        <span className="ml-auto text-sm text-gray-400 self-center">{total} total referrals</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-auto">
        {loading ? <div className="text-center py-12 text-gray-400">Loading…</div>
          : rows.length === 0 ? <div className="text-center py-12 text-gray-400">No referrals found</div>
          : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Referrer</th>
                <th className="px-4 py-3 text-left">Referred</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Coupon Issued</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3"><div className="font-medium text-gray-800">{r.referrer_name}</div><div className="text-xs text-gray-400">{r.referrer_email}</div></td>
                  <td className="px-4 py-3"><div className="font-medium text-gray-800">{r.referred_name}</div><div className="text-xs text-gray-400">{r.referred_email}</div></td>
                  <td className="px-4 py-3 capitalize text-gray-500">{r.referrer_role}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{r.referral_code}</td>
                  <td className="px-4 py-3"><RefStatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{r.status === 'rewarded' ? <span className="text-green-600 font-medium">✓ Yes</span> : '—'}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > LIMIT && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="flex items-center gap-1 px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><FiChevronLeft /> Prev</button>
          <span className="text-gray-500">Page {page} of {Math.ceil(total / LIMIT)}</span>
          <button disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)} className="flex items-center gap-1 px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40">Next <FiChevronRight /></button>
        </div>
      )}
    </div>
  );
};

// ─── Admin Universal Code Tab (merged from AdminReferrals) ────────────────────
const AdminCodeTab = () => {
  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    api.get('/api/referrals/admin/universal-code')
      .then(d => setCode(d.code || ''))
      .catch(() => adminToast.error('Failed to load admin code'))
      .finally(() => setLoading(false));
  }, []);

  const saveCode = async () => {
    if (!code || code.trim().length < 5) { adminToast.error('Code must be at least 5 characters'); return; }
    setSaving(true);
    try {
      const res = await api.put('/api/referrals/admin/universal-code', { code: code.trim() });
      adminToast.success('Universal code updated');
      setCode(res.code || code.trim().toUpperCase());
    } catch (err) { adminToast.error(err?.message || 'Failed to update code'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading…</div>;

  return (
    <div className="space-y-4 max-w-lg">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          🔑 Admin Universal Referral Code
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          This single code works for <strong>all account types</strong> (user, business, company).
          Anyone who registers with this code gets the referral coupon automatically.
        </p>
        <div className="flex gap-2 mb-4">
          <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="GSNADMINXXXX"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#bca142]" />
          <button onClick={saveCode} disabled={saving}
            className="flex items-center gap-2 bg-[#bca142] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#9d8635] disabled:opacity-60">
            <FiSave className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
          Changing this code does not affect existing referrals already recorded with the old code.
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>How it works:</strong> Admin shares the code → new user registers with it → qualifying event fires (registration / activation / subscription) → both admin and the new user automatically receive the coupon configured in <strong>Referral Rules</strong> above.
      </div>
    </div>
  );
};

// ─── Main Page ──────────────────────────────────────────────────────────────
const AdminCoupons = () => {
  const [tab, setTab] = useState('templates');
  const tabs = [
    { key: 'templates',  label: 'Coupons' },
    { key: 'welcome',    label: 'Welcome Coupon' },
    { key: 'issued',     label: 'Issued' },
    { key: 'history',    label: 'Redemption History' },
    { key: 'referral',   label: 'Referral Rules' },
    { key: 'referrals',  label: 'Referral Tracking' },
    { key: 'admincode',  label: 'Admin Referral Code' },
    { key: 'settings',   label: 'Settings' },
  ];
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FiTag className="text-[#bca142]" /> Coupon Management</h1>
        <p className="text-gray-500 mt-1 text-sm">Create and distribute coupons, configure referral rewards, track all referrals, and manage the admin referral code — everything in one place.</p>
      </div>
      <div className="border-b border-gray-200">
        <nav className="flex gap-6 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.key ? 'border-[#bca142] text-[#bca142]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t.label}</button>
          ))}
        </nav>
      </div>
      {tab === 'templates'  && <TemplatesTab />}
      {tab === 'welcome'    && <WelcomeTab />}
      {tab === 'issued'     && <IssuedTab />}
      {tab === 'history'    && <HistoryTab />}
      {tab === 'referral'   && <ReferralTab />}
      {tab === 'referrals'  && <ReferralTrackingTab />}
      {tab === 'admincode'  && <AdminCodeTab />}
      {tab === 'settings'   && <SettingsTab />}
    </div>
  );
};

export default AdminCoupons;
