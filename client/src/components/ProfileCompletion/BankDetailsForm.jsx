import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiCreditCard, FiEdit3, FiSave, FiX, FiCheckCircle, FiLock } from 'react-icons/fi';
import { api } from '../../utils/api';
import { useProfileCompletionContext } from '../../contexts/ProfileCompletionContext';

const EMPTY_FORM = {
  bank_name: '',
  account_holder_name: '',
  account_number: '',
  iban_number: '',
  swift_code: '',
  branch_name: '',
  branch_address: '',
  ifsc_code: '',
};

const maskAccount = (value) => {
  if (!value) return '—';
  const str = String(value);
  return str.length <= 4 ? str : `•••• •••• ${str.slice(-4)}`;
};

const inputClass =
  'w-full rounded-xl border border-white/70 bg-white/60 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 backdrop-blur-sm outline-none transition-all focus:border-[#bca142]/60 focus:bg-white/90 focus:ring-2 focus:ring-[#bca142]/20';

const Field = ({ label, required, ...props }) => (
  <label className="block">
    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
      {label} {required && <span className="text-rose-500">*</span>}
    </span>
    <input className={inputClass} {...props} />
  </label>
);

const BankDetailsForm = ({ className = '' }) => {
  const { bankDetails, role, refresh } = useProfileCompletionContext();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const primary = bankDetails?.[0] || null;

  useEffect(() => {
    if (primary) {
      setForm({
        bank_name: primary.bank_name || '',
        account_holder_name: primary.account_holder_name || '',
        account_number: primary.account_number || '',
        iban_number: primary.iban_number || '',
        swift_code: primary.swift_code || '',
        branch_name: primary.branch_name || '',
        branch_address: primary.branch_address || '',
        ifsc_code: primary.ifsc_code || '',
      });
    }
  }, [primary]);

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.bank_name.trim() || !form.account_number.trim() || !form.account_holder_name.trim()) {
      toast.error('Bank name, account holder name and account number are required');
      return;
    }

    setSaving(true);
    try {
      if (primary) {
        await api.put(`/api/bank-details/my/${primary.id}`, { ...form, is_default: true });
        toast.success('Bank details updated');
      } else {
        await api.post('/api/bank-details/my', { ...form, is_default: true });
        toast.success('Main bank account saved');
      }
      setEditing(false);
      window.dispatchEvent(new CustomEvent('bankDetailsUpdated'));
      await refresh();
    } catch (error) {
      toast.error(error.message || 'Could not save bank details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/70 bg-white/60 backdrop-blur-xl shadow-[0_10px_40px_-12px_rgba(188,161,66,0.35)] ${className}`}
    >
      <div className="pointer-events-none absolute -top-20 -right-16 h-48 w-48 rounded-full bg-[#bca142]/15 blur-3xl" />

      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#bca142]/15 text-[#bca142]">
              <FiCreditCard size={18} />
            </span>
            <div>
              <h3 className="text-base font-bold text-gray-900">Bank Details</h3>
              <p className="text-[11px] text-gray-500">Your main account — required to receive payments.</p>
            </div>
          </div>

          {primary && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 rounded-xl border border-white/70 bg-white/60 px-3 py-2 text-xs font-semibold text-gray-600 backdrop-blur-sm transition-colors hover:bg-white/90 hover:text-gray-900"
            >
              <FiEdit3 size={13} /> Edit
            </button>
          )}
          {editing && (
            <button
              onClick={() => setEditing(false)}
              className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-white/70 hover:text-gray-900"
            >
              <FiX size={15} />
            </button>
          )}
        </div>

        {primary && !editing ? (
          <div className="mt-4 space-y-2 rounded-2xl border border-green-200/70 bg-green-50/60 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-green-700">
              <FiCheckCircle /> Primary account saved
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-500">Bank</p>
                <p className="text-sm font-semibold text-gray-900">{primary.bank_name || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-500">Account holder</p>
                <p className="text-sm font-semibold text-gray-900">{primary.account_holder_name || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-500">Account number</p>
                <p className="text-sm font-semibold text-gray-900">{maskAccount(primary.account_number)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-500">SWIFT / IFSC</p>
                <p className="text-sm font-semibold text-gray-900">
                  {primary.swift_code || primary.ifsc_code || '—'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Bank name" required value={form.bank_name} onChange={update('bank_name')} />
              <Field
                label="Account holder name"
                required
                value={form.account_holder_name}
                onChange={update('account_holder_name')}
              />
              <Field
                label="Account number"
                required
                value={form.account_number}
                onChange={update('account_number')}
              />
              <Field label="IBAN" value={form.iban_number} onChange={update('iban_number')} />
              <Field label="SWIFT code" value={form.swift_code} onChange={update('swift_code')} />
              <Field label="IFSC code" value={form.ifsc_code} onChange={update('ifsc_code')} />
              <Field label="Branch name" value={form.branch_name} onChange={update('branch_name')} />
              <Field label="Branch address" value={form.branch_address} onChange={update('branch_address')} />
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-[#bca142]/25 bg-[#bca142]/10 p-3 text-[11px] text-gray-700">
              <FiLock className="flex-shrink-0 text-[#bca142]" />
              This account will be marked as your <span className="font-semibold">primary</span> account.
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#bca142] to-[#a98f34] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#bca142]/30 transition-all hover:from-[#a98f34] hover:to-[#8f7826] disabled:opacity-60"
            >
              <FiSave size={15} />
              {saving ? 'Saving...' : primary ? 'Update Bank Details' : 'Save Main Bank Account'}
            </button>
          </form>
        )}

        {role === 'user' && (
          <p className="mt-3 text-[11px] leading-relaxed text-gray-500">
            Bank details are used for refunds and payouts and cannot be skipped.
          </p>
        )}
      </div>
    </div>
  );
};

export default BankDetailsForm;
