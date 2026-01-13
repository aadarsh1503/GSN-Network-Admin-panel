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
  Upload
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';
import PaymentUpload from '../../components/PaymentUpload/PaymentUpload';
import { useQuoteStatusSync } from '../../hooks/useQuoteStatusSync';

const BusinessQuoteDetails = () => {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedResponseForPayment, setSelectedResponseForPayment] = useState(null);

  // Status synchronization hook
  const { currentStatus, isPolling, forceRefresh } = useQuoteStatusSync(
    parseInt(quoteId),
    15000, // Poll every 15 seconds
    (statusChange) => {
      console.log('Quote status changed:', statusChange);
      
      // Update quote state with new status
      setQuote(prevQuote => ({
        ...prevQuote,
        status: statusChange.newStatus,
        updated_at: statusChange.updatedAt
      }));

      // Refresh responses to get latest data
      fetchQuoteResponses();
      
      // Show detailed notification with company info
      if (statusChange.quote && statusChange.quote.company_name) {
        toast.success(
          `${statusChange.quote.company_name} updated your quote status to "${statusChange.newStatus.charAt(0).toUpperCase() + statusChange.newStatus.slice(1)}"`,
          {
            duration: 6000,
            icon: '📊'
          }
        );
      }
    }
  );

  useEffect(() => {
    fetchQuoteDetails();
    fetchQuoteResponses();
  }, [quoteId]);

  const fetchQuoteDetails = async () => {
    try {
      const quotes = await api.get('/api/business-quotes/my-quotes');
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
      const responsesArray = Array.isArray(data) ? data : [];
      setResponses(responsesArray);
    } catch (error) {
      console.error('Error fetching quote responses:', error);
      toast.error('Failed to fetch quote responses');
    } finally {
      setLoading(false);
    }
  };

  // Check if user has uploaded payment proof to any company for this quote
  const hasUploadedPaymentToAnyCompany = responses.some(response => response.payment_proof_uploaded);

  const handleAcceptResponse = async (responseId, companyId) => {
    if (!window.confirm('Are you sure you want to accept this quote? This action cannot be undone.')) {
      return;
    }

    setActionLoading(responseId);
    try {
      await api.post('/api/business-quotes/accept-response', {
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
      await api.post('/api/business-quotes/reject-response', {
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

  const getPaymentStatusBadge = (response) => {
    // For accepted responses, show detailed payment status
    if (response.user_response_status === 'accepted') {
      if (response.payment_status === 'verified') {
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
            ✅ Payment Verified
          </span>
        );
      }

      if (response.payment_status === 'rejected') {
        return (
          <div className="flex flex-col items-start">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
              ✗ Payment Rejected
            </span>
            {response.payment_company_notes && (
              <div className="mt-2 text-xs text-red-600 max-w-xs">
                <span className="font-medium">Reason:</span> {response.payment_company_notes}
              </div>
            )}
          </div>
        );
      }

      if (response.payment_status === 'pending' || Boolean(response.payment_proof_uploaded)) {
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
            ⏳ Payment Under Review
          </span>
        );
      }

      if (response.bank_name || response.account_number) {
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
            💳 Payment Required
          </span>
        );
      }
    }

    return null;
  };

  const hasAcceptedResponse = Array.isArray(responses) ? responses.some(response => response.user_response_status === 'accepted') : false;

  // Function to navigate to messages with specific company
  const handleMessageCompany = (companyId, companyName) => {
    // Navigate to business messages page with company info
    navigate('/business/messages', { 
      state: { 
        selectedCompanyId: companyId,
        selectedCompanyName: companyName 
      } 
    });
  };

  // Get rejected response for top banner
  const getRejectedResponse = () => {
    return Array.isArray(responses) ? responses.find(response => response.payment_status === 'rejected') : null;
  };

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
        <Link to="/business/quotes" className="text-[#CDA435] hover:text-yellow-600">
          Back to Quotes
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-yellow-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
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

        {/* Status Sync Indicator */}
        {isPolling && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-blue-700 text-sm font-medium">
                  Live status updates active - You'll be notified of any changes
                </span>
              </div>
              <button
                onClick={forceRefresh}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Refresh Now
              </button>
            </div>
          </div>
        )}

        {/* Payment Rejection Banner - Show prominently at top */}
        {(() => {
          const rejectedResponse = getRejectedResponse();
          return rejectedResponse && (
            <div className="bg-gradient-to-r from-red-100 via-rose-100 to-red-100 border-2 border-red-300 rounded-3xl p-8 shadow-xl mb-6">
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <div className="p-4 bg-red-500 rounded-2xl shadow-lg">
                    <XCircle className="h-8 w-8 text-white" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-4">
                    <h2 className="text-2xl font-bold text-red-800">❌ Payment Rejected</h2>
                    <div className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-full">
                      Quote #{quote.id}
                    </div>
                  </div>
                  
                  <p className="text-red-700 text-lg mb-6 leading-relaxed">
                    Your payment proof was rejected by <strong>{rejectedResponse.company_name}</strong>. 
                    Please review the reason below and take appropriate action.
                  </p>

                  {/* Company Details Section */}
                  <div className="bg-white/80 rounded-2xl p-6 border border-red-200 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
                          <FaBuilding className="text-white h-8 w-8" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-800 mb-1">{rejectedResponse.company_name}</h3>
                          <div className="flex items-center space-x-6 text-slate-600">
                            <div className="flex items-center space-x-2">
                              <FaEnvelope className="h-4 w-4 text-red-500" />
                              <span className="font-medium">{rejectedResponse.company_email}</span>
                            </div>
                            {rejectedResponse.company_phone && (
                              <div className="flex items-center space-x-2">
                                <FaPhone className="h-4 w-4 text-red-500" />
                                <span className="font-medium">{rejectedResponse.company_phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Message Button */}
                      <button
                        onClick={() => handleMessageCompany(rejectedResponse.company_id, rejectedResponse.company_name)}
                        className="flex items-center space-x-3 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <FaComments className="h-5 w-5" />
                        <span>Message Company</span>
                      </button>
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
                  <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                    <h4 className="font-bold text-blue-800 text-lg mb-4 flex items-center space-x-2">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <FaRocket className="h-4 w-4 text-white" />
                      </div>
                      <span>💡 What you can do next:</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-blue-200">
                        <div className="flex items-center space-x-3 mb-2">
                          <FaComments className="h-5 w-5 text-blue-500" />
                          <span className="font-semibold text-blue-800">Contact Company</span>
                        </div>
                        <p className="text-blue-700 text-sm">Message the company directly for clarification about the rejection</p>
                      </div>
                      {/* <div className="bg-white p-4 rounded-xl border border-blue-200">
                        <div className="flex items-center space-x-3 mb-2">
                          <FaUpload className="h-5 w-5 text-blue-500" />
                          <span className="font-semibold text-blue-800">Upload New Proof</span>
                        </div>
                        <p className="text-blue-700 text-sm">Upload a clearer or corrected payment proof document</p>
                      </div> */}
                      <div className="bg-white p-4 rounded-xl border border-blue-200">
                        <div className="flex items-center space-x-3 mb-2">
                          <FaUniversity className="h-5 w-5 text-blue-500" />
                          <span className="font-semibold text-blue-800">Verify Payment</span>
                        </div>
                        <p className="text-blue-700 text-sm">Ensure your payment matches the provided bank details exactly</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-blue-200">
                        <div className="flex items-center space-x-3 mb-2">
                          <FaShieldAlt className="h-5 w-5 text-blue-500" />
                          <span className="font-semibold text-blue-800">Get Support</span>
                        </div>
                        <p className="text-blue-700 text-sm">Contact GSN Network support if you need assistance</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Futuristic Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-yellow-500/10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-yellow-400/20 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-amber-400/20 to-transparent rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <Link
                to="/business/quotes"
                className="group flex items-center space-x-3 text-white/80 hover:text-yellow-400 transition-all duration-300"
              >
                <div className="p-2 bg-white/10 backdrop-blur-sm rounded-xl group-hover:bg-yellow-400/20 transition-all duration-300">
                  <FaArrowLeft className="h-4 w-4" />
                </div>
                <span className="font-medium">Back to Quotes</span>
              </Link>
              
              <div className="flex items-center space-x-4">
                <div className={`px-4 py-2 rounded-2xl backdrop-blur-sm border font-medium ${
                  quote.status === 'pending' ? 'bg-amber-500/20 text-amber-300 border-amber-400/30' :
                  quote.status === 'approved' ? 'bg-green-500/20 text-green-300 border-green-400/30' :
                  quote.status === 'running' ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' :
                  quote.status === 'closed' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' :
                  'bg-red-500/20 text-red-300 border-red-400/30'
                }`}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      quote.status === 'pending' ? 'bg-amber-400' :
                      quote.status === 'approved' ? 'bg-green-400' :
                      quote.status === 'running' ? 'bg-blue-400' :
                      quote.status === 'closed' ? 'bg-emerald-400' :
                      'bg-red-400'
                    }`}></div>
                    <span className="capitalize">{quote.status}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/20">
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                  <span className="text-white/90 font-medium">{responses.length} Responses</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-yellow-100 to-amber-200 bg-clip-text text-transparent">
                Quote #{quote.id}
              </h1>
              
              <div className="flex items-center space-x-6 text-white/80">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-yellow-400" />
                  <span className="font-medium">{quote.departure_country}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ArrowRight className="h-4 w-4 text-amber-400" />
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-amber-400" />
                  <span className="font-medium">{quote.arrival_country}</span>
                </div>
                <div className="h-4 w-px bg-white/20"></div>
                <div className="flex items-center space-x-2">
                  <Truck className="h-5 w-5 text-yellow-400" />
                  <span className="font-medium">{quote.shipping_mode}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quote Details Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl">
              <Package className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Shipment Details</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-6 border border-slate-200/50">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center space-x-2">
                  <Package className="h-5 w-5 text-yellow-500" />
                  <span>Product Information</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-slate-600 font-medium">Product:</span>
                    <span className="text-slate-800 font-semibold text-right max-w-xs">{quote.product_description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Shipping Mode:</span>
                    <span className="text-slate-800 font-semibold">{quote.shipping_mode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Arrival Date:</span>
                    <span className="text-slate-800 font-semibold">{formatDate(quote.arrival_date)}</span>
                  </div>
                  {quote.quantity && (
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-medium">Quantity:</span>
                      <span className="text-slate-800 font-semibold">{quote.quantity}</span>
                    </div>
                  )}
                  {quote.weight && (
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-medium">Weight:</span>
                      <span className="text-slate-800 font-semibold">{quote.weight}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50/50 rounded-2xl p-6 border border-amber-200/50">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-amber-500" />
                  <span>Route Information</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">From:</span>
                    <span className="text-slate-800 font-semibold">{quote.departure_city}, {quote.departure_country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">To:</span>
                    <span className="text-slate-800 font-semibold">{quote.arrival_city}, {quote.arrival_country}</span>
                  </div>
                  {quote.incoterms && (
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-medium">Incoterms:</span>
                      <span className="text-slate-800 font-semibold">{quote.incoterms}</span>
                    </div>
                  )}
                  {quote.packing && (
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-medium">Packing:</span>
                      <span className="text-slate-800 font-semibold">{quote.packing}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {quote.notes && (
            <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl p-6 border border-blue-200/50">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <span>Additional Notes</span>
              </h3>
              <p className="text-slate-700 leading-relaxed">{quote.notes}</p>
            </div>
          )}
        </div>

        {/* Quote Responses Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl">
                  <FaRocket className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {quote && quote.status === 'approved' ? 'Selected Company' : 'Quote Responses'}
                  </h2>
                  <p className="text-slate-300">
                    {quote && quote.status === 'approved' 
                      ? 'Company that accepted your payment and will handle your shipment' 
                      : 'Review and manage incoming proposals'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {quote && quote.status === 'approved' ? (
                  <div className="bg-green-500/20 backdrop-blur-sm px-4 py-2 rounded-2xl border border-green-400/30">
                    <span className="text-green-300 font-semibold">Approved Company</span>
                  </div>
                ) : (
                  <>
                    <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/20">
                      <span className="text-white font-semibold">{responses.length} Total</span>
                    </div>
                    {responses.filter(r => r.user_response_status === 'accepted').length > 0 && (
                      <div className="bg-green-500/20 backdrop-blur-sm px-4 py-2 rounded-2xl border border-green-400/30">
                        <span className="text-green-300 font-semibold">
                          {responses.filter(r => r.user_response_status === 'accepted').length} Accepted
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="p-8">
            {Array.isArray(responses) && responses.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                  <FaShippingFast className="text-slate-400 h-16 w-16" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-4">Awaiting Responses</h3>
                <p className="text-slate-600 text-lg max-w-md mx-auto">
                  Companies are reviewing your quote request. You'll receive notifications as responses come in.
                </p>
                <div className="flex items-center justify-center space-x-2 mt-6">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-yellow-600 font-medium">Live Updates Active</span>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
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
                      const hasPaymentProof = response.payment_proof_uploaded;
                      
                      // For approved quotes, prioritize companies with verified payments or accepted status
                      return isAccepted || hasVerifiedPayment || hasVerifiedPaymentStatus || hasPaymentProof;
                    });
                    
                    // If still no results, show any company that has interaction with this quote
                    if (filteredResponses.length === 0) {
                      filteredResponses = responses.filter(response => 
                        response.payment_proof_uploaded || response.user_response_status
                      );
                    }
                  }
                  
                  // Ensure we always return valid JSX
                  if (!filteredResponses || filteredResponses.length === 0) {
                    return null;
                  }
                  
                  const mapResult = filteredResponses.map((response, index) => {
                    return (
                  <div key={response.id} className="group relative">
                    {/* Response Card */}
                    <div className={`relative overflow-hidden rounded-3xl border-2 transition-all duration-500 ${
                      response.user_response_status === 'accepted' 
                        ? 'border-green-400 bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 shadow-xl shadow-green-100' 
                        : response.user_response_status === 'rejected'
                        ? 'border-red-300 bg-gradient-to-br from-red-50 via-rose-50 to-red-50 shadow-lg shadow-red-100'
                        : 'border-slate-200 bg-gradient-to-br from-white via-slate-50/50 to-white hover:border-yellow-300 hover:shadow-2xl hover:shadow-yellow-100'
                    }`}>
                      
                      {/* Status Indicator */}
                      {response.user_response_status && (
                        <div className={`absolute top-0 right-0 w-full h-2 ${
                          response.user_response_status === 'accepted' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                          'bg-gradient-to-r from-red-400 to-rose-500'
                        }`}></div>
                      )}
                      
                      <div className="p-8">
                        {/* Company Header */}
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                                <FaBuilding className="text-white h-8 w-8" />
                              </div>
                              {response.user_response_status === 'accepted' && (
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <CheckCircle className="h-4 w-4 text-white" />
                                </div>
                              )}
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold text-slate-800 mb-1">{response.company_name}</h3>
                              <div className="flex items-center space-x-6 text-slate-600">
                                <div className="flex items-center space-x-2">
                                  <FaEnvelope className="h-4 w-4 text-yellow-500" />
                                  <span className="font-medium">{response.company_email}</span>
                                </div>
                                {response.company_phone && (
                                  <div className="flex items-center space-x-2">
                                    <FaPhone className="h-4 w-4 text-amber-500" />
                                    <span className="font-medium">{response.company_phone}</span>
                                  </div>
                                )}
                              </div>
                              {/* Payment Status Badge */}
                              {getPaymentStatusBadge(response) && (
                                <div className="mt-2">
                                  {getPaymentStatusBadge(response)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* {response.user_response_status && (
                            <div className={`px-6 py-3 rounded-2xl font-bold text-lg ${
                              response.user_response_status === 'accepted' 
                                ? 'bg-green-500 text-white shadow-lg shadow-green-200' 
                                : 'bg-red-500 text-white shadow-lg shadow-red-200'
                            }`}>
                              <div className="flex items-center space-x-2">
                                {response.user_response_status === 'accepted' ? (
                                  <CheckCircle className="h-5 w-5" />
                                ) : (
                                  <XCircle className="h-5 w-5" />
                                )}
                                <span className="capitalize">{response.user_response_status}</span>
                              </div>
                            </div>
                          )} */}
                        </div>

                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200/50">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="p-2 bg-green-500 rounded-xl">
                                <FaDollarSign className="h-5 w-5 text-white" />
                              </div>
                              <span className="font-semibold text-green-700">Total Price</span>
                            </div>
                            <p className="text-3xl font-bold text-green-800">${response.price}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-600 font-medium">Competitive Rate</span>
                            </div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="p-2 bg-blue-500 rounded-xl">
                                <Clock className="h-5 w-5 text-white" />
                              </div>
                              <span className="font-semibold text-blue-700">Transit Time</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-800">{response.transit_time}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <Zap className="h-4 w-4 text-blue-600" />
                              <span className="text-sm text-blue-600 font-medium">Express Service</span>
                            </div>
                          </div>
                          
                          {response.valid_until && (
                            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-200/50">
                              <div className="flex items-center space-x-3 mb-3">
                                <div className="p-2 bg-amber-500 rounded-xl">
                                  <Calendar className="h-5 w-5 text-white" />
                                </div>
                                <span className="font-semibold text-amber-700">Valid Until</span>
                              </div>
                              <p className="text-xl font-bold text-amber-800">
                                {formatDate(response.valid_until)}
                              </p>
                              <div className="flex items-center space-x-2 mt-2">
                                <Shield className="h-4 w-4 text-amber-600" />
                                <span className="text-sm text-amber-600 font-medium">Price Guaranteed</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Detailed Information */}
                        {(response.inclusions || response.value_added_services || response.terms || response.notes) && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {response.inclusions && (
                              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/50">
                                <h4 className="font-bold text-slate-800 mb-3 flex items-center space-x-2">
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                  <span>Inclusions</span>
                                </h4>
                                <p className="text-slate-700 leading-relaxed">{response.inclusions}</p>
                              </div>
                            )}
                            
                            {response.value_added_services && (
                              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/50">
                                <h4 className="font-bold text-slate-800 mb-3 flex items-center space-x-2">
                                  <Star className="h-5 w-5 text-yellow-500" />
                                  <span>Value Added Services</span>
                                </h4>
                                <p className="text-slate-700 leading-relaxed">{response.value_added_services}</p>
                              </div>
                            )}
                            
                            {response.terms && (
                              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/50">
                                <h4 className="font-bold text-slate-800 mb-3 flex items-center space-x-2">
                                  <Shield className="h-5 w-5 text-blue-500" />
                                  <span>Terms & Conditions</span>
                                </h4>
                                <p className="text-slate-700 leading-relaxed">{response.terms}</p>
                              </div>
                            )}
                            
                            {response.notes && (
                              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/50">
                                <h4 className="font-bold text-slate-800 mb-3 flex items-center space-x-2">
                                  <Award className="h-5 w-5 text-purple-500" />
                                  <span>Additional Notes</span>
                                </h4>
                                <p className="text-slate-700 leading-relaxed">{response.notes}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Bank Details Section - NEW */}
                        {(response.bank_name || response.account_number) && (
                          <div className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50 shadow-sm">
                            <h4 className="font-bold text-slate-800 mb-4 flex items-center space-x-2">
                              <FaUniversity className="h-5 w-5 text-blue-500" />
                              <span>Payment Bank Details</span>
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {response.bank_name && (
                                <div className="bg-white/80 rounded-xl p-4 border border-blue-100">
                                  <span className="text-slate-600 font-medium text-sm">Bank Name:</span>
                                  <p className="text-slate-800 font-bold">{response.bank_name}</p>
                                </div>
                              )}
                              {response.account_holder_name && (
                                <div className="bg-white/80 rounded-xl p-4 border border-blue-100">
                                  <span className="text-slate-600 font-medium text-sm">Bank Holder Name:</span>
                                  <p className="text-slate-800 font-bold">{response.account_holder_name}</p>
                                </div>
                              )}
                              {response.account_number && (
                                <div className="bg-white/80 rounded-xl p-4 border border-blue-100">
                                  <span className="text-slate-600 font-medium text-sm">Account Number:</span>
                                  <p className="text-slate-800 font-bold">{response.account_number}</p>
                                </div>
                              )}
                              {response.branch_name && (
                                <div className="bg-white/80 rounded-xl p-4 border border-blue-100">
                                  <span className="text-slate-600 font-medium text-sm">Branch Name:</span>
                                  <p className="text-slate-800 font-bold">{response.branch_name}</p>
                                </div>
                              )}
                              {response.iban_number && (
                                <div className="bg-white/80 rounded-xl p-4 border border-blue-100">
                                  <span className="text-slate-600 font-medium text-sm">IBAN Number:</span>
                                  <p className="text-slate-800 font-bold">{response.iban_number}</p>
                                </div>
                              )}
                              {response.swift_code && (
                                <div className="bg-white/80 rounded-xl p-4 border border-blue-100">
                                  <span className="text-slate-600 font-medium text-sm">SWIFT Code:</span>
                                  <p className="text-slate-800 font-bold">{response.swift_code}</p>
                                </div>
                              )}
                              {response.branch_address && (
                                <div className="bg-white/80 rounded-xl p-4 border border-blue-100">
                                  <span className="text-slate-600 font-medium text-sm">Branch Address:</span>
                                  <p className="text-slate-800 font-bold text-sm">{response.branch_address}</p>
                                </div>
                              )}
                            </div>
                            {response.bank_instructions && (
                              <div className="mt-4 bg-amber-50 rounded-xl p-4 border border-amber-200">
                                <span className="text-amber-700 font-medium text-sm">Payment Instructions:</span>
                                <p className="text-amber-800 text-sm mt-1">{response.bank_instructions}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Payment Status Section - Enhanced with Company Logic */}
                        {(response.user_response_status === 'accepted' || response.payment_status === 'rejected') && (
                          <div className="mb-8">
                            {/* Payment Verification Status - Similar to Company MyQuotes */}
                            {response.payment_status === 'verified' && (
                              <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center space-x-4">
                                  <div className="p-3 bg-green-500 rounded-xl shadow-sm">
                                    <CheckCircle className="h-5 w-5 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-bold text-green-800">✅ Payment Verified</h4>
                                    <p className="text-green-700">Your payment has been verified by the company. Work will begin as scheduled.</p>
                                    {response.verification_date && (
                                      <p className="text-green-600 text-sm mt-1">
                                        <strong>Verified on:</strong> {formatDate(response.verification_date)}
                                      </p>
                                    )}
                                  </div>
                                  <div className="bg-green-500/20 backdrop-blur-sm px-4 py-2 rounded-2xl border border-green-400/30">
                                    <span className="text-green-800 font-semibold">Payment Approved</span>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {response.payment_status === 'pending' && (
                              <div className="bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-300 rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-orange-500 rounded-xl shadow-sm">
                                      <FaCreditCard className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-orange-800">⏳ Payment Verification Pending</h4>
                                      <p className="text-orange-700">Your payment proof is being verified by the company. You'll be notified once it's reviewed.</p>
                                      {response.payment_proof_date && (
                                        <p className="text-orange-600 text-sm mt-1">
                                          <strong>Uploaded on:</strong> {formatDate(response.payment_proof_date)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="bg-orange-500/20 backdrop-blur-sm px-4 py-2 rounded-2xl border border-orange-400/30">
                                    <span className="text-orange-800 font-semibold">Under Review</span>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {!response.payment_status && (response.bank_name || response.account_number) && (
                              <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300 rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-blue-500 rounded-xl shadow-sm">
                                      <FaUpload className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-blue-800">💳 Payment Required</h4>
                                      <p className="text-blue-700">Please make payment to the bank details above and upload proof to proceed.</p>
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
                                    className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                                  >
                                    <Upload className="h-5 w-5" />
                                    <span>Upload Payment Proof</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action Buttons */}
                        {!response.user_response_status && !hasAcceptedResponse && (
                          <div className="space-y-6">
                            {/* Payment Upload Required First */}
                            {!Boolean(response.payment_proof_uploaded) && (response.bank_name || response.account_number) && (
                              <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300 rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-blue-500 rounded-xl shadow-sm">
                                      <FaUpload className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-blue-800">Payment Required First</h4>
                                      <p className="text-blue-700">Please make payment and upload proof before accepting this quote.</p>
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
                                    className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                                  >
                                    <Upload className="h-5 w-5" />
                                    <span>Upload Payment Proof</span>
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Payment Uploaded - Now Can Accept */}
                            {Boolean(response.payment_proof_uploaded) && response.payment_status === 'pending' && (
                              <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center space-x-4">
                                  <div className="p-3 bg-green-500 rounded-xl shadow-sm">
                                    <FaCreditCard className="h-5 w-5 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-green-800">Payment Proof Uploaded ✓</h4>
                                    <p className="text-green-700">You can now accept this quote. The company will verify your payment.</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Accept/Reject Buttons - Only show if payment proof uploaded OR no bank details required */}
                            {(Boolean(response.payment_proof_uploaded) || (!response.bank_name && !response.account_number)) && (
                              <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                  onClick={() => handleAcceptResponse(response.id, response.company_id)}
                                  disabled={actionLoading === response.id}
                                  className="flex-1 group relative overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                  <div className="relative flex items-center justify-center space-x-3">
                                    {actionLoading === response.id ? (
                                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                                    ) : (
                                      <>
                                        <CheckCircle className="h-6 w-6" />
                                        <span className="text-lg">Accept Quote</span>
                                      </>
                                    )}
                                  </div>
                                </button>
                            
                            <button
                              onClick={() => handleRejectResponse(response.id, response.company_id)}
                              disabled={actionLoading === response.id}
                              className="flex-1 group relative overflow-hidden bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                              <div className="relative flex items-center justify-center space-x-3">
                                {actionLoading === response.id ? (
                                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                                ) : (
                                  <>
                                    <XCircle className="h-6 w-6" />
                                    <span className="text-lg">Reject Quote</span>
                                  </>
                                )}
                              </div>
                            </button>
                              </div>
                            )}
                          </div>
                        )}

                        {hasAcceptedResponse && !response.user_response_status && (
                          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-6">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-amber-500 rounded-xl">
                                <FaShieldAlt className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-bold text-amber-800">Quote Already Accepted</h4>
                                <p className="text-amber-700">You have already accepted another quote for this request.</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                  });
                  
                  return mapResult;
                })()}
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

export default BusinessQuoteDetails;
