import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  FiDollarSign, FiEye, FiCheck, FiX, FiUser, FiMail, FiPhone,
  FiMapPin, FiTruck, FiCalendar, FiFileText, FiCreditCard,
  FiImage, FiDownload, FiAlertCircle, FiCheckCircle, FiClock, FiGlobe
} from 'react-icons/fi';
import api from '../../utils/api';
import './PaymentManagement.css';

const PaymentManagement = () => {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      // Use enhanced API to get company's payment verifications
      const response = await api.get('/api/enhanced-quotes/company-responses-with-payments');
      
      // Filter for payment proofs that need verification (regardless of acceptance status)
      const pendingPayments = response.filter(item => {
        const hasPaymentProof = item.payment_proof_uploaded === 1 || item.payment_proof_url;
        const needsVerification = !item.payment_status || item.payment_status === 'pending' || item.payment_status === null;
        return hasPaymentProof && needsVerification;
      });
      
      setPendingPayments(pendingPayments || []);
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      toast.error('Failed to fetch pending payments: ' + error.message);
      setPendingPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (paymentVerificationId, status, notes = '') => {
    try {
      if (!paymentVerificationId) {
        toast.error('Payment verification ID is missing');
        return;
      }

      setIsProcessing(true);

      await api.put(`/api/payments/verify-enhanced/${paymentVerificationId}`, {
        verification_status: status,
        company_notes: notes
      });
      
      toast.success(`Payment ${status === 'verified' ? 'verified' : 'rejected'} successfully`);
      fetchPendingPayments();
      setShowModal(false);
      setShowRejectionModal(false);
      setSelectedPayment(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Failed to verify payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageClick = (imageUrl) => {
    if (imageUrl) {
      const newWindow = window.open(imageUrl, '_blank');
      if (!newWindow) {
        // Fallback: try to open in same tab
        window.location.href = imageUrl;
      }
    }
  };

  const openPaymentModal = (payment) => {
    setSelectedPayment(payment);
    setShowModal(true);
  };

  const handleRejectClick = () => {
    setShowModal(false);
    setShowRejectionModal(true);
  };

  const handleRejectConfirm = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    handleVerifyPayment(selectedPayment.payment_verification_id, 'rejected', rejectionReason);
  };

  const handleCancelRejection = () => {
    setShowRejectionModal(false);
    setRejectionReason('');
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#bca142] mx-auto mb-4"></div>
          <p className="text-xl text-black">Loading pending payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-200">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-[#bca142] mb-4">
              Payment Management
            </h1>
            <p className="text-black text-lg">
              Verify and manage customer payments for your quotes
            </p>
            <div className="mt-6 flex items-center justify-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#bca142] rounded-full"></div>
                <span className="text-sm text-black">Pending Verification</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-black rounded-full"></div>
                <span className="text-sm text-black">Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-black">Rejected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payments Grid */}
        {!Array.isArray(pendingPayments) || pendingPayments.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-6 bg-[#bca142] rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <FiDollarSign className="text-4xl text-white" />
            </div>
            <h3 className="text-2xl font-bold text-black mb-2">No Pending Payments</h3>
            <p className="text-gray-600 mb-6">All payments have been processed or no payments are awaiting verification</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {pendingPayments.map((payment) => (
              <div
                key={payment.id}
                className="relative bg-white rounded-2xl shadow-xl border-2 border-gray-200 hover:border-[#bca142] transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                    payment.payment_status === 'verified' 
                      ? 'bg-black text-white' 
                      : payment.payment_status === 'rejected'
                      ? 'bg-gray-400 text-white'
                      : 'bg-[#bca142] text-white'
                  }`}>
                    {payment.payment_status === 'verified' ? (
                      <FiCheckCircle className="text-xs" />
                    ) : payment.payment_status === 'rejected' ? (
                      <FiX className="text-xs" />
                    ) : (
                      <FiClock className="text-xs" />
                    )}
                    {payment.payment_status || 'Pending'}
                  </div>
                </div>

                <div className="p-6">
                  {/* Quote Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-[#bca142] rounded-xl text-white">
                      <FiFileText className="text-xl" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-black">Quote #{payment.quote_id}</h3>
                      <p className="text-gray-600">${payment.price}</p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <FiUser className="text-[#bca142] text-lg" />
                      <div>
                        <p className="text-sm text-gray-500">Customer</p>
                        <p className="font-medium text-black">{payment.user_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <FiMail className="text-[#bca142] text-lg" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-black text-sm">{payment.user_email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <FiMapPin className="text-[#bca142] text-lg" />
                      <div>
                        <p className="text-sm text-gray-500">Route</p>
                        <p className="font-medium text-black">{payment.departure_country} → {payment.arrival_country}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <FiTruck className="text-[#bca142] text-lg" />
                      <div>
                        <p className="text-sm text-gray-500">Service</p>
                        <p className="font-medium text-black text-sm">{payment.product_description}</p>
                      </div>
                    </div>

                    {payment.payment_proof_date && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <FiCalendar className="text-[#bca142] text-lg" />
                        <div>
                          <p className="text-sm text-gray-500">Payment Date</p>
                          <p className="font-medium text-black">{new Date(payment.payment_proof_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment Proof Thumbnail */}
                  {payment.payment_proof_url && (
                    <div className="mb-6">
                      <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <FiImage className="text-[#bca142]" />
                        Payment Proof
                      </p>
                      <div className="relative group">
                        <img 
                          src={payment.payment_proof_url} 
                          alt="Payment proof" 
                          className="w-full h-32 object-cover rounded-xl border-2 border-gray-200 group-hover:border-[#bca142] transition-colors cursor-pointer"
                          onClick={() => handleImageClick(payment.payment_proof_url)}
                        />
                        <div 
                          className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                          onClick={() => handleImageClick(payment.payment_proof_url)}
                        >
                          <FiEye className="text-white opacity-0 group-hover:opacity-100 text-2xl transition-opacity" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quote Status */}
                  <div className="mb-6">
                    <div className={`p-3 rounded-xl border-2 ${
                      payment.user_response_status === 'accepted' 
                        ? 'bg-black text-white border-black' 
                        : payment.user_response_status === 'rejected'
                        ? 'bg-gray-400 text-white border-gray-400'
                        : 'bg-[#bca142] text-white border-[#bca142]'
                    }`}>
                      <div className="flex items-center gap-2">
                        {payment.user_response_status === 'accepted' ? (
                          <FiCheckCircle className="text-white" />
                        ) : payment.user_response_status === 'rejected' ? (
                          <FiX className="text-white" />
                        ) : (
                          <FiAlertCircle className="text-white" />
                        )}
                        <p className="text-sm font-medium text-white">
                          {payment.user_response_status === 'accepted' ? 'Quote Accepted' : 
                           payment.user_response_status === 'rejected' ? 'Quote Rejected' : 
                           'Payment Uploaded - Awaiting Quote Acceptance'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button 
                    className="w-full px-6 py-3 bg-[#bca142] text-white font-semibold rounded-xl hover:bg-[#a89139] hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                    onClick={() => openPaymentModal(payment)}
                  >
                    <FiEye className="text-lg" />
                    Review Payment
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Verification Modal */}
      {showModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-[#bca142]">
                  Verify Payment - Quote #{selectedPayment.quote_id}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <FiX className="text-2xl text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Customer & Quote Details */}
                <div className="space-y-6">
                  {/* Customer Information */}
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                      <FiUser className="text-[#bca142]" />
                      Customer Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <FiUser className="text-[#bca142]" />
                        <div>
                          <p className="text-sm text-gray-600">Name</p>
                          <p className="font-medium text-black">{selectedPayment.user_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FiMail className="text-[#bca142]" />
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium text-black">{selectedPayment.user_email}</p>
                        </div>
                      </div>
                      {selectedPayment.user_phone && (
                        <div className="flex items-center gap-3">
                          <FiPhone className="text-[#bca142]" />
                          <div>
                            <p className="text-sm text-gray-600">Phone</p>
                            <p className="font-medium text-black">{selectedPayment.user_phone}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quote Details */}
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                      <FiFileText className="text-[#bca142]" />
                      Quote Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <FiDollarSign className="text-[#bca142]" />
                        <div>
                          <p className="text-sm text-gray-600">Amount</p>
                          <p className="font-bold text-black text-xl">${selectedPayment.price}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FiTruck className="text-[#bca142]" />
                        <div>
                          <p className="text-sm text-gray-600">Service</p>
                          <p className="font-medium text-black">{selectedPayment.product_description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FiMapPin className="text-[#bca142]" />
                        <div>
                          <p className="text-sm text-gray-600">Route</p>
                          <p className="font-medium text-black">{selectedPayment.departure_country} → {selectedPayment.arrival_country}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FiTruck className="text-[#bca142]" />
                        <div>
                          <p className="text-sm text-gray-600">Shipping Mode</p>
                          <p className="font-medium text-black">{selectedPayment.shipping_mode}</p>
                        </div>
                      </div>
                      {selectedPayment.payment_proof_date && (
                        <div className="flex items-center gap-3">
                          <FiCalendar className="text-[#bca142]" />
                          <div>
                            <p className="text-sm text-gray-600">Payment Date</p>
                            <p className="font-medium text-black">{new Date(selectedPayment.payment_proof_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Notes */}
                  {selectedPayment.payment_notes && (
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                      <h3 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                        <FiFileText className="text-[#bca142]" />
                        Payment Notes
                      </h3>
                      <p className="text-black leading-relaxed">{selectedPayment.payment_notes}</p>
                    </div>
                  )}
                </div>

                {/* Right Column - Payment Proof & Bank Details */}
                <div className="space-y-6">
                  {/* Payment Proof */}
                  {selectedPayment.payment_proof_url && (
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                      <h3 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                        <FiImage className="text-[#bca142]" />
                        Payment Proof
                      </h3>
                      <div className="relative group">
                        <img 
                          src={selectedPayment.payment_proof_url} 
                          alt="Payment proof" 
                          className="w-full h-64 object-cover rounded-xl border-2 border-gray-200 group-hover:border-[#bca142] transition-colors cursor-pointer"
                          onClick={() => handleImageClick(selectedPayment.payment_proof_url)}
                        />
                        <div 
                          className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                          onClick={() => handleImageClick(selectedPayment.payment_proof_url)}
                        >
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-white/90 px-4 py-2 rounded-lg">
                            <FiDownload className="text-[#bca142]" />
                            <span className="text-[#bca142] font-medium">View Full Size</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bank Details Used */}
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                      <FiCreditCard className="text-[#bca142]" />
                      Bank Details Used
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <FiCreditCard className="text-[#bca142]" />
                        <div>
                          <p className="text-sm text-gray-600">Bank Name</p>
                          <p className="font-medium text-black">{selectedPayment.bank_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FiUser className="text-[#bca142]" />
                        <div>
                          <p className="text-sm text-gray-600">Bank Holder Name</p>
                          <p className="font-medium text-black">{selectedPayment.account_holder_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FiCreditCard className="text-[#bca142]" />
                        <div>
                          <p className="text-sm text-gray-600">Account Number</p>
                          <p className="font-mono font-medium text-black">{selectedPayment.account_number}</p>
                        </div>
                      </div>
                      {selectedPayment.iban_number && (
                        <div className="flex items-center gap-3">
                          <FiGlobe className="text-[#bca142]" />
                          <div>
                            <p className="text-sm text-gray-600">IBAN Number</p>
                            <p className="font-mono font-medium text-black">{selectedPayment.iban_number}</p>
                          </div>
                        </div>
                      )}
                      {selectedPayment.swift_code && (
                        <div className="flex items-center gap-3">
                          <FiGlobe className="text-[#bca142]" />
                          <div>
                            <p className="text-sm text-gray-600">SWIFT Code</p>
                            <p className="font-mono font-medium text-black">{selectedPayment.swift_code}</p>
                          </div>
                        </div>
                      )}
                      {selectedPayment.branch_name && (
                        <div className="flex items-center gap-3">
                          <FiMapPin className="text-[#bca142]" />
                          <div>
                            <p className="text-sm text-gray-600">Branch Name</p>
                            <p className="font-medium text-black">{selectedPayment.branch_name}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification Actions */}
              <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
                <button 
                  className="flex-1 px-6 py-4 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleVerifyPayment(selectedPayment.payment_verification_id, 'verified')}
                  disabled={isProcessing}
                >
                  <FiCheck className="text-xl" />
                  {isProcessing ? 'Processing...' : 'Verify Payment'}
                </button>
                <button 
                  className="flex-1 px-6 py-4 bg-gray-400 text-white font-semibold rounded-xl hover:bg-gray-500 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleRejectClick}
                  disabled={isProcessing}
                >
                  <FiX className="text-xl" />
                  Reject Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectionModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="p-8">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-black">
                  Reject Payment - Quote #{selectedPayment.quote_id}
                </h2>
                <button
                  onClick={handleCancelRejection}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  disabled={isProcessing}
                >
                  <FiX className="text-2xl text-gray-500" />
                </button>
              </div>

              {/* Warning */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <FiAlertCircle className="text-[#bca142] text-xl flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-black">Important Notice</h3>
                    <p className="text-gray-700 text-sm mt-1">
                      Rejecting this payment will notify the customer, admin, and prevent work from starting. 
                      Please provide a clear reason to help resolve any issues.
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-black mb-2">Customer: {selectedPayment.user_name}</h3>
                <p className="text-gray-600 text-sm">Amount: ${selectedPayment.price}</p>
                <p className="text-gray-600 text-sm">Email: {selectedPayment.user_email}</p>
              </div>

              {/* Rejection Reason */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-black mb-2">
                  Reason for Rejection *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#bca142] focus:border-[#bca142] resize-none"
                  placeholder="Please explain why you're rejecting this payment proof. Be specific to help the customer understand and resolve the issue..."
                  disabled={isProcessing}
                />
                <p className="text-sm text-gray-500 mt-2">
                  This reason will be sent to the customer, admin, and included in all email notifications.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleCancelRejection}
                  className="flex-1 px-6 py-3 border border-gray-300 text-black font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectConfirm}
                  className="flex-1 px-6 py-3 bg-gray-400 text-white font-semibold rounded-xl hover:bg-gray-500 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={isProcessing || !rejectionReason.trim()}
                >
                  <FiX className="text-lg" />
                  {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;