import { useState, useEffect } from 'react';
import { FiEdit, FiTrash2, FiCheck, FiX, FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const PricingCard = ({ plan, onEdit, onDelete, onToggle }) => {
  return (
    <div className={`bg-white border rounded-lg shadow-sm p-6 flex flex-col text-gray-700 ${!plan.is_active ? 'opacity-60' : ''}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-500 tracking-wider uppercase">{plan.name}</h3>
        {!plan.is_active && (
          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">Inactive</span>
        )}
      </div>
      <p className="text-center text-2xl my-2">
        <span className="font-bold">${parseFloat(plan.price).toFixed(2)}</span>
        {plan.duration_months > 0 && (
          <span className="text-sm text-gray-500">/{plan.duration_months} {plan.duration_months === 1 ? 'month' : 'months'}</span>
        )}
      </p>
      
      {plan.description && (
        <p className="text-sm text-gray-500 text-center mb-4">{plan.description}</p>
      )}
      
      <hr className="my-4" />

      <div className="flex-grow mb-6">
        <ul className="space-y-2">
          {plan.features?.map((feature, index) => (
            <li key={index} className="flex items-start text-sm">
              <FiCheck className="mr-2 text-green-500 mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
          <li className="flex items-start text-sm">
            {plan.directory_listing ? (
              <FiCheck className="mr-2 text-green-500 mt-0.5 flex-shrink-0" />
            ) : (
              <FiX className="mr-2 text-red-500 mt-0.5 flex-shrink-0" />
            )}
            <span>Directory Listing</span>
          </li>
          <li className="flex items-start text-sm">
            {plan.priority_support ? (
              <FiCheck className="mr-2 text-green-500 mt-0.5 flex-shrink-0" />
            ) : (
              <FiX className="mr-2 text-red-500 mt-0.5 flex-shrink-0" />
            )}
            <span>Priority Support</span>
          </li>
          {plan.max_quotes !== -1 && (
            <li className="flex items-start text-sm">
              <FiCheck className="mr-2 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Max Quotes: {plan.max_quotes}</span>
            </li>
          )}
          {plan.max_responses !== -1 && (
            <li className="flex items-start text-sm">
              <FiCheck className="mr-2 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Max Responses: {plan.max_responses}</span>
            </li>
          )}
        </ul>
      </div>
      
      <div className="flex items-center space-x-2">
        <button 
          onClick={() => onEdit(plan)}
          className="bg-[#84c44e] text-white p-2 rounded-md hover:bg-[#76b046] transition-colors"
          title="Edit plan"
        >
          <FiEdit size={16} />
        </button>
        <button 
          onClick={() => onToggle(plan)}
          className={`${plan.is_active ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} text-white p-2 rounded-md transition-colors`}
          title={plan.is_active ? 'Deactivate' : 'Activate'}
        >
          {plan.is_active ? <FiX size={16} /> : <FiCheck size={16} />}
        </button>
        <button 
          onClick={() => onDelete(plan)}
          className="bg-[#e63273] text-white p-2 rounded-md hover:bg-[#d12c66] transition-colors"
          title="Delete plan"
        >
          <FiTrash2 size={16} />
        </button>
      </div>
    </div>
  );
};

const ManageSubscription = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const data = await api.get('/subscriptions/admin/plans');
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
      await api.put(`/subscriptions/admin/plans/${plan.id}`, {
        ...plan,
        isActive: !plan.is_active
      });
      toast.success(`Plan ${plan.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchPlans();
    } catch (error) {
      toast.error(error.message || 'Failed to update plan');
    }
  };

  const handleDelete = async (plan) => {
    if (!confirm(`Are you sure you want to delete the "${plan.name}" plan?`)) return;
    
    // For now, just deactivate instead of delete
    try {
      await api.put(`/subscriptions/admin/plans/${plan.id}`, {
        ...plan,
        isActive: false
      });
      toast.success('Plan deactivated successfully');
      fetchPlans();
    } catch (error) {
      toast.error(error.message || 'Failed to delete plan');
    }
  };

  const handleSaveEdit = async () => {
    try {
      const featuresArray = editingPlan.features
        .split(',')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      await api.put(`/subscriptions/admin/plans/${editingPlan.id}`, {
        name: editingPlan.name,
        description: editingPlan.description,
        price: parseFloat(editingPlan.price),
        durationMonths: parseInt(editingPlan.duration_months),
        maxQuotes: parseInt(editingPlan.max_quotes),
        maxResponses: parseInt(editingPlan.max_responses),
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
    return <div className="text-center py-8">Loading plans...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Subscription Plans</h1>
          <button
            onClick={() => navigate('/admin/create-Subscription')}
            className="flex items-center gap-2 bg-[#CDA435] text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
          >
            <FiPlus /> Create New Plan
          </button>
        </div>

        {plans.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No subscription plans found. Create your first plan!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <PricingCard 
                key={plan.id} 
                plan={plan} 
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isModalOpen && editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Edit Plan</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                <input
                  type="text"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-md p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD)</label>
                <input
                  type="number"
                  value={editingPlan.price}
                  onChange={(e) => setEditingPlan({...editingPlan, price: e.target.value})}
                  className="w-full border border-gray-300 rounded-md p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Months)</label>
                <input
                  type="number"
                  value={editingPlan.duration_months}
                  onChange={(e) => setEditingPlan({...editingPlan, duration_months: e.target.value})}
                  className="w-full border border-gray-300 rounded-md p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingPlan.description || ''}
                  onChange={(e) => setEditingPlan({...editingPlan, description: e.target.value})}
                  rows="2"
                  className="w-full border border-gray-300 rounded-md p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Features (comma-separated)</label>
                <textarea
                  value={editingPlan.features}
                  onChange={(e) => setEditingPlan({...editingPlan, features: e.target.value})}
                  rows="3"
                  className="w-full border border-gray-300 rounded-md p-2"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingPlan.directory_listing}
                    onChange={(e) => setEditingPlan({...editingPlan, directory_listing: e.target.checked})}
                    className="mr-2"
                  />
                  Directory Listing
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingPlan.priority_support}
                    onChange={(e) => setEditingPlan({...editingPlan, priority_support: e.target.checked})}
                    className="mr-2"
                  />
                  Priority Support
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-[#CDA435] text-white rounded-md hover:bg-opacity-90"
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
