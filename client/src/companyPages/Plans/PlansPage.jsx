import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FiCheck, FiX, FiUpload, FiDollarSign } from 'react-icons/fi';
import { FaUniversity, FaCheckCircle } from 'react-icons/fa';
import { subscriptionAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const PlansPage = () => {
  const location = useLocation();
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bankDetails, setBankDetails] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [prorationDetails, setProrationDetails] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  
  // Upload form state
  const [transactionId, setTransactionId] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
    fetchBankDetails();
    
    // Check if coming from SubscriptionPage with selected plan
    if (location.state?.selectedPlan) {
      setSelectedPlan(location.state.selectedPlan);
      setProrationDetails(location.state.prorationDetails);
      setShowUploadForm(true);
    }
  }, [location]);

  const fetchData = async () => {
    try {
      const [plansData, subData] = await Promise.all([
        subscriptionAPI.getPlans(),
        subscriptionAPI.getMySubscription()
      ]);
      setPlans(plansData);
      setCurrentSubscription(subData);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBankDetails = async () => {
    try {
      const details = await subscriptionAPI.getBankDetails();
      setBankDetails(details);
    } catch (error) {
      console.error('Error fetching bank details:', error);
    }
  };

  const handleSelectPlan = (plan) => {
    if (plan.price === 0 || plan.price === '0.00') {
      toast.error('You are already on the free plan');
      return;
    }
    setSelectedPlan(plan);
    setShowUploadForm(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setPaymentProof(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!transactionId.trim()) {
      toast.error('Please enter transaction ID');
      return;
    }
    
    if (!paymentProof) {
      toast.error('Please upload payment proof');
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('planId', selectedPlan.id);
      formData.append('transactionId', transactionId);
      formData.append('paymentMethod', 'bank_transfer');
      formData.append('paymentProof', paymentProof);
      
      if (prorationDetails) {
        formData.append('prorationApplied', 'true');
        formData.append('prorationDetails', JSON.stringify(prorationDetails));
      }

      await subscriptionAPI.submitBankTransferRequest(formData);
      
      toast.success('Payment proof submitted successfully! Admin will review and approve your subscription.');
      
      // Reset form
      setTransactionId('');
      setPaymentProof(null);
      setSelectedPlan(null);
      setProrationDetails(null);
      setShowUploadForm(false);
      
      // Refresh data
      await fetchData();
      
    } catch (error) {
      console.error('Error submitting payment proof:', error);
      toast.error(error.response?.data?.message || 'Failed to submit payment proof');
    } finally {
      setUploading(false);
    }
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

        {/* Bank Transfer Upload Form */}
        {showUploadForm && selectedPlan && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">Complete Your Subscription</h2>
              <button
                onClick={() => {
                  setShowUploadForm(false);
                  setSelectedPlan(null);
                  setProrationDetails(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="text-2xl" />
              </button>
            </div>

            {/* Selected Plan Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-black">{selectedPlan.name} Plan</h3>
                  <p className="text-sm text-gray-600">{selectedPlan.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#bca142]">${selectedPlan.price}</p>
                  <p className="text-sm text-gray-500">per month</p>
                </div>
              </div>

              {/* Proration Details */}
              {prorationDetails && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="bg-[#bca142]/10 border border-[#bca142] rounded-lg p-3">
                    <h4 className="font-bold text-black mb-2">Upgrade Credit Applied</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">New Plan Price:</span>
                        <span className="font-semibold">${prorationDetails.newPlanPrice}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Unused Credit:</span>
                        <span className="font-semibold">-${prorationDetails.unusedValue}</span>
                      </div>
                      <div className="border-t border-[#bca142] pt-2 flex justify-between font-bold">
                        <span>Amount to Pay:</span>
                        <span className="text-[#bca142]">${prorationDetails.amountToCharge}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bank Details */}
            {bankDetails && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <FaUniversity className="text-3xl text-blue-600" />
                  <div>
                    <h3 className="text-lg font-bold text-blue-900">Bank Transfer Details</h3>
                    <p className="text-sm text-blue-700">Transfer the amount to the following account</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white rounded-lg p-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Bank Name</label>
                    <p className="text-black font-semibold">{bankDetails.bank_name}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Account Name</label>
                    <p className="text-black font-semibold">{bankDetails.account_name}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Account Number</label>
                    <p className="text-black font-semibold font-mono">{bankDetails.account_number}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">IFSC Code</label>
                    <p className="text-black font-semibold font-mono">{bankDetails.ifsc_code}</p>
                  </div>
                  {bankDetails.swift_code && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">SWIFT Code</label>
                      <p className="text-black font-semibold font-mono">{bankDetails.swift_code}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Amount to Transfer</label>
                    <p className="text-2xl font-bold text-[#bca142]">
                      ${prorationDetails ? prorationDetails.amountToCharge : selectedPlan.price}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Transaction ID / Reference Number *
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter your transaction ID"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bca142]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Payment Proof (Screenshot/Receipt) *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#bca142] transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="payment-proof"
                    required
                  />
                  <label htmlFor="payment-proof" className="cursor-pointer">
                    <FiUpload className="text-4xl text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 font-medium">
                      {paymentProof ? paymentProof.name : 'Click to upload payment proof'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                  </label>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> After submitting, admin will review your payment proof and activate your subscription within 24 hours.
                </p>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-4 bg-[#bca142] text-white font-bold rounded-xl hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <FaCheckCircle />
                    Submit Payment Proof
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Plans Grid */}
        {!showUploadForm && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div 
                key={plan.id} 
                className={`bg-white border rounded-lg p-6 flex flex-col text-center shadow-sm hover:shadow-lg transition-shadow duration-300 ${
                  isCurrentPlan(plan) ? 'border-[#bca142] border-2' : 'border-gray-200'
                }`}
              >
                {isCurrentPlan(plan) && (
                  <div className="bg-[#bca142] text-white text-xs font-bold py-1 px-3 rounded-full self-center -mt-9 mb-4">
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
                      : 'bg-[#bca142] text-white hover:bg-opacity-90'
                  }`}
                >
                  {isCurrentPlan(plan) ? 'Current Plan' : plan.price === 0 || plan.price === '0.00' ? 'Free Plan' : 'Upgrade Now'}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Need a custom plan? <a href="/company/create-Ticket" className="text-[#bca142] hover:underline">Contact us</a></p>
        </div>
      </div>
    </div>
  );
};

export default PlansPage;
