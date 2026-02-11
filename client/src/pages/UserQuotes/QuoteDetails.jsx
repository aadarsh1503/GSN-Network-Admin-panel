import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaCheck, 
  FaTimes, 
  FaEnvelope, 
  FaPhone,
  FaBuilding,
  FaClock,
  FaDollarSign,
  FaShippingFast,
  FaStar,
  FaAward,
  FaShieldAlt,
  FaRocket,
  FaGlobe,
  FaUniversity,
  FaCreditCard,
  FaUpload,
  FaExclamationTriangle,
  FaEye,
  FaComments
} from 'react-icons/fa';
import { 
  Zap, 
  Clock, 
  Shield, 
  Award, 
  Truck, 
  MapPin, 
  Calendar,
  Package,
  CheckCircle,
  XCircle,
  Star,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Users,
  Globe,
  CreditCard,
  Upload
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';
import QuotePaymentModal from '../../components/QuotePayment/QuotePaymentModal';
import CompanyProfileModal from '../../components/CompanyProfileModal/CompanyProfileModal';

// Compact Response Row Component
const CompactResponseRow = ({ 
  response, 
  quote, 
  onAccept, 
  onReject, 
  onViewCompany, 
  onUploadPayment, 
  onMessageCompany,
  actionLoading, 
  hasAcceptedResponse, 
  hasUploadedPaymentToAnyCompany, 
  formatDate 
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusBadge = () => {
    if (response.user_response_status === 'accepted') {
      if (response.payment_status === 'verified') {
        return <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">✅ Approved</span>;
      }
      if (response.payment_status === 'rejected') {
        return <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">❌ Rejected</span>;
      }
      if (response.payment_status === 'pending') {
        return <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full">⏳ Pending</span>;
      }
      return <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">✅ Accepted</span>;
    }
    if (response.user_response_status === 'rejected') {
      return <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded-full">❌ Rejected</span>;
    }
    return <span className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded-full">⏳ Pending</span>;
  };

  return (
    <div className={`border rounded-xl p-4 transition-all duration-300 ${
      response.user_response_status === 'accepted' 
        ? 'border-[#bca142] bg-gradient-to-r from-green-50 to-yellow-50 shadow-lg ring-2 ring-[#bca142] ring-opacity-50' 
        : response.user_response_status === 'rejected'
        ? 'border-red-300 bg-red-50'
        : 'border-gray-200 bg-white hover:border-[#bca142]'
    }`}>
      {/* Compact Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {/* Company Info */}
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center relative ${
              response.user_response_status === 'accepted' 
                ? 'bg-gradient-to-br from-[#bca142] to-yellow-500 shadow-lg' 
                : 'bg-[#bca142]'
            }`}>
              <FaBuilding className="text-white h-5 w-5" />
              {response.user_response_status === 'accepted' && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-2.5 w-2.5 text-white" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-gray-900">{response.company_name}</h4>
                {response.user_response_status === 'accepted' && (
                  <span className="px-2 py-1 bg-[#bca142] text-white text-xs font-bold rounded-full animate-pulse">
                    🏆 APPROVED COMPANY
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{response.company_email}</p>
            </div>
          </div>

          {/* Key Metrics in Row */}
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-1">
              <FaDollarSign className="h-4 w-4 text-[#bca142]" />
              <span className="font-semibold">${response.price}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-[#bca142]" />
              <span>{response.transit_time}</span>
            </div>
            {response.valid_until && (
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4 text-[#bca142]" />
                <span>Valid: {formatDate(response.valid_until)}</span>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
          >
            <FaEye className="h-3 w-3" />
            <span>{showDetails ? 'Hide' : 'View'} Details</span>
          </button>
          
          <button
            onClick={onViewCompany}
            className="flex items-center space-x-1 px-3 py-1 bg-[#bca142] hover:bg-black text-white rounded-lg transition-colors text-sm"
          >
            <FaBuilding className="h-3 w-3" />
            <span>Company</span>
          </button>

          <button
            onClick={onMessageCompany}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
          >
            <FaComments className="h-3 w-3" />
            <span>Message</span>
          </button>

          {/* Quick Action Buttons */}
          {response.user_response_status === 'accepted' ? (
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-green-500 text-white text-sm font-bold rounded-lg flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>SELECTED</span>
              </span>
            </div>
          ) : !hasAcceptedResponse && !response.user_response_status && (
            <>
              {(Boolean(response.payment_proof_uploaded) || (!response.bank_name && !response.account_number)) ? (
                <>
                  <button
                    onClick={onAccept}
                    disabled={actionLoading === response.id}
                    className="flex items-center space-x-1 px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                  >
                    <CheckCircle className="h-3 w-3" />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={onReject}
                    disabled={actionLoading === response.id}
                    className="flex items-center space-x-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                  >
                    <XCircle className="h-3 w-3" />
                    <span>Reject</span>
                  </button>
                </>
              ) : (response.bank_name || response.account_number) && !hasUploadedPaymentToAnyCompany && (
                <button
                  onClick={onUploadPayment}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                >
                  <Upload className="h-3 w-3" />
                  <span>Pay</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Expandable Details */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
          {/* Detailed Information */}
          {(response.inclusions || response.value_added_services || response.terms || response.notes) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {response.inclusions && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <h5 className="font-semibold text-gray-800 mb-2 flex items-center space-x-1">
                    <CheckCircle className="h-4 w-4 text-[#bca142]" />
                    <span>Inclusions</span>
                  </h5>
                  <p className="text-gray-700 text-sm">{response.inclusions}</p>
                </div>
              )}
              
              {response.value_added_services && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <h5 className="font-semibold text-gray-800 mb-2 flex items-center space-x-1">
                    <Star className="h-4 w-4 text-[#bca142]" />
                    <span>Value Added Services</span>
                  </h5>
                  <p className="text-gray-700 text-sm">{response.value_added_services}</p>
                </div>
              )}
              
              {response.terms && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <h5 className="font-semibold text-gray-800 mb-2 flex items-center space-x-1">
                    <Shield className="h-4 w-4 text-[#bca142]" />
                    <span>Terms & Conditions</span>
                  </h5>
                  <p className="text-gray-700 text-sm">{response.terms}</p>
                </div>
              )}
              
              {response.notes && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <h5 className="font-semibold text-gray-800 mb-2 flex items-center space-x-1">
                    <Award className="h-4 w-4 text-[#bca142]" />
                    <span>Additional Notes</span>
                  </h5>
                  <p className="text-gray-700 text-sm">{response.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Bank Details */}
          {(response.bank_name || response.account_number) && (
            <div className="bg-white rounded-lg p-4 border border-[#bca142]">
              <h5 className="font-semibold text-gray-800 mb-3 flex items-center space-x-1">
                <FaUniversity className="h-4 w-4 text-[#bca142]" />
                <span>Payment Bank Details</span>
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {response.bank_name && (
                  <div>
                    <span className="text-gray-600 text-xs">Bank Name:</span>
                    <p className="text-gray-800 font-semibold text-sm">{response.bank_name}</p>
                  </div>
                )}
                {response.account_holder_name && (
                  <div>
                    <span className="text-gray-600 text-xs">Account Holder:</span>
                    <p className="text-gray-800 font-semibold text-sm">{response.account_holder_name}</p>
                  </div>
                )}
                {response.account_number && (
                  <div>
                    <span className="text-gray-600 text-xs">Account Number:</span>
                    <p className="text-gray-800 font-semibold text-sm">{response.account_number}</p>
                  </div>
                )}
                {response.swift_code && (
                  <div>
                    <span className="text-gray-600 text-xs">SWIFT Code:</span>
                    <p className="text-gray-800 font-semibold text-sm">{response.swift_code}</p>
                  </div>
                )}
                {response.ifsc_code && (
                  <div>
                    <span className="text-gray-600 text-xs">IFSC Code:</span>
                    <p className="text-gray-800 font-semibold text-sm">{response.ifsc_code}</p>
                  </div>
                )}
                {response.branch_name && (
                  <div>
                    <span className="text-gray-600 text-xs">Branch:</span>
                    <p className="text-gray-800 font-semibold text-sm">{response.branch_name}</p>
                  </div>
                )}
              </div>
              {response.bank_instructions && (
                <div className="mt-3 p-2 bg-gray-50 rounded border">
                  <span className="text-gray-600 text-xs">Instructions:</span>
                  <p className="text-gray-800 text-sm mt-1">{response.bank_instructions}</p>
                </div>
              )}
            </div>
          )}

          {/* Payment Status Details */}
          {response.user_response_status === 'accepted' && (
            <div className="space-y-3">
              {response.payment_status === 'pending' && (
                <div className="bg-orange-100 border border-orange-300 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <FaCreditCard className="h-4 w-4 text-orange-600" />
                    <span className="font-semibold text-orange-800">Payment Verification Pending</span>
                  </div>
                  <p className="text-orange-700 text-sm mt-1">Your payment proof is being verified by the company.</p>
                </div>
              )}
              
              {response.payment_status === 'verified' && (
                <div className="bg-green-100 border border-green-300 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-800">Payment Verified ✓</span>
                  </div>
                  <p className="text-green-700 text-sm mt-1">Your payment has been verified. The service will begin as scheduled.</p>
                </div>
              )}
              
              {response.payment_status === 'rejected' && (
                <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="font-semibold text-red-800">Payment Verification Failed</span>
                  </div>
                  <p className="text-red-700 text-sm mt-1">Please contact the company or upload a clearer payment proof.</p>
                  {response.payment_company_notes && (
                    <p className="text-red-600 text-xs mt-1">Note: {response.payment_company_notes}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons in Details */}
          {!hasAcceptedResponse && !response.user_response_status && (
            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-gray-200">
              {!Boolean(response.payment_proof_uploaded) && (response.bank_name || response.account_number) && !hasUploadedPaymentToAnyCompany && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <h6 className="font-semibold text-blue-800 text-sm">Payment Required First</h6>
                    <p className="text-blue-700 text-xs">Make payment and upload proof before accepting.</p>
                  </div>
                  <button
                    onClick={onUploadPayment}
                    className="flex items-center space-x-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    <Upload className="h-3 w-3" />
                    <span>Upload Payment</span>
                  </button>
                </div>
              )}

              {Boolean(response.payment_proof_uploaded) && (
                <div className="flex space-x-3">
                  <button
                    onClick={onAccept}
                    disabled={actionLoading === response.id}
                    className="flex-1 flex items-center justify-center space-x-2 bg-[#bca142] hover:bg-black text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Accept Quote</span>
                  </button>
                  <button
                    onClick={onReject}
                    disabled={actionLoading === response.id}
                    className="flex-1 flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Reject Quote</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const QuoteDetails = () => {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedResponseForPayment, setSelectedResponseForPayment] = useState(null);
  const [showCompanyProfileModal, setShowCompanyProfileModal] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);

  useEffect(() => {
    fetchQuoteDetails();
    fetchQuoteResponses();
  }, [quoteId]);

  const fetchQuoteDetails = async () => {
    try {
      const quotes = await api.get('/api/user-quotes/my-quotes');
      const currentQuote = Array.isArray(quotes) ? quotes.find(q => q.id === parseInt(quoteId)) : null;
      setQuote(currentQuote);
    } catch (error) {
      console.error('Error fetching quote details:', error);
      toast.error('Failed to fetch quote details');
    }
  };

  const fetchQuoteResponses = async () => {
    try {
      // Use enhanced API to get responses with bank details
      const data = await api.get(`/api/enhanced-quotes/${quoteId}/responses-with-bank-details`);
      setResponses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching quote responses:', error);
      toast.error('Failed to fetch quote responses');
    } finally {
      setLoading(false);
    }
  };

  // Check if user has uploaded payment proof to any company for this quote
  const hasUploadedPaymentToAnyCompany = responses.some(response => Boolean(response.payment_proof_uploaded));

  const handleAcceptResponse = async (responseId, companyId) => {
    if (!window.confirm('Are you sure you want to accept this quote? This action cannot be undone.')) {
      return;
    }

    setActionLoading(responseId);
    try {
      await api.post('/api/user-quotes/accept-response', {
        quoteId: parseInt(quoteId),
        quoteResponseId: responseId,
        companyId: companyId
      });

      toast.success('Quote accepted successfully! Your payment is being verified by the company. Work will begin once payment is confirmed.');
      fetchQuoteResponses();
      fetchQuoteDetails();
    } catch (error) {
      console.error('Error accepting quote response:', error);
      toast.error(error.message || 'Failed to accept quote response');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectResponse = async (responseId, companyId) => {
    if (!window.confirm('Are you sure you want to reject this quote?')) {
      return;
    }

    setActionLoading(responseId);
    try {
      await api.post('/api/user-quotes/reject-response', {
        quoteId: parseInt(quoteId),
        quoteResponseId: responseId,
        companyId: companyId
      });

      toast.success('Quote response rejected. The company has been notified.');
      fetchQuoteResponses();
    } catch (error) {
      console.error('Error rejecting quote response:', error);
      toast.error(error.message || 'Failed to reject quote response');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get rejected response for top banner
  const getRejectedResponse = () => {
    return Array.isArray(responses) ? responses.find(response => response.payment_status === 'rejected') : null;
  };

  // Function to navigate to messages with specific company
  const handleMessageCompany = (companyId, companyName) => {
    // Navigate to user messages page with company info
    navigate('/user/messages', { 
      state: { 
        selectedCompanyId: companyId,
        selectedCompanyName: companyName 
      } 
    });
  };

  const hasAcceptedResponse = Array.isArray(responses) ? responses.some(response => response.user_response_status === 'accepted') : false;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-12 w-12 border-4 border-gray-200 rounded-full animate-spin">
              <div className="h-12 w-12 border-4 border-transparent border-t-[#bca142] rounded-full animate-spin"></div>
            </div>
          </div>
          <p className="text-gray-600 font-medium">Loading quote details...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Quote not found</h3>
        <Link to="/user/quotes" className="text-[#bca142] hover:text-black">
          Back to Quotes
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Quote Status Banner - Show when approved */}
        {quote && quote.status === 'approved' && (
          <div className="bg-white border-2 border-[#bca142] rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-[#bca142] rounded-full shadow-md">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-black mb-2">🎉 Quote Approved!</h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Great news! Your payment has been verified and your quote has been approved. 
                  The company will begin working on your shipment as scheduled.
                </p>
                {(() => {
                  // Try multiple fallback strategies to find the approved company
                  let acceptedResponse = null;
                  
                  // Strategy 1: Look for accepted response with verified payment (most accurate)
                  acceptedResponse = responses.find(r => r.user_response_status === 'accepted' && r.payment_status === 'verified');
                  
                  // Strategy 2: Look for any accepted response (for older data)
                  if (!acceptedResponse) {
                    acceptedResponse = responses.find(r => r.user_response_status === 'accepted');
                  }
                  
                  // Strategy 3: Look for any response with verified payment
                  if (!acceptedResponse) {
                    acceptedResponse = responses.find(r => r.payment_status === 'verified');
                  }
                  
                  // Strategy 4: Look for any response with payment proof uploaded (fallback for old data)
                  if (!acceptedResponse) {
                    acceptedResponse = responses.find(r => r.payment_proof_uploaded);
                  }
                  
                  // Strategy 5: If quote is approved but no specific response found, show first response with company info
                  if (!acceptedResponse && responses.length > 0) {
                    acceptedResponse = responses.find(r => r.company_name && r.company_email);
                  }
                  
                  return acceptedResponse ? (
                    <div className="bg-gray-50 rounded-lg p-4 border border-[#bca142]">
                      <div className="flex items-center space-x-3">
                        <FaBuilding className="h-5 w-5 text-[#bca142]" />
                        <div>
                          <p className="text-black font-semibold text-lg">{acceptedResponse.company_name}</p>
                          <p className="text-gray-600 text-sm">{acceptedResponse.company_email}</p>
                          {acceptedResponse.company_phone && (
                            <p className="text-gray-600 text-sm flex items-center space-x-1 mt-1">
                              <FaPhone className="h-3 w-3" />
                              <span>{acceptedResponse.company_phone}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-gray-700">
                        {acceptedResponse.payment_status === 'verified' ? (
                          <p className="font-medium">✅ Payment verified and approved by this company</p>
                        ) : acceptedResponse.user_response_status === 'accepted' ? (
                          <p className="font-medium">✅ Quote accepted by this company</p>
                        ) : (
                          <p className="font-medium">✅ This company is handling your approved quote</p>
                        )}
                        {acceptedResponse.verification_date && (
                          <p className="text-xs text-gray-500 mt-1">
                            Verified on: {new Date(acceptedResponse.verification_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 border border-[#bca142]">
                      <div className="flex items-center space-x-3">
                        <FaBuilding className="h-5 w-5 text-[#bca142]" />
                        <div>
                          <p className="text-black font-semibold text-lg">Approved Company</p>
                          <p className="text-gray-600 text-sm">Your quote has been approved and is being processed</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="text-[#bca142] text-sm font-medium bg-white px-3 py-1 rounded-lg border border-[#bca142]">
                Status: Approved ✓
              </div>
            </div>
          </div>
        )}

        {/* Payment Rejection Banner - Show prominently at top */}
        {(() => {
          const rejectedResponse = getRejectedResponse();
          
          return rejectedResponse && (
            <div className="bg-white border-2 border-black rounded-3xl p-8 shadow-xl mb-6">
              <div className="flex items-start space-x-6">
                <div className="p-4 bg-black rounded-2xl flex-shrink-0 shadow-lg">
                  <XCircle className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-black mb-4">❌ Payment Verification Failed</h3>
                  <p className="text-gray-700 text-lg leading-relaxed mb-6">
                    Unfortunately, your payment proof was not accepted by the company. Please review the reason below and take appropriate action.
                  </p>

                  {/* Company Info */}
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 shadow-sm mb-6">
                    <div className="flex items-center space-x-3">
                      <FaBuilding className="h-5 w-5 text-black" />
                      <div>
                        <p className="text-black font-bold text-lg">{rejectedResponse.company_name}</p>
                        <p className="text-gray-600">{rejectedResponse.company_email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Rejection Reason */}
                  {rejectedResponse.payment_company_notes && (
                    <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200 shadow-sm mb-6">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-black rounded-xl flex-shrink-0">
                          <FaBuilding className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-black text-lg mb-3">📝 Reason for Rejection:</h4>
                          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-black font-medium text-lg leading-relaxed">
                              "{rejectedResponse.payment_company_notes}"
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rejection Date */}
                  {rejectedResponse.rejection_date && (
                    <div className="flex items-center space-x-3 text-gray-600 mb-6">
                      <Calendar className="h-5 w-5" />
                      <p className="font-medium">
                        <strong>Rejected on:</strong> {formatDate(rejectedResponse.rejection_date)}
                      </p>
                    </div>
                  )}

                  {/* Next Steps */}
                  <div className="bg-white rounded-2xl p-6 border-2 border-[#bca142] shadow-sm">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-[#bca142] rounded-xl flex-shrink-0">
                        <FaExclamationTriangle className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-black text-lg mb-3">🔄 Next Steps:</h4>
                        <ul className="text-gray-700 space-y-2 font-medium">
                          <li className="flex items-start space-x-2">
                            <span className="text-[#bca142] font-bold">1.</span>
                            <span>Review the rejection reason above carefully</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-[#bca142] font-bold">2.</span>
                            <span>Contact the company directly for clarification if needed</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-[#bca142] font-bold">3.</span>
                            <span>Upload a new, clearer payment proof if possible</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-[#bca142] font-bold">4.</span>
                            <span>Consider accepting quotes from other companies</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Modern Header */}
        <div className="relative overflow-hidden bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <Link
                to="/user/quotes"
                className="group flex items-center space-x-2 text-slate-600 hover:text-[#bca142] transition-all duration-300"
              >
                <div className="p-2 bg-white rounded-xl group-hover:bg-gray-50 transition-all duration-300 shadow-md border border-gray-200">
                  <FaArrowLeft className="h-4 w-4" />
                </div>
                <span className="font-semibold">Back to My Quotes</span>
              </Link>
              
              <div className="flex items-center space-x-3">
                <div className={`px-4 py-2 rounded-xl border font-semibold shadow-md ${
                  quote.status === 'pending' ? 'bg-white text-[#bca142] border-[#bca142]' :
                  quote.status === 'approved' ? 'bg-[#bca142] text-white border-[#bca142] ring-2 ring-[#bca142] ring-offset-2' :
                  quote.status === 'running' ? 'bg-[#bca142] text-white border-[#bca142]' :
                  quote.status === 'closed' ? 'bg-[#bca142] text-white border-[#bca142]' :
                  'bg-black text-white border-black'
                }`}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      quote.status === 'pending' ? 'bg-[#bca142] animate-pulse' :
                      quote.status === 'approved' ? 'bg-white animate-bounce' :
                      quote.status === 'running' ? 'bg-white animate-pulse' :
                      quote.status === 'closed' ? 'bg-white' :
                      'bg-white animate-pulse'
                    }`}></div>
                    <span className="capitalize">
                      {quote.status}
                      {quote.status === 'approved' && ' ✓'}
                    </span>
                  </div>
                </div>
                
                {/* Refresh Button */}
                <button
                  onClick={async () => {
                    setLoading(true);
                    await fetchQuoteDetails();
                    await fetchQuoteResponses();
                    setLoading(false);
                    toast.success('Status updated!');
                  }}
                  className="flex items-center space-x-2 bg-[#bca142] hover:bg-black text-white px-3 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                  title="Refresh status"
                >
                  <div className="w-4 h-4">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold">Refresh</span>
                </button>
                
                <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-md">
                  <Sparkles className="h-4 w-4 text-[#bca142]" />
                  <span className="text-slate-700 font-semibold">{responses.length} Responses</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-black">
                Quote #{quote.id}
              </h1>
              
              <div className="flex items-center space-x-6 text-slate-600">
                <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">
                  <MapPin className="h-4 w-4 text-[#bca142]" />
                  <span className="font-semibold">
                    {quote.departure_city}
                    {quote.departure_state && `, ${quote.departure_state}`}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <ArrowRight className="h-4 w-4 text-[#bca142]" />
                </div>
                <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">
                  <MapPin className="h-4 w-4 text-[#bca142]" />
                  <span className="font-semibold">
                    {quote.arrival_city}
                    {quote.arrival_state && `, ${quote.arrival_state}`}
                  </span>
                </div>
                <div className="h-4 w-px bg-slate-300"></div>
                <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">
                  <Truck className="h-4 w-4 text-[#bca142]" />
                  <span className="font-semibold">{quote.shipping_mode}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Company Responses - Compact Row Format */}
        {Array.isArray(responses) && responses.length > 0 ? (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-[#bca142] rounded-xl shadow-md">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Company Responses</h2>
                  {(() => {
                    // Use the same fallback logic to find approved company
                    let approvedCompany = null;
                    
                    // Strategy 1: Look for accepted response with verified payment (most accurate)
                    approvedCompany = responses.find(r => r.user_response_status === 'accepted' && r.payment_status === 'verified');
                    
                    // Strategy 2: Look for any accepted response (for older data)
                    if (!approvedCompany) {
                      approvedCompany = responses.find(r => r.user_response_status === 'accepted');
                    }
                    
                    // Strategy 3: Look for any response with verified payment
                    if (!approvedCompany) {
                      approvedCompany = responses.find(r => r.payment_status === 'verified');
                    }
                    
                    // Strategy 4: Look for any response with payment proof uploaded (fallback for old data)
                    if (!approvedCompany) {
                      approvedCompany = responses.find(r => r.payment_proof_uploaded);
                    }
                    
                    // Strategy 5: If quote is approved but no specific response found, show first response with company info
                    if (!approvedCompany && responses.length > 0 && quote && quote.status === 'approved') {
                      approvedCompany = responses.find(r => r.company_name && r.company_email);
                    }
                    
                    return approvedCompany && (
                      <p className="text-sm text-[#bca142] font-semibold flex items-center space-x-1">
                        <span>🏆</span>
                        <span>Approved: {approvedCompany.company_name}</span>
                      </p>
                    );
                  })()}
                </div>
              </div>
              <div className="text-sm text-slate-600 font-medium">
                {responses.length} Response{responses.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            <div className="space-y-4">
              {(() => {
                // Filter responses based on quote status
                let filteredResponses = Array.isArray(responses) ? responses : [];
                
                // If quote is approved, show only the company that accepted the payment
                if (quote && quote.status === 'approved') {
                  filteredResponses = responses.filter(response => {
                    const isAccepted = response.user_response_status === 'accepted';
                    const hasVerifiedPayment = response.payment_status === 'verified';
                    const hasVerifiedPaymentStatus = response.payment_verification_status === 'verified';
                    const hasPaymentProof = Boolean(response.payment_proof_uploaded);
                    
                    return isAccepted || hasVerifiedPayment || hasVerifiedPaymentStatus || hasPaymentProof;
                  });
                  
                  if (filteredResponses.length === 0) {
                    filteredResponses = responses.filter(response => 
                      Boolean(response.payment_proof_uploaded) || response.user_response_status
                    );
                  }
                }
                
                // Sort responses to put approved company first
                const sortedResponses = filteredResponses.sort((a, b) => {
                  if (a.user_response_status === 'accepted' && b.user_response_status !== 'accepted') return -1;
                  if (b.user_response_status === 'accepted' && a.user_response_status !== 'accepted') return 1;
                  return 0;
                });
                
                return sortedResponses.map((response, index) => (
                  <CompactResponseRow 
                    key={response.id} 
                    response={response} 
                    quote={quote}
                    onAccept={() => handleAcceptResponse(response.id, response.company_id)}
                    onReject={() => handleRejectResponse(response.id, response.company_id)}
                    onViewCompany={() => {
                      setSelectedCompanyId(response.company_id);
                      setShowCompanyProfileModal(true);
                    }}
                    onUploadPayment={() => {
                      setSelectedResponseForPayment({
                        ...response,
                        quote_id: quote.id,
                        amount: response.price,
                        company_name: response.company_name,
                        bank_details: {
                          bank_name: response.bank_name,
                          account_holder_name: response.account_holder_name,
                          account_number: response.account_number,
                          routing_number: response.routing_number,
                          swift_code: response.swift_code,
                          ifsc_code: response.ifsc_code,
                          branch_name: response.branch_name,
                          branch_address: response.branch_address,
                          instructions: response.bank_instructions
                        }
                      });
                      setShowPaymentModal(true);
                    }}
                    onMessageCompany={() => handleMessageCompany(response.company_id, response.company_name)}
                    actionLoading={actionLoading}
                    hasAcceptedResponse={hasAcceptedResponse}
                    hasUploadedPaymentToAnyCompany={hasUploadedPaymentToAnyCompany}
                    formatDate={formatDate}
                  />
                ));
              })()}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-[#bca142] rounded-xl shadow-md">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Company Responses</h2>
            </div>
            <div className="text-center py-8">
              <div className="bg-gray-100 rounded-full p-6 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FaShippingFast className="text-gray-400 h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Awaiting Company Responses</h3>
              <p className="text-slate-600 text-sm">
                Freight companies are reviewing your quote request. You'll receive notifications as responses arrive.
              </p>
            </div>
          </div>
        )}

        {/* Quote Details Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-[#bca142] rounded-xl shadow-md">
              <Package className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Shipment Details</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center space-x-2">
                  <Package className="h-4 w-4 text-[#bca142]" />
                  <span>Product Information</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-slate-600 font-medium">Product:</span>
                    <span className="text-slate-800 font-semibold text-right max-w-xs text-sm">{quote.product_description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Shipping Mode:</span>
                    <span className="text-slate-800 font-semibold text-sm">{quote.shipping_mode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Arrival Date:</span>
                    <span className="text-slate-800 font-semibold text-sm">{formatDate(quote.arrival_date)}</span>
                  </div>
                  {quote.quantity && (
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-medium">Quantity:</span>
                      <span className="text-slate-800 font-semibold text-sm">{quote.quantity}</span>
                    </div>
                  )}
                  {quote.weight && (
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-medium">Weight:</span>
                      <span className="text-slate-800 font-semibold text-sm">{quote.weight}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-[#bca142]" />
                  <span>Route Information</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">From:</span>
                    <span className="text-slate-800 font-semibold text-sm">
                      {quote.departure_city}
                      {quote.departure_state && `, ${quote.departure_state}`}
                      , {quote.departure_country}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">To:</span>
                    <span className="text-slate-800 font-semibold text-sm">
                      {quote.arrival_city}
                      {quote.arrival_state && `, ${quote.arrival_state}`}
                      , {quote.arrival_country}
                    </span>
                  </div>
                  {quote.incoterms && (
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-medium">Incoterms:</span>
                      <span className="text-slate-800 font-semibold text-sm">{quote.incoterms}</span>
                    </div>
                  )}
                  {quote.packing && (
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-medium">Packing:</span>
                      <span className="text-slate-800 font-semibold text-sm">{quote.packing}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {quote.notes && (
            <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-[#bca142]" />
                <span>Additional Notes</span>
              </h3>
              <p className="text-slate-700 leading-relaxed">{quote.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedResponseForPayment && (
        <QuotePaymentModal 
          quote={selectedResponseForPayment}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedResponseForPayment(null);
          }}
          onSuccess={() => {
            setShowPaymentModal(false);
            setSelectedResponseForPayment(null);
            fetchQuoteResponses(); // Refresh to show updated payment status
          }}
        />
      )}

      {/* Company Profile Modal */}
      {showCompanyProfileModal && selectedCompanyId && (
        <CompanyProfileModal
          companyId={selectedCompanyId}
          onClose={() => {
            setShowCompanyProfileModal(false);
            setSelectedCompanyId(null);
          }}
        />
      )}
    </div>
  );
};

export default QuoteDetails;