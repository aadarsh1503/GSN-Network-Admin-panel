import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheck, FaCrown, FaStar, FaRocket } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';
import { useLoading } from '../contexts/LoadingContext';
import { subscriptionAPI, getToken } from '../utils/api';
import PageLoader from '../components/Loader/PageLoader';

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
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
      setPlans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      setPlans([]);
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

  const activateSubscription = async () => {
    // Check if user is logged in
    const token = getToken();
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;

    if (!token || !user) {
      // Show login modal if not logged in
      setShowLoginModal(true);
      return;
    }

    // If user is logged in, redirect to company subscriptions page
    navigate('/company/subscriptions');
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  const handleRegisterRedirect = () => {
    navigate('/register');
  };

  const getPlanIcon = (planName) => {
    switch (planName.toLowerCase()) {
      case 'basic': return <FaCheck className="text-[#bca142]" />;
      case 'professional': return <FaStar className="text-[#bca142]" />;
      case 'enterprise': return <FaRocket className="text-black" />;
      default: return <FaCrown className="text-[#bca142]" />;
    }
  };

  const getPlanColor = (planName) => {
    switch (planName.toLowerCase()) {
      case 'basic': return 'border-[#bca142] bg-white';
      case 'professional': return 'border-[#bca142] bg-white';
      case 'enterprise': return 'border-black bg-white';
      default: return 'border-gray-300 bg-white';
    }
  };

  return (
    <PageLoader loading={loading} loadingMessage="Loading subscription plans...">
      {/* Content */}
    <div className="min-h-screen mt-32 bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-4">
            Choose Your Membership Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Unlock the power of our freight forwarding network. Get access to quotes, 
            respond to opportunities, and grow your business.
          </p>
        </div>

        {/* Current Subscription Status */}
        {currentSubscription && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4 text-black">Current Subscription</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium text-[#bca142]">
                  {currentSubscription.plan_name} Plan
                </p>
                <p className="text-gray-600">
                  {currentSubscription.is_guest ? 'Free access with limited features' : 
                   `Active until: ${new Date(currentSubscription.end_date).toLocaleDateString()}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Monthly Responses</p>
                <p className="text-lg font-semibold text-black">
                  {currentSubscription.max_responses === -1 ? 'Unlimited' : 
                   `${currentSubscription.max_responses} responses`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans && plans.length > 0 ? (
            plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-lg shadow-lg border-2 ${getPlanColor(plan.name)} 
                           transform hover:scale-105 transition-transform duration-200`}
              >
                {/* Popular Badge */}
                {plan.name.toLowerCase() === 'professional' && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[#bca142] text-white px-4 py-1 rounded-full text-sm font-semibold">
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
                    <h3 className="text-2xl font-bold text-black">{plan.name}</h3>
                    <p className="text-gray-600 mt-2">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-black">
                      ${plan.price}
                      <span className="text-lg font-normal text-gray-600">/month</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <FaCheck className="text-[#bca142] mr-3 flex-shrink-0" />
                          <span className="text-black">{feature}</span>
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
                    onClick={() => activateSubscription()}
                    disabled={currentSubscription && currentSubscription.plan_name === plan.name}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors
                      ${currentSubscription && currentSubscription.plan_name === plan.name
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-[#bca142] text-white hover:bg-black'
                      }`}
                  >
                    {currentSubscription && currentSubscription.plan_name === plan.name ? (
                      'Current Plan'
                    ) : (
                      'Subscribe via Bank Transfer'
                    )}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">No subscription plans available at the moment</p>
              <p className="text-gray-400 mt-2">Please check back later</p>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8 border border-gray-200">
          <h2 className="text-2xl font-semibold mb-4 text-black">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-[#bca142] text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2 text-black">Choose Your Plan</h3>
              <p className="text-gray-600">Select the membership plan that fits your business needs</p>
            </div>
            <div className="text-center">
              <div className="bg-[#bca142] text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2 text-black">Make Bank Payment</h3>
              <p className="text-gray-600">Transfer payment to our bank account using the provided details</p>
            </div>
            <div className="text-center">
              <div className="bg-[#bca142] text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2 text-black">Upload Payment Proof</h3>
              <p className="text-gray-600">Upload your payment receipt with transaction ID for verification</p>
            </div>
            <div className="text-center">
              <div className="bg-[#bca142] text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                4
              </div>
              <h3 className="font-semibold mb-2 text-black">Admin Approval</h3>
              <p className="text-gray-600">Our admin will verify your payment and activate your subscription</p>
            </div>
          </div>
          
          <div className="mt-8 bg-white border border-[#bca142] rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <FaCheck className="text-[#bca142] text-xl" />
              <h3 className="text-lg font-semibold text-black">Bank Transfer Payment</h3>
            </div>
            <p className="text-black">
              All subscriptions require bank transfer payment for verification. After selecting a plan, you'll receive our bank details to complete the payment and upload proof for admin approval.
            </p>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-8">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#bca142]">
                    Login Required
                  </h2>
                  <p className="text-gray-600 mt-2">Please login or create an account to subscribe</p>
                </div>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <FiX className="text-2xl text-gray-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="space-y-6">
                <div className="text-center">
                  <div className="bg-[#bca142] text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <FaCrown className="text-2xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-black mb-2">
                    Ready to Get Started?
                  </h3>
                  <p className="text-gray-600">
                    Join our platform to access premium subscription plans and grow your business.
                  </p>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={handleLoginRedirect}
                    className="w-full py-3 px-4 bg-[#bca142] text-white font-semibold rounded-lg hover:bg-black transition-colors"
                  >
                    Login to Your Account
                  </button>
                  
                  <div className="text-center">
                    <span className="text-gray-500">Don't have an account?</span>
                  </div>
                  
                  <button
                    onClick={handleRegisterRedirect}
                    className="w-full py-3 px-4 border border-[#bca142] text-[#bca142] font-semibold rounded-lg hover:bg-[#bca142] hover:text-white transition-colors"
                  >
                    Create New Account
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-black mb-2">What happens next?</h4>
                  <ul className="text-black text-sm space-y-1">
                    <li>• Login or create your account</li>
                    <li>• Choose your subscription plan</li>
                    <li>• Complete bank transfer payment</li>
                    <li>• Get admin approval and start using premium features</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </PageLoader>
  );
};

export default SubscriptionPage;