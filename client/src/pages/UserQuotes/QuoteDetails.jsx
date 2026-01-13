import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  FaExclamationTriangle
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
import PaymentUpload from '../../components/PaymentUpload/PaymentUpload';

const QuoteDetails = () => {
  const { quoteId } = useParams();
  const [quote, setQuote] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedResponseForPayment, setSelectedResponseForPayment] = useState(null);

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

  const hasAcceptedResponse = Array.isArray(responses) ? responses.some(response => response.user_response_status === 'accepted') : false;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-12 w-12 border-4 border-gray-200 rounded-full animate-spin">
              <div className="h-12 w-12 border-4 border-transparent border-t-[#CDA435] rounded-full animate-spin"></div>
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
        <Link to="/user/quotes" className="text-[#CDA435] hover:text-yellow-600">
          Back to Quotes
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-yellow-50/30 to-amber-50/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Quote Status Banner - Show when approved */}
        {quote && quote.status === 'approved' && (
          <div className="bg-gradient-to-r from-green-100 via-emerald-100 to-green-100 border-2 border-green-300 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-500 rounded-full shadow-md">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-green-800 mb-2">🎉 Quote Approved!</h3>
                <p className="text-green-700 leading-relaxed mb-3">
                  Great news! Your payment has been verified and your quote has been approved. 
                  The company will begin working on your shipment as scheduled.
                </p>
                {(() => {
                  const acceptedResponse = responses.find(r => r.user_response_status === 'accepted');
                  return acceptedResponse ? (
                    <div className="bg-white/60 rounded-lg p-3 border border-green-200">
                      <div className="flex items-center space-x-3">
                        <FaBuilding className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-green-800 font-semibold">{acceptedResponse.company_name}</p>
                          <p className="text-green-600 text-sm">{acceptedResponse.company_email}</p>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
              <div className="text-green-600 text-sm font-medium bg-white/60 px-3 py-1 rounded-lg">
                Status: Approved ✓
              </div>
            </div>
          </div>
        )}

        {/* Payment Rejection Banner - Show prominently at top */}
        {(() => {
          const rejectedResponse = getRejectedResponse();
          
          return rejectedResponse && (
            <div className="bg-gradient-to-r from-red-100 via-rose-100 to-red-100 border-2 border-red-300 rounded-3xl p-8 shadow-xl mb-6">
              <div className="flex items-start space-x-6">
                <div className="p-4 bg-red-500 rounded-2xl flex-shrink-0 shadow-lg">
                  <XCircle className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-red-800 mb-4">❌ Payment Verification Failed</h3>
                  <p className="text-red-700 text-lg leading-relaxed mb-6">
                    Unfortunately, your payment proof was not accepted by the company. Please review the reason below and take appropriate action.
                  </p>

                  {/* Company Info */}
                  <div className="bg-white/70 rounded-2xl p-4 border border-red-200 shadow-sm mb-6">
                    <div className="flex items-center space-x-3">
                      <FaBuilding className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="text-red-800 font-bold text-lg">{rejectedResponse.company_name}</p>
                        <p className="text-red-600">{rejectedResponse.company_email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Rejection Reason */}
                  {rejectedResponse.payment_company_notes && (
                    <div className="bg-red-50 rounded-2xl p-6 border-2 border-red-200 shadow-sm mb-6">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-red-500 rounded-xl flex-shrink-0">
                          <FaBuilding className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-red-800 text-lg mb-3">📝 Reason for Rejection:</h4>
                          <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm">
                            <p className="text-red-900 font-medium text-lg leading-relaxed">
                              "{rejectedResponse.payment_company_notes}"
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rejection Date */}
                  {rejectedResponse.rejection_date && (
                    <div className="flex items-center space-x-3 text-red-600 mb-6">
                      <Calendar className="h-5 w-5" />
                      <p className="font-medium">
                        <strong>Rejected on:</strong> {formatDate(rejectedResponse.rejection_date)}
                      </p>
                    </div>
                  )}

                  {/* Next Steps */}
                  <div className="bg-amber-50 rounded-2xl p-6 border-2 border-amber-200 shadow-sm">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-amber-500 rounded-xl flex-shrink-0">
                        <FaExclamationTriangle className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-amber-800 text-lg mb-3">🔄 Next Steps:</h4>
                        <ul className="text-amber-900 space-y-2 font-medium">
                          <li className="flex items-start space-x-2">
                            <span className="text-amber-600 font-bold">1.</span>
                            <span>Review the rejection reason above carefully</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-amber-600 font-bold">2.</span>
                            <span>Contact the company directly for clarification if needed</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-amber-600 font-bold">3.</span>
                            <span>Upload a new, clearer payment proof if possible</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-amber-600 font-bold">4.</span>
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
        <div className="relative overflow-hidden bg-gradient-to-r from-white via-yellow-50 to-amber-50 rounded-2xl p-6 shadow-lg border border-yellow-200/50">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-yellow-300/20 to-transparent rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-amber-300/20 to-transparent rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <Link
                to="/user/quotes"
                className="group flex items-center space-x-2 text-slate-600 hover:text-yellow-600 transition-all duration-300"
              >
                <div className="p-2 bg-white/80 backdrop-blur-sm rounded-xl group-hover:bg-yellow-100 transition-all duration-300 shadow-md border border-yellow-200/50">
                  <FaArrowLeft className="h-4 w-4" />
                </div>
                <span className="font-semibold">Back to My Quotes</span>
              </Link>
              
              <div className="flex items-center space-x-3">
                <div className={`px-4 py-2 rounded-xl backdrop-blur-sm border font-semibold shadow-md ${
                  quote.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                  quote.status === 'approved' ? 'bg-green-100 text-green-700 border-green-300 ring-2 ring-green-400 ring-offset-2' :
                  quote.status === 'running' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                  quote.status === 'closed' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                  'bg-red-100 text-red-700 border-red-300'
                }`}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      quote.status === 'pending' ? 'bg-amber-500 animate-pulse' :
                      quote.status === 'approved' ? 'bg-green-500 animate-bounce' :
                      quote.status === 'running' ? 'bg-blue-500 animate-pulse' :
                      quote.status === 'closed' ? 'bg-emerald-500' :
                      'bg-red-500 animate-pulse'
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
                  className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                  title="Refresh status"
                >
                  <div className="w-4 h-4">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold">Refresh</span>
                </button>
                
                <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-yellow-200 shadow-md">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  <span className="text-slate-700 font-semibold">{responses.length} Responses</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-yellow-600 to-amber-600 bg-clip-text text-transparent">
                Quote #{quote.id}
              </h1>
              
              <div className="flex items-center space-x-6 text-slate-600">
                <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-3 py-1 rounded-lg border border-yellow-200/50">
                  <MapPin className="h-4 w-4 text-yellow-500" />
                  <span className="font-semibold">
                    {quote.departure_city}
                    {quote.departure_state && `, ${quote.departure_state}`}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <ArrowRight className="h-4 w-4 text-amber-500" />
                </div>
                <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-3 py-1 rounded-lg border border-amber-200/50">
                  <MapPin className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold">
                    {quote.arrival_city}
                    {quote.arrival_state && `, ${quote.arrival_state}`}
                  </span>
                </div>
                <div className="h-4 w-px bg-slate-300"></div>
                <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-3 py-1 rounded-lg border border-yellow-200/50">
                  <Truck className="h-4 w-4 text-yellow-500" />
                  <span className="font-semibold">{quote.shipping_mode}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quote Details Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-yellow-200/50">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl shadow-md">
              <Package className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Shipment Details</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-200/50 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center space-x-2">
                  <Package className="h-4 w-4 text-yellow-600" />
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
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200/50 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-blue-600" />
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
            <div className="mt-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200/50 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-slate-600" />
                <span>Additional Notes</span>
              </h3>
              <p className="text-slate-700 leading-relaxed">{quote.notes}</p>
            </div>
          )}
        </div>

        {/* Quote Responses Section */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-yellow-200/50 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-100 via-amber-100 to-yellow-100 p-6 border-b border-yellow-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl shadow-md">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {quote && quote.status === 'approved' ? 'Selected Company' : 'Company Responses'}
                  </h2>
                  <p className="text-slate-600">
                    {quote && quote.status === 'approved' 
                      ? 'Company that accepted your payment and will handle your shipment' 
                      : 'Review proposals from freight companies'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {quote && quote.status === 'approved' ? (
                  <div className="bg-green-100 backdrop-blur-sm px-4 py-2 rounded-xl border border-green-300 shadow-md">
                    <span className="text-green-700 font-semibold">Approved Company</span>
                  </div>
                ) : (
                  <>
                    <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-yellow-300 shadow-md">
                      <span className="text-slate-800 font-semibold">{responses.length} Total</span>
                    </div>
                    {responses.filter(r => r.user_response_status === 'accepted').length > 0 && (
                      <div className="bg-green-100 backdrop-blur-sm px-4 py-2 rounded-xl border border-green-300 shadow-md">
                        <span className="text-green-700 font-semibold">
                          {responses.filter(r => r.user_response_status === 'accepted').length} Accepted
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            {Array.isArray(responses) && responses.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gradient-to-br from-yellow-100 to-amber-100 rounded-full p-8 w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-lg">
                  <FaShippingFast className="text-yellow-600 h-12 w-12" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">Awaiting Company Responses</h3>
                <p className="text-slate-600 max-w-lg mx-auto leading-relaxed">
                  Freight companies are reviewing your quote request. You'll receive notifications as responses arrive.
                </p>
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-yellow-600 font-semibold text-sm">Live Updates Active</span>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {(() => {
                  // Filter responses based on quote status
                  let filteredResponses = Array.isArray(responses) ? responses : [];
                  
                  // If quote is approved, show only the company that accepted the payment
                  if (quote && quote.status === 'approved') {
                    // For approved quotes, show companies that:
                    // 1. Have been accepted by user (user_response_status === 'accepted')
                    // 2. OR have verified payment (payment_status === 'verified')
                    // 3. OR have payment verification status (payment_verification_status === 'verified')
                    filteredResponses = responses.filter(response => {
                      const isAccepted = response.user_response_status === 'accepted';
                      const hasVerifiedPayment = response.payment_status === 'verified';
                      const hasVerifiedPaymentStatus = response.payment_verification_status === 'verified';
                      const hasPaymentProof = Boolean(response.payment_proof_uploaded);
                      
                      // For approved quotes, prioritize companies with verified payments or accepted status
                      return isAccepted || hasVerifiedPayment || hasVerifiedPaymentStatus || hasPaymentProof;
                    });
                    
                    // If still no results, show any company that has interaction with this quote
                    if (filteredResponses.length === 0) {
                      filteredResponses = responses.filter(response => 
                        Boolean(response.payment_proof_uploaded) || response.user_response_status
                      );
                    }
                  }
                  
                  return filteredResponses.map((response, index) => (
                  <div key={response.id} className="group relative">
                    {/* Response Card */}
                    <div className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.01] ${
                      response.user_response_status === 'accepted' 
                        ? 'border-green-400 bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 shadow-lg shadow-green-100' 
                        : response.user_response_status === 'rejected'
                        ? 'border-red-300 bg-gradient-to-br from-red-50 via-rose-50 to-red-50 shadow-lg shadow-red-100'
                        : 'border-yellow-200 bg-gradient-to-br from-white via-yellow-50/30 to-white hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-100'
                    }`}>
                      
                      {/* Status Indicator */}
                      {response.user_response_status && (
                        <div className={`absolute top-0 left-0 right-0 h-2 ${
                          response.user_response_status === 'accepted' ? 'bg-gradient-to-r from-green-400 via-emerald-500 to-green-400' :
                          'bg-gradient-to-r from-red-400 via-rose-500 to-red-400'
                        }`}></div>
                      )}
                      
                      <div className="p-6">
                        {/* Company Header */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center shadow-md">
                                <FaBuilding className="text-white h-6 w-6" />
                              </div>
                              {response.user_response_status === 'accepted' && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                                  <CheckCircle className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-slate-800 mb-1">{response.company_name}</h3>
                              <div className="flex items-center space-x-4 text-slate-600 text-sm">
                                <div className="flex items-center space-x-2">
                                  <FaEnvelope className="h-3 w-3 text-yellow-500" />
                                  <span className="font-medium">{response.company_email}</span>
                                </div>
                                {response.company_phone && (
                                  <div className="flex items-center space-x-2">
                                    <FaPhone className="h-3 w-3 text-amber-500" />
                                    <span className="font-medium">{response.company_phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* {response.user_response_status && (
                            <div className={`px-4 py-2 rounded-xl font-semibold shadow-md ${
                              response.user_response_status === 'accepted' 
                                ? 'bg-green-500 text-white shadow-green-200' 
                                : 'bg-red-500 text-white shadow-red-200'
                            }`}>
                              <div className="flex items-center space-x-2">
                                {response.user_response_status === 'accepted' ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : (
                                  <XCircle className="h-4 w-4" />
                                )}
                                <span className="capitalize text-sm">{response.user_response_status}</span>
                              </div>
                            </div>
                          )} */}
                        </div>

                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl p-4 border border-green-200 shadow-sm">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="p-2 bg-green-500 rounded-lg shadow-sm">
                                <FaDollarSign className="h-4 w-4 text-white" />
                              </div>
                              <span className="font-semibold text-green-700">Total Price</span>
                            </div>
                            <p className="text-2xl font-bold text-green-800 mb-1">${response.price}</p>
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="h-3 w-3 text-green-600" />
                              <span className="text-green-600 font-medium text-xs">Competitive Rate</span>
                            </div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl p-4 border border-blue-200 shadow-sm">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
                                <Clock className="h-4 w-4 text-white" />
                              </div>
                              <span className="font-semibold text-blue-700">Transit Time</span>
                            </div>
                            <p className="text-xl font-bold text-blue-800 mb-1">{response.transit_time}</p>
                            <div className="flex items-center space-x-1">
                              <Zap className="h-3 w-3 text-blue-600" />
                              <span className="text-blue-600 font-medium text-xs">Express Service</span>
                            </div>
                          </div>
                          
                          {response.valid_until && (
                            <div className="bg-gradient-to-br from-amber-100 to-yellow-100 rounded-xl p-4 border border-amber-200 shadow-sm">
                              <div className="flex items-center space-x-3 mb-3">
                                <div className="p-2 bg-amber-500 rounded-lg shadow-sm">
                                  <Calendar className="h-4 w-4 text-white" />
                                </div>
                                <span className="font-semibold text-amber-700">Valid Until</span>
                              </div>
                              <p className="text-lg font-bold text-amber-800 mb-1">
                                {formatDate(response.valid_until)}
                              </p>
                              <div className="flex items-center space-x-1">
                                <Shield className="h-3 w-3 text-amber-600" />
                                <span className="text-amber-600 font-medium text-xs">Price Guaranteed</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Detailed Information */}
                        {(response.inclusions || response.value_added_services || response.terms || response.notes) && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                            {response.inclusions && (
                              <div className="bg-white/80 rounded-xl p-4 border border-slate-200 shadow-sm">
                                <h4 className="font-semibold text-slate-800 mb-3 flex items-center space-x-2">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span>Inclusions</span>
                                </h4>
                                <p className="text-slate-700 leading-relaxed text-sm">{response.inclusions}</p>
                              </div>
                            )}
                            
                            {response.value_added_services && (
                              <div className="bg-white/80 rounded-xl p-4 border border-slate-200 shadow-sm">
                                <h4 className="font-semibold text-slate-800 mb-3 flex items-center space-x-2">
                                  <Star className="h-4 w-4 text-yellow-500" />
                                  <span>Value Added Services</span>
                                </h4>
                                <p className="text-slate-700 leading-relaxed text-sm">{response.value_added_services}</p>
                              </div>
                            )}
                            
                            {response.terms && (
                              <div className="bg-white/80 rounded-xl p-4 border border-slate-200 shadow-sm">
                                <h4 className="font-semibold text-slate-800 mb-3 flex items-center space-x-2">
                                  <Shield className="h-4 w-4 text-blue-500" />
                                  <span>Terms & Conditions</span>
                                </h4>
                                <p className="text-slate-700 leading-relaxed text-sm">{response.terms}</p>
                              </div>
                            )}
                            
                            {response.notes && (
                              <div className="bg-white/80 rounded-xl p-4 border border-slate-200 shadow-sm">
                                <h4 className="font-semibold text-slate-800 mb-3 flex items-center space-x-2">
                                  <Award className="h-4 w-4 text-purple-500" />
                                  <span>Additional Notes</span>
                                </h4>
                                <p className="text-slate-700 leading-relaxed text-sm">{response.notes}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Bank Details Section - NEW */}
                        {(response.bank_name || response.account_number) && (
                          <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 shadow-sm">
                            <h4 className="font-semibold text-slate-800 mb-4 flex items-center space-x-2">
                              <FaUniversity className="h-5 w-5 text-blue-500" />
                              <span>Payment Bank Details</span>
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {response.bank_name && (
                                <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
                                  <span className="text-slate-600 font-medium text-sm">Bank Name:</span>
                                  <p className="text-slate-800 font-semibold">{response.bank_name}</p>
                                </div>
                              )}
                              {response.account_holder_name && (
                                <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
                                  <span className="text-slate-600 font-medium text-sm">Bank Holder Name:</span>
                                  <p className="text-slate-800 font-semibold">{response.account_holder_name}</p>
                                </div>
                              )}
                              {response.account_number && (
                                <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
                                  <span className="text-slate-600 font-medium text-sm">Account Number:</span>
                                  <p className="text-slate-800 font-semibold">{response.account_number}</p>
                                </div>
                              )}
                              {response.branch_name && (
                                <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
                                  <span className="text-slate-600 font-medium text-sm">Branch Name:</span>
                                  <p className="text-slate-800 font-semibold">{response.branch_name}</p>
                                </div>
                              )}
                              {response.iban_number && (
                                <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
                                  <span className="text-slate-600 font-medium text-sm">IBAN Number:</span>
                                  <p className="text-slate-800 font-semibold">{response.iban_number}</p>
                                </div>
                              )}
                              {response.swift_code && (
                                <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
                                  <span className="text-slate-600 font-medium text-sm">SWIFT Code:</span>
                                  <p className="text-slate-800 font-semibold">{response.swift_code}</p>
                                </div>
                              )}
                              {response.ifsc_code && (
                                <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
                                  <span className="text-slate-600 font-medium text-sm">IFSC Code:</span>
                                  <p className="text-slate-800 font-semibold">{response.ifsc_code}</p>
                                </div>
                              )}
                              {response.branch_name && (
                                <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
                                  <span className="text-slate-600 font-medium text-sm">Branch:</span>
                                  <p className="text-slate-800 font-semibold">{response.branch_name}</p>
                                </div>
                              )}
                              {response.branch_address && (
                                <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
                                  <span className="text-slate-600 font-medium text-sm">Branch Address:</span>
                                  <p className="text-slate-800 font-semibold text-sm">{response.branch_address}</p>
                                </div>
                              )}
                            </div>
                            {response.bank_instructions && (
                              <div className="mt-4 bg-amber-50 rounded-lg p-3 border border-amber-200">
                                <span className="text-amber-700 font-medium text-sm">Payment Instructions:</span>
                                <p className="text-amber-800 text-sm mt-1">{response.bank_instructions}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Payment Status Section - NEW */}
                        {response.user_response_status === 'accepted' && (
                          <div className="mb-6">
                            {response.payment_status === 'pending' && (
                              <div className="bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-300 rounded-xl p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-orange-500 rounded-lg shadow-sm">
                                      <FaCreditCard className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-orange-800">Payment Verification Pending</h4>
                                      <p className="text-orange-700 text-sm">Your payment proof is being verified by the company.</p>
                                    </div>
                                  </div>
                                  <div className="text-orange-600 text-sm font-medium">
                                    {response.payment_proof_date && `Uploaded: ${formatDate(response.payment_proof_date)}`}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {response.payment_status === 'verified' && (
                              <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-xl p-4 shadow-sm">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-green-500 rounded-lg shadow-sm">
                                    <CheckCircle className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-green-800">Payment Verified ✓</h4>
                                    <p className="text-green-700 text-sm">Your payment has been verified. The service will begin as scheduled.</p>
                                    {response.verification_date && (
                                      <p className="text-green-600 text-xs mt-1">Verified on: {formatDate(response.verification_date)}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {response.payment_status === 'rejected' && (
                              <div className="bg-gradient-to-r from-red-100 to-rose-100 border-2 border-red-300 rounded-xl p-4 shadow-sm">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-red-500 rounded-lg shadow-sm">
                                    <XCircle className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-red-800">Payment Verification Failed</h4>
                                    <p className="text-red-700 text-sm">Please contact the company or upload a clearer payment proof.</p>
                                    {response.payment_company_notes && (
                                      <p className="text-red-600 text-xs mt-1">Note: {response.payment_company_notes}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {!response.payment_status && (response.bank_name || response.account_number) && (
                              <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300 rounded-xl p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
                                      <FaUpload className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-blue-800">Payment Required</h4>
                                      <p className="text-blue-700 text-sm">Please make payment to the bank details above and upload proof.</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
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
                                    className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                                  >
                                    <Upload className="h-4 w-4" />
                                    <span>Upload Payment Proof</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action Buttons */}
                        {!hasAcceptedResponse && (
                          <div className="space-y-4">
                            {/* Show accepted status if this response is accepted */}
                            {response.user_response_status === 'accepted' && (
                              <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-xl p-4 shadow-sm">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-green-500 rounded-lg shadow-sm">
                                    <FaCheck className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-green-800">Quote Accepted ✓</h4>
                                    <p className="text-green-700 text-sm">
                                      You have accepted this quote. 
                                      {response.payment_status === 'verified' ? ' Payment verified - work will begin soon!' : 
                                       response.payment_status === 'rejected' ? ' Payment was rejected - please contact the company.' :
                                       ' Waiting for payment verification.'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                            {/* Payment Upload Required First */}
                            {!Boolean(response.payment_proof_uploaded) && (response.bank_name || response.account_number) && !hasUploadedPaymentToAnyCompany && (
                              <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300 rounded-xl p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
                                      <FaUpload className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-blue-800">Payment Required First</h4>
                                      <p className="text-blue-700 text-sm">Please make payment and upload proof before accepting this quote.</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
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
                                    className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                                  >
                                    <Upload className="h-4 w-4" />
                                    <span>Upload Payment Proof</span>
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Payment Already Uploaded to Another Company */}
                            {!Boolean(response.payment_proof_uploaded) && (response.bank_name || response.account_number) && hasUploadedPaymentToAnyCompany && (
                              <div className="bg-gradient-to-r from-orange-100 to-red-100 border-2 border-orange-300 rounded-xl p-4 shadow-sm">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-orange-500 rounded-lg shadow-sm">
                                    <FaExclamationTriangle className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-orange-800">Payment Already Uploaded</h4>
                                    <p className="text-orange-700 text-sm">You have already uploaded payment proof to another company for this quote. You can only upload payment proof to one company per quote.</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Payment Uploaded - Now Can Accept */}
                            {Boolean(response.payment_proof_uploaded) && response.payment_status !== 'verified' && !response.user_response_status && (
                              <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-xl p-4 shadow-sm mb-4">
                                <div className="flex items-center space-x-3 mb-4">
                                  <div className="p-2 bg-green-500 rounded-lg shadow-sm">
                                    <FaCreditCard className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-green-800">Payment Proof Uploaded ✓</h4>
                                    <p className="text-green-700 text-sm">You can now accept this quote. The company will verify your payment.</p>
                                  </div>
                                </div>
                                <div className="bg-white/50 rounded-lg p-3 border border-green-200">
                                  <p className="text-green-800 font-medium text-sm">
                                    🎯 <strong>Next Step:</strong> Click "Accept Quote" below to proceed with this company.
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Accept/Reject Buttons - Only show if payment proof uploaded OR no bank details required */}
                            {(Boolean(response.payment_proof_uploaded) || (!response.bank_name && !response.account_number)) && !response.user_response_status && (
                              <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                  onClick={() => handleAcceptResponse(response.id, response.company_id)}
                                  disabled={actionLoading === response.id}
                                  className={`flex-1 group relative overflow-hidden ${
                                    Boolean(response.payment_proof_uploaded) 
                                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 ring-2 ring-green-300 ring-offset-2' 
                                      : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                                  } text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                  <div className="relative flex items-center justify-center space-x-2">
                                    {actionLoading === response.id ? (
                                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                    ) : (
                                      <>
                                        <CheckCircle className="h-5 w-5" />
                                        <span>Accept Quote</span>
                                      </>
                                    )}
                                  </div>
                                </button>
                            
                            <button
                              onClick={() => handleRejectResponse(response.id, response.company_id)}
                              disabled={actionLoading === response.id}
                              className="flex-1 group relative overflow-hidden bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                              <div className="relative flex items-center justify-center space-x-2">
                                {actionLoading === response.id ? (
                                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                ) : (
                                  <>
                                    <XCircle className="h-5 w-5" />
                                    <span>Reject Quote</span>
                                  </>
                                )}
                              </div>
                            </button>
                              </div>
                            )}
                          </div>
                        )}

                        {hasAcceptedResponse && !response.user_response_status && (
                          <div className="bg-gradient-to-r from-amber-100 to-yellow-100 border-2 border-amber-300 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-amber-500 rounded-lg shadow-sm">
                                <FaShieldAlt className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-amber-800">Quote Already Accepted</h4>
                                <p className="text-amber-700 text-sm">You have already accepted another quote for this request.</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))})()}
                
                {/* Show message if no approved company found when status is approved */}
                {quote && quote.status === 'approved' && 
                 responses.filter(r => 
                   r.user_response_status === 'accepted' || 
                   r.payment_status === 'verified' || 
                   r.payment_verification_status === 'verified' || 
                   r.payment_proof_uploaded
                 ).length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-full p-8 w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-lg">
                      <CheckCircle className="text-green-600 h-12 w-12" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Quote Approved</h3>
                    <p className="text-slate-600 max-w-lg mx-auto leading-relaxed">
                      Your quote has been approved! The selected company will contact you soon with further details.
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Upload Modal */}
      {showPaymentModal && selectedResponseForPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <PaymentUpload 
            quote={selectedResponseForPayment}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedResponseForPayment(null);
            }}
            onSuccess={() => {
              setShowPaymentModal(false);
              setSelectedResponseForPayment(null);
              fetchQuoteResponses(); // Refresh to show updated payment status
              toast.success('Payment proof uploaded successfully! The company will verify your payment before work begins.');
            }}
          />
        </div>
      )}
    </div>
  );
};

export default QuoteDetails;