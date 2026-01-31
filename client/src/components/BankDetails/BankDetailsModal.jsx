import React, { useState, useEffect } from 'react';
import { 
  FiX, FiCreditCard, FiMapPin, FiHash, FiUser, FiInfo, FiCopy, 
  FiCheck, FiShield, FiArrowRight, FiStar, FiLock
} from 'react-icons/fi';
import { api } from '../../utils/api';

const BankDetailsModal = ({ isOpen, onClose, planName, planPrice }) => {
  const [bankDetails, setBankDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBankDetails();
    }
  }, [isOpen]);

  const fetchBankDetails = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/bank-details');
      setBankDetails(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching bank details:', error);
      // Fallback to static bank details if API fails
      setBankDetails([{
        id: 1,
        bank_name: 'Indian Bank',
        branch_name: 'XYZ Branch',
        branch_address: 'XYZ Address, City - 123456',
        ifsc_code: 'IDIB000X048',
        account_number: '89798765463498',
        account_holder_name: 'GSN Network Services',
        instructions: 'Please ensure to enter the correct branch name where the account is held to avoid any confusion. After making the payment, please contact our support team with the transaction reference number.',
        is_active: true
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handlePaymentConfirmation = () => {
    setShowConfirmation(true);
    // Here you can add logic to handle payment confirmation
    // For now, we'll just show a confirmation message
    setTimeout(() => {
      onClose();
      setShowConfirmation(false);
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto relative">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-[#bca142]/20 to-[#D9B95B]/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-[#D9B95B]/20 to-[#bca142]/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#bca142] to-[#D9B95B] p-8 rounded-t-3xl text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-4xl font-bold mb-2 flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                      <FiCreditCard className="text-3xl" />
                    </div>
                    Complete Your Payment
                  </h2>
                  <p className="text-white/90 text-lg">
                    Secure bank transfer for your {planName} subscription
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-3 hover:bg-white/20 rounded-2xl transition-all duration-200 backdrop-blur-sm"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>

              {/* Plan Info */}
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">{planName} Plan</h3>
                    <p className="text-white/80">Monthly Subscription</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold">${planPrice}</div>
                    <p className="text-white/80">per month</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#bca142] border-t-transparent"></div>
                <p className="text-gray-600 mt-4">Loading bank details...</p>
              </div>
            ) : bankDetails ? (
              <div className="space-y-8">
                {/* Security Notice */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-500 rounded-xl text-white">
                      <FiShield className="text-xl" />
                    </div>
                    <div>
                      <h4 className="font-bold text-green-800 text-lg mb-2">Secure Payment</h4>
                      <p className="text-green-700">
                        Your payment is processed through secure bank transfer. All transactions are encrypted and monitored for your safety.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bank Details Card */}
                <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-3xl p-8 shadow-xl">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-gradient-to-r from-[#bca142] to-[#D9B95B] rounded-2xl text-white">
                      <FiCreditCard className="text-3xl" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-gray-800">{bankDetails.bank_name}</h3>
                      <p className="text-gray-600 text-lg">{bankDetails.branch_name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Account Holder */}
                    <div className="group">
                      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <FiUser className="text-[#bca142] text-xl" />
                            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Account Holder</span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(bankDetails.account_holder_name, 'holder')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {copiedField === 'holder' ? (
                              <FiCheck className="text-green-500" />
                            ) : (
                              <FiCopy className="text-gray-400" />
                            )}
                          </button>
                        </div>
                        <p className="text-xl font-bold text-gray-800">{bankDetails.account_holder_name}</p>
                      </div>
                    </div>

                    {/* Account Number */}
                    <div className="group">
                      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <FiCreditCard className="text-[#bca142] text-xl" />
                            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Account Number</span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(bankDetails.account_number, 'account')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {copiedField === 'account' ? (
                              <FiCheck className="text-green-500" />
                            ) : (
                              <FiCopy className="text-gray-400" />
                            )}
                          </button>
                        </div>
                        <p className="text-xl font-bold text-gray-800 font-mono tracking-wider">{bankDetails.account_number}</p>
                      </div>
                    </div>

                    {/* IFSC Code */}
                    <div className="group">
                      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <FiHash className="text-[#bca142] text-xl" />
                            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">IFSC Code</span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(bankDetails.ifsc_code, 'ifsc')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {copiedField === 'ifsc' ? (
                              <FiCheck className="text-green-500" />
                            ) : (
                              <FiCopy className="text-gray-400" />
                            )}
                          </button>
                        </div>
                        <p className="text-xl font-bold text-gray-800 font-mono tracking-wider">{bankDetails.ifsc_code}</p>
                      </div>
                    </div>

                    {/* Branch Address */}
                    <div className="group">
                      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <FiMapPin className="text-[#bca142] text-xl" />
                            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Branch Address</span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(bankDetails.branch_address, 'address')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {copiedField === 'address' ? (
                              <FiCheck className="text-green-500" />
                            ) : (
                              <FiCopy className="text-gray-400" />
                            )}
                          </button>
                        </div>
                        <p className="text-lg font-medium text-gray-800 leading-relaxed">{bankDetails.branch_address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                {bankDetails.instructions && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-500 rounded-xl text-white">
                        <FiInfo className="text-xl" />
                      </div>
                      <div>
                        <h4 className="font-bold text-blue-800 text-lg mb-2">Payment Instructions</h4>
                        <p className="text-blue-700 leading-relaxed">{bankDetails.instructions}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Steps */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-200">
                  <h4 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <FiStar className="text-[#bca142]" />
                    How to Complete Payment
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
                      <div className="w-8 h-8 bg-gradient-to-r from-[#bca142] to-[#D9B95B] text-white rounded-full flex items-center justify-center font-bold">1</div>
                      <p className="text-gray-700">Transfer <strong>${planPrice}</strong> to the above bank account</p>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
                      <div className="w-8 h-8 bg-gradient-to-r from-[#bca142] to-[#D9B95B] text-white rounded-full flex items-center justify-center font-bold">2</div>
                      <p className="text-gray-700">Keep your transaction reference number safe</p>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
                      <div className="w-8 h-8 bg-gradient-to-r from-[#bca142] to-[#D9B95B] text-white rounded-full flex items-center justify-center font-bold">3</div>
                      <p className="text-gray-700">Click "I've Made the Payment" below to confirm</p>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
                      <div className="w-8 h-8 bg-gradient-to-r from-[#bca142] to-[#D9B95B] text-white rounded-full flex items-center justify-center font-bold">4</div>
                      <p className="text-gray-700">Your subscription will be activated within 24 hours</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={onClose}
                    className="flex-1 px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePaymentConfirmation}
                    className="flex-1 px-8 py-4 bg-gradient-to-r from-[#bca142] to-[#D9B95B] text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3"
                  >
                    <FiLock className="text-xl" />
                    I've Made the Payment
                    <FiArrowRight className="text-xl" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="p-6 bg-red-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <FiX className="text-4xl text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Bank Details Not Available</h3>
                <p className="text-gray-600">Please contact support for payment information</p>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Overlay */}
        {showConfirmation && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center rounded-3xl">
            <div className="text-center">
              <div className="p-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center animate-bounce">
                <FiCheck className="text-4xl text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-2">Payment Confirmation Received!</h3>
              <p className="text-gray-600 text-lg">Your subscription will be activated within 24 hours</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BankDetailsModal;