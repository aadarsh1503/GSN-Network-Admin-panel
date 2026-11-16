import { useState, useEffect, useMemo } from 'react';
import { FaShip, FaPlane,FaTimes , FaTruck, FaTrain, FaEye, FaReply, FaClock, FaMapMarkerAlt, FaFilter, FaSearch, FaSort } from 'react-icons/fa';
import { FiLock, FiArrowRight, FiAlertTriangle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '../contexts/LoadingContext';
import { quotesAPI, api } from '../utils/api';
import PageLoader from '../components/Loader/PageLoader';
import toast from 'react-hot-toast';
import useMarkAsRead from '../hooks/useMarkAsRead';
import EnhancedQuoteResponse from '../components/QuoteResponse/EnhancedQuoteResponse';
import { useProfileCompletionContext } from '../contexts/ProfileCompletionContext';

const MemberQuotesPage = () => {
  const [quotes, setQuotes] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [canRespond, setCanRespond] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    shippingMode: '',
    departureCountry: '',
    arrivalCountry: '',
    sortBy: 'newest', // newest, oldest, responses
    dateFrom: '',
    dateTo: '',
    hasResponded: 'all' // all, responded, not_responded
  });

  // Mark quote-related notifications as read when this page is visited
  useMarkAsRead('quotes');
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const { withLoading } = useLoading();
  const navigate = useNavigate();
  const { missingRequired, profile } = useProfileCompletionContext();

  // A company whose profile is incomplete (missing personal info / logo / bank
  // details) must not be able to browse or respond to quotes. We only gate once
  // the profile has actually loaded, so there is no flash on first paint.
  const profileBlocked = !!profile && missingRequired.length > 0;
  const missingLabels = missingRequired.flatMap((m) => (m.stepRequired ? [m.label] : m.pending));

  // Get unique values for filter dropdowns
  const uniqueValues = useMemo(() => {
    return {
      shippingModes: [...new Set(quotes.map(q => q.shipping_mode).filter(Boolean))],
      departureCountries: [...new Set(quotes.map(q => q.departure_country).filter(Boolean))],
      arrivalCountries: [...new Set(quotes.map(q => q.arrival_country).filter(Boolean))]
    };
  }, [quotes]);

  // Filter and sort quotes
  const filteredAndSortedQuotes = useMemo(() => {
    let filtered = quotes.filter(quote => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText = [
          quote.product_description,
          quote.user_name,
          quote.user_email,
          quote.departure_country,
          quote.arrival_country,
          quote.shipping_mode,
          quote.id?.toString()
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchTerm)) return false;
      }

      // Shipping mode filter
      if (filters.shippingMode && quote.shipping_mode !== filters.shippingMode) return false;

      // Country filters
      if (filters.departureCountry && quote.departure_country !== filters.departureCountry) return false;
      if (filters.arrivalCountry && quote.arrival_country !== filters.arrivalCountry) return false;

      // Date filters
      if (filters.dateFrom) {
        const quoteDate = new Date(quote.arrival_date);
        const fromDate = new Date(filters.dateFrom);
        if (quoteDate < fromDate) return false;
      }
      if (filters.dateTo) {
        const quoteDate = new Date(quote.arrival_date);
        const toDate = new Date(filters.dateTo);
        if (quoteDate > toDate) return false;
      }

      // Response status filter
      if (filters.hasResponded === 'responded' && !quote.already_responded) return false;
      if (filters.hasResponded === 'not_responded' && quote.already_responded) return false;

      return true;
    });

    // Sort quotes
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'oldest':
          return new Date(a.created_at || a.arrival_date) - new Date(b.created_at || b.arrival_date);
        case 'responses':
          return (b.response_count || 0) - (a.response_count || 0);
        case 'newest':
        default:
          return new Date(b.created_at || b.arrival_date) - new Date(a.created_at || a.arrival_date);
      }
    });

    return filtered;
  }, [quotes, filters]);

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      shippingMode: '',
      departureCountry: '',
      arrivalCountry: '',
      sortBy: 'newest',
      dateFrom: '',
      dateTo: '',
      hasResponded: 'all'
    });
  };

  // Check if any filters are active
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'sortBy') return value !== 'newest';
    if (key === 'hasResponded') return value !== 'all';
    return value !== '';
  });

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

  const getShippingIcon = (mode, color = 'text-white') => {
    switch (mode.toLowerCase()) {
      case 'sea': return <FaShip className={color} />;
      case 'air': return <FaPlane className={color} />;
      case 'road': return <FaTruck className={color} />;
      case 'rail': return <FaTrain className={color} />;
      default: return <FaShip className={color} />;
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
        <span className="text-xs bg-[#bca142] text-white px-2 py-1 rounded">
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
            <div className="bg-black/10 border border-black/30 text-black px-4 py-3 rounded mb-4">
              {error}
            </div>
            <a 
              href="/company/subscriptions" 
              className="bg-[#bca142] text-white px-6 py-2 rounded hover:bg-black transition-colors"
            >
              View Subscription Plans
            </a>
          </div>
        </div>
      )}
      
      {!error && (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Available Quotes</h1>
          
          {/* Subscription Info */}
          {hasActiveSubscription && subscription ? (
            <div className="bg-white rounded-lg shadow-md p-3 mb-3">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-semibold text-[#bca142]">
                    {subscription.planName} Plan
                  </h2>
                  <p className="text-xs text-gray-600">
                    Monthly Responses: {subscription.currentResponses} / {subscription.maxResponses}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Remaining</p>
                  <p className="text-lg font-bold text-[#bca142]">
                    {subscription.remainingResponses}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#bca142]/10 border-2 border-[#bca142]/30 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-[#bca142] rounded-full flex items-center justify-center mr-2">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-black">
                      Guest Mode - Browse Only
                    </h2>
                    <p className="text-black text-xs">
                      You can view all quotes but need a subscription to respond
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSubscriptionModal(true)}
                  className="bg-[#bca142] text-white px-3 py-1 rounded-lg hover:bg-black transition-all duration-300 transform hover:scale-105 shadow-lg font-medium text-sm"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-md p-3 mb-3 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-1">
                <FaFilter className="text-[#bca142] text-xs" />
                Filters & Search
              </h2>
              <span className="text-xs text-gray-500">
                {filteredAndSortedQuotes.length} of {quotes.length} quotes
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-black transition-colors"
                >
                  <FaTimes className="text-xs" />
                  Clear All
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                  showFilters 
                    ? 'bg-[#bca142] text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FaFilter className="text-xs" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
          </div>

          {/* Search Bar - Always Visible */}
          <div className="mb-2">
            <div className="relative">
              <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search quotes by ID, product, customer, country, or shipping mode..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Advanced Filters - Collapsible */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 pt-2 border-t border-gray-200">
              {/* Sort By */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent"
                >
                  <option value="newest">🆕 Newest First</option>
                  <option value="oldest">📅 Oldest First</option>
                  <option value="responses">📊 Most Responses</option>
                </select>
              </div>

              {/* Shipping Mode Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Shipping Mode</label>
                <select
                  value={filters.shippingMode}
                  onChange={(e) => setFilters(prev => ({ ...prev, shippingMode: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent"
                >
                  <option value="">🚢 All Shipping Modes</option>
                  {uniqueValues.shippingModes.map(mode => (
                    <option key={mode} value={mode}>
                      {mode === 'sea' ? '🚢' : mode === 'air' ? '✈️' : mode === 'road' ? '🚛' : '🚂'} {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Departure Country Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">From Country</label>
                <select
                  value={filters.departureCountry}
                  onChange={(e) => setFilters(prev => ({ ...prev, departureCountry: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent"
                >
                  <option value="">🌍 All Departure Countries</option>
                  {uniqueValues.departureCountries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              {/* Arrival Country Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">To Country</label>
                <select
                  value={filters.arrivalCountry}
                  onChange={(e) => setFilters(prev => ({ ...prev, arrivalCountry: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent"
                >
                  <option value="">🌍 All Arrival Countries</option>
                  {uniqueValues.arrivalCountries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              {/* Response Status Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Response Status</label>
                <select
                  value={filters.hasResponded}
                  onChange={(e) => setFilters(prev => ({ ...prev, hasResponded: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent"
                >
                  <option value="all">📋 All Quotes</option>
                  <option value="not_responded">🆕 Not Responded</option>
                  <option value="responded">✅ Already Responded</option>
                </select>
              </div>

              {/* Date From Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Arrival From</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent"
                />
              </div>

              {/* Date To Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Arrival To</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent"
                />
              </div>

              {/* Quick Filter Buttons */}
              <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Quick Filters</label>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, hasResponded: 'not_responded' }))}
                    className="px-2 py-1 text-xs bg-[#bca142]/20 text-[#bca142] rounded-full hover:bg-[#bca142]/30 transition-colors"
                  >
                    🆕 New Opportunities
                  </button>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, shippingMode: 'sea' }))}
                    className="px-2 py-1 text-xs bg-[#bca142]/20 text-[#bca142] rounded-full hover:bg-[#bca142]/30 transition-colors"
                  >
                    🚢 Sea Freight
                  </button>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, shippingMode: 'air' }))}
                    className="px-2 py-1 text-xs bg-black/20 text-black rounded-full hover:bg-black/30 transition-colors"
                  >
                    ✈️ Air Freight
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                      setFilters(prev => ({ 
                        ...prev, 
                        dateFrom: today.toISOString().split('T')[0],
                        dateTo: nextWeek.toISOString().split('T')[0]
                      }));
                    }}
                    className="px-2 py-1 text-xs bg-black/20 text-black rounded-full hover:bg-black/30 transition-colors"
                  >
                    📅 This Week
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quotes Grid — blurred until the profile is complete */}
        <div className={profileBlocked ? 'pointer-events-none select-none blur-[3px] opacity-50 transition-all duration-300' : ''}>
        {!filteredAndSortedQuotes || filteredAndSortedQuotes.length === 0 ? (
          <div className="text-center py-8">
            {quotes.length === 0 ? (
              <>
                <p className="text-gray-500 text-lg">No quotes available at the moment</p>
                <p className="text-gray-400 mt-2">Check back later for new opportunities</p>
              </>
            ) : (
              <>
                <p className="text-gray-500 text-lg">No quotes match your filters</p>
                <p className="text-gray-400 mt-2">Try adjusting your search criteria</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 bg-[#bca142] text-white rounded-lg hover:bg-black transition-colors text-sm"
                >
                  Clear All Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {filteredAndSortedQuotes.map((quote) => (
              <div key={quote.id} className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden ${!canRespond ? 'border-2 border-amber-200' : 'border border-gray-200'}`}>
                {/* Header Gradient */}
                <div className="bg-[#bca142] p-2">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-1">
                      {getShippingIcon(quote.shipping_mode)}
                      <span className="font-bold text-sm capitalize">
                        {quote.shipping_mode}
                      </span>
                    </div>
                    <span className="bg-white bg-opacity-20 text-black px-2 py-1 rounded-full text-xs font-medium">
                      ID: {quote.id}
                    </span>
                  </div>
                </div>

                <div className="p-3">
                  {/* User Info */}
                  {(quote.user_name || quote.user_email) && (
                    <div className="mb-2 p-2 bg-[#bca142]/10 rounded-lg border border-[#bca142]/30">
                      <div className="text-xs">
                        <p className="font-semibold text-[#bca142] mb-1 flex items-center gap-1">
                          <FaMapMarkerAlt className="text-[#bca142] text-xs" />
                          Requested by:
                          {!canSeeContactInfo() && <svg className="w-3 h-3 text-black ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                          </svg>}
                        </p>
                        {quote.user_name && (
                          <p className="text-black font-bold text-sm">{renderContactInfo(quote.user_name, 'Name')}</p>
                        )}
                        {quote.user_email && (
                          <p className="text-black text-xs">✉️ {renderContactInfo(quote.user_email, 'Email')}</p>
                        )}
                        {quote.user_phone && (
                          <p className="text-black text-xs">📞 {renderContactInfo(quote.user_phone, 'Phone')}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Route */}
                  <div className="mb-2">
                    <div className="flex items-center text-xs text-gray-600 mb-1">
                      <FaMapMarkerAlt className="mr-1 text-[#bca142]" />
                      <span className="font-semibold">Shipping Route</span>
                    </div>
                    <div className="flex items-center justify-between bg-[#bca142]/10 p-2 rounded-lg border border-[#bca142]/30">
                      <div className="text-center">
                        <p className="font-bold text-black text-xs">{quote.departure_country}</p>
                        {quote.departure_city && (
                          <p className="text-xs text-gray-700">{quote.departure_city}</p>
                        )}
                        {quote.departure_state && (
                          <p className="text-xs text-gray-600">{quote.departure_state}</p>
                        )}
                      </div>
                      <div className="flex-1 mx-2">
                        <div className="border-t-2 border-dashed border-[#bca142] relative">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-white px-2 py-1 text-xs font-bold text-[#bca142] rounded-full border border-[#bca142]">→</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-black text-xs">{quote.arrival_country}</p>
                        {quote.arrival_city && (
                          <p className="text-xs text-gray-700">{quote.arrival_city}</p>
                        )}
                        {quote.arrival_state && (
                          <p className="text-xs text-gray-600">{quote.arrival_state}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Product Info */}
                  {/* <div className="mb-2 p-2 bg-[#bca142]/10 rounded-lg border border-[#bca142]/30">
                    <p className="text-xs font-semibold text-[#bca142] mb-1">Product Details</p>
                    <p className="font-medium text-black mb-1 text-xs" title={quote.product_description}>
                      {quote.product_description}
                    </p>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div>
                        <span className="text-black">Weight:</span>
                        <span className="font-medium text-black ml-1">{quote.weight || 'N/A'}</span>
                      </div>
                      {quote.quantity && (
                        <div>
                          <span className="text-black">Qty:</span>
                          <span className="font-medium text-black ml-1">{quote.quantity}</span>
                        </div>
                      )}
                    </div>
                  </div> */}

                  {/* Timeline & Details */}
                  <div className="grid grid-cols-1 gap-2 mb-2 text-xs">
                    <div className="flex items-center justify-between p-2 bg-[#bca142]/10 rounded-lg border border-[#bca142]/30">
                      <div className="flex items-center gap-1">
                        <FaClock className="text-[#bca142]" />
                        <span className="text-black font-medium">Arrival Date:</span>
                      </div>
                      <span className="font-bold text-black">{formatDate(quote.arrival_date)}</span>
                    </div>
                    
                    {quote.incoterms && (
                      <div className="flex items-center justify-between">
                        <span className="bg-[#bca142] text-white px-2 py-1 rounded-full text-xs font-medium">
                          {quote.incoterms}
                        </span>
                        <span className="text-gray-600 text-xs">
                          {quote.response_count} responses
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleViewDetails(quote)}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 px-2 rounded-lg hover:bg-gray-200 transition-all duration-300 flex items-center justify-center font-medium shadow-sm text-xs"
                    >
                      <FaEye className="mr-1" />
                      View
                    </button>
                    {quote.already_responded ? (
                      <button
                        disabled
                        className="flex-1 bg-gray-300 text-gray-500 py-2 px-2 rounded-lg cursor-not-allowed flex items-center justify-center font-medium text-xs"
                        title="You have already responded to this quote"
                      >
                        <FaReply className="mr-1" />
                        Responded
                      </button>
                    ) : !canRespond ? (
                      <button
                        onClick={() => handleRespondToQuote(quote)}
                        className="flex-1 bg-[#bca142] text-white py-2 px-2 rounded-lg hover:bg-black transition-all duration-300 flex items-center justify-center transform hover:scale-105 shadow-lg font-medium text-xs"
                      >
                        <FaReply className="mr-1" />
                        Upgrade to Respond
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRespondToQuote(quote)}
                        className="flex-1 bg-[#bca142] text-white py-2 px-2 rounded-lg hover:bg-black transition-all duration-300 flex items-center justify-center transform hover:scale-105 font-medium text-xs"
                      >
                        <FaReply className="mr-1" />
                        Respond
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>

        {/* Profile-incomplete gate */}
        {profileBlocked && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#bca142]/25 bg-white p-6 shadow-[0_25px_70px_-20px_rgba(188,161,66,0.55)] sm:p-8">
              <div className="pointer-events-none absolute -top-20 -right-16 h-48 w-48 rounded-full bg-[#bca142]/20 blur-3xl" />
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
                  <FiLock size={24} />
                </div>
                <h2 className="mt-4 text-xl font-bold text-gray-900">
                  Complete your profile to view quotes
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                  Quotes stay locked until your profile is complete. Please add the following:
                </p>

                <div className="mt-4 space-y-2">
                  {missingLabels.map((label) => (
                    <div
                      key={label}
                      className="flex items-center gap-2.5 rounded-2xl border border-rose-200/70 bg-rose-50/70 p-3"
                    >
                      <FiAlertTriangle className="flex-shrink-0 text-rose-500" size={16} />
                      <span className="text-sm font-semibold text-rose-700">{label}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-col gap-2">
                  <button
                    onClick={() => navigate(missingRequired[0]?.link || '/company/edit-Profile')}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#bca142] to-[#a98f34] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#bca142]/30 transition-all hover:from-[#a98f34] hover:to-[#8f7826]"
                  >
                    Complete Profile <FiArrowRight size={14} />
                  </button>
                  <button
                    onClick={() => navigate('/company/dashboard')}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quote Details Modal */}
        {selectedQuote && !showResponseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/30 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl overflow-hidden bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35)]">
              {/* Decorative gold glow */}
              <div className="pointer-events-none absolute -top-24 -right-16 w-64 h-64 rounded-full opacity-40"
                style={{ background: 'radial-gradient(circle, rgba(188,161,66,0.35), transparent)', filter: 'blur(50px)' }} />
              <div className="pointer-events-none absolute -bottom-24 -left-16 w-64 h-64 rounded-full opacity-30"
                style={{ background: 'radial-gradient(circle, rgba(188,161,66,0.3), transparent)', filter: 'blur(50px)' }} />

              {/* Header */}
              <div className="relative flex items-center justify-between gap-3 px-5 sm:px-7 py-4 border-b border-[#bca142]/20 bg-white/50 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
                    style={{ background: 'linear-gradient(135deg, #d4b55e, #bca142)' }}>
                    <FaEye className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#bca142]">Available Quote</p>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">Quote #{selectedQuote.id}</h2>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedQuote(null)}
                  className="p-2.5 rounded-full text-gray-500 hover:text-gray-900 hover:bg-[#bca142]/10 transition-colors"
                >
                  <FaTimes className="text-lg" />
                </button>
              </div>

              {/* Body */}
              <div className="relative flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-4">
                {/* Quote Information */}
                <section className="rounded-2xl bg-white/60 backdrop-blur-md border border-[#bca142]/20 shadow-sm p-5">
                  <h3 className="text-base font-bold uppercase tracking-wide text-gray-900 mb-4">Quote Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold uppercase tracking-wide text-gray-800 mb-1.5">Quote ID</label>
                      <p className="text-gray-900 font-bold">#{selectedQuote.id}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold uppercase tracking-wide text-gray-800 mb-1.5">Submitted</label>
                      <p className="text-gray-900 font-medium text-base">{new Date(selectedQuote.created_at || selectedQuote.arrival_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold uppercase tracking-wide text-gray-800 mb-1.5">Status</label>
                      <span className="inline-flex items-center gap-1.5 bg-[#bca142]/15 text-[#8f7a2e] border border-[#bca142]/30 px-2.5 py-1 rounded-full text-xs font-semibold capitalize">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#bca142]" />
                        {selectedQuote.status || 'Active'}
                      </span>
                    </div>
                  </div>
                </section>

                {/* Customer Details */}
                {(selectedQuote.user_name || selectedQuote.user_email) && (
                  <section className="rounded-2xl bg-white/60 backdrop-blur-md border border-[#bca142]/20 shadow-sm p-5">
                    <h3 className="flex items-center gap-2 text-base font-bold uppercase tracking-wide text-gray-900 mb-4">
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#bca142]/15 text-[#bca142]"><FaMapMarkerAlt className="text-xs" /></span>
                      Customer Details
                      {!canSeeContactInfo() && <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                      </svg>}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-3">
                        {selectedQuote.user_name && (
                          <div>
                            <label className="block text-sm font-semibold uppercase tracking-wide text-gray-800 mb-1.5">Customer</label>
                            <p className="text-gray-900 font-semibold text-base">{renderContactInfo(selectedQuote.user_name, 'Name')} <span className="text-gray-500 font-normal capitalize">({selectedQuote.user_role || 'user'})</span></p>
                          </div>
                        )}
                        {selectedQuote.user_email && (
                          <div>
                            <label className="block text-sm font-semibold uppercase tracking-wide text-gray-800 mb-1.5">Contact</label>
                            <p className="text-gray-900 text-base">{renderContactInfo(selectedQuote.user_email, 'Email')}</p>
                          </div>
                        )}
                        {selectedQuote.user_phone && (
                          <div>
                            <label className="block text-sm font-semibold uppercase tracking-wide text-gray-800 mb-1.5">Phone</label>
                            <p className="text-gray-900 text-base">{renderContactInfo(selectedQuote.user_phone, 'Phone')}</p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        {(selectedQuote.user_country || selectedQuote.user_state || selectedQuote.user_city) && (
                          <div>
                            <label className="block text-sm font-semibold uppercase tracking-wide text-gray-800 mb-1.5">Customer Location</label>
                            <p className="text-gray-900 text-base">
                              {[selectedQuote.user_country, selectedQuote.user_state, selectedQuote.user_city].filter(Boolean).join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                )}

                {/* Shipping Requirements */}
                <section className="rounded-2xl bg-white/60 backdrop-blur-md border border-[#bca142]/20 shadow-sm p-5">
                  <h3 className="flex items-center gap-2 text-base font-bold uppercase tracking-wide text-gray-900 mb-4">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#bca142]/15 text-[#bca142]"><FaTruck className="text-xs" /></span>
                    Shipping Requirements
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold uppercase tracking-wide text-gray-800 mb-1.5">Shipping Mode</label>
                        <p className="text-gray-900 font-semibold capitalize flex items-center gap-2">
                          {getShippingIcon(selectedQuote.shipping_mode, 'text-[#bca142]')}
                          {selectedQuote.shipping_mode}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold uppercase tracking-wide text-gray-800 mb-1.5">Arrival Date</label>
                        <p className="text-gray-900 font-semibold">{formatDate(selectedQuote.arrival_date)}</p>
                      </div>
                      {selectedQuote.departure_date && (
                        <div>
                          <label className="block text-sm font-semibold uppercase tracking-wide text-gray-800 mb-1.5">Departure Date</label>
                          <p className="text-gray-900 font-medium">{formatDate(selectedQuote.departure_date)}</p>
                        </div>
                      )}
                      {selectedQuote.incoterms && (
                        <div>
                          <label className="block text-sm font-semibold uppercase tracking-wide text-gray-800 mb-1.5">Incoterms</label>
                          <span className="inline-block bg-[#bca142] text-white px-3 py-1 rounded-full text-xs font-semibold">{selectedQuote.incoterms}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold uppercase tracking-wide text-gray-800 mb-1.5">From</label>
                        <div className="text-gray-900">
                          <p className="font-semibold">{selectedQuote.departure_country}</p>
                          {selectedQuote.departure_state && <p className="text-[15px] text-gray-700">{selectedQuote.departure_state}</p>}
                          {selectedQuote.departure_city && <p className="text-[15px] text-gray-700">{selectedQuote.departure_city}</p>}
                          {selectedQuote.departure_type && <p className="text-sm text-gray-500">({selectedQuote.departure_type})</p>}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold uppercase tracking-wide text-gray-800 mb-1.5">To</label>
                        <div className="text-gray-900">
                          <p className="font-semibold">{selectedQuote.arrival_country}</p>
                          {selectedQuote.arrival_state && <p className="text-[15px] text-gray-700">{selectedQuote.arrival_state}</p>}
                          {selectedQuote.arrival_city && <p className="text-[15px] text-gray-700">{selectedQuote.arrival_city}</p>}
                          {selectedQuote.arrival_type && <p className="text-sm text-gray-500">({selectedQuote.arrival_type})</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Cargo Details */}
                <section className="rounded-2xl bg-white/60 backdrop-blur-md border border-[#bca142]/20 shadow-sm p-5">
                  <h3 className="flex items-center gap-2 text-base font-bold uppercase tracking-wide text-gray-900 mb-4">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#bca142]/15 text-[#bca142]">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                      </svg>
                    </span>
                    Cargo Details
                  </h3>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold uppercase tracking-wide text-gray-800 mb-1.5">Product</label>
                      <p className="text-gray-900 font-medium">{selectedQuote.product_description}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {selectedQuote.packing && (
                        <div>
                          <label className="block text-sm font-semibold uppercase tracking-wide text-gray-800 mb-1.5">Packing</label>
                          <p className="text-gray-900 capitalize">{selectedQuote.packing}</p>
                        </div>
                      )}
                      {selectedQuote.type && (
                        <div>
                          <label className="block text-sm font-semibold uppercase tracking-wide text-gray-800 mb-1.5">Cargo Type</label>
                          <p className="text-gray-900 capitalize">{selectedQuote.type}</p>
                        </div>
                      )}
                      {selectedQuote.quantity && (
                        <div>
                          <label className="block text-sm font-semibold uppercase tracking-wide text-gray-800 mb-1.5">Quantity</label>
                          <p className="text-gray-900">{selectedQuote.quantity}</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedQuote.weight && (
                        <div>
                          <label className="block text-sm font-semibold uppercase tracking-wide text-gray-800 mb-1.5">Weight</label>
                          <p className="text-gray-900 font-medium">{selectedQuote.weight} kg</p>
                        </div>
                      )}
                      {(selectedQuote.length && selectedQuote.width && selectedQuote.height) && (
                        <div>
                          <label className="block text-sm font-semibold uppercase tracking-wide text-gray-800 mb-1.5">Dimensions</label>
                          <p className="text-gray-900 font-medium">
                            {selectedQuote.length} × {selectedQuote.width} × {selectedQuote.height} {selectedQuote.dimension_unit || 'cm'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* Important Cargo Information */}
                {(selectedQuote.is_stackable !== undefined || selectedQuote.is_hazardous !== undefined || selectedQuote.has_insurance !== undefined) && (
                  <section className="rounded-2xl bg-white/60 backdrop-blur-md border border-[#bca142]/20 shadow-sm p-5">
                    <h3 className="flex items-center gap-2 text-base font-bold uppercase tracking-wide text-gray-900 mb-4">
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-amber-100 text-amber-600">⚠️</span>
                      Important Cargo Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {selectedQuote.is_stackable !== undefined && (
                        <div>
                          <label className="block text-sm font-semibold uppercase tracking-wide text-gray-800 mb-1.5">Stackable</label>
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${selectedQuote.is_stackable ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {selectedQuote.is_stackable ? '✅ Yes' : '❌ No'}
                          </span>
                        </div>
                      )}
                      {selectedQuote.is_hazardous !== undefined && (
                        <div>
                          <label className="block text-sm font-semibold uppercase tracking-wide text-gray-800 mb-1.5">Hazardous</label>
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${selectedQuote.is_hazardous ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {selectedQuote.is_hazardous ? '⚠️ Yes - Special handling' : '✅ No'}
                          </span>
                        </div>
                      )}
                      {selectedQuote.has_insurance !== undefined && (
                        <div>
                          <label className="block text-sm font-semibold uppercase tracking-wide text-gray-800 mb-1.5">Cargo Insurance</label>
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${selectedQuote.has_insurance ? 'bg-[#bca142]/20 text-[#8f7a2e]' : 'bg-gray-100 text-gray-600'}`}>
                            {selectedQuote.has_insurance ? '🛡️ Required' : '❌ Not required'}
                          </span>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Special Notes */}
                {selectedQuote.notes && (
                  <section className="rounded-2xl bg-white/60 backdrop-blur-md border border-[#bca142]/20 shadow-sm p-5">
                    <h3 className="flex items-center gap-2 text-base font-bold uppercase tracking-wide text-gray-900 mb-4">
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#bca142]/15">📝</span>
                      Special Notes
                    </h3>
                    <p className="text-gray-700 bg-white/70 p-4 rounded-xl border border-[#bca142]/20 italic">
                      "{selectedQuote.notes}"
                    </p>
                  </section>
                )}

                {/* Quote Statistics */}
                <section className="rounded-2xl bg-gradient-to-br from-[#bca142]/10 to-white/40 backdrop-blur-md border border-[#bca142]/20 shadow-sm p-5">
                  <h3 className="text-base font-bold uppercase tracking-wide text-gray-900 mb-4">Quote Statistics</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center rounded-xl bg-white/70 border border-[#bca142]/15 py-4">
                      <p className="text-2xl font-bold text-[#bca142]">{selectedQuote.response_count || 0}</p>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 mt-1">Responses</p>
                    </div>
                    <div className="text-center rounded-xl bg-white/70 border border-[#bca142]/15 py-4">
                      <p className="text-2xl font-bold text-[#bca142]">#{selectedQuote.id}</p>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 mt-1">Quote ID</p>
                    </div>
                    <div className="text-center rounded-xl bg-white/70 border border-[#bca142]/15 py-4">
                      <p className="text-base font-bold text-[#bca142] leading-tight mt-1">{formatDate(selectedQuote.created_at || selectedQuote.arrival_date)}</p>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 mt-1">Created</p>
                    </div>
                  </div>
                </section>
              </div>

              {/* Footer */}
              <div className="relative flex gap-3 px-5 sm:px-7 py-4 border-t border-[#bca142]/20 bg-white/50 backdrop-blur-xl">
                <button
                  onClick={() => setSelectedQuote(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-white/70 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors font-semibold text-sm"
                >
                  Close
                </button>
                {selectedQuote.already_responded ? (
                  <button
                    disabled
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gray-200 text-gray-400 cursor-not-allowed font-semibold text-sm"
                    title="You have already responded to this quote"
                  >
                    Already Responded
                  </button>
                ) : !canRespond ? (
                  <button
                    onClick={() => handleRespondToQuote(selectedQuote)}
                    className="flex-1 py-2.5 px-4 rounded-xl text-white font-semibold text-sm shadow-lg transition-all duration-300 hover:scale-[1.02]"
                    style={{ background: 'linear-gradient(135deg, #d4b55e, #bca142)' }}
                  >
                    🚀 Upgrade to Respond
                  </button>
                ) : (
                  <button
                    onClick={() => handleRespondToQuote(selectedQuote)}
                    className="flex-1 py-2.5 px-4 rounded-xl text-white font-semibold text-sm shadow-lg transition-all duration-300 hover:scale-[1.02]"
                    style={{ background: 'linear-gradient(135deg, #d4b55e, #bca142)' }}
                  >
                    Respond to Quote
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Subscription Required Modal */}
        {showSubscriptionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="bg-[#bca142] p-6 text-white text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Unlock Premium Features</h2>
                <p className="text-white/80">Upgrade your account to respond to quotes</p>
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
                    <div className="w-5 h-5 bg-[#bca142] rounded-full flex items-center justify-center mr-3">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700">View unlimited quotes</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-[#bca142] rounded-full flex items-center justify-center mr-3">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700">Submit competitive responses</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-[#bca142] rounded-full flex items-center justify-center mr-3">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700">Direct communication with clients</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-[#bca142] rounded-full flex items-center justify-center mr-3">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
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
                    className="w-full bg-[#bca142] text-white py-3 px-6 rounded-lg font-semibold text-center block hover:bg-black transition-all duration-300 transform hover:scale-105 shadow-lg"
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
              className="bg-[#bca142] text-white p-4 rounded-full shadow-2xl hover:bg-black transition-all duration-300 transform hover:scale-110 group"
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