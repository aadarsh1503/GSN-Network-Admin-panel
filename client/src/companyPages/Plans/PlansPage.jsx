import { useState, useEffect } from 'react';
import { FiCheck, FiX } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const PlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansData, subData] = await Promise.all([
        api.get('/api/subscriptions/plans'),
        api.get('/api/subscriptions/my-subscription')
      ]);
      setPlans(plansData);
      setCurrentSubscription(subData);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan) => {
    if (plan.price === 0 || plan.price === '0.00') {
      toast.error('You are already on the free plan');
      return;
    }
    // In a real app, this would redirect to payment
    toast.success(`Contact support to upgrade to ${plan.name} plan`);
  };

  const isCurrentPlan = (plan) => {
    return currentSubscription?.plan_name?.toLowerCase() === plan.name?.toLowerCase();
  };

  if (loading) {
    return <div className="text-center py-8">Loading plans...</div>;
  }

  return (
    <div className="bg-gray-50 p-4 sm:p-8 w-full flex flex-col items-center">
      <div className="w-full max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Membership Plans</h1>
        <p className="text-gray-500 text-center mb-8">Choose the plan that best fits your business needs</p>

        {currentSubscription && !currentSubscription.is_guest && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 text-center">
            <p className="text-green-800">
              Current Plan: <strong>{currentSubscription.plan_name}</strong>
              {currentSubscription.end_date && (
                <span className="ml-2">
                  (Expires: {new Date(currentSubscription.end_date).toLocaleDateString()})
                </span>
              )}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`bg-white border rounded-lg p-6 flex flex-col text-center shadow-sm hover:shadow-lg transition-shadow duration-300 ${
                isCurrentPlan(plan) ? 'border-[#CDA435] border-2' : 'border-gray-200'
              }`}
            >
              {isCurrentPlan(plan) && (
                <div className="bg-[#CDA435] text-white text-xs font-bold py-1 px-3 rounded-full self-center -mt-9 mb-4">
                  CURRENT PLAN
                </div>
              )}

              <h2 className="text-lg font-semibold text-gray-500 uppercase tracking-widest">
                {plan.name}
              </h2>
              
              <p className="text-4xl font-bold text-gray-800 mt-4">
                ${parseFloat(plan.price).toFixed(2)}
                {plan.duration_months > 0 && (
                  <span className="text-base font-normal text-gray-500">
                    /{plan.duration_months} {plan.duration_months === 1 ? 'month' : 'months'}
                  </span>
                )}
              </p>

              {plan.description && (
                <p className="text-sm text-gray-500 mt-2">{plan.description}</p>
              )}
              
              <div className="border-t border-gray-200 my-6"></div>
              
              <ul className="space-y-3 text-left flex-grow">
                {plan.features?.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700 text-sm">
                    <FiCheck className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
                
                <li className="flex items-start gap-2 text-gray-700 text-sm">
                  {plan.directory_listing ? (
                    <FiCheck className="text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <FiX className="text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  <span>Directory Listing</span>
                </li>
                
                <li className="flex items-start gap-2 text-gray-700 text-sm">
                  {plan.priority_support ? (
                    <FiCheck className="text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <FiX className="text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  <span>Priority Support</span>
                </li>

                {plan.max_quotes !== -1 && (
                  <li className="flex items-start gap-2 text-gray-700 text-sm">
                    <FiCheck className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{plan.max_quotes} Quotes/month</span>
                  </li>
                )}

                {plan.max_responses !== -1 && plan.max_responses > 0 && (
                  <li className="flex items-start gap-2 text-gray-700 text-sm">
                    <FiCheck className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{plan.max_responses} Quote Responses/month</span>
                  </li>
                )}

                {plan.max_responses === -1 && (
                  <li className="flex items-start gap-2 text-gray-700 text-sm">
                    <FiCheck className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Unlimited Quote Responses</span>
                  </li>
                )}
              </ul>
              
              <div className="border-t border-gray-200 my-6"></div>
              
              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={isCurrentPlan(plan)}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  isCurrentPlan(plan)
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : plan.price === 0 || plan.price === '0.00'
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-[#CDA435] text-white hover:bg-opacity-90'
                }`}
              >
                {isCurrentPlan(plan) ? 'Current Plan' : plan.price === 0 || plan.price === '0.00' ? 'Free Plan' : 'Upgrade Now'}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Need a custom plan? <a href="/company/create-Ticket" className="text-[#CDA435] hover:underline">Contact us</a></p>
        </div>
      </div>
    </div>
  );
};

export default PlansPage;
