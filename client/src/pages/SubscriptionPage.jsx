import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheck, FaCrown, FaRocket, FaGem, FaPaperPlane } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';
import { useLoading } from '../contexts/LoadingContext';
import { subscriptionAPI, getToken } from '../utils/api';
import PageLoader from '../components/Loader/PageLoader';
import toast from 'react-hot-toast';

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

  const calculateProration = (newPlan) => {
    if (!currentSubscription || !newPlan || currentSubscription.is_guest) return null;
    
    if (!currentSubscription.plan_price || !currentSubscription.end_date) return null;

    const currentPlanPrice = parseFloat(currentSubscription.plan_price || 0);
    const newPlanPrice = parseFloat(newPlan.price);
    const newPlanDurationMonths = parseInt(newPlan.duration_months || 1);

    const now = new Date();
    const startDate = new Date(currentSubscription.start_date);
    const endDate = new Date(currentSubscription.end_date);
    
    if (isNaN(endDate.getTime()) || isNaN(startDate.getTime())) return null;
    
    // Calculate total days in current subscription period
    const totalDaysInPeriod = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    // Calculate days remaining
    const daysRemaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
    
    // Calculate unused value based on days remaining
    const unusedValue = (currentPlanPrice / totalDaysInPeriod) * daysRemaining;
    
    // Calculate amount to charge (new plan price minus unused value)
    const amountToCharge = Math.max(0, newPlanPrice - unusedValue);

    return {
      currentPlanPrice: currentPlanPrice.toFixed(2),
      currentPlanName: currentSubscription.plan_name,
      newPlanPrice: newPlanPrice.toFixed(2),
      newPlanDurationMonths,
      daysRemaining,
      totalDaysInPeriod,
      unusedValue: unusedValue.toFixed(2),
      amountToCharge: amountToCharge.toFixed(2),
      savings: unusedValue.toFixed(2)
    };
  };

  const getPlanRelation = (plan) => {
    if (!currentSubscription || currentSubscription.is_guest) return 'new';
    
    const currentPrice = parseFloat(currentSubscription.plan_price || 0);
    const newPrice = parseFloat(plan.price);
    
    console.log('🔍 Plan Relation Debug:');
    console.log('Current Plan:', currentSubscription.plan_name, '- Price:', currentPrice);
    console.log('New Plan:', plan.name, '- Price:', newPrice);
    
    if (currentSubscription.plan_name === plan.name) return 'current';
    if (newPrice > currentPrice) return 'upgrade';
    if (newPrice < currentPrice) return 'downgrade';
    return 'same';
  };

  const activateSubscription = async (plan) => {
    const token = getToken();
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;
    
    if (!token || !user) {
      setShowLoginModal(true);
      return;
    }

    const relation = getPlanRelation(plan);
    
    console.log('🔍 Activate Subscription Debug:');
    console.log('Plan:', plan);
    console.log('Relation:', relation);
    console.log('Current Subscription:', currentSubscription);
    
    if (relation === 'downgrade') {
      toast.error('Downgrading is not available. Please contact support for assistance.', {
        duration: 5000
      });
      return;
    }

    if (relation === 'current') {
      toast.info('You are already on this plan');
      return;
    }

    let proration = null;
    if (relation === 'upgrade') {
      proration = calculateProration(plan);
      console.log('Proration calculated:', proration);
    }

    console.log('Navigating to payment with:', { plan, prorationDetails: proration });

    navigate('/payment', {
      state: {
        plan: plan,
        prorationDetails: proration
      }
    });
  };

  const handleLoginRedirect = () => navigate('/login');
  const handleRegisterRedirect = () => navigate('/register');

  const getPlanIcon = (planName) => {
    switch (planName.toLowerCase()) {
      case 'guest': return <FaPaperPlane className="text-3xl text-[#bca142]" />;
      case 'professional': return <FaGem className="text-4xl text-[#bca142]" />;
      case 'enterprise': return <FaRocket className="text-3xl text-black" />;
      default: return <FaCrown className="text-3xl text-[#bca142]" />;
    }
  };

  const getPlanColor = (planName) => {
    switch (planName.toLowerCase()) {
      case 'basic': return 'border-[#bca142]';
      case 'professional': return 'border-[#bca142] shadow-2xl';
      case 'enterprise': return 'border-black';
      default: return 'border-gray-300';
    }
  };

  return (
    <PageLoader loading={loading} loadingMessage="Loading subscription plans...">
      <div className="min-h-screen bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-black mb-4">
              Choose Your Membership Plan
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Unlock the power of our freight forwarding network. Get access to quotes, 
              respond to opportunities, and grow your business.
            </p>
          </div>

          {/* Current Subscription Info */}
          {currentSubscription && !currentSubscription.is_guest && (
            <div className="mb-12 bg-gradient-to-r from-[#bca142]/10 to-[#bca142]/5 border-2 border-[#bca142] rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-[#bca142] text-white rounded-full w-12 h-12 flex items-center justify-center">
                    <FaCrown className="text-xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black">Current Subscription</h3>
                    <p className="text-gray-600">
                      <span className="font-semibold text-[#bca142]">{currentSubscription.plan_name}</span>
                      {' • '}
                      <span className="text-sm">
                        {currentSubscription.end_date && (() => {
                          const endDate = new Date(currentSubscription.end_date);
                          const now = new Date();
                          const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                          return daysLeft > 0 ? `${daysLeft} days remaining` : 'Expired';
                        })()}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-black">
                    ${currentSubscription.plan_price}
                    <span className="text-sm font-normal text-gray-500">/mo</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Expires: {currentSubscription.end_date && new Date(currentSubscription.end_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              {/* Upgrade Info */}
              <div className="mt-4 pt-4 border-t border-[#bca142]/30">
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-[#bca142] font-bold">💡</span>
                  <div>
                    <span className="font-semibold">Upgrade anytime:</span> When you upgrade, we'll credit your unused time towards the new plan. 
                    <span className="font-semibold text-[#bca142]"> No money wasted!</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 relative top-10 lg:grid-cols-4 gap-6 items-stretch">
            {plans && plans.length > 0 ? (
              plans.map((plan) => {
                const isProfessional = plan.name.toLowerCase() === 'professional';
                const isGuestPlan = plan.name.toLowerCase() === 'guest' || parseFloat(plan.price) === 0;
                const planRelation = getPlanRelation(plan);
                
                // Guest plan is always disabled and shows as current if user is on guest
                const isDisabled = isGuestPlan || planRelation === 'current' || planRelation === 'downgrade';
                
                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col bg-white rounded-xl border-2 transition-all duration-300
                               ${getPlanColor(plan.name)} 
                               ${isProfessional && !isGuestPlan ? 'lg:scale-110 z-10 ring-2 ring-[#bca142] ring-opacity-50' : 'hover:scale-105'}
                               ${isGuestPlan || planRelation === 'downgrade' ? 'opacity-60' : ''}`}
                  >
                    {isProfessional && planRelation !== 'current' && !isGuestPlan && (
                      <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-full text-center">
                        <span className="bg-[#bca142] text-white px-6 py-1 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg">
                          Most Popular
                        </span>
                      </div>
                    )}
                    
                    {/* Show Current Plan badge for Guest if user is on guest, or for any current plan */}
                    {(planRelation === 'current' || (isGuestPlan && currentSubscription?.is_guest)) && (
                      <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-full text-center">
                        <span className="bg-white text-[#bca142] outline outline-[#bca142] px-6 py-1 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg">
                          Current Plan
                        </span>
                      </div>
                    )}

                    {planRelation === 'upgrade' && !isGuestPlan && (
                      <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-full text-center">
                        <span className="bg-[#bca142] text-white px-6 py-1 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg">
                          Upgrade
                        </span>
                      </div>
                    )}

                    {planRelation === 'downgrade' && !isGuestPlan && (
                      <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-full text-center">
                        <span className="bg-gray-400 text-white px-6 py-1 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg">
                          Not Available
                        </span>
                      </div>
                    )}

                    <div className="p-6 flex flex-col flex-grow">
                      <div className="text-center mb-6">
                        <div className="flex justify-center mb-4">
                          {getPlanIcon(plan.name)}
                        </div>
                        <h3 className={`text-2xl font-bold uppercase ${isProfessional ? 'text-[#bca142]' : 'text-black'}`}>
                          {plan.name}
                        </h3>
                        <p className="text-gray-600 mt-2 text-sm min-h-[40px]">{plan.description}</p>
                      </div>

                      <div className="text-center mb-6">
                        {planRelation === 'upgrade' && (() => {
                          const proration = calculateProration(plan);
                          return proration ? (
                            <div className="space-y-2">
                              <div className="text-sm text-gray-500 line-through">
                                Original: ${proration.newPlanPrice}
                              </div>
                              <div className="text-4xl font-extrabold text-[#bca142]">
                                ${proration.amountToCharge}
                                <span className="text-lg font-normal text-gray-500">/mo</span>
                              </div>
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                                <div className="text-xs font-semibold text-green-700 mb-1">
                                  💰 Proration Applied
                                </div>
                                <div className="text-xs text-green-600 space-y-1">
                                  <div>Credit from current plan: <span className="font-bold">${proration.unusedValue}</span></div>
                                  <div>Days remaining: <span className="font-bold">{proration.daysRemaining} days</span></div>
                                  <div className="pt-1 border-t border-green-200 font-bold">
                                    You save: ${proration.savings}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-4xl font-extrabold text-black">
                              ${plan.price}
                              <span className="text-lg font-normal text-gray-500">/mo</span>
                            </div>
                          );
                        })()}
                        {planRelation !== 'upgrade' && (
                          <div className="text-4xl font-extrabold text-black">
                            ${plan.price}
                            <span className="text-lg font-normal text-gray-500">/mo</span>
                          </div>
                        )}
                      </div>

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

                      <div className="mt-auto">
                        <div className="mb-6 pt-4 border-t border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-widest text-center space-y-1">
                          <p className='whitespace-nowrap'>Responses: {plan.max_responses === -1 ? 'Unlimited' : plan.max_responses}</p>
                          <p>Support: {plan.priority_support ? 'Priority' : 'Standard'}</p>
                        </div>

                        <button
                          onClick={() => activateSubscription(plan)}
                          disabled={isDisabled}
                          className={`w-full py-4 px-2 rounded-xl font-bold transition-all shadow-md
                            ${isDisabled
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : isProfessional 
                                ? 'bg-[#bca142] text-white hover:bg-black hover:shadow-xl' 
                                : 'bg-black text-white hover:bg-[#bca142]'
                            }`}
                        >
                          {isGuestPlan ? (
                            currentSubscription?.is_guest ? 'Current Plan' : 'Free Plan'
                          ) : planRelation === 'current' ? (
                            'Current Plan'
                          ) : planRelation === 'downgrade' ? (
                            'Downgrade Not Available'
                          ) : planRelation === 'upgrade' ? (
                            'Upgrade Now'
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
