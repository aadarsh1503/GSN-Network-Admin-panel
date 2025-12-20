import { useState, useEffect } from 'react';
import { FaShip, FaPlane, FaTruck, FaTrain, FaEye, FaReply, FaClock, FaMapMarkerAlt, FaTimes } from 'react-icons/fa';
import { useLoading } from '../contexts/LoadingContext';
import { quotesAPI, api } from '../utils/api';
import PageLoader from '../components/Loader/PageLoader';
import toast from 'react-hot-toast';
import useMarkAsRead from '../hooks/useMarkAsRead';

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
  const [responseForm, setResponseForm] = useState({
    price: '',
    transitTime: '',
    inclusions: '',
    valueAddedServices: '',
    validUntil: '',
    terms: '',
    notes: ''
  });
  const [submittingResponse, setSubmittingResponse] = useState(false);
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
      setQuotes(data.quotes);
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
    // Reset form
    setResponseForm({
      price: '',
      transitTime: '',
      inclusions: '',
      valueAddedServices: '',
      validUntil: '',
      terms: '',
      notes: ''
    });
  };

  const handleResponseFormChange = (e) => {
    setResponseForm({
      ...responseForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    
    if (!responseForm.price || !responseForm.transitTime) {
      toast.error('Price and transit time are required');
      return;
    }

    setSubmittingResponse(true);
    try {
      await api.post('/quote-responses/submit', {
        quoteId: selectedQuote.id,
        price: parseFloat(responseForm.price),
        transitTime: responseForm.transitTime,
        inclusions: responseForm.inclusions,
        valueAddedServices: responseForm.valueAddedServices,
        validUntil: responseForm.validUntil || null,
        terms: responseForm.terms,
        notes: responseForm.notes
      });

      toast.success('Quote response submitted successfully!');
      setShowResponseModal(false);
      setSelectedQuote(null);
      
      // Refresh quotes to update response count
      await fetchAvailableQuotes();
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error(error.message || 'Failed to submit response');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const closeResponseModal = () => {
    setShowResponseModal(false);
    setSelectedQuote(null);
    setResponseForm({
      price: '',
      transitTime: '',
      inclusions: '',
      valueAddedServices: '',
      validUntil: '',
      terms: '',
      notes: ''
    });
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
        {quotes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No quotes available at the moment</p>
            <p className="text-gray-400 mt-2">Check back later for new opportunities</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {quotes.map((quote) => (
              <div key={quote.id} className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow relative ${!canRespond ? 'border-2 border-amber-200' : ''}`}>
                <div className="p-6">
                  {/* Quote Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      {getShippingIcon(quote.shipping_mode)}
                      <span className="ml-2 font-semibold text-gray-900 capitalize">
                        {quote.shipping_mode}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      ID: {quote.id}
                    </span>
                  </div>

                  {/* User Info */}
                  {(quote.user_name || quote.user_email) && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900 mb-1">Requested by:</p>
                        {quote.user_name && (
                          <p className="text-gray-700 font-medium">{quote.user_name}</p>
                        )}
                        {quote.user_email && (
                          <p className="text-gray-600 text-xs">{quote.user_email}</p>
                        )}
                        {quote.user_phone && (
                          <p className="text-gray-600 text-xs">📞 {quote.user_phone}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Route */}
                  <div className="mb-4">
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <FaMapMarkerAlt className="mr-1" />
                      <span className="font-medium">Route</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <p className="font-semibold text-gray-900">{quote.departure_country}</p>
                        {quote.departure_city && (
                          <p className="text-sm text-gray-500">{quote.departure_city}</p>
                        )}
                      </div>
                      <div className="flex-1 mx-4">
                        <div className="border-t-2 border-dashed border-gray-300 relative">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-white px-2 text-xs text-gray-500">→</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-900">{quote.arrival_country}</p>
                        {quote.arrival_city && (
                          <p className="text-sm text-gray-500">{quote.arrival_city}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">Product</p>
                    <p className="font-medium text-gray-900 truncate" title={quote.product_description}>
                      {quote.product_description}
                    </p>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600">Weight</p>
                      <p className="font-medium">{quote.weight || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Arrival Date</p>
                      <p className="font-medium flex items-center">
                        <FaClock className="mr-1" />
                        {formatDate(quote.arrival_date)}
                      </p>
                    </div>
                  </div>

                  {/* Incoterms & Responses */}
                  <div className="flex justify-between items-center mb-4 text-sm">
                    <div>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {quote.incoterms || 'Not specified'}
                      </span>
                    </div>
                    <div className="text-gray-600">
                      {quote.response_count} responses
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewDetails(quote)}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded hover:bg-gray-200 transition-colors flex items-center justify-center"
                    >
                      <FaEye className="mr-2" />
                      View Details
                    </button>
                    {quote.already_responded ? (
                      <button
                        disabled
                        className="flex-1 bg-gray-300 text-gray-500 py-2 px-4 rounded cursor-not-allowed flex items-center justify-center"
                        title="You have already responded to this quote"
                      >
                        <FaReply className="mr-2" />
                        Already Responded
                      </button>
                    ) : !canRespond ? (
                      <button
                        onClick={() => handleRespondToQuote(quote)}
                        className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white py-2 px-4 rounded hover:from-amber-600 hover:to-yellow-600 transition-all duration-300 flex items-center justify-center transform hover:scale-105 shadow-lg"
                      >
                        <FaReply className="mr-2" />
                        Upgrade to Respond
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRespondToQuote(quote)}
                        className="flex-1 bg-[#CDA435] text-white py-2 px-4 rounded hover:bg-yellow-600 transition-colors flex items-center justify-center"
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
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Quote Details</h2>
                  <button
                    onClick={() => setSelectedQuote(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  {/* User Info */}
                  {(selectedQuote.user_name || selectedQuote.user_email) && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Requested By:</h3>
                      <div className="space-y-1">
                        {selectedQuote.user_name && (
                          <p className="text-gray-900 font-medium">{selectedQuote.user_name}</p>
                        )}
                        {selectedQuote.user_email && (
                          <p className="text-gray-600 text-sm">✉️ {selectedQuote.user_email}</p>
                        )}
                        {selectedQuote.user_phone && (
                          <p className="text-gray-600 text-sm">📞 {selectedQuote.user_phone}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Shipping Mode</label>
                      <p className="mt-1 text-gray-900 capitalize">{selectedQuote.shipping_mode}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Arrival Date</label>
                      <p className="mt-1 text-gray-900">{formatDate(selectedQuote.arrival_date)}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Product Description</label>
                    <p className="mt-1 text-gray-900">{selectedQuote.product_description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Weight</label>
                      <p className="mt-1 text-gray-900">{selectedQuote.weight || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Quantity</label>
                      <p className="mt-1 text-gray-900">{selectedQuote.quantity || 'Not specified'}</p>
                    </div>
                  </div>

                  {selectedQuote.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
                      <p className="mt-1 text-gray-900">{selectedQuote.notes}</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => setSelectedQuote(null)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
                  >
                    Close
                  </button>
                  {selectedQuote.already_responded ? (
                    <button
                      disabled
                      className="flex-1 bg-gray-300 text-gray-500 py-2 px-4 rounded cursor-not-allowed"
                      title="You have already responded to this quote"
                    >
                      Already Responded
                    </button>
                  ) : !canRespond ? (
                    <button
                      onClick={() => handleRespondToQuote(selectedQuote)}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white py-2 px-4 rounded hover:from-amber-600 hover:to-yellow-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      🚀 Upgrade to Respond
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRespondToQuote(selectedQuote)}
                      className="flex-1 bg-[#CDA435] text-white py-2 px-4 rounded hover:bg-yellow-600 transition-colors"
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
        {showResponseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmitResponse}>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Submit Quote Response</h2>
                    <button
                      type="button"
                      onClick={closeResponseModal}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <FaTimes size={20} />
                    </button>
                  </div>

                  {/* Quote Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Quote Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Route:</span>
                        <span className="ml-2 font-medium">
                          {selectedQuote.departure_country} → {selectedQuote.arrival_country}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Mode:</span>
                        <span className="ml-2 font-medium capitalize">{selectedQuote.shipping_mode}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Product:</span>
                        <span className="ml-2 font-medium">{selectedQuote.product_description}</span>
                      </div>
                    </div>
                  </div>

                  {/* Response Form */}
                  <div className="space-y-4">
                    {/* Price and Transit Time */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price (USD) *
                        </label>
                        <input
                          type="number"
                          name="price"
                          value={responseForm.price}
                          onChange={handleResponseFormChange}
                          step="0.01"
                          min="0"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                          placeholder="Enter price"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Transit Time *
                        </label>
                        <input
                          type="text"
                          name="transitTime"
                          value={responseForm.transitTime}
                          onChange={handleResponseFormChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                          placeholder="e.g., 7-10 days"
                        />
                      </div>
                    </div>

                    {/* Valid Until */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valid Until
                      </label>
                      <input
                        type="date"
                        name="validUntil"
                        value={responseForm.validUntil}
                        onChange={handleResponseFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                      />
                    </div>

                    {/* Inclusions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Inclusions
                      </label>
                      <textarea
                        name="inclusions"
                        value={responseForm.inclusions}
                        onChange={handleResponseFormChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                        placeholder="What's included in your quote (e.g., pickup, delivery, insurance)"
                      />
                    </div>

                    {/* Value Added Services */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Value Added Services
                      </label>
                      <textarea
                        name="valueAddedServices"
                        value={responseForm.valueAddedServices}
                        onChange={handleResponseFormChange}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                        placeholder="Additional services you offer"
                      />
                    </div>

                    {/* Terms */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Terms & Conditions
                      </label>
                      <textarea
                        name="terms"
                        value={responseForm.terms}
                        onChange={handleResponseFormChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                        placeholder="Payment terms, conditions, etc."
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Notes
                      </label>
                      <textarea
                        name="notes"
                        value={responseForm.notes}
                        onChange={handleResponseFormChange}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                        placeholder="Any additional information"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex space-x-3">
                    <button
                      type="button"
                      onClick={closeResponseModal}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingResponse}
                      className="flex-1 bg-[#CDA435] text-white py-2 px-4 rounded hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingResponse ? 'Submitting...' : 'Submit Response'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
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