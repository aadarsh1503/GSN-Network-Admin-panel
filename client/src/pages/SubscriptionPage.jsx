import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheck, FaCrown, FaStar, FaRocket, FaGem, FaPaperPlane } from 'react-icons/fa'; // Added more icons
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
    const token = getToken();
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;
    if (!token || !user) {
      setShowLoginModal(true);
      return;
    }
    navigate('/company/subscriptions');
  };

  const handleLoginRedirect = () => navigate('/login');
  const handleRegisterRedirect = () => navigate('/register');

  // UNIQUE ICONS FOR EVERY PLAN
  const getPlanIcon = (planName) => {
    switch (planName.toLowerCase()) {
      case 'guest': return <FaPaperPlane className="text-3xl text-[#bca142]" />;
      case 'professional': return <FaGem className="text-4xl text-[#bca142]" />; // Gem for professional
      case 'enterprise': return <FaRocket className="text-3xl text-black" />;
      default: return <FaCrown className="text-3xl text-[#bca142]" />;
    }
  };

  const getPlanColor = (planName) => {
    switch (planName.toLowerCase()) {
      case 'basic': return 'border-[#bca142]';
      case 'professional': return 'border-[#bca142] shadow-2xl'; // More shadow for professional
      case 'enterprise': return 'border-black';
      default: return 'border-gray-300';
    }
  };

  return (
    <PageLoader loading={loading} loadingMessage="Loading subscription plans...">
      <div className="min-h-screen mt-32 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-black mb-4">
              Choose Your Membership Plan
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Unlock the power of our freight forwarding network. Get access to quotes, 
              respond to opportunities, and grow your business.
            </p>
          </div>

          {/* Subscription Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 relative top-10 lg:grid-cols-4 gap-8 items-stretch">
            {plans && plans.length > 0 ? (
              plans.map((plan) => {
                const isProfessional = plan.name.toLowerCase() === 'professional';
                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col bg-white rounded-xl border-2 transition-all duration-300
                               ${getPlanColor(plan.name)} 
                               ${isProfessional ? 'lg:scale-110 z-10 ring-2 ring-[#bca142] ring-opacity-50' : 'hover:scale-105'}`}
                  >
                    {/* Popular Badge Highlighting */}
                    {isProfessional && (
                      <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-full text-center">
                        <span className="bg-[#bca142] text-white px-6 py-1 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="p-6 flex flex-col flex-grow">
                      {/* Plan Header */}
                      <div className="text-center mb-6">
                        <div className="flex justify-center mb-4">
                          {getPlanIcon(plan.name)}
                        </div>
                        <h3 className={`text-2xl font-bold uppercase ${isProfessional ? 'text-[#bca142]' : 'text-black'}`}>
                          {plan.name}
                        </h3>
                        <p className="text-gray-600 mt-2 text-sm min-h-[40px]">{plan.description}</p>
                      </div>

                      {/* Price */}
                      <div className="text-center mb-6">
                        <div className="text-4xl font-extrabold text-black">
                          ${plan.price}
                          <span className="text-lg font-normal text-gray-500">/mo</span>
                        </div>
                      </div>

                      {/* Features List - Uses flex-grow to push footer down */}
                      <div className="mb-8 flex-grow">
                        <ul className="space-y-4">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-start">
                              <FaCheck className="text-[#bca142] mt-1 mr-3 flex-shrink-0 text-xs" />
                              <span className="text-black text-sm leading-tight">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Limits and Button - Aligned to bottom */}
                      <div className="mt-auto">
                        <div className="mb-6 pt-4 border-t border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-widest text-center space-y-1">
                          <p className='whitespace-nowrap'>Monthly Responses: {plan.max_responses === -1 ? 'Unlimited' : plan.max_responses}</p>
                          {/* <p>Directory Listing: {plan.directory_listing ? 'Yes' : 'No'}</p> */}
                          <p>Support: {plan.priority_support ? 'Priority' : 'Standard'}</p>
                        </div>

                        <button
                          onClick={() => activateSubscription()}
                          disabled={currentSubscription && currentSubscription.plan_name === plan.name}
                          className={`w-full py-4 px-2 rounded-xl font-bold transition-all shadow-md
                            ${currentSubscription && currentSubscription.plan_name === plan.name
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : isProfessional 
                                ? 'bg-[#bca142] text-white hover:bg-black hover:shadow-xl' 
                                : 'bg-black text-white hover:bg-[#bca142]'
                            }`}
                        >
                          {currentSubscription && currentSubscription.plan_name === plan.name ? (
                            'Current Plan'
                          ) : (
                            'Subscribe for Membership'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">No subscription plans available at the moment</p>
              </div>
            )}
          </div>

          {/* How It Works Section */}
          <div className="mt-20 bg-gray-50 relative top-10 mb-10 rounded-2xl p-10 border border-gray-200">
            <h2 className="text-2xl font-bold mb-8 text-black text-center">Step-by-Step Activation</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { step: 1, title: 'Choose Plan', desc: 'Select the best plan for your team.' },
                { step: 2, title: 'Bank Payment', desc: 'Securely transfer via bank details.' },
                { step: 3, title: 'Upload Proof', desc: 'Submit receipt via your dashboard.' },
                { step: 4, title: 'Instant Access', desc: 'Admin verifies and activates.' }
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="bg-[#bca142] text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-4 font-bold">
                    {item.step}
                  </div>
                  <h3 className="font-bold mb-2 text-black">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Login Modal (Styled to match new layout) */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-[#bca142]">Login Required</h2>
                  <button onClick={() => setShowLoginModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <FiX className="text-2xl text-gray-400" />
                  </button>
                </div>
                <div className="text-center mb-8">
                  <div className="bg-[#bca142]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaCrown className="text-3xl text-[#bca142]" />
                  </div>
                  <p className="text-gray-600 font-medium">Please login to choose a membership plan and grow your business.</p>
                </div>
                <div className="space-y-4">
                  <button onClick={handleLoginRedirect} className="w-full py-4 bg-[#bca142] text-white font-bold rounded-xl hover:bg-black transition-all">
                    Login to Your Account
                  </button>
                  <button onClick={handleRegisterRedirect} className="w-full py-4 border-2 border-[#bca142] text-[#bca142] font-bold rounded-xl hover:bg-[#bca142] hover:text-white transition-all">
                    Create New Account
                  </button>
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