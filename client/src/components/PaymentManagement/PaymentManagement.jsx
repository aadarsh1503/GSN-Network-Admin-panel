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

      await api.put(`http://localhost:5000/api/payments/verify-enhanced/${paymentVerificationId}`, {
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#CDA435] mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading pending payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#CDA435] to-[#D9B95B] bg-clip-text text-transparent mb-4">
              Payment Management
            </h1>
            <p className="text-gray-600 text-lg">
              Verify and manage customer payments for your quotes
            </p>
            <div className="mt-6 flex items-center justify-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Pending Verification</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Rejected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payments Grid */}
        {!Array.isArray(pendingPayments) || pendingPayments.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-6 bg-gradient-to-r from-[#CDA435] to-[#D9B95B] rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <FiDollarSign className="text-4xl text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Pending Payments</h3>
            <p className="text-gray-600 mb-6">All payments have been processed or no payments are awaiting verification</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {pendingPayments.map((payment) => (
              <div
                key={payment.id}
                className="relative bg-white rounded-2xl shadow-xl border-2 border-gray-200 hover:border-[#CDA435] transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                    payment.payment_status === 'verified' 
                      ? 'bg-green-100 text-green-800' 
                      : payment.payment_status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
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
                    <div className="p-3 bg-gradient-to-r from-[#CDA435] to-[#D9B95B] rounded-xl text-white">
                      <FiFileText className="text-xl" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">Quote #{payment.quote_id}</h3>
                      <p className="text-gray-600">${payment.price}</p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <FiUser className="text-[#CDA435] text-lg" />
                      <div>
                        <p className="text-sm text-gray-500">Customer</p>
                        <p className="font-medium text-gray-800">{payment.user_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <FiMail className="text-[#CDA435] text-lg" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-gray-800 text-sm">{payment.user_email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <FiMapPin className="text-[#CDA435] text-lg" />
                      <div>
                        <p className="text-sm text-gray-500">Route</p>
                        <p className="font-medium text-gray-800">{payment.departure_country} → {payment.arrival_country}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <FiTruck className="text-[#CDA435] text-lg" />
                      <div>
                        <p className="text-sm text-gray-500">Service</p>
                        <p className="font-medium text-gray-800 text-sm">{payment.product_description}</p>
                      </div>
                    </div>

                    {payment.payment_proof_date && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <FiCalendar className="text-[#CDA435] text-lg" />
                        <div>
                          <p className="text-sm text-gray-500">Payment Date</p>
                          <p className="font-medium text-gray-800">{new Date(payment.payment_proof_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment Proof Thumbnail */}
                  {payment.payment_proof_url && (
                    <div className="mb-6">
                      <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <FiImage className="text-[#CDA435]" />
                        Payment Proof
                      </p>
                      <div className="relative group">
                        <img 
                          src={payment.payment_proof_url} 
                          alt="Payment proof" 
                          className="w-full h-32 object-cover rounded-xl border-2 border-gray-200 group-hover:border-[#CDA435] transition-colors cursor-pointer"
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
                        ? 'bg-green-50 border-green-200' 
                        : payment.user_response_status === 'rejected'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        {payment.user_response_status === 'accepted' ? (
                          <FiCheckCircle className="text-green-500" />
                        ) : payment.user_response_status === 'rejected' ? (
                          <FiX className="text-red-500" />
                        ) : (
                          <FiAlertCircle className="text-blue-500" />
                        )}
                        <p className={`text-sm font-medium ${
                          payment.user_response_status === 'accepted' 
                            ? 'text-green-800' 
                            : payment.user_response_status === 'rejected'
                            ? 'text-red-800'
                            : 'text-blue-800'
                        }`}>
                          {payment.user_response_status === 'accepted' ? 'Quote Accepted' : 
                           payment.user_response_status === 'rejected' ? 'Quote Rejected' : 
                           'Payment Uploaded - Awaiting Quote Acceptance'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button 
                    className="w-full px-6 py-3 bg-gradient-to-r from-[#CDA435] to-[#D9B95B] text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
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
                <h2 className="text-3xl font-bold bg-gradient-to-r from-[#CDA435] to-[#D9B95B] bg-clip-text text-transparent">
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
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <FiUser className="text-blue-500" />
                      Customer Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <FiUser className="text-blue-500" />
                        <div>
                          <p className="text-sm text-blue-600">Name</p>
                          <p className="font-medium text-blue-800">{selectedPayment.user_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FiMail className="text-blue-500" />
                        <div>
                          <p className="text-sm text-blue-600">Email</p>
                          <p className="font-medium text-blue-800">{selectedPayment.user_email}</p>
                        </div>
                      </div>
                      {selectedPayment.user_phone && (
                        <div className="flex items-center gap-3">
                          <FiPhone className="text-blue-500" />
                          <div>
                            <p className="text-sm text-blue-600">Phone</p>
                            <p className="font-medium text-blue-800">{selectedPayment.user_phone}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quote Details */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <FiFileText className="text-green-500" />
                      Quote Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <FiDollarSign className="text-green-500" />
                        <div>
                          <p className="text-sm text-green-600">Amount</p>
                          <p className="font-bold text-green-800 text-xl">${selectedPayment.price}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FiTruck className="text-green-500" />
                        <div>
                          <p className="text-sm text-green-600">Service</p>
                          <p className="font-medium text-green-800">{selectedPayment.product_description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FiMapPin className="text-green-500" />
                        <div>
                          <p className="text-sm text-green-600">Route</p>
                          <p className="font-medium text-green-800">{selectedPayment.departure_country} → {selectedPayment.arrival_country}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FiTruck className="text-green-500" />
                        <div>
                          <p className="text-sm text-green-600">Shipping Mode</p>
                          <p className="font-medium text-green-800">{selectedPayment.shipping_mode}</p>
                        </div>
                      </div>
                      {selectedPayment.payment_proof_date && (
                        <div className="flex items-center gap-3">
                          <FiCalendar className="text-green-500" />
                          <div>
                            <p className="text-sm text-green-600">Payment Date</p>
                            <p className="font-medium text-green-800">{new Date(selectedPayment.payment_proof_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Notes */}
                  {selectedPayment.payment_notes && (
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-6 border border-yellow-200">
                      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FiFileText className="text-yellow-500" />
                        Payment Notes
                      </h3>
                      <p className="text-yellow-800 leading-relaxed">{selectedPayment.payment_notes}</p>
                    </div>
                  )}
                </div>

                {/* Right Column - Payment Proof & Bank Details */}
                <div className="space-y-6">
                  {/* Payment Proof */}
                  {selectedPayment.payment_proof_url && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
                      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FiImage className="text-purple-500" />
                        Payment Proof
                      </h3>
                      <div className="relative group">
                        <img 
                          src={selectedPayment.payment_proof_url} 
                          alt="Payment proof" 
                          className="w-full h-64 object-cover rounded-xl border-2 border-purple-200 group-hover:border-purple-400 transition-colors cursor-pointer"
                          onClick={() => handleImageClick(selectedPayment.payment_proof_url)}
                        />
                        <div 
                          className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                          onClick={() => handleImageClick(selectedPayment.payment_proof_url)}
                        >
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-white/90 px-4 py-2 rounded-lg">
                            <FiDownload className="text-purple-600" />
                            <span className="text-purple-600 font-medium">View Full Size</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bank Details Used */}
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <FiCreditCard className="text-gray-500" />
                      Bank Details Used
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <FiCreditCard className="text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Bank Name</p>
                          <p className="font-medium text-gray-800">{selectedPayment.bank_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FiUser className="text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Bank Holder Name</p>
                          <p className="font-medium text-gray-800">{selectedPayment.account_holder_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FiCreditCard className="text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Account Number</p>
                          <p className="font-mono font-medium text-gray-800">{selectedPayment.account_number}</p>
                        </div>
                      </div>
                      {selectedPayment.iban_number && (
                        <div className="flex items-center gap-3">
                          <FiGlobe className="text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-600">IBAN Number</p>
                            <p className="font-mono font-medium text-gray-800">{selectedPayment.iban_number}</p>
                          </div>
                        </div>
                      )}
                      {selectedPayment.swift_code && (
                        <div className="flex items-center gap-3">
                          <FiGlobe className="text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-600">SWIFT Code</p>
                            <p className="font-mono font-medium text-gray-800">{selectedPayment.swift_code}</p>
                          </div>
                        </div>
                      )}
                      {selectedPayment.branch_name && (
                        <div className="flex items-center gap-3">
                          <FiMapPin className="text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-600">Branch Name</p>
                            <p className="font-medium text-gray-800">{selectedPayment.branch_name}</p>
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
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleVerifyPayment(selectedPayment.payment_verification_id, 'verified')}
                  disabled={isProcessing}
                >
                  <FiCheck className="text-xl" />
                  {isProcessing ? 'Processing...' : 'Verify Payment'}
                </button>
                <button 
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <h2 className="text-2xl font-bold text-red-600">
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
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <FiAlertCircle className="text-red-500 text-xl flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-red-800">Important Notice</h3>
                    <p className="text-red-700 text-sm mt-1">
                      Rejecting this payment will notify the customer, admin, and prevent work from starting. 
                      Please provide a clear reason to help resolve any issues.
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Customer: {selectedPayment.user_name}</h3>
                <p className="text-gray-600 text-sm">Amount: ${selectedPayment.price}</p>
                <p className="text-gray-600 text-sm">Email: {selectedPayment.user_email}</p>
              </div>

              {/* Rejection Reason */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason for Rejection *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
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
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectConfirm}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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