import { useState, useEffect } from 'react';
import { FaCheck, FaCrown, FaStar, FaRocket } from 'react-icons/fa';
import { FiX, FiCreditCard, FiCheck as FiCheckIcon, FiUpload, FiInfo } from 'react-icons/fi';
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

  const [showBankTransferModal, setShowBankTransferModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [bankDetails, setBankDetails] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const activateSubscription = async (planId) => {
    try {
      setActivating(planId);
      
      // Find the selected plan
      const plan = plans.find(p => p.id === planId);
      if (!plan) {
        throw new Error('Plan not found');
      }

      setSelectedPlan(plan);
      
      // Fetch bank details for payment
      const bankData = await subscriptionAPI.getBankDetails();
      setBankDetails(bankData);
      
      setShowBankTransferModal(true);
      
    } catch (error) {
      console.error('Error preparing subscription:', error);
      alert(error.message || 'Error preparing subscription. Please try again.');
    } finally {
      setActivating(null);
    }
  };

  const handleBankTransferSubmit = async () => {
    if (!paymentProof || !transactionId.trim()) {
      alert('Please upload payment proof and enter transaction ID');
      return;
    }

    try {
      setSubmittingRequest(true);
      
      const formData = new FormData();
      formData.append('planId', selectedPlan.id);
      formData.append('transactionId', transactionId);
      formData.append('paymentProof', paymentProof);
      formData.append('paymentMethod', 'bank_transfer');
      
      const response = await subscriptionAPI.submitBankTransferRequest(formData);
      
      if (response) {
        alert(`🎉 Subscription request submitted successfully!\n\nPlan: ${selectedPlan.name}\nTransaction ID: ${transactionId}\n\nYour request has been sent to admin for verification. You will be notified once approved.`);
        
        setShowBankTransferModal(false);
        setSelectedPlan(null);
        setPaymentProof(null);
        setTransactionId('');
        
        // Refresh the page data
        await Promise.all([
          fetchPlans(),
          fetchCurrentSubscription()
        ]);
      }
      
    } catch (error) {
      console.error('Error submitting bank transfer request:', error);
      alert(error.message || 'Error submitting request. Please try again.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleBankDetailsClose = () => {
    // No longer needed - keeping for compatibility
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
                      <InlineLoader size="small" message="Preparing..." />
                    ) : currentSubscription && currentSubscription.plan_name === plan.name ? (
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
              <h3 className="font-semibold mb-2">Make Bank Payment</h3>
              <p className="text-gray-600">Transfer payment to our bank account using the provided details</p>
            </div>
            <div className="text-center">
              <div className="bg-[#CDA435] text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">Upload Payment Proof</h3>
              <p className="text-gray-600">Upload your payment receipt with transaction ID for verification</p>
            </div>
            <div className="text-center">
              <div className="bg-[#CDA435] text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                4
              </div>
              <h3 className="font-semibold mb-2">Admin Approval</h3>
              <p className="text-gray-600">Our admin will verify your payment and activate your subscription</p>
            </div>
          </div>
          
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <FaCheck className="text-blue-500 text-xl" />
              <h3 className="text-lg font-semibold text-blue-800">Bank Transfer Payment</h3>
            </div>
            <p className="text-blue-700">
              All subscriptions require bank transfer payment for verification. After selecting a plan, you'll receive our bank details to complete the payment and upload proof for admin approval.
            </p>
          </div>
        </div>
      </div>

      {/* Bank Transfer Modal */}
      {showBankTransferModal && selectedPlan && bankDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-[#CDA435] to-[#D9B95B] bg-clip-text text-transparent">
                    Bank Transfer Payment
                  </h2>
                  <p className="text-gray-600 mt-2">Complete your {selectedPlan.name} subscription</p>
                </div>
                <button
                  onClick={() => setShowBankTransferModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <FiX className="text-2xl text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bank Details Section */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                  <h3 className="text-xl font-bold text-blue-800 mb-6 flex items-center gap-3">
                    <FiCreditCard className="text-2xl" />
                    Bank Account Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Bank Name</label>
                      <p className="text-lg font-bold text-gray-900">{bankDetails.bank_name}</p>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Bank Holder Name</label>
                      <p className="text-lg font-bold text-gray-900">{bankDetails.account_holder_name}</p>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Account Number</label>
                      <p className="text-lg font-mono font-bold text-gray-900">{bankDetails.account_number}</p>
                    </div>
                    
                    {bankDetails.iban_number && (
                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">IBAN Number</label>
                        <p className="text-lg font-mono font-bold text-gray-900">{bankDetails.iban_number}</p>
                      </div>
                    )}
                    
                    {bankDetails.branch_name && (
                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Branch Name</label>
                        <p className="text-lg font-bold text-gray-900">{bankDetails.branch_name}</p>
                      </div>
                    )}

                    {bankDetails.swift_code && (
                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          SWIFT Code
                          <span className="text-xs text-blue-600 ml-2">(International Transfers)</span>
                        </label>
                        <p className="text-lg font-mono font-bold text-gray-900">{bankDetails.swift_code}</p>
                      </div>
                    )}
                  </div>

                  {bankDetails.payment_instructions && (
                    <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <h4 className="font-semibold text-yellow-800 mb-2">Payment Instructions</h4>
                      <p className="text-yellow-700 text-sm">{bankDetails.payment_instructions}</p>
                    </div>
                  )}

                  {/* Country-specific disclaimer */}
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      <FiInfo className="text-blue-600" />
                      Important Note
                    </h4>
                    <div className="text-blue-700 text-sm space-y-2">
                      <p>
                        Please use the IBAN number for all bank transfers.
                      </p>
                      <p>
                        Please ensure all bank details are entered correctly to avoid payment delays.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Form Section */}
                <div>
                  <div className="bg-gradient-to-br from-[#CDA435]/10 to-[#D9B95B]/10 rounded-2xl p-6 border border-[#CDA435]/20 mb-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Subscription Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Plan:</span>
                        <span className="font-semibold text-[#CDA435]">{selectedPlan.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-semibold">{selectedPlan.duration_months} months</span>
                      </div>
                      <div className="flex justify-between text-lg">
                        <span className="text-gray-600">Amount to Pay:</span>
                        <span className="font-bold text-green-600">${selectedPlan.price}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Transaction ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-200"
                        placeholder="Enter your bank transaction ID"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter the transaction reference number from your bank transfer receipt
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Payment Proof (Receipt Image) *
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#CDA435] transition-colors">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              // Validate file type - Only allow JPG, JPEG, and PNG files
                              const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                              const allowedExtensions = ['.jpg', '.jpeg', '.png'];
                              
                              // Check MIME type
                              if (!allowedTypes.includes(file.type.toLowerCase())) {
                                alert('Please upload only JPG, JPEG, or PNG image files');
                                e.target.value = ''; // Clear the input
                                return;
                              }

                              // Double-check file extension as backup validation
                              const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
                              if (!allowedExtensions.includes(fileExtension)) {
                                alert('Please upload only JPG, JPEG, or PNG image files');
                                e.target.value = ''; // Clear the input
                                return;
                              }

                              // Validate file size (max 10MB)
                              if (file.size > 10 * 1024 * 1024) {
                                alert('File size must be less than 10MB');
                                e.target.value = ''; // Clear the input
                                return;
                              }

                              setPaymentProof(file);
                            }
                          }}
                          className="hidden"
                          id="paymentProof"
                        />
                        <label htmlFor="paymentProof" className="cursor-pointer">
                          {paymentProof ? (
                            <div className="text-green-600">
                              <FiCheckIcon className="text-3xl mx-auto mb-2" />
                              <p className="font-semibold">{paymentProof.name}</p>
                              <p className="text-sm text-gray-500">Click to change</p>
                            </div>
                          ) : (
                            <div className="text-gray-500">
                              <FiUpload className="text-3xl mx-auto mb-2" />
                              <p className="font-semibold">Upload Payment Receipt</p>
                              <p className="text-sm">JPG, JPEG, PNG only (Max 10MB)</p>
                            </div>
                          )}
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Upload a clear image of your bank transfer receipt showing the transaction details
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">Next Steps:</h4>
                      <ol className="text-blue-700 text-sm space-y-1">
                        <li>1. Make the payment to the above bank account</li>
                        <li>2. Upload your payment receipt image</li>
                        <li>3. Enter the transaction ID from your receipt</li>
                        <li>4. Submit for admin verification</li>
                        <li>5. You'll be notified once approved</li>
                      </ol>
                    </div>

                    <div className="flex gap-4 pt-6">
                      <button
                        type="button"
                        onClick={() => setShowBankTransferModal(false)}
                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleBankTransferSubmit}
                        disabled={submittingRequest || !paymentProof || !transactionId.trim()}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-[#CDA435] to-[#D9B95B] text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submittingRequest ? (
                          <InlineLoader size="small" message="Submitting..." />
                        ) : (
                          'Submit for Verification'
                        )}
                      </button>
                    </div>
                  </div>
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