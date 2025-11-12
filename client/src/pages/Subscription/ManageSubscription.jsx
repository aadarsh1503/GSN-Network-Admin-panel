import React from 'react';
import { FiEdit, FiTrash2, FiZap } from 'react-icons/fi';

// Data for the pricing plans
const companyPlans = [
  {
    name: 'GUEST',
    price: '0.00',
    duration: '90 days',
    features: [
      'Quote Reply Limits: 20',
      'Contact Visibility: No',
      'Directory Access: No',
    ],
  },
  {
    name: 'PREMIER',
    price: '49.00',
    duration: '365 days',
    features: [
      'Quote Reply Limits: 100',
      'Contact Visibility: Yes',
      'Directory Access: Yes',
    ],
  },
  {
    name: 'ELITE',
    price: '99.00',
    duration: '365 days',
    features: [
      'Quote Reply Limits: 999',
      'Contact Visibility: Yes',
      'Directory Access: Yes',
    ],
  },
];

const businessPlans = [
  {
    name: 'GUEST',
    price: '0.00',
    duration: '365 days',
    features: [
      'Quote Reply Limits: 0',
      'Contact Visibility: Yes',
      'Directory Access: Yes',
    ],
  },
];

// Reusable Pricing Card Component
const PricingCard = ({ plan }) => {
  const handleEdit = () => {
    console.log(`Editing plan: ${plan.name}`);
    // Add edit logic here
  };

  const handleDelete = () => {
    console.log(`Deleting plan: ${plan.name}`);
    // Add delete logic here
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col text-gray-700">
      <h3 className="text-center font-semibold text-gray-500 tracking-wider uppercase">{plan.name}</h3>
      <p className="text-center text-lg my-2">
        <span className="font-semibold">${plan.price}</span>
        <span className="text-gray-500">/{plan.duration}</span>
      </p>
      
      <hr className="my-4" />

      <div className="flex-grow mb-6">
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm">
              <FiZap className="mr-3 text-gray-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="flex items-center space-x-2">
        <button 
          onClick={handleEdit}
          className="bg-[#84c44e] text-white p-2 rounded-md hover:bg-[#76b046] transition-colors"
          aria-label={`Edit ${plan.name} plan`}
        >
          <FiEdit size={16} />
        </button>
        <button 
          onClick={handleDelete}
          className="bg-[#e63273] text-white p-2 rounded-md hover:bg-[#d12c66] transition-colors"
          aria-label={`Delete ${plan.name} plan`}
        >
          <FiTrash2 size={16} />
        </button>
      </div>
    </div>
  );
};


// Main Page Component
const ManageSubscription = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Pricing</h1>

        {/* Company Plans Section */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-5">Company Plans</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {companyPlans.map((plan, index) => (
              <PricingCard key={index} plan={plan} />
            ))}
          </div>
        </section>

        {/* Business Plans Section */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-5">Business Plans</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {businessPlans.map((plan, index) => (
              <PricingCard key={index} plan={plan} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ManageSubscription;