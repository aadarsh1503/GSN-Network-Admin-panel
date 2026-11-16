import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheck, FaCrown, FaRocket, FaGem, FaPaperPlane } from 'react-icons/fa';
import { FiX, FiGlobe } from 'react-icons/fi';
import { useLoading } from '../contexts/LoadingContext';
import { formatSubDate } from '../utils/formatDate';
import { subscriptionAPI, walletAPI, getToken } from '../utils/api';
import PageLoader from '../components/Loader/PageLoader';
import { useCurrency } from '../contexts/CurrencyContext';
import toast from 'react-hot-toast';

/**
 * Public subscriptions page -> /subscriptions
 * This is an independent copy of the company subscriptions page
 * (client/src/companyPages/Subscription/CompanySubscriptionPage.jsx).
 * Editing this file does NOT affect the company page.
 */
const SubscriptionPage = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [rate, setRate] = useState(2.6526);
  const { withLoading } = useLoading();
  const { format, formatUsd, ready, currency, country, countrySource } = useCurrency();

  // BHD is the base currency; amounts are shown in the visitor's local currency
  // with the USD equivalent as a live secondary line.
  const fmtBhd = (v) => format(v);
  const toUsd = (v) => (ready ? `≈ ${formatUsd(v)}` : `≈ $${(Number(v || 0) * rate).toFixed(2)}`);

  useEffect(() => {
    initializePage();
    fetchRate();
    const id = setInterval(fetchRate, 60000);
    return () => clearInterval(id);
  }, []);

  const fetchRate = async () => {
    try {
      const r = await walletAPI.getCurrencyRate();
      const live = Number(r?.bhdToUsd);
      if (live > 0) setRate(live);
    } catch (error) {
      console.error('Error fetching currency rate:', error);
    }
  };

  const initializePage = async () => {
    await withLoading(async () => {
      await Promise.all([fetchPlans(), fetchCurrentSubscription()]);
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

    const now = new Date();
    // Parse dates as LOCAL midnight (not UTC) to avoid timezone-off-by-one-day bugs
    const parseLocalDate = (d) => (d ? new Date(String(d).slice(0, 10) + 'T00:00:00') : null);
    const startDate = parseLocalDate(currentSubscription.start_date);
    const endDate = parseLocalDate(currentSubscription.end_date);

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
      newPlanDurationMonths: parseInt(newPlan.duration_months || 1),
      daysRemaining,
      totalDaysInPeriod,
      unusedValue: unusedValue.toFixed(2),
      amountToCharge: amountToCharge.toFixed(2),
      savings: unusedValue.toFixed(2),
    };
  };

  const getPlanRelation = (plan) => {
    if (!currentSubscription || currentSubscription.is_guest) return 'new';

    const currentPrice = parseFloat(currentSubscription.plan_price || 0);
    const newPrice = parseFloat(plan.price);

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

    if (relation === 'downgrade') {
      toast.error('Downgrading is not available. Please contact support for assistance.', {
        duration: 5000,
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
    }

    navigate('/payment', {
      state: {
        plan: plan,
        prorationDetails: proration,
      },
    });
  };

  const handleLoginRedirect = () => navigate('/login');
  const handleRegisterRedirect = () => navigate('/register');

  const getPlanIcon = (planName) => {
    switch (planName.toLowerCase()) {
      case 'guest':
        return <FaPaperPlane className="text-2xl text-[#bca142]" />;
      case 'professional':
        return <FaGem className="text-3xl text-[#bca142]" />;
      case 'enterprise':
        return <FaRocket className="text-2xl text-black" />;
      default:
        return <FaCrown className="text-2xl text-[#bca142]" />;
    }
  };

  const getPlanColor = (planName) => {
    switch (planName.toLowerCase()) {
      case 'basic':
        return 'border-[#bca142]/40';
      case 'professional':
        return 'border-[#bca142]';
      case 'enterprise':
        return 'border-black';
      default:
        return 'border-gray-200';
    }
  };

  return (
    <PageLoader loading={loading} loadingMessage="Loading subscription plans...">
      <div className="mt-24 bg-gradient-to-b from-white via-[#bca142]/5 to-white">
        <div className="max-w-7xl mx-auto px-4  sm:px-6 lg:px-8">
          {/* ---------- Header ---------- */}
          <div className="text-center top-6 relative mb-12 sm:mb-16">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black mb-4 tracking-tight">
              Choose Your Membership Plan
            </h1>
            <div className="mx-auto mb-5 h-1 w-20 rounded-full bg-gradient-to-r from-[#bca142] to-[#e2c66a]" />
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Unlock the power of our freight forwarding network. Get access to quotes,
              respond to opportunities, and grow your business.
            </p>

            {country && (
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#bca142]/30 bg-white px-4 py-1.5 text-xs font-medium text-gray-600 shadow-sm">
                <FiGlobe className="text-[#bca142]" />
                <span>
                  Prices shown in <span className="font-bold text-black">{currency}</span>
                  {countrySource === 'geo'
                    ? <> · location detected: <span className="font-bold text-black">{country}</span></>
                    : <> · your country: <span className="font-bold text-black">{country}</span></>}
                </span>
              </div>
            )}
          </div>

          {/* ---------- Current Subscription Info ---------- */}
          {currentSubscription && !currentSubscription.is_guest && (
            <div className="relative mb-12 overflow-hidden rounded-3xl border border-[#bca142]/30 bg-white p-6 sm:p-7 shadow-[0_10px_40px_-18px_rgba(188,161,66,0.45)]">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#bca142] via-[#e2c66a] to-[#bca142]" />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#bca142] text-white shadow-[0_8px_20px_-8px_rgba(188,161,66,0.9)]">
                    <FaCrown className="text-xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black">Current Subscription</h3>
                    <p className="text-gray-600">
                      <span className="font-semibold text-[#bca142]">
                        {currentSubscription.plan_name}
                      </span>
                      {' • '}
                      <span className="text-sm">
                        {currentSubscription.end_date &&
                          (() => {
                            const endDate = new Date(
                              String(currentSubscription.end_date).slice(0, 10) + 'T00:00:00'
                            );
                            const now = new Date();
                            const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                            return daysLeft > 0 ? `${daysLeft} days remaining` : 'Expired';
                          })()}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="sm:text-right">
                  <div className="text-2xl font-bold leading-tight break-words text-black">
                    {fmtBhd(currentSubscription.plan_price)}
                    <span className="text-sm font-normal text-gray-500">/mo</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {toUsd(currentSubscription.plan_price)} · Expires:{' '}
                    {currentSubscription.end_date && formatSubDate(currentSubscription.end_date)}
                  </div>
                </div>
              </div>

              {/* Upgrade Info */}
              <div className="mt-5 rounded-2xl border border-[#bca142]/20 bg-[#bca142]/5 p-4">
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-[#bca142] font-bold">💡</span>
                  <div>
                    <span className="font-semibold">Upgrade anytime:</span> When you upgrade, we'll
                    credit your unused time towards the new plan.
                    <span className="font-semibold text-[#bca142]"> No money wasted!</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------- Plans Grid ---------- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {plans && plans.length > 0 ? (
              plans.map((plan) => {
                const isProfessional = plan.name.toLowerCase() === 'professional';
                const isGuestPlan =
                  plan.name.toLowerCase() === 'guest' || parseFloat(plan.price) === 0;
                const planRelation = getPlanRelation(plan);

                // Guest plan is always disabled and shows as current if user is on guest
                const isDisabled =
                  isGuestPlan || planRelation === 'current' || planRelation === 'downgrade';
                const features = Array.isArray(plan.features) ? plan.features : [];
                const isHighlighted = isProfessional && !isGuestPlan;

                // Only one badge is shown per card so labels never overlap
                const badge =
                  planRelation === 'current' ||
                  (isGuestPlan && currentSubscription?.is_guest)
                    ? {
                        text: 'Current Plan',
                        cls: 'border border-[#bca142] bg-white text-[#bca142]',
                      }
                    : planRelation === 'upgrade' && !isGuestPlan
                    ? { text: 'Upgrade', cls: 'bg-[#bca142] text-white' }
                    : planRelation === 'downgrade' && !isGuestPlan
                    ? { text: 'Not Available', cls: 'bg-gray-400 text-white' }
                    : isProfessional && !isGuestPlan
                    ? { text: 'Most Popular', cls: 'bg-[#bca142] text-white' }
                    : null;

                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col overflow-hidden rounded-3xl border-2 bg-white transition-all duration-300
                               ${getPlanColor(plan.name)}
                               ${
                                 isHighlighted
                                   ? 'z-10 shadow-[0_22px_50px_-20px_rgba(188,161,66,0.55)]'
                                   : 'shadow-[0_6px_24px_-16px_rgba(0,0,0,0.35)] hover:-translate-y-1 hover:shadow-[0_18px_40px_-20px_rgba(0,0,0,0.35)]'
                               }
                               ${isGuestPlan || planRelation === 'downgrade' ? 'opacity-60' : ''}`}
                  >
                    {isHighlighted && (
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#bca142] via-[#e2c66a] to-[#bca142]" />
                    )}

                    {badge && (
                      <div className="absolute top-4 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap">
                        <span
                          className={`rounded-full px-4 py-1 text-[11px] font-bold uppercase tracking-wider shadow-md ${badge.cls}`}
                        >
                          {badge.text}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-grow flex-col p-6 pt-12">
                      <div className="text-center mb-6">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#bca142]/10 ring-1 ring-[#bca142]/20">
                          {getPlanIcon(plan.name)}
                        </div>
                        <h3
                          className={`text-xl font-bold uppercase tracking-wide ${
                            isProfessional ? 'text-[#bca142]' : 'text-black'
                          }`}
                        >
                          {plan.name}
                        </h3>
                        <p className="text-gray-500 mt-2 text-sm min-h-[40px] leading-relaxed">
                          {plan.description}
                        </p>
                      </div>

                      <div className="text-center mb-6">
                        {planRelation === 'upgrade' &&
                          (() => {
                            const proration = calculateProration(plan);
                            return proration ? (
                              <div className="space-y-2">
                                <div className="text-sm text-gray-400 line-through break-words">
                                  Original: {fmtBhd(proration.newPlanPrice)}
                                </div>
                                <div className="text-2xl sm:text-3xl font-extrabold leading-tight break-words text-[#bca142]">
                                  {fmtBhd(proration.amountToCharge)}
                                  <span className="text-lg font-normal text-gray-500">/mo</span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {toUsd(proration.amountToCharge)}
                                </div>
                                <div className="mt-3 rounded-2xl border border-green-200 bg-green-50 p-3">
                                  <div className="text-xs font-semibold text-green-700 mb-1">
                                    💰 Proration Applied
                                  </div>
                                  <div className="text-xs text-green-600 space-y-1 break-words">
                                    <div>
                                      Credit from current plan:{' '}
                                      <span className="font-bold">
                                        {fmtBhd(proration.unusedValue)}
                                      </span>
                                    </div>
                                    <div>
                                      Days remaining:{' '}
                                      <span className="font-bold">
                                        {proration.daysRemaining} days
                                      </span>
                                    </div>
                                    <div className="pt-1 border-t border-green-200 font-bold">
                                      You save: {fmtBhd(proration.savings)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-2xl sm:text-3xl font-extrabold leading-tight break-words text-black">
                                {fmtBhd(plan.price)}
                                <span className="text-lg font-normal text-gray-500">/mo</span>
                              </div>
                            );
                          })()}
                        {planRelation !== 'upgrade' && (
                          <div className="text-2xl sm:text-3xl font-extrabold leading-tight break-words text-black">
                            {fmtBhd(plan.price)}
                            <span className="text-lg font-normal text-gray-500">/mo</span>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">{toUsd(plan.price)}</div>
                      </div>

                      <div className="mb-8 flex-grow">
                        <ul className="space-y-3.5">
                          {features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#bca142]/10">
                                <FaCheck className="text-[10px] text-[#bca142]" />
                              </span>
                              <span className="text-sm leading-snug text-gray-700">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-auto">
                        <div className="mb-6 space-y-1 border-t border-gray-100 pt-4 text-center text-xs font-bold uppercase tracking-widest text-gray-500">
                          <p className="whitespace-nowrap">
                            Responses: {plan.max_responses === -1 ? 'Unlimited' : plan.max_responses}
                          </p>
                          <p>Support: {plan.priority_support ? 'Priority' : 'Standard'}</p>
                        </div>

                        <button
                          onClick={() => activateSubscription(plan)}
                          disabled={isDisabled}
                          className={`w-full rounded-xl py-3.5 px-3 text-sm font-bold tracking-wide transition-all duration-200
                            ${
                              isDisabled
                                ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                                : isProfessional
                                ? 'bg-gradient-to-r from-[#bca142] to-[#a8892f] text-white shadow-[0_10px_24px_-10px_rgba(188,161,66,0.9)] hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-10px_rgba(188,161,66,1)]'
                                : 'bg-black text-white hover:-translate-y-0.5 hover:bg-[#bca142] hover:shadow-[0_10px_24px_-12px_rgba(0,0,0,0.6)]'
                            }`}
                        >
                          {isGuestPlan
                            ? currentSubscription?.is_guest
                              ? 'Current Plan'
                              : 'Free Plan'
                            : planRelation === 'current'
                            ? 'Current Plan'
                            : planRelation === 'downgrade'
                            ? 'Downgrade Not Available'
                            : planRelation === 'upgrade'
                            ? 'Upgrade Now'
                            : 'Subscribe for Membership'}
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

          {/* ---------- Steps ---------- */}
          <div className="mt-20 mb-6 rounded-3xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-8 sm:p-12">
            <h2 className="mb-10 text-center text-2xl font-bold text-black">
              Step-by-Step Activation
            </h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { step: 1, title: 'Choose Plan', desc: 'Select the best plan for your team.' },
                { step: 2, title: 'Bank Payment', desc: 'Securely transfer via bank details.' },
                { step: 3, title: 'Upload Proof', desc: 'Submit receipt via your dashboard.' },
                { step: 4, title: 'Instant Access', desc: 'Admin verifies and activates.' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#bca142] text-lg font-bold text-white shadow-[0_10px_22px_-10px_rgba(188,161,66,0.95)] ring-4 ring-[#bca142]/10">
                    {item.step}
                  </div>
                  <h3 className="mb-1.5 font-bold text-black">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-2xl">
              <div className="p-6 sm:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-[#bca142]">Login Required</h2>
                  <button
                    onClick={() => setShowLoginModal(false)}
                    className="rounded-full p-2 transition-colors hover:bg-gray-100"
                  >
                    <FiX className="text-2xl text-gray-400" />
                  </button>
                </div>
                <div className="text-center mb-8">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#bca142]/10 ring-1 ring-[#bca142]/20">
                    <FaCrown className="text-3xl text-[#bca142]" />
                  </div>
                  <p className="text-gray-600 font-medium">
                    Please login to choose a membership plan and grow your business.
                  </p>
                </div>
                <div className="space-y-4">
                  <button
                    onClick={handleLoginRedirect}
                    className="w-full rounded-xl bg-gradient-to-r from-[#bca142] to-[#a8892f] py-4 font-bold text-white shadow-[0_10px_24px_-10px_rgba(188,161,66,0.9)] transition-all hover:-translate-y-0.5"
                  >
                    Login to Your Account
                  </button>
                  <button
                    onClick={handleRegisterRedirect}
                    className="w-full rounded-xl border-2 border-[#bca142] py-4 font-bold text-[#bca142] transition-all hover:bg-[#bca142] hover:text-white"
                  >
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
