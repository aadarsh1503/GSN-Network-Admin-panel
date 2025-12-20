import { useState, useEffect } from 'react';
import { FaCheck, FaCrown, FaStar, FaRocket } from 'react-icons/fa';
import { useLoading } from '../contexts/LoadingContext';
import { subscriptionAPI } from '../utils/api';
import InlineLoader from '../components/Loader/InlineLoader';
import PageLoader from '../components/Loader/PageLoader';

const SubscriptionPage = () => {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(null);
  const { withLoading } = useLoading();

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    await withLoading(async () => {
      await Promise.all([
        fetchPlans(),
        fetchCurrentSubscription()
      ]);
    }, 'Loading subscription plans...');
  };

  const fetchPlans = async () => {
    try {
      const data = await subscriptionAPI.getPlans();
      setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const data = await subscriptionAPI.getMySubscription();
      setCurrentSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const activateSubscription = async (planId) => {
    try {
      setActivating(planId);
      
      const data = await subscriptionAPI.activateSubscription(planId);
      alert(`Subscription activated successfully! Plan: ${data.planName}`);
      await fetchCurrentSubscription(); // Refresh current subscription
    } catch (error) {
      console.error('Error activating subscription:', error);
      alert(error.message || 'Error activating subscription');
    } finally {
      setActivating(null);
    }
  };

  const getPlanIcon = (planName) => {
    switch (planName.toLowerCase()) {
      case 'basic': return <FaCheck className="text-blue-500" />;
      case 'professional': return <FaStar className="text-purple-500" />;
      case 'enterprise': return <FaRocket className="text-red-500" />;
      default: return <FaCrown className="text-yellow-500" />;
    }
  };

  const getPlanColor = (planName) => {
    switch (planName.toLowerCase()) {
      case 'basic': return 'border-blue-500 bg-blue-50';
      case 'professional': return 'border-purple-500 bg-purple-50';
      case 'enterprise': return 'border-red-500 bg-red-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <PageLoader loading={loading} loadingMessage="Loading subscription plans...">
      {/* Content */}
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Membership Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Unlock the power of our freight forwarding network. Get access to quotes, 
            respond to opportunities, and grow your business.
          </p>
        </div>

        {/* Current Subscription Status */}
        {currentSubscription && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Current Subscription</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium text-[#CDA435]">
                  {currentSubscription.plan_name} Plan
                </p>
                <p className="text-gray-600">
                  {currentSubscription.is_guest ? 'Free access with limited features' : 
                   `Active until: ${new Date(currentSubscription.end_date).toLocaleDateString()}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Monthly Responses</p>
                <p className="text-lg font-semibold">
                  {currentSubscription.max_responses === -1 ? 'Unlimited' : 
                   `${currentSubscription.max_responses} responses`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-lg shadow-lg border-2 ${getPlanColor(plan.name)} 
                         transform hover:scale-105 transition-transform duration-200`}
            >
              {/* Popular Badge */}
              {plan.name.toLowerCase() === 'professional' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#CDA435] text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-6">
                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-3">
                    {getPlanIcon(plan.name)}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-gray-600 mt-2">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-gray-900">
                    ${plan.price}
                    <span className="text-lg font-normal text-gray-600">/month</span>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <FaCheck className="text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Limits */}
                <div className="mb-6 text-sm text-gray-600">
                  <p>Monthly Responses: {plan.max_responses === -1 ? 'Unlimited' : plan.max_responses}</p>
                  <p>Directory Listing: {plan.directory_listing ? 'Yes' : 'No'}</p>
                  <p>Priority Support: {plan.priority_support ? 'Yes' : 'No'}</p>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => activateSubscription(plan.id)}
                  disabled={activating === plan.id || 
                           (currentSubscription && currentSubscription.plan_name === plan.name)}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors
                    ${currentSubscription && currentSubscription.plan_name === plan.name
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : activating === plan.id
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-[#CDA435] text-white hover:bg-yellow-600'
                    }`}
                >
                  {activating === plan.id ? (
                    <InlineLoader size="small" message="Activating..." />
                  ) : currentSubscription && currentSubscription.plan_name === plan.name ? (
                    'Current Plan'
                  ) : (
                    'Activate Plan'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-[#CDA435] text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">Choose Your Plan</h3>
              <p className="text-gray-600">Select the membership plan that fits your business needs</p>
            </div>
            <div className="text-center">
              <div className="bg-[#CDA435] text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">Activate Instantly</h3>
              <p className="text-gray-600">Click activate and start accessing quotes immediately</p>
            </div>
            <div className="text-center">
              <div className="bg-[#CDA435] text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">Start Responding</h3>
              <p className="text-gray-600">View and respond to quotes based on your plan limits</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </PageLoader>
  );
};

export default SubscriptionPage;