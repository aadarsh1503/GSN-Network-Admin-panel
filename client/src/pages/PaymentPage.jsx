import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaPaypal, FaUniversity, FaArrowLeft } from 'react-icons/fa';
import { FiAlertCircle } from 'react-icons/fi';
import { subscriptionAPI } from '../utils/api';
import toast from 'react-hot-toast';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { plan, prorationDetails } = location.state || {};
  
  // Debug logging
  useEffect(() => {
    console.log('🔍 PaymentPage Debug:');
    console.log('Plan:', plan);
    console.log('Proration Details:', prorationDetails);
    console.log('Amount to charge:', prorationDetails?.amountToCharge || plan?.price);
  }, [plan, prorationDetails]);
  
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [bankDetails, setBankDetails] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [checkingPending, setCheckingPending] = useState(true);
  const paypalRef = useRef(null);

  const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

  useEffect(() => {
    if (!plan) {
      navigate('/subscription');
      return;
    }
    loadPayPalScript();
    fetchBankDetails();
    checkPendingRequest();
  }, [plan, navigate]);

  useEffect(() => {
    // Wait for all conditions to be ready
    if (paypalLoaded && paymentMethod === 'paypal' && plan && !checkingPending && !hasPendingRequest) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        renderPayPalButtons();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [paypalLoaded, paymentMethod, plan, hasPendingRequest, checkingPending, prorationDetails]);

  const loadPayPalScript = () => {
    if (window.paypal) {
      setPaypalLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
    script.async = true;
    script.onload = () => setPaypalLoaded(true);
    script.onerror = () => {
      console.error('Failed to load PayPal SDK');
      toast.error('Failed to load PayPal. Please try bank transfer.');
    };
    document.body.appendChild(script);
  };

  const fetchBankDetails = async () => {
    try {
      const details = await subscriptionAPI.getBankDetails();
      setBankDetails(details);
    } catch (error) {
      console.error('Error fetching bank details:', error);
    }
  };

  const checkPendingRequest = async () => {
    try {
      setCheckingPending(true);
      // Check if user has pending subscription request
      const response = await subscriptionAPI.getMySubscription();
      
      // If there's a pending request, show warning
      if (response && response.pending_request) {
        setHasPendingRequest(true);
        toast.error('You already have a pending subscription request. Please wait for admin approval.', {
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error checking pending request:', error);
    } finally {
      setCheckingPending(false);
    }
  };

  const renderPayPalButtons = () => {
    if (!paypalRef.current || !window.paypal) return;

    paypalRef.current.innerHTML = '';

    const amount = prorationDetails 
      ? prorationDetails.amountToCharge 
      : plan.price;

    window.paypal.Buttons({
      createOrder: async (data, actions) => {
        // Check for pending request BEFORE creating order
        try {
          const response = await subscriptionAPI.getMySubscription();
          if (response && response.pending_request) {
            toast.error('⚠️ You already have a pending subscription request awaiting admin approval. Please wait before submitting a new request.', {
              duration: 10000,
              style: {
                background: '#fee',
                color: '#c00',
                fontWeight: 'bold',
                border: '2px solid #c00'
              }
            });
            // Reject the order creation to prevent payment
            throw new Error('Pending request exists');
          }
        } catch (error) {
          if (error.message === 'Pending request exists') {
            throw error; // Re-throw to prevent order creation
          }
          console.error('Error checking pending request:', error);
        }

        return actions.order.create({
          purchase_units: [{
            description: `${plan.name} Plan - ${plan.duration_months} month(s)`,
            amount: {
              currency_code: 'USD',
              value: amount
            }
          }]
        });
      },
      onApprove: async (data, actions) => {
        try {
          const order = await actions.order.capture();
          await handlePayPalSuccess(order);
        } catch (error) {
          console.error('PayPal capture error:', error);
          toast.error('Payment capture failed. Please contact support.', {
            duration: 10000
          });
        }
      },
      onError: (err) => {
        console.error('PayPal error:', err);
        // Don't show error if it's our pending request check
        if (err && err.message !== 'Pending request exists') {
          toast.error('Payment failed. Please try again or use bank transfer.', {
            duration: 10000
          });
        }
      },
      onCancel: () => {
        toast.info('Payment cancelled');
      },
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'paypal'
      }
    }).render(paypalRef.current);
  };

  const handlePayPalSuccess = async (order) => {
    try {
      const loadingToast = toast.loading('Submitting your subscription request...');
      
      await subscriptionAPI.activateSubscription(
        plan.id, 
        'paypal',
        {
          orderId: order.id,
          payerId: order.payer.payer_id,
          paymentDetails: order,
          prorationApplied: !!prorationDetails,
          prorationDetails: prorationDetails
        }
      );

      toast.dismiss(loadingToast);
      toast.success('✅ Payment successful! Your subscription request has been submitted for admin approval.', {
        duration: 5000
      });
      
      setTimeout(() => {
        navigate('/company/dashboard', { 
          state: { 
            message: 'Your subscription request is pending admin approval. You will be notified once approved.' 
          } 
        });
      }, 2000);
      
    } catch (error) {
      console.error('Subscription activation error:', error);
      
      // Show specific error message
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit subscription request';
      
      if (errorMessage.includes('pending subscription request')) {
        toast.error('⚠️ You already have a pending subscription request awaiting admin approval. Please wait before submitting a new request.', {
          duration: 10000,
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            fontWeight: 'bold',
            border: '2px solid #dc2626',
            fontSize: '14px'
          }
        });
      } else {
        toast.error(`❌ ${errorMessage}`, {
          duration: 10000,
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            fontWeight: 'bold'
          }
        });
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setPaymentProof(file);
    }
  };

  const handleBankTransferSubmit = async (e) => {
    e.preventDefault();
    
    if (hasPendingRequest) {
      toast.error('⚠️ You already have a pending subscription request awaiting admin approval. Please wait before submitting a new request.', {
        duration: 10000,
        style: {
          background: '#fee2e2',
          color: '#991b1b',
          fontWeight: 'bold',
          border: '2px solid #dc2626',
          fontSize: '14px'
        }
      });
      return;
    }
    
    if (!transactionId.trim()) {
      toast.error('❌ Please enter transaction ID', {
        duration: 5000
      });
      return;
    }
    
    if (!paymentProof) {
      toast.error('❌ Please upload payment proof', {
        duration: 5000
      });
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('planId', plan.id);
      formData.append('transactionId', transactionId);
      formData.append('paymentMethod', 'bank_transfer');
      formData.append('paymentProof', paymentProof);
      
      if (prorationDetails) {
        formData.append('prorationApplied', 'true');
        formData.append('prorationDetails', JSON.stringify(prorationDetails));
      }

      await subscriptionAPI.submitBankTransferRequest(formData);
      
      toast.success('✅ Payment proof submitted successfully! Admin will review and approve your subscription.', {
        duration: 5000
      });
      
      setTimeout(() => {
        navigate('/company/dashboard', { 
          state: { 
            message: 'Your subscription request is pending admin approval. You will be notified once approved.' 
          } 
        });
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting payment proof:', error);
      
      // Show specific error message
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit payment proof';
      
      if (errorMessage.includes('pending subscription request')) {
        toast.error('⚠️ You already have a pending subscription request awaiting admin approval. Please wait before submitting a new request.', {
          duration: 10000,
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            fontWeight: 'bold',
            border: '2px solid #dc2626',
            fontSize: '14px'
          }
        });
      } else {
        toast.error(`❌ ${errorMessage}`, {
          duration: 10000,
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            fontWeight: 'bold'
          }
        });
      }
    } finally {
      setUploading(false);
    }
  };

  if (!plan) {
    return null;
  }

  return (
    <div className="min-h-screen mt-32 bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/company/subscriptions')}
          className="flex items-center gap-2 text-gray-600 hover:text-[#bca142] mb-6 transition-colors"
        >
          <FaArrowLeft />
          <span>Back to Plans</span>
        </button>

        {/* Compact Payment Container */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header - Compact */}
          <div className="bg-gradient-to-r from-[#bca142] to-[#d4b55e] p-6">
            <h1 className="text-2xl font-bold text-white mb-2">Complete Your Payment</h1>
            <p className="text-white/90 text-sm">{plan.name} Plan - ${prorationDetails ? prorationDetails.amountToCharge : plan.price}</p>
          </div>

          {/* Proration Alert - Compact */}
          {prorationDetails && (
            <div className="bg-blue-50 border-b border-blue-200 p-4">
              <div className="flex items-start gap-2">
                <FiAlertCircle className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-900">Upgrade Credit Applied</p>
                  <p className="text-blue-700">
                    {prorationDetails.daysRemaining} days remaining. Credit: ${prorationDetails.unusedValue}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Method Tabs - Compact */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setPaymentMethod('paypal')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 font-semibold transition-all ${
                  paymentMethod === 'paypal'
                    ? 'bg-white text-[#bca142] border-b-2 border-[#bca142]'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FaPaypal className="text-xl" />
                <span>PayPal</span>
              </button>
              <button
                onClick={() => setPaymentMethod('bank')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 font-semibold transition-all ${
                  paymentMethod === 'bank'
                    ? 'bg-white text-[#bca142] border-b-2 border-[#bca142]'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FaUniversity className="text-xl" />
                <span>Bank Transfer</span>
              </button>
            </div>
          </div>

          {/* Payment Content - Compact */}
          <div className="p-6">
            {/* Pending Request Warning */}
            {hasPendingRequest && (
              <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <FiAlertCircle className="text-red-500 text-2xl mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-red-900 mb-2">⚠️ Pending Subscription Request</h3>
                    <p className="text-red-800 text-sm mb-2">
                      You already have a pending subscription request awaiting admin approval.
                    </p>
                    <p className="text-red-700 text-sm">
                      <strong>Action Required:</strong> Please wait for the admin to review your current request before submitting a new one. You will receive an email notification once your request is processed.
                    </p>
                    <button
                      onClick={() => navigate('/company/dashboard')}
                      className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            )}

            {checkingPending ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#bca142] mx-auto mb-3"></div>
                <p className="text-gray-600 text-sm">Checking subscription status...</p>
              </div>
            ) : hasPendingRequest ? null : (
              <>
            {paymentMethod === 'paypal' ? (
              <div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm">
                  <p className="text-yellow-800">
                    <strong>Note:</strong> Admin approval required after payment.
                  </p>
                </div>
                {paypalLoaded ? (
                  <div ref={paypalRef} className="w-full max-w-md mx-auto"></div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#bca142] mx-auto mb-3"></div>
                    <p className="text-gray-600 text-sm">Loading PayPal...</p>
                  </div>
                )}
              </div>
            ) : (
              <div>

                {/* Bank Details - Compact Grid */}
                {bankDetails && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <FaUniversity className="text-[#bca142]" />
                      Bank Transfer Details
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Bank Name *</label>
                        <p className="text-gray-900 font-semibold">{bankDetails.bank_name || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Branch Name *</label>
                        <p className="text-gray-900 font-semibold">{bankDetails.branch_name || 'N/A'}</p>
                      </div>
                      
                      {bankDetails.branch_address && (
                        <div className="col-span-2">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Branch Address</label>
                          <p className="text-gray-900 font-semibold">{bankDetails.branch_address}</p>
                        </div>
                      )}
                      
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Account Holder Name *</label>
                        <p className="text-gray-900 font-semibold">{bankDetails.account_holder_name || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Account Number *</label>
                        <p className="text-gray-900 font-semibold ">{bankDetails.account_number || 'N/A'}</p>
                      </div>
                      
                      {bankDetails.ifsc_code && (
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">IFSC Code</label>
                          <p className="text-gray-900 font-semibold ">{bankDetails.ifsc_code}</p>
                        </div>
                      )}
                      
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">IBAN Number *</label>
                        <p className="text-gray-900 font-semibold ">{bankDetails.iban_number || 'Not Available'}</p>
                        <p className="text-xs text-gray-500 mt-1">Required for all bank accounts</p>
                      </div>
                      
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">SWIFT Code *</label>
                        <p className="text-gray-900 font-semibold ">{bankDetails.swift_code || 'Not Available'}</p>
                        <p className="text-xs text-gray-500 mt-1">Required for all transfers</p>
                      </div>
                      
                      <div className="col-span-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Amount to Transfer</label>
                        <p className="text-2xl font-bold text-[#bca142]">
                          ${prorationDetails ? prorationDetails.amountToCharge : plan.price}
                        </p>
                      </div>
                    </div>

                    {/* Payment Instructions */}
                    {bankDetails.payment_instructions && (
                      <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-3">
                        <p className="text-xs font-semibold text-yellow-900 mb-1">Payment Instructions (Optional):</p>
                        <p className="text-xs text-yellow-800">{bankDetails.payment_instructions}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Upload Form - Compact */}
                <form onSubmit={handleBankTransferSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Transaction ID / Reference Number *
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Enter transaction ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bca142] text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Payment Proof (Screenshot/Receipt) *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#bca142] transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="payment-proof"
                        required
                      />
                      <label htmlFor="payment-proof" className="cursor-pointer">
                        <div className="text-3xl text-gray-400 mb-1">📤</div>
                        <p className="text-sm text-gray-600 font-medium">
                          {paymentProof ? paymentProof.name : 'Click to upload'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full py-3 bg-[#bca142] text-white font-bold rounded-lg hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Submitting...
                      </>
                    ) : (
                      <>✓ Submit Payment Proof</>
                    )}
                  </button>
                </form>
              </div>
            )}
            </>
            )}
          </div>
        </div>

        {/* Security Note */}
        <p className="text-center text-xs text-gray-500 mt-4">
          🔒 Your payment information is secure and encrypted
        </p>
      </div>
    </div>
  );
};

export default PaymentPage;
