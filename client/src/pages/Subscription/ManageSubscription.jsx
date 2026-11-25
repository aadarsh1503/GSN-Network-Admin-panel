import { useState, useEffect } from 'react';
import { FiEdit, FiTrash2, FiCheck, FiX, FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../../contexts/CurrencyContext';

const inputClass =
  'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#bca142] focus:ring-2 focus:ring-[#bca142]/25';

// Numeric plan limit with an explicit "Unlimited" toggle so admins don't have
// to remember that -1 means unlimited. A value of 0 is a valid "none".
const LimitField = ({ label, hint, value, onChange }) => {
  const unlimited = Number(value) === -1;
  const displayValue =
    unlimited || value === '' || value === null || value === undefined ? '' : value;

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          disabled={unlimited}
          value={displayValue}
          onChange={(e) => onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
          placeholder="e.g. 20"
          className={`${inputClass} disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400`}
        />
        <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
          <input
            type="checkbox"
            checked={unlimited}
            onChange={(e) => onChange(e.target.checked ? -1 : 0)}
            className="h-4 w-4 accent-[#bca142]"
          />
          Unlimited
        </label>
      </div>
      <p className="mt-1.5 text-xs text-gray-400">{hint}</p>
    </div>
  );
};

const PricingCard = ({ plan, onEdit, onDelete, onToggle, deleting }) => {
  const { format, formatUsd } = useCurrency();
  const fmtBhd = (v) => format(v);
  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        plan.is_active ? 'border-gray-200' : 'border-red-200'
      } ${!plan.is_active ? 'opacity-70' : ''}`}
    >
      {plan.is_active && (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#bca142] to-[#e2c66a]" />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold uppercase tracking-wide text-gray-900">
            {plan.name}
          </h3>
          <p className="mt-1 text-2xl font-extrabold text-gray-900">
            {fmtBhd(plan.price)}
            {plan.duration_months > 0 && (
              <span className="text-sm font-medium text-gray-500">
                /{plan.duration_months} {plan.duration_months === 1 ? 'month' : 'months'}
              </span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">{formatUsd(plan.price)}</p>
          {Number(plan.yearly_price) > 0 && (
            <p className="mt-1 text-xs font-semibold text-[#8a7628]">
              or {fmtBhd(plan.yearly_price)}/yr
            </p>
          )}
        </div>
        <span
          className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
            plan.is_active
              ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'
              : 'bg-red-50 text-red-600 ring-1 ring-red-200'
          }`}
        >
          {plan.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {plan.description && (
        <p className="mt-3 text-sm leading-relaxed text-gray-500">{plan.description}</p>
      )}

      <div className="my-4 border-t border-gray-100" />

      <div className="mb-5 flex-grow">
        <ul className="space-y-2.5">
          {plan.features?.map((feature, index) => (
            <li key={index} className="flex items-start gap-2.5 text-sm text-gray-700">
              <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-[#bca142]/10">
                <FiCheck className="text-[10px] text-[#bca142]" />
              </span>
              <span className="leading-snug">{feature}</span>
            </li>
          ))}
          <li className="flex items-start gap-2.5 text-sm">
            {plan.directory_listing ? (
              <FiCheck className="mt-0.5 flex-shrink-0 text-emerald-500" />
            ) : (
              <FiX className="mt-0.5 flex-shrink-0 text-red-400" />
            )}
            <span className="text-gray-700">Directory Listing</span>
          </li>
          <li className="flex items-start gap-2.5 text-sm">
            {plan.priority_support ? (
              <FiCheck className="mt-0.5 flex-shrink-0 text-emerald-500" />
            ) : (
              <FiX className="mt-0.5 flex-shrink-0 text-red-400" />
            )}
            <span className="text-gray-700">Priority Support</span>
          </li>
          <li className="flex items-start gap-2.5 text-sm">
            <FiCheck className="mt-0.5 flex-shrink-0 text-emerald-500" />
            <span className="text-gray-700">
              Max Quote Requests: {plan.max_quotes === -1 ? 'Unlimited' : plan.max_quotes}
            </span>
          </li>
          <li className="flex items-start gap-2.5 text-sm">
            <FiCheck className="mt-0.5 flex-shrink-0 text-emerald-500" />
            <span className="text-gray-700">
              Max Quote Responses: {plan.max_responses === -1 ? 'Unlimited' : plan.max_responses}
            </span>
          </li>
        </ul>
      </div>

      <div className="mt-auto grid grid-cols-3 gap-2 border-t border-gray-100 pt-4">
        <button
          onClick={() => onEdit(plan)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#bca142] px-2 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#a8892f]"
          title="Edit plan"
        >
          <FiEdit size={14} />
          Edit
        </button>
        <button
          onClick={() => onToggle(plan)}
          className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-colors ${
            plan.is_active
              ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100'
              : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100'
          }`}
          title={plan.is_active ? 'Deactivate' : 'Activate'}
        >
          {plan.is_active ? <FiX size={14} /> : <FiCheck size={14} />}
          {plan.is_active ? 'Deactivate' : 'Activate'}
        </button>
        <button
          onClick={() => onDelete(plan)}
          disabled={deleting === plan.id}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-50 px-2 py-2 text-xs font-semibold text-red-600 ring-1 ring-red-200 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          title="Delete plan"
        >
          {deleting === plan.id ? (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-400 border-t-transparent"></div>
          ) : (
            <>
              <FiTrash2 size={14} />
              Delete
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const ManageSubscription = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const data = await api.get('/api/subscriptions/admin/plans');
      setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan({
      ...plan,
      features: plan.features?.join(', ') || ''
    });
    setIsModalOpen(true);
  };

  const handleToggle = async (plan) => {
    try {
      await api.put(`/api/subscriptions/admin/plans/${plan.id}`, {
        ...plan,
        // The plan comes back as `yearly_price`; the API expects `yearlyPrice`.
        // Sending it explicitly avoids wiping the annual price on a toggle.
        yearlyPrice: plan.yearly_price ?? null,
        isActive: !plan.is_active
      });
      toast.success(`Plan ${plan.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchPlans();
    } catch (error) {
      toast.error(error.message || 'Failed to update plan');
    }
  };

  const handleDelete = async (plan) => {
    if (!confirm(`Are you sure you want to permanently delete the "${plan.name}" plan? This action cannot be undone.`)) return;

    try {
      setDeleting(plan.id);
      await api.delete(`/api/subscriptions/admin/plans/${plan.id}`);
      toast.success(`Plan "${plan.name}" deleted successfully`);
      fetchPlans();
    } catch (error) {
      toast.error(error.message || 'Failed to delete plan');
    } finally {
      setDeleting(null);
    }
  };

  // Keep 0 as a valid "none" value; only blank/invalid becomes 0.
  const toLimit = (value) => {
    if (value === '' || value === null || value === undefined) return 0;
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? n : 0;
  };

  const handleSaveEdit = async () => {
    try {
      const featuresArray = editingPlan.features
        .split(',')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      await api.put(`/api/subscriptions/admin/plans/${editingPlan.id}`, {
        name: editingPlan.name,
        description: editingPlan.description,
        price: parseFloat(editingPlan.price),
        yearlyPrice:
          editingPlan.yearly_price === '' || editingPlan.yearly_price === null || editingPlan.yearly_price === undefined
            ? null
            : parseFloat(editingPlan.yearly_price),
        durationMonths: Math.max(1, parseInt(editingPlan.duration_months, 10) || 1),
        maxQuotes: toLimit(editingPlan.max_quotes),
        maxResponses: toLimit(editingPlan.max_responses),
        directoryListing: editingPlan.directory_listing,
        prioritySupport: editingPlan.priority_support,
        isActive: editingPlan.is_active,
        features: featuresArray
      });

      toast.success('Plan updated successfully');
      setIsModalOpen(false);
      fetchPlans();
    } catch (error) {
      toast.error(error.message || 'Failed to update plan');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#bca142] border-t-transparent"></div>
          <p className="text-sm text-gray-500">Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* ---------- Header ---------- */}
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Subscription Plans</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage the membership plans shown to users and companies.
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/create-Subscription')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#bca142] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#a8892f] focus:outline-none focus:ring-2 focus:ring-[#bca142]/40"
          >
            <FiPlus /> Create New Plan
          </button>
        </div>

        {/* ---------- Plans ---------- */}
        {plans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#bca142]/10 text-[#bca142]">
              <FiPlus size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No subscription plans yet</h3>
            <p className="mx-auto mt-1 mb-6 max-w-sm text-sm text-gray-500">
              Create your first plan so users and companies can subscribe.
            </p>
            <button
              onClick={() => navigate('/admin/create-Subscription')}
              className="inline-flex items-center gap-2 rounded-xl bg-[#bca142] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#a8892f]"
            >
              <FiPlus /> Create New Plan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {plans.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
                deleting={deleting}
              />
            ))}
          </div>
        )}
      </div>

      {/* ---------- Edit Modal ---------- */}
      {isModalOpen && editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Edit Plan</h3>
                <p className="text-xs text-gray-500">Update the details of this membership plan.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                title="Close"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="space-y-5 overflow-y-auto px-6 py-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Plan Name</label>
                <input
                  type="text"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Price (BHD)
                  </label>
                  <input
                    type="number"
                    value={editingPlan.price}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Duration (Months)
                  </label>
                  <input
                    type="number"
                    value={editingPlan.duration_months}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, duration_months: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Yearly Price (BHD)
                  </label>
                  <input
                    type="number"
                    value={editingPlan.yearly_price ?? ''}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, yearly_price: e.target.value })
                    }
                    placeholder="Blank = 10× monthly"
                    className={inputClass}
                  />
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-400">Annual price shown when users pick yearly billing.</p>
                    {Number(editingPlan.price) > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditingPlan({
                            ...editingPlan,
                            yearly_price: (Number(editingPlan.price) * 10).toFixed(2),
                          })
                        }
                        className="shrink-0 text-xs font-semibold text-[#9d8635] hover:underline"
                      >
                        Use 10×
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <LimitField
                  label="Max Quote Requests / month"
                  hint="How many quote requests this plan can post each month. 0 = none."
                  value={editingPlan.max_quotes}
                  onChange={(v) => setEditingPlan({ ...editingPlan, max_quotes: v })}
                />
                <LimitField
                  label="Max Quote Responses / month"
                  hint="How many quote responses this plan can send each month. 0 = none (view only)."
                  value={editingPlan.max_responses}
                  onChange={(v) => setEditingPlan({ ...editingPlan, max_responses: v })}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={editingPlan.description || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  rows="2"
                  className={`${inputClass} resize-y`}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Features (comma-separated)
                </label>
                <textarea
                  value={editingPlan.features}
                  onChange={(e) => setEditingPlan({ ...editingPlan, features: e.target.value })}
                  rows="3"
                  className={`${inputClass} resize-y`}
                />
                <p className="mt-1.5 text-xs text-gray-400">
                  Separate each feature with a comma, e.g. “Unlimited quotes, Priority support”.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={editingPlan.directory_listing}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, directory_listing: e.target.checked })
                    }
                    className="h-4 w-4 accent-[#bca142]"
                  />
                  <span className="text-sm font-medium text-gray-700">Directory Listing</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={editingPlan.priority_support}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, priority_support: e.target.checked })
                    }
                    className="h-4 w-4 accent-[#bca142]"
                  />
                  <span className="text-sm font-medium text-gray-700">Priority Support</span>
                </label>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="rounded-xl bg-[#bca142] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#a8892f] focus:outline-none focus:ring-2 focus:ring-[#bca142]/40"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSubscription;
