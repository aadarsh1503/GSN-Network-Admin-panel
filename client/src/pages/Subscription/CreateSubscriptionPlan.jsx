import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const InputField = ({ label, name, value, onChange, placeholder, type = 'text', required = false }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-600 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
    />
  </div>
);

const CheckboxField = ({ label, name, checked, onChange }) => (
  <div className="flex items-center">
    <input
      id={name}
      name={name}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
    />
    <label htmlFor={name} className="ml-2 block text-sm text-gray-700">
      {label}
    </label>
  </div>
);

const CreateSubscriptionPlan = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    durationMonths: '1',
    maxQuotes: '-1',
    maxResponses: '-1',
    directoryListing: true,
    prioritySupport: false,
    features: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || formData.price === '') {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Parse features from comma-separated string to array
      const featuresArray = formData.features
        .split(',')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      await api.post('/api/subscriptions/admin/plans', {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        durationMonths: parseInt(formData.durationMonths),
        maxQuotes: parseInt(formData.maxQuotes),
        maxResponses: parseInt(formData.maxResponses),
        directoryListing: formData.directoryListing,
        prioritySupport: formData.prioritySupport,
        features: featuresArray
      });

      toast.success('Subscription plan created successfully!');
      navigate('/admin/manage-Subscription');
    } catch (error) {
      toast.error(error.message || 'Failed to create plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Create Subscription Plan
        </h1>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <InputField 
              label="Plan Name" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="e.g., Basic, Premium, Enterprise"
              required
            />

            <InputField 
              label="Price (USD)" 
              name="price" 
              value={formData.price} 
              onChange={handleChange} 
              placeholder="0.00"
              type="number"
              required
            />

            <InputField 
              label="Duration (Months)" 
              name="durationMonths" 
              value={formData.durationMonths} 
              onChange={handleChange} 
              placeholder="1"
              type="number"
            />

            <InputField 
              label="Max Quotes (-1 for unlimited)" 
              name="maxQuotes" 
              value={formData.maxQuotes} 
              onChange={handleChange} 
              placeholder="-1"
              type="number"
            />

            <InputField 
              label="Max Quote Responses (-1 for unlimited)" 
              name="maxResponses" 
              value={formData.maxResponses} 
              onChange={handleChange} 
              placeholder="-1"
              type="number"
            />

            <div className="flex flex-col space-y-3 pt-6">
              <CheckboxField 
                label="Directory Listing"
                name="directoryListing"
                checked={formData.directoryListing}
                onChange={handleChange}
              />
              <CheckboxField 
                label="Priority Support"
                name="prioritySupport"
                checked={formData.prioritySupport}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-600 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of the plan"
                rows="2"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="features" className="block text-sm font-medium text-gray-600 mb-1">
                Features (comma-separated)
              </label>
              <textarea
                id="features"
                name="features"
                value={formData.features}
                onChange={handleChange}
                placeholder="Feature 1, Feature 2, Feature 3"
                rows="3"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
              />
              <p className="text-xs text-gray-500 mt-1">Enter features separated by commas</p>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#D9B95B] text-white font-semibold rounded-md hover:bg-[#c8a84a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D9B95B] disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Plan'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/manage-Subscription')}
              className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSubscriptionPlan;
