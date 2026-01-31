import { useState, useEffect, useMemo } from 'react';
import { FaShip, FaPlane,FaTimes , FaTruck, FaTrain, FaEye, FaReply, FaClock, FaMapMarkerAlt, FaFilter, FaSearch, FaSort } from 'react-icons/fa';
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

        {/* Quotes Grid */}
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

        {/* Quote Details Modal */}
        {selectedQuote && !showResponseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-[#bca142]">
                    Quote Details #{selectedQuote.id}
                  </h2>
                  <button
                    onClick={() => setSelectedQuote(null)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FaTimes className="text-lg" />
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Quote Header Info */}
                  <div className="p-3 bg-[#bca142]/10 rounded-lg border-2 border-[#bca142]/30">
                    <h3 className="text-lg font-bold text-black mb-2">Quote Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700">Quote ID:</label>
                        <p className="text-gray-900 font-bold">#{selectedQuote.id}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700">Submitted:</label>
                        <p className="text-gray-800 text-sm">{new Date(selectedQuote.created_at || selectedQuote.arrival_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700">Status:</label>
                        <span className="inline-block bg-[#bca142] text-white px-2 py-1 rounded-full text-xs font-medium">
                          {selectedQuote.status || 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  {(selectedQuote.user_name || selectedQuote.user_email) && (
                    <div className="p-3 bg-[#bca142]/10 rounded-lg border-2 border-[#bca142]/30">
                      <h3 className="text-lg font-bold text-[#bca142] mb-2 flex items-center gap-2">
                        <FaMapMarkerAlt className="text-[#bca142]" />
                        Customer Details
                        {!canSeeContactInfo() && <svg className="w-4 h-4 text-black ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          {selectedQuote.user_name && (
                            <div>
                              <label className="block text-xs font-semibold text-black">Customer:</label>
                              <p className="text-black font-medium text-sm">{renderContactInfo(selectedQuote.user_name, 'Name')} ({selectedQuote.user_role || 'user'})</p>
                            </div>
                          )}
                          {selectedQuote.user_email && (
                            <div>
                              <label className="block text-xs font-semibold text-black">Contact:</label>
                              <p className="text-black text-sm">{renderContactInfo(selectedQuote.user_email, 'Email')}</p>
                            </div>
                          )}
                          {selectedQuote.user_phone && (
                            <div>
                              <label className="block text-xs font-semibold text-black">Phone:</label>
                              <p className="text-black text-sm">{renderContactInfo(selectedQuote.user_phone, 'Phone')}</p>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          {(selectedQuote.user_country || selectedQuote.user_state || selectedQuote.user_city) && (
                            <div>
                              <label className="block text-xs font-semibold text-black">Customer Location:</label>
                              <p className="text-black text-sm">
                                {[selectedQuote.user_country, selectedQuote.user_state, selectedQuote.user_city].filter(Boolean).join(', ')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Shipping Requirements */}
                  <div className="p-6 bg-[#bca142]/10 rounded-xl border-2 border-[#bca142]/30">
                    <h3 className="text-xl font-bold text-[#bca142] mb-4 flex items-center gap-2">
                      <FaTruck className="text-[#bca142]" />
                      Shipping Requirements
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-semibold text-black">Shipping Mode:</label>
                          <p className="text-black font-medium capitalize flex items-center gap-2">
                            {getShippingIcon(selectedQuote.shipping_mode, 'text-[#bca142]')}
                            {selectedQuote.shipping_mode}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-black">Arrival Date:</label>
                          <p className="text-black font-medium">{formatDate(selectedQuote.arrival_date)}</p>
                        </div>
                        {selectedQuote.departure_date && (
                          <div>
                            <label className="block text-sm font-semibold text-black">Departure Date:</label>
                            <p className="text-black">{formatDate(selectedQuote.departure_date)}</p>
                          </div>
                        )}
                        {selectedQuote.incoterms && (
                          <div>
                            <label className="block text-sm font-semibold text-black">Incoterms:</label>
                            <p className="text-black font-medium">{selectedQuote.incoterms}</p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-semibold text-black">From:</label>
                          <div className="text-black">
                            <p className="font-medium">{selectedQuote.departure_country}</p>
                            {selectedQuote.departure_state && <p className="text-sm">{selectedQuote.departure_state}</p>}
                            {selectedQuote.departure_city && <p className="text-sm">{selectedQuote.departure_city}</p>}
                            {selectedQuote.departure_type && <p className="text-xs text-gray-600">({selectedQuote.departure_type})</p>}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-black">To:</label>
                          <div className="text-black">
                            <p className="font-medium">{selectedQuote.arrival_country}</p>
                            {selectedQuote.arrival_state && <p className="text-sm">{selectedQuote.arrival_state}</p>}
                            {selectedQuote.arrival_city && <p className="text-sm">{selectedQuote.arrival_city}</p>}
                            {selectedQuote.arrival_type && <p className="text-xs text-gray-600">({selectedQuote.arrival_type})</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cargo Details */}
                  <div className="p-6 bg-[#bca142]/10 rounded-xl border-2 border-[#bca142]/30">
                    <h3 className="text-xl font-bold text-[#bca142] mb-4 flex items-center gap-2">
                      <svg className="w-6 h-6 text-[#bca142]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                      </svg>
                      Cargo Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-black">Product:</label>
                        <p className="text-black font-medium">{selectedQuote.product_description}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selectedQuote.packing && (
                          <div>
                            <label className="block text-sm font-semibold text-black">Packing:</label>
                            <p className="text-black capitalize">{selectedQuote.packing}</p>
                          </div>
                        )}
                        {selectedQuote.type && (
                          <div>
                            <label className="block text-sm font-semibold text-black">Cargo Type:</label>
                            <p className="text-black capitalize">{selectedQuote.type}</p>
                          </div>
                        )}
                        {selectedQuote.quantity && (
                          <div>
                            <label className="block text-sm font-semibold text-black">Quantity:</label>
                            <p className="text-black">{selectedQuote.quantity}</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedQuote.weight && (
                          <div>
                            <label className="block text-sm font-semibold text-black">Weight:</label>
                            <p className="text-black font-medium">{selectedQuote.weight}</p>
                          </div>
                        )}
                        {(selectedQuote.length && selectedQuote.width && selectedQuote.height) && (
                          <div>
                            <label className="block text-sm font-semibold text-black">Dimensions:</label>
                            <p className="text-black font-medium">
                              {selectedQuote.length} x {selectedQuote.width} x {selectedQuote.height} {selectedQuote.dimension_unit || 'cm'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Important Cargo Information */}
                  {(selectedQuote.is_stackable !== undefined || selectedQuote.is_hazardous !== undefined || selectedQuote.has_insurance !== undefined) && (
                    <div className="p-6 bg-[#bca142]/10 rounded-xl border-2 border-[#bca142]/30">
                      <h3 className="text-xl font-bold text-[#bca142] mb-4 flex items-center gap-2">
                        ⚠️ Important Cargo Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selectedQuote.is_stackable !== undefined && (
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-semibold text-black">Stackable:</label>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              selectedQuote.is_stackable 
                                ? 'bg-[#bca142] text-white' 
                                : 'bg-black text-white'
                            }`}>
                              {selectedQuote.is_stackable ? '✅ Yes' : '❌ No'}
                            </span>
                          </div>
                        )}
                        {selectedQuote.is_hazardous !== undefined && (
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-semibold text-black">Hazardous:</label>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              selectedQuote.is_hazardous 
                                ? 'bg-black text-white' 
                                : 'bg-[#bca142] text-white'
                            }`}>
                              {selectedQuote.is_hazardous ? '⚠️ Yes - Special handling required' : '✅ No'}
                            </span>
                          </div>
                        )}
                        {selectedQuote.has_insurance !== undefined && (
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-semibold text-black">Cargo Insurance:</label>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              selectedQuote.has_insurance 
                                ? 'bg-[#bca142] text-white' 
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
                    <div className="p-6 bg-[#bca142]/10 rounded-xl border-2 border-[#bca142]/30">
                      <h3 className="text-xl font-bold text-[#bca142] mb-4 flex items-center gap-2">
                        📝 Special Notes
                      </h3>
                      <p className="text-black bg-white p-4 rounded-lg border border-[#bca142]/30 italic">
                        "{selectedQuote.notes}"
                      </p>
                    </div>
                  )}

                  {/* Quote Statistics */}
                  <div className="p-6 bg-[#bca142]/10 rounded-xl border-2 border-[#bca142]/30">
                    <h3 className="text-xl font-bold text-[#bca142] mb-4">Quote Statistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-black">{selectedQuote.response_count || 0}</p>
                        <p className="text-sm text-gray-700">Total Responses</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-black">#{selectedQuote.id}</p>
                        <p className="text-sm text-gray-700">Quote ID</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-black">{formatDate(selectedQuote.created_at || selectedQuote.arrival_date)}</p>
                        <p className="text-sm text-gray-700">Created</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => setSelectedQuote(null)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                  >
                    Close
                  </button>
                  {selectedQuote.already_responded ? (
                    <button
                      disabled
                      className="flex-1 bg-gray-300 text-gray-500 py-2 px-4 rounded-lg cursor-not-allowed font-medium text-sm"
                      title="You have already responded to this quote"
                    >
                      Already Responded
                    </button>
                  ) : !canRespond ? (
                    <button
                      onClick={() => handleRespondToQuote(selectedQuote)}
                      className="flex-1 bg-[#bca142] text-white py-2 px-4 rounded-lg hover:bg-black transition-all duration-300 transform hover:scale-105 shadow-lg font-medium text-sm"
                    >
                      🚀 Upgrade to Respond
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRespondToQuote(selectedQuote)}
                      className="flex-1 bg-[#bca142] text-white py-2 px-4 rounded-lg hover:bg-black transition-all duration-300 transform hover:scale-105 font-medium text-sm"
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