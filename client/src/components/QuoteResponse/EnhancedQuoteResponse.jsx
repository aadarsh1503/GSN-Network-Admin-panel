import React, { useState, useEffect } from 'react';
import { 
  FiX, FiUser, FiMail, FiTruck, FiMapPin, FiPackage, 
  FiCalendar, FiDollarSign, FiFileText, FiCreditCard,
  FiCheck, FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import "./enhence.css"
const EnhancedQuoteResponse = ({ quote, onClose, onSuccess }) => {
  const [bankDetails, setBankDetails] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [responseData, setResponseData] = useState({
    amount: '',
    description: '',
    estimated_completion: '',
    transit_time: '',
    terms_conditions: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      const response = await api.get('/api/bank-details');
      console.log('Bank details API response:', response);
      
      let bankDetailsArray = [];
      if (Array.isArray(response)) {
        bankDetailsArray = response;
      } else {
        console.warn('Unexpected API response format:', response);
        bankDetailsArray = [];
      }
      
      const activeBankDetails = bankDetailsArray.filter(bank => bank && bank.is_active);
      setBankDetails(activeBankDetails);
      
      if (activeBankDetails.length > 0) {
        setSelectedBankId(activeBankDetails[0].id);
      }
    } catch (error) {
      console.error('Error fetching bank details:', error);
      toast.error('Failed to fetch bank details');
      setBankDetails([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setResponseData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedBankId) {
      toast.error('Please select bank details for payment');
      return;
    }

    if (!responseData.amount || !responseData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      const payload = {
        quoteId: quote.id,
        price: parseFloat(responseData.amount),
        transitTime: responseData.transit_time || '5-7 days',
        inclusions: responseData.description,
        valueAddedServices: '',
        validUntil: responseData.estimated_completion,
        terms: responseData.terms_conditions,
        notes: 'Enhanced quote response with bank details',
        bankDetailsId: selectedBankId
      };

      await api.post('/api/quote-responses/submit', payload);
      
      toast.success('Quote response sent successfully with bank details');
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Close modal if provided
      if (onClose) {
        onClose();
      }
      
      // Refresh the page after a short delay to allow toast to show
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Error sending quote response:', error);
      toast.error('Failed to send quote response');
    } finally {
      setLoading(false);
    }
  };

  const selectedBank = bankDetails.find(bank => bank.id === parseInt(selectedBankId));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#bca142] p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <FiFileText className="text-3xl" />
              Send Quote Response
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <FiX className="text-2xl" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Quote Request Details */}
          <div className="bg-[#bca142]/10 rounded-xl p-6 border-2 border-[#bca142]/30">
            <h3 className="text-xl font-bold text-[#bca142] mb-4 flex items-center gap-2">
              <FiUser className="text-[#bca142]" />
              Quote Request Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FiUser className="text-[#bca142]" />
                  <div>
                    <p className="text-sm font-semibold text-black">From:</p>
                    <p className="text-black font-medium">{quote.user_name || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FiMail className="text-[#bca142]" />
                  <div>
                    <p className="text-sm font-semibold text-black">Email:</p>
                    <p className="text-black">{quote.user_email || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FiTruck className="text-[#bca142]" />
                  <div>
                    <p className="text-sm font-semibold text-black">Shipping Mode:</p>
                    <p className="text-black font-medium capitalize">{quote.shipping_mode || 'N/A'}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FiMapPin className="text-[#bca142]" />
                  <div>
                    <p className="text-sm font-semibold text-black">Route:</p>
                    <p className="text-black font-medium">{quote.departure_country} → {quote.arrival_country}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FiPackage className="text-[#bca142]" />
                  <div>
                    <p className="text-sm font-semibold text-black">Product:</p>
                    <p className="text-black">{quote.product_description || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FiCalendar className="text-[#bca142]" />
                  <div>
                    <p className="text-sm font-semibold text-black">Arrival Date:</p>
                    <p className="text-black">{quote.arrival_date ? new Date(quote.arrival_date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
            {quote.weight && (
              <div className="mt-4 p-3 bg-[#bca142]/20 rounded-lg">
                <p className="text-black"><strong>Weight:</strong> {quote.weight}</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Quote Response Section */}
            <div className="bg-[#bca142]/10 rounded-xl p-6 border-2 border-[#bca142]/30">
              <h3 className="text-xl font-bold text-[#bca142] mb-4 flex items-center gap-2">
                <FiDollarSign className="text-[#bca142]" />
                Your Quote Response
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="amount" className="block text-sm font-semibold text-black mb-2">
                    Quote Amount ($) *
                  </label>
                 <div className="relative">
  <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#bca142]" />
  <input
    type="number"
    id="amount"
    name="amount"
    value={responseData.amount}
    onChange={handleInputChange}
    min="0"
    required
    className="no-spinner w-full pl-10 pr-4 py-3 border-2 border-[#bca142]/30 rounded-xl focus:ring-2 focus:ring-[#bca142] focus:border-[#bca142] transition-colors"
    placeholder="Enter your quote amount"
  />
</div>

                </div>

                <div>
                  <label htmlFor="transit_time" className="block text-sm font-semibold text-black mb-2">
                    Transit Time
                  </label>
                  <div className="relative">
                    <FiTruck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#bca142]" />
                    <input
                      type="text"
                      id="transit_time"
                      name="transit_time"
                      value={responseData.transit_time || ''}
                      onChange={handleInputChange}
                      placeholder="e.g., 5-7 days, 2 weeks, 1 month"
                      className="w-full pl-10 pr-4 py-3 border-2 border-[#bca142]/30 rounded-xl focus:ring-2 focus:ring-[#bca142] focus:border-[#bca142] transition-colors"
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">How long will the shipment take?</p>
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="estimated_completion" className="block text-sm font-semibold text-black mb-2">
                  Valid Until Date *
                </label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#bca142]" />
                  <input
                    type="date"
                    id="estimated_completion"
                    name="estimated_completion"
                    value={responseData.estimated_completion}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full pl-10 pr-4 py-3 border-2 border-[#bca142]/30 rounded-xl focus:ring-2 focus:ring-[#bca142] focus:border-[#bca142] transition-colors"
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">This is when your quote expires, not the completion date</p>
              </div>

              <div className="mt-4">
                <label htmlFor="description" className="block text-sm font-semibold text-black mb-2">
                  Service Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={responseData.description}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Describe what services you will provide..."
                  required
                  className="w-full px-4 py-3 border-2 border-[#bca142]/30 rounded-xl focus:ring-2 focus:ring-[#bca142] focus:border-[#bca142] transition-colors resize-none"
                />
              </div>

              <div className="mt-4">
                <label htmlFor="terms_conditions" className="block text-sm font-semibold text-black mb-2">
                  Terms & Conditions
                </label>
                <textarea
                  id="terms_conditions"
                  name="terms_conditions"
                  value={responseData.terms_conditions}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Any specific terms or conditions..."
                  className="w-full px-4 py-3 border-2 border-[#bca142]/30 rounded-xl focus:ring-2 focus:ring-[#bca142] focus:border-[#bca142] transition-colors resize-none"
                />
              </div>
            </div>

            {/* Payment Bank Details Section */}
            <div className="bg-[#bca142]/10 rounded-xl p-6 border-2 border-[#bca142]/30">
              <h3 className="text-xl font-bold text-[#bca142] mb-4 flex items-center gap-2">
                <FiCreditCard className="text-[#bca142]" />
                Payment Bank Details
              </h3>
              
              {!Array.isArray(bankDetails) || bankDetails.length === 0 ? (
                <div className="text-center py-8">
                  <FiAlertCircle className="text-4xl text-black mx-auto mb-4" />
                  <p className="text-black font-medium mb-4">No active bank details found. Please add bank details first.</p>
                  <button 
                    type="button" 
                    className="bg-black text-white px-6 py-3 rounded-xl hover:bg-[#bca142] transition-all duration-300 transform hover:scale-105"
                  >
                    Add Bank Details
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label htmlFor="bank_select" className="block text-sm font-semibold text-black mb-2">
                      Select Bank Account for Payment *
                    </label>
                    <select
                      id="bank_select"
                      value={selectedBankId}
                      onChange={(e) => setSelectedBankId(e.target.value)}
                      required
                      className="w-full px-4 py-3 border-2 border-[#bca142]/30 rounded-xl focus:ring-2 focus:ring-[#bca142] focus:border-[#bca142] transition-colors"
                    >
                      {Array.isArray(bankDetails) && bankDetails.map(bank => (
                        <option key={bank.id} value={bank.id}>
                          {bank.bank_name} - {bank.account_holder_name} (****{bank.account_number.slice(-4)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedBank && (
                    <div className="bg-white rounded-xl p-4 border-2 border-[#bca142]/30">
                      <h4 className="font-bold text-[#bca142] mb-3 flex items-center gap-2">
                        <FiCheck className="text-[#bca142]" />
                        Selected Bank Details (Customer will see this):
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-black"><strong>Bank Name:</strong> {selectedBank.bank_name}</p>
                          <p className="text-black"><strong>Account Holder:</strong> {selectedBank.account_holder_name}</p>
                          <p className="text-black"><strong>Account Number:</strong> {selectedBank.account_number}</p>
                        </div>
                        <div>
                          {selectedBank.branch_name && (
                            <p className="text-black"><strong>Branch Name:</strong> {selectedBank.branch_name}</p>
                          )}
                          {selectedBank.ifsc_code && (
                            <p className="text-black"><strong>IFSC Code:</strong> {selectedBank.ifsc_code}</p>
                          )}
                          {selectedBank.iban_number && (
                            <p className="text-black"><strong>IBAN Number:</strong> {selectedBank.iban_number}</p>
                          )}
                          {selectedBank.swift_code && (
                            <p className="text-black"><strong>SWIFT Code:</strong> {selectedBank.swift_code}</p>
                          )}
                        </div>
                      </div>
                      {selectedBank.payment_instructions && (
                        <div className="mt-3 p-3 bg-[#bca142]/20 rounded-lg">
                          <p className="text-black"><strong>Payment Instructions:</strong></p>
                          <p className="text-black text-sm mt-1">{selectedBank.payment_instructions}</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 py-4 px-6 rounded-xl hover:bg-gray-200 transition-colors font-medium text-lg"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading || !Array.isArray(bankDetails) || bankDetails.length === 0}
                className="flex-1 bg-[#bca142] text-white py-4 px-6 rounded-xl hover:bg-black transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-medium text-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <FiCheck className="text-xl" />
                    Send Quote Response
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnhancedQuoteResponse;