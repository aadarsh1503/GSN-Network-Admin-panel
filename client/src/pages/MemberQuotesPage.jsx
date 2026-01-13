import { useState, useEffect } from 'react';
import { FaShip, FaPlane,FaTimes , FaTruck, FaTrain, FaEye, FaReply, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import { useLoading } from '../contexts/LoadingContext';
import { quotesAPI, api } from '../utils/api';
import PageLoader from '../components/Loader/PageLoader';
import toast from 'react-hot-toast';
import useMarkAsRead from '../hooks/useMarkAsRead';
import EnhancedQuoteResponse from '../components/QuoteResponse/EnhancedQuoteResponse';

const MemberQuotesPage = () => {
  const [quotes, setQuotes] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [canRespond, setCanRespond] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mark quote-related notifications as read when this page is visited
  useMarkAsRead('quotes');
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const { withLoading } = useLoading();

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    await withLoading(async () => {
      await fetchAvailableQuotes();
    }, 'Loading available quotes...');
  };

  const fetchAvailableQuotes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to view quotes');
        setLoading(false);
        return;
      }

      const data = await quotesAPI.getAvailableQuotes();
      setQuotes(data.quotes || []);
      setSubscription(data.subscription);
      setHasActiveSubscription(data.hasActiveSubscription);
      setCanRespond(data.canRespond);
      setError(null);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      setError(error.message || 'Error loading quotes');
    } finally {
      setLoading(false);
    }
  };

  const getShippingIcon = (mode) => {
    switch (mode.toLowerCase()) {
      case 'sea': return <FaShip className="text-blue-500" />;
      case 'air': return <FaPlane className="text-sky-500" />;
      case 'road': return <FaTruck className="text-green-500" />;
      case 'rail': return <FaTrain className="text-purple-500" />;
      default: return <FaShip className="text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewDetails = (quote) => {
    setSelectedQuote(quote);
  };

  const handleRespondToQuote = (quote) => {
    if (!canRespond) {
      setShowSubscriptionModal(true);
      return;
    }
    
    setSelectedQuote(quote);
    setShowResponseModal(true);
  };

  // Check if user can see contact information
  const canSeeContactInfo = () => {
    if (!subscription) return false;
    if (subscription.maxResponses === 0) return false; // Basic plan
    if (subscription.maxResponses !== -1 && subscription.currentResponses >= subscription.maxResponses) return false; // Exhausted responses
    return hasActiveSubscription;
  };

  // Simple and clean contact info hiding
  const renderContactInfo = (info, label) => {
    if (canSeeContactInfo()) {
      return info || 'N/A';
    }
    
    return (
      <div className="flex items-center gap-2">
        <span className="text-gray-400">●●●●●●●●●●</span>
        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
          Upgrade to view
        </span>
      </div>
    );
  };

  const handleResponseSuccess = async () => {
    setShowResponseModal(false);
    setSelectedQuote(null);
    
    // Show success message
    toast.success('Response submitted successfully!');
    
    // Force refresh with delay to ensure backend processing is complete
    setTimeout(async () => {
      await fetchAvailableQuotes();
    }, 1000);
    
    // Also refresh immediately
    await fetchAvailableQuotes();
  };

  const closeResponseModal = () => {
    setShowResponseModal(false);
    setSelectedQuote(null);
  };

  return (
    <PageLoader loading={loading} error={error} loadingMessage="Loading available quotes...">
      {error && error.includes('subscription') && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
            <a 
              href="/company/subscriptions" 
              className="bg-[#CDA435] text-white px-6 py-2 rounded hover:bg-yellow-600 transition-colors"
            >
              View Subscription Plans
            </a>
          </div>
        </div>
      )}
      
      {!error && (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Available Quotes</h1>
          
          {/* Subscription Info */}
          {hasActiveSubscription && subscription ? (
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-[#CDA435]">
                    {subscription.planName} Plan
                  </h2>
                  <p className="text-gray-600">
                    Monthly Responses: {subscription.currentResponses} / {subscription.maxResponses}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Remaining</p>
                  <p className="text-xl font-bold text-green-600">
                    {subscription.remainingResponses}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-[#CDA435] rounded-full flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-amber-900">
                      Guest Mode - Browse Only
                    </h2>
                    <p className="text-amber-700 text-sm">
                      You can view all quotes but need a subscription to respond
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSubscriptionModal(true)}
                  className="bg-[#CDA435] text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-medium"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quotes Grid */}
        {!quotes || quotes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No quotes available at the moment</p>
            <p className="text-gray-400 mt-2">Check back later for new opportunities</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {quotes.map((quote) => (
              <div key={quote.id} className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden ${!canRespond ? 'border-2 border-amber-200' : 'border border-gray-200'}`}>
                {/* Header Gradient */}
                <div className="bg-gradient-to-r from-[#CDA435] to-[#D9B95B] p-4">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      {getShippingIcon(quote.shipping_mode)}
                      <span className="font-bold text-lg capitalize">
                        {quote.shipping_mode}
                      </span>
                    </div>
                    <span className="bg-white bg-opacity-20 text-black px-3 py-1 rounded-full text-sm font-medium">
                      ID: {quote.id}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  {/* User Info */}
                  {(quote.user_name || quote.user_email) && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="text-sm">
                        <p className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                          <FaMapMarkerAlt className="text-blue-600" />
                          Requested by:
                          {!canSeeContactInfo() && <svg className="w-4 h-4 text-yellow-500 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                          </svg>}
                        </p>
                        {quote.user_name && (
                          <p className="text-blue-900 font-bold text-lg">{renderContactInfo(quote.user_name, 'Name')}</p>
                        )}
                        {quote.user_email && (
                          <p className="text-blue-700 text-sm">✉️ {renderContactInfo(quote.user_email, 'Email')}</p>
                        )}
                        {quote.user_phone && (
                          <p className="text-blue-700 text-sm">📞 {renderContactInfo(quote.user_phone, 'Phone')}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Route */}
                  <div className="mb-4">
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <FaMapMarkerAlt className="mr-2 text-[#CDA435]" />
                      <span className="font-semibold">Shipping Route</span>
                    </div>
                    <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-xl border border-green-200">
                      <div className="text-center">
                        <p className="font-bold text-green-900">{quote.departure_country}</p>
                        {quote.departure_city && (
                          <p className="text-sm text-green-700">{quote.departure_city}</p>
                        )}
                        {quote.departure_state && (
                          <p className="text-xs text-green-600">{quote.departure_state}</p>
                        )}
                      </div>
                      <div className="flex-1 mx-4">
                        <div className="border-t-2 border-dashed border-green-400 relative">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-white px-3 py-1 text-sm font-bold text-green-600 rounded-full border border-green-300">→</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-green-900">{quote.arrival_country}</p>
                        {quote.arrival_city && (
                          <p className="text-sm text-green-700">{quote.arrival_city}</p>
                        )}
                        {quote.arrival_state && (
                          <p className="text-xs text-green-600">{quote.arrival_state}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="mb-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200">
                    <p className="text-sm font-semibold text-yellow-800 mb-2">Product Details</p>
                    <p className="font-medium text-yellow-900 mb-2" title={quote.product_description}>
                      {quote.product_description}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-yellow-700">Weight:</span>
                        <span className="font-medium text-yellow-900 ml-1">{quote.weight || 'N/A'}</span>
                      </div>
                      {quote.quantity && (
                        <div>
                          <span className="text-yellow-700">Qty:</span>
                          <span className="font-medium text-yellow-900 ml-1">{quote.quantity}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline & Details */}
                  <div className="grid grid-cols-1 gap-3 mb-4 text-sm">
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2">
                        <FaClock className="text-purple-600" />
                        <span className="text-purple-700 font-medium">Arrival Date:</span>
                      </div>
                      <span className="font-bold text-purple-900">{formatDate(quote.arrival_date)}</span>
                    </div>
                    
                    {quote.incoterms && (
                      <div className="flex items-center justify-between">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                          {quote.incoterms}
                        </span>
                        <span className="text-gray-600 text-sm">
                          {quote.response_count} responses
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewDetails(quote)}
                      className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 py-3 px-4 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-300 flex items-center justify-center font-medium shadow-sm"
                    >
                      <FaEye className="mr-2" />
                      View Details
                    </button>
                    {quote.already_responded ? (
                      <button
                        disabled
                        className="flex-1 bg-gray-300 text-gray-500 py-3 px-4 rounded-xl cursor-not-allowed flex items-center justify-center font-medium"
                        title="You have already responded to this quote"
                      >
                        <FaReply className="mr-2" />
                        Responded
                      </button>
                    ) : !canRespond ? (
                      <button
                        onClick={() => handleRespondToQuote(quote)}
                        className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white py-3 px-4 rounded-xl hover:from-amber-600 hover:to-yellow-600 transition-all duration-300 flex items-center justify-center transform hover:scale-105 shadow-lg font-medium"
                      >
                        <FaReply className="mr-2" />
                        Upgrade to Respond
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRespondToQuote(quote)}
                        className="flex-1 bg-gradient-to-r from-[#CDA435] to-[#D9B95B] text-white py-3 px-4 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center transform hover:scale-105 font-medium"
                      >
                        <FaReply className="mr-2" />
                        Respond
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quote Details Modal */}
        {selectedQuote && !showResponseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-[#CDA435] to-[#D9B95B] bg-clip-text text-transparent">
                    Quote Details #{selectedQuote.id}
                  </h2>
                  <button
                    onClick={() => setSelectedQuote(null)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FaTimes className="text-xl" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Quote Header Info */}
                  <div className="p-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border-2 border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Quote Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Quote ID:</label>
                        <p className="text-gray-900 font-bold">#{selectedQuote.id}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Submitted:</label>
                        <p className="text-gray-800">{new Date(selectedQuote.created_at || selectedQuote.arrival_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Status:</label>
                        <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          {selectedQuote.status || 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  {(selectedQuote.user_name || selectedQuote.user_email) && (
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                      <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
                        <FaMapMarkerAlt className="text-blue-600" />
                        Customer Details
                        {!canSeeContactInfo() && <svg className="w-5 h-5 text-yellow-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          {selectedQuote.user_name && (
                            <div>
                              <label className="block text-sm font-semibold text-blue-700">Customer:</label>
                              <p className="text-blue-900 font-medium">{renderContactInfo(selectedQuote.user_name, 'Name')} ({selectedQuote.user_role || 'user'})</p>
                            </div>
                          )}
                          {selectedQuote.user_email && (
                            <div>
                              <label className="block text-sm font-semibold text-blue-700">Contact:</label>
                              <p className="text-blue-800">{renderContactInfo(selectedQuote.user_email, 'Email')}</p>
                            </div>
                          )}
                          {selectedQuote.user_phone && (
                            <div>
                              <label className="block text-sm font-semibold text-blue-700">Phone:</label>
                              <p className="text-blue-800">{renderContactInfo(selectedQuote.user_phone, 'Phone')}</p>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          {(selectedQuote.user_country || selectedQuote.user_state || selectedQuote.user_city) && (
                            <div>
                              <label className="block text-sm font-semibold text-blue-700">Customer Location:</label>
                              <p className="text-blue-800">
                                {[selectedQuote.user_country, selectedQuote.user_state, selectedQuote.user_city].filter(Boolean).join(', ')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Shipping Requirements */}
                  <div className="p-6 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border-2 border-purple-200">
                    <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center gap-2">
                      <FaTruck className="text-purple-600" />
                      Shipping Requirements
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-semibold text-purple-700">Shipping Mode:</label>
                          <p className="text-purple-900 font-medium capitalize flex items-center gap-2">
                            {getShippingIcon(selectedQuote.shipping_mode)}
                            {selectedQuote.shipping_mode}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-purple-700">Arrival Date:</label>
                          <p className="text-purple-800 font-medium">{formatDate(selectedQuote.arrival_date)}</p>
                        </div>
                        {selectedQuote.departure_date && (
                          <div>
                            <label className="block text-sm font-semibold text-purple-700">Departure Date:</label>
                            <p className="text-purple-800">{formatDate(selectedQuote.departure_date)}</p>
                          </div>
                        )}
                        {selectedQuote.incoterms && (
                          <div>
                            <label className="block text-sm font-semibold text-purple-700">Incoterms:</label>
                            <p className="text-purple-800 font-medium">{selectedQuote.incoterms}</p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-semibold text-purple-700">From:</label>
                          <div className="text-purple-800">
                            <p className="font-medium">{selectedQuote.departure_country}</p>
                            {selectedQuote.departure_state && <p className="text-sm">{selectedQuote.departure_state}</p>}
                            {selectedQuote.departure_city && <p className="text-sm">{selectedQuote.departure_city}</p>}
                            {selectedQuote.departure_type && <p className="text-xs text-purple-600">({selectedQuote.departure_type})</p>}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-purple-700">To:</label>
                          <div className="text-purple-800">
                            <p className="font-medium">{selectedQuote.arrival_country}</p>
                            {selectedQuote.arrival_state && <p className="text-sm">{selectedQuote.arrival_state}</p>}
                            {selectedQuote.arrival_city && <p className="text-sm">{selectedQuote.arrival_city}</p>}
                            {selectedQuote.arrival_type && <p className="text-xs text-purple-600">({selectedQuote.arrival_type})</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cargo Details */}
                  <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                    <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                      </svg>
                      Cargo Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-green-700">Product:</label>
                        <p className="text-green-900 font-medium">{selectedQuote.product_description}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selectedQuote.packing && (
                          <div>
                            <label className="block text-sm font-semibold text-green-700">Packing:</label>
                            <p className="text-green-800 capitalize">{selectedQuote.packing}</p>
                          </div>
                        )}
                        {selectedQuote.type && (
                          <div>
                            <label className="block text-sm font-semibold text-green-700">Cargo Type:</label>
                            <p className="text-green-800 capitalize">{selectedQuote.type}</p>
                          </div>
                        )}
                        {selectedQuote.quantity && (
                          <div>
                            <label className="block text-sm font-semibold text-green-700">Quantity:</label>
                            <p className="text-green-800">{selectedQuote.quantity}</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedQuote.weight && (
                          <div>
                            <label className="block text-sm font-semibold text-green-700">Weight:</label>
                            <p className="text-green-800 font-medium">{selectedQuote.weight}</p>
                          </div>
                        )}
                        {(selectedQuote.length && selectedQuote.width && selectedQuote.height) && (
                          <div>
                            <label className="block text-sm font-semibold text-green-700">Dimensions:</label>
                            <p className="text-green-800 font-medium">
                              {selectedQuote.length} x {selectedQuote.width} x {selectedQuote.height} {selectedQuote.dimension_unit || 'cm'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Important Cargo Information */}
                  {(selectedQuote.is_stackable !== undefined || selectedQuote.is_hazardous !== undefined || selectedQuote.has_insurance !== undefined) && (
                    <div className="p-6 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border-2 border-red-200">
                      <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center gap-2">
                        ⚠️ Important Cargo Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selectedQuote.is_stackable !== undefined && (
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-semibold text-red-700">Stackable:</label>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              selectedQuote.is_stackable 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {selectedQuote.is_stackable ? '✅ Yes' : '❌ No'}
                            </span>
                          </div>
                        )}
                        {selectedQuote.is_hazardous !== undefined && (
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-semibold text-red-700">Hazardous:</label>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              selectedQuote.is_hazardous 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {selectedQuote.is_hazardous ? '⚠️ Yes - Special handling required' : '✅ No'}
                            </span>
                          </div>
                        )}
                        {selectedQuote.has_insurance !== undefined && (
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-semibold text-red-700">Cargo Insurance:</label>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              selectedQuote.has_insurance 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {selectedQuote.has_insurance ? '🛡️ Required' : '❌ Not required'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Additional Notes */}
                  {selectedQuote.notes && (
                    <div className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border-2 border-yellow-200">
                      <h3 className="text-xl font-bold text-yellow-800 mb-4 flex items-center gap-2">
                        📝 Special Notes
                      </h3>
                      <p className="text-yellow-900 bg-white p-4 rounded-lg border border-yellow-200 italic">
                        "{selectedQuote.notes}"
                      </p>
                    </div>
                  )}

                  {/* Quote Statistics */}
                  <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                    <h3 className="text-xl font-bold text-purple-800 mb-4">Quote Statistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-900">{selectedQuote.response_count || 0}</p>
                        <p className="text-sm text-purple-700">Total Responses</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-900">#{selectedQuote.id}</p>
                        <p className="text-sm text-purple-700">Quote ID</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-900">{formatDate(selectedQuote.created_at || selectedQuote.arrival_date)}</p>
                        <p className="text-sm text-purple-700">Created</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex space-x-4">
                  <button
                    onClick={() => setSelectedQuote(null)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  >
                    Close
                  </button>
                  {selectedQuote.already_responded ? (
                    <button
                      disabled
                      className="flex-1 bg-gray-300 text-gray-500 py-3 px-6 rounded-xl cursor-not-allowed font-medium"
                      title="You have already responded to this quote"
                    >
                      Already Responded
                    </button>
                  ) : !canRespond ? (
                    <button
                      onClick={() => handleRespondToQuote(selectedQuote)}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white py-3 px-6 rounded-xl hover:from-amber-600 hover:to-yellow-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-medium"
                    >
                      🚀 Upgrade to Respond
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRespondToQuote(selectedQuote)}
                      className="flex-1 bg-gradient-to-r from-[#CDA435] to-[#D9B95B] text-white py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-medium"
                    >
                      Respond to Quote
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Required Modal */}
        {showSubscriptionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-amber-600 to-yellow-600 p-6 text-white text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Unlock Premium Features</h2>
                <p className="text-amber-100">Upgrade your account to respond to quotes</p>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    You're viewing in Guest Mode
                  </h3>
                  <p className="text-gray-600 mb-4">
                    You can browse all available quotes, but need an active subscription to submit responses and grow your business.
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700">View unlimited quotes</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700">Submit competitive responses</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700">Direct communication with clients</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700">Priority support & analytics</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <a
                    href="/company/subscriptions"
                    className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 text-white py-3 px-6 rounded-lg font-semibold text-center block hover:from-amber-700 hover:to-yellow-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    🚀 Choose Your Plan
                  </a>
                  <button
                    onClick={() => setShowSubscriptionModal(false)}
                    className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Continue Browsing
                  </button>
                </div>

                {/* Small print */}
                <p className="text-xs text-gray-500 text-center mt-4">
                  Start with our basic plan from just $29/month
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quote Response Modal */}
        {showResponseModal && selectedQuote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <EnhancedQuoteResponse 
              quote={selectedQuote}
              onClose={closeResponseModal}
              onSuccess={handleResponseSuccess}
            />
          </div>
        )}

        {/* Floating Upgrade Button for Guests */}
        {!hasActiveSubscription && (
          <div className="fixed bottom-6 right-6 z-40">
            <button
              onClick={() => setShowSubscriptionModal(true)}
              className="bg-gradient-to-r from-amber-600 to-yellow-600 text-white p-4 rounded-full shadow-2xl hover:from-amber-700 hover:to-yellow-700 transition-all duration-300 transform hover:scale-110 group"
              title="Upgrade to Premium"
            >
              <div className="flex items-center">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <span className="ml-2 font-medium hidden group-hover:inline-block transition-all duration-300">
                  Upgrade
                </span>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
      )}
    </PageLoader>
  );
};

export default MemberQuotesPage;