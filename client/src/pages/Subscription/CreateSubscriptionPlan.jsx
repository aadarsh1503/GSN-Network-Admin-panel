import React, { useState } from 'react';

// A reusable component for input fields to keep the main component clean
const InputField = ({ label, name, value, onChange, placeholder, type = 'text' }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-600 mb-1">
      {label}
    </label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
    />
  </div>
);

// A reusable component for select/dropdown fields
const SelectField = ({ label, name, value, onChange, children }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-600 mb-1">
      {label}
    </label>
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
    >
      {children}
    </select>
  </div>
);

// A reusable component for checkboxes
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
  const [formData, setFormData] = useState({
    userType: '',
    planName: '',
    validityType: '',
    planDays: '',
    quotesLimit: '',
    referralAmount: '',
    planAmount: '',
    contactDetailsVisibility: false,
    directoryAccess1: false,
    directoryAccess2: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form Submitted:', formData);
    // Add your API call logic here
  };

  return (
    <div className="bg-gray-50 p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Create Subscription Plan
        </h1>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            
            {/* Column 1 */}
            <SelectField label="Select User Type" name="userType" value={formData.userType} onChange={handleChange}>
              <option value="">Select Category</option>
              <option value="business_owner">Business Owner</option>
              <option value="company_owner">Company Owner</option>
              <option value="user">Regular User</option>
            </SelectField>

            {/* Column 2 */}
            <InputField 
                label="Plan Name" 
                name="planName" 
                value={formData.planName} 
                onChange={handleChange} 
                placeholder="Plan Name"
            />

            {/* Column 1 */}
            <SelectField label="Validity Type" name="validityType" value={formData.validityType} onChange={handleChange}>
              <option value="">validity type</option>
              <option value="days">Days</option>
              <option value="months">Months</option>
              <option value="lifetime">Lifetime</option>
            </SelectField>

            {/* Column 2 */}
            <InputField 
                label="Plan Days" 
                name="planDays" 
                value={formData.planDays} 
                onChange={handleChange} 
                placeholder="Plan Days"
                type="number"
            />

            {/* Column 1 */}
            <InputField 
                label="Quotes Limit" 
                name="quotesLimit" 
                value={formData.quotesLimit} 
                onChange={handleChange} 
                placeholder="Quotes Limit"
                type="number"
            />

            {/* Column 2 */}
            <InputField 
                label="Referral Amount" 
                name="referralAmount" 
                value={formData.referralAmount} 
                onChange={handleChange} 
                placeholder="Referral Amount"
                type="number"
            />

            {/* Column 1 */}
            <InputField 
                label="Plan Amount" 
                name="planAmount" 
                value={formData.planAmount} 
                onChange={handleChange} 
                placeholder="Plan Amount"
                type="number"
            />

            {/* Column 2 - Checkboxes */}
            <div className="flex flex-col space-y-3 pt-6">
                <CheckboxField 
                    label="Contact Details Visibility"
                    name="contactDetailsVisibility"
                    checked={formData.contactDetailsVisibility}
                    onChange={handleChange}
                />
                <CheckboxField 
                    label="Directory Access"
                    name="directoryAccess1"
                    checked={formData.directoryAccess1}
                    onChange={handleChange}
                />
                <CheckboxField 
                    label="Directory Access"
                    name="directoryAccess2"
                    checked={formData.directoryAccess2}
                    onChange={handleChange}
                />
            </div>
          </div>

          <div className="mt-8">
            <button
              type="submit"
              className="px-6 py-2 bg-[#D9B95B] text-white font-semibold rounded-md hover:bg-[#c8a84a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D9B95B]"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSubscriptionPlan;