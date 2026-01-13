import { useState, useEffect } from 'react';
import { FiEye, FiPhone, FiGrid, FiList, FiSend, FiLock, FiTrendingUp } from 'react-icons/fi';
import Flag from 'react-world-flags';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const RightSidebar = () => (
  <div className="space-y-6 mt-2">
    <a href="/company/quote" className="block w-full bg-[#CDA435] text-white font-bold py-3 rounded-lg shadow-md hover:bg-[#B8941F] transition-colors text-center">
      Request a quote
    </a>
    <div className="bg-[#C9A959] p-6 rounded-lg shadow-md text-center text-white">
      <h4 className="text-lg font-bold">Need Any Information?</h4>
      <p className="text-sm opacity-90 my-2">Please Contact Our Experts</p>
      <div className="flex items-center justify-center mt-4">
        <FiPhone className="h-10 w-10 mr-3 opacity-80" />
        <p className="text-2xl font-bold">+973 17491222</p>
      </div>
    </div>
  </div>
);

const QuotesPage = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [currentView, setCurrentView] = useState('list');
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationInfo, setLocationInfo] = useState(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [canRespond, setCanRespond] = useState(false);
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

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      // Fetch location-based available quotes
      const data = await api.get('/api/quotes/available');
      
      // Handle both old and new API response formats
      if (data.quotes) {
        // New format with location filtering and subscription info
        setQuotes(data.quotes);
        setLocationInfo({
          companyLocation: data.companyLocation,
          totalQuotes: data.totalQuotes,
          localQuotes: data.localQuotes
        });
        setSubscriptionInfo(data.subscription);
        setCanRespond(data.canRespond);
      } else {
        // Fallback to old format
        setQuotes(Array.isArray(data) ? data : []);
        setCanRespond(false);
        setSubscriptionInfo({
          planName: 'Basic Plan',
          maxResponses: 0,
          currentResponses: 0,
          canSeeContactInfo: false
        });
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
      setQuotes([]);
      setCanRespond(false);
      setSubscriptionInfo({
        planName: 'Basic Plan',
        maxResponses: 0,
        currentResponses: 0,
        canSeeContactInfo: false
      });
      toast.error('Failed to load quotes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (quote) => {
    setSelectedQuote(quote);
    setCurrentView('detail');
  };

  const handleCloseDetails = () => {
    setCurrentView('list');
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

  const handleResponseChange = (e) => {
    const { name, value } = e.target;
    setResponseForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    
    if (!responseForm.price || !responseForm.transitTime) {
      toast.error('Price and transit time are required');
      return;
    }

    setSubmittingResponse(true);
    try {
      await api.post('/api/quote-responses/submit', {
        quoteId: selectedQuote.id,
        ...responseForm
      });

      toast.success('Quote response submitted successfully!');
      handleCloseDetails();
      fetchQuotes();
    } catch (error) {
      toast.error(error.message || 'Failed to submit response');
    } finally {
      setSubmittingResponse(false);
    }
  };

  // Check if user can see contact information for a specific quote
  const canSeeContactInfo = (quote = null) => {
    // If quote has individual flag, use that
    if (quote && quote.hasOwnProperty('canSeeContactInfo')) {
      return quote.canSeeContactInfo;
    }
    // Otherwise use global subscription info
    if (!subscriptionInfo) return false;
    return subscriptionInfo.canSeeContactInfo === true;
  };

  // Simple and clean contact info hiding
  const renderContactInfo = (info, label, quote = null) => {
    if (canSeeContactInfo(quote)) {
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

  const UpgradePrompt = () => {
    if (canSeeContactInfo()) return null;

    const isBasicPlan = subscriptionInfo?.maxResponses === 0;

    return (
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <FiTrendingUp className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {isBasicPlan ? 'Upgrade Your Plan' : 'Response Limit Reached'}
              </h3>
              <p className="text-gray-600 text-sm">
                {isBasicPlan 
                  ? 'You\'re on a basic plan with 0 responses. Upgrade to see customer contact information and respond to quotes.'
                  : `You've used all ${subscriptionInfo?.maxResponses} responses this month. Upgrade to get more responses.`
                }
              </p>
            </div>
          </div>
          <div className="text-right">
            <button 
              onClick={() => window.location.href = '/company/plans'}
              className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-700 transition-all duration-300 shadow-lg"
            >
              Upgrade Now
            </button>
          </div>
        </div>
        {subscriptionInfo && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white/50 rounded-lg p-3">
              <div className="text-gray-500">Current Plan</div>
              <div className="font-semibold text-gray-800">{subscriptionInfo.planName}</div>
            </div>
            <div className="bg-white/50 rounded-lg p-3">
              <div className="text-gray-500">Monthly Responses</div>
              <div className="font-semibold text-gray-800">
                {subscriptionInfo.maxResponses === -1 ? 'Unlimited' : subscriptionInfo.maxResponses}
              </div>
            </div>
            <div className="bg-white/50 rounded-lg p-3">
              <div className="text-gray-500">Used This Month</div>
              <div className="font-semibold text-gray-800">
                {subscriptionInfo.currentResponses} / {subscriptionInfo.maxResponses === -1 ? 'Unlimited' : subscriptionInfo.maxResponses}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getCountryCode = (countryName) => {
    const countryCodes = {
      'UAE': 'AE', 'United Arab Emirates': 'AE', 'Saudi Arabia': 'SA', 'Kuwait': 'KW',
      'Qatar': 'QA', 'Bahrain': 'BH', 'Oman': 'OM', 'India': 'IN', 'USA': 'US',
      'United States': 'US', 'United Kingdom': 'GB', 'UK': 'GB', 'China': 'CN',
      'Germany': 'DE', 'France': 'FR', 'Australia': 'AU', 'Canada': 'CA'
    };
    return countryCodes[countryName] || countryName?.substring(0, 2).toUpperCase();
  };

  const QuoteCard = ({ quote }) => (
    <div className="bg-white p-6 rounded-lg shadow-md relative">
      {/* Location Match Badge */}
      {quote.is_local_match && (
        <div className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
          Local Match
        </div>
      )}
      
      <div className="flex items-center gap-2 text-xl font-bold mb-4">
        <div className="w-8 h-6">
          <Flag code={getCountryCode(quote.departure_country)} className="w-full h-full object-cover" />
        </div>
        <span>{quote.departure_country}</span>
        <span className="text-gray-400">To</span>
        <div className="w-8 h-6">
          <Flag code={getCountryCode(quote.arrival_country)} className="w-full h-full object-cover" />
        </div>
        <span>{quote.arrival_country}</span>
      </div>
      
      <div className="space-y-1 text-sm text-gray-600">
        <p><span className="font-semibold text-gray-800">Mode:</span> {quote.shipping_mode}</p>
        <p><span className="font-semibold text-gray-800">Product:</span> {quote.product_description?.substring(0, 50)}...</p>
        <p><span className="font-semibold text-gray-800">Arrive by:</span> {new Date(quote.arrival_date).toLocaleDateString()}</p>
        <p><span className="font-semibold text-gray-800">Posted:</span> {new Date(quote.created_at).toLocaleDateString()}</p>
        {quote.response_count > 0 && (
          <p><span className="font-semibold text-gray-800">Responses:</span> {quote.response_count}</p>
        )}
        {quote.distance_km && (
          <p className="flex items-center text-blue-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-semibold text-gray-800">Distance:</span> {quote.distance_km} km away
          </p>
        )}
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <button 
          onClick={() => handleViewDetails(quote)} 
          className="h-10 w-10 flex items-center justify-center border-2 border-[#CDA435] text-[#CDA435] rounded-full hover:bg-yellow-50"
        >
          <FiEye size={20}/>
        </button>
        
        {quote.already_responded && (
          <span className="text-xs text-blue-600 font-medium">Already Responded</span>
        )}
      </div>
    </div>
  );

  const QuoteDetail = ({ quote }) => {
    const DetailRow = ({ label, value, isContactInfo = false }) => (
      <p className="border-b py-2">
        <span className="font-semibold text-gray-800">{label}:</span> 
        {isContactInfo ? renderContactInfo(value, label, quote) : (value || 'N/A')}
      </p>
    );

    return (
      <div>
        <button onClick={handleCloseDetails} className="text-sm text-[#CDA435] hover:underline mb-4">&larr; Back to Quotes List</button>
        
        {/* Upgrade Prompt */}
        <UpgradePrompt />
        
        {/* Quote Details */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex items-center gap-2 text-xl font-bold mb-4">
            <div className="w-8 h-6">
              <Flag code={getCountryCode(quote.departure_country)} className="w-full h-full object-cover" />
            </div>
            <span>{quote.departure_country}</span>
            <span className="text-gray-400">To</span>
            <div className="w-8 h-6">
              <Flag code={getCountryCode(quote.arrival_country)} className="w-full h-full object-cover" />
            </div>
            <span>{quote.arrival_country}</span>
          </div>
          
          <h3 className="text-lg font-bold text-gray-800 mb-4">Quote Request Details</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <DetailRow label="Shipping Mode" value={quote.shipping_mode} />
            <DetailRow label="Departure Country" value={quote.departure_country} />
            <DetailRow label="Departure City" value={quote.departure_city} />
            <DetailRow label="Departure Type" value={quote.departure_type} />
            <DetailRow label="Arrival Country" value={quote.arrival_country} />
            <DetailRow label="Arrival City" value={quote.arrival_city} />
            <DetailRow label="Arrival Type" value={quote.arrival_type} />
            <DetailRow label="Arrival Date" value={new Date(quote.arrival_date).toLocaleDateString()} />
            <DetailRow label="Packing" value={quote.packing} />
            <DetailRow label="Incoterms" value={quote.incoterms} />
            <DetailRow label="Weight" value={quote.weight} />
            <DetailRow label="Dimensions" value={quote.length && `${quote.length}L x ${quote.width}W x ${quote.height}H ${quote.dimension_unit}`} />
            <DetailRow label="Product Description" value={quote.product_description} />
            <DetailRow label="Notes" value={quote.notes} />
            
            {/* Contact Information - Hidden for basic plans */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-md font-bold text-gray-800 mb-3 flex items-center">
                Customer Contact Information
                {!canSeeContactInfo(quote) && <FiLock className="ml-2 text-yellow-500" />}
              </h4>
              <DetailRow label="Customer Name" value={quote.user_name} isContactInfo={true} />
              <DetailRow label="Email" value={quote.user_email} isContactInfo={true} />
              {quote.user_phone && (
                <DetailRow label="Phone" value={quote.user_phone} isContactInfo={true} />
              )}
              {quote.user_country && (
                <DetailRow label="Customer Location" value={`${quote.user_city || ''} ${quote.user_state || ''} ${quote.user_country}`.trim()} isContactInfo={true} />
              )}
            </div>
          </div>
        </div>

        {/* Response Form - Only show if user can respond */}
        {canRespond ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Submit Your Quote Response</h3>
            <form onSubmit={handleSubmitResponse} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD) *</label>
                  <input
                    type="number"
                    name="price"
                    value={responseForm.price}
                    onChange={handleResponseChange}
                    placeholder="Enter your price"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A959]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transit Time *</label>
                  <input
                    type="text"
                    name="transitTime"
                    value={responseForm.transitTime}
                    onChange={handleResponseChange}
                    placeholder="e.g., 5-7 business days"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A959]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                  <input
                    type="date"
                    name="validUntil"
                    value={responseForm.validUntil}
                    onChange={handleResponseChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A959]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inclusions</label>
                  <input
                    type="text"
                    name="inclusions"
                    value={responseForm.inclusions}
                    onChange={handleResponseChange}
                    placeholder="What's included in the price"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A959]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value Added Services</label>
                <input
                  type="text"
                  name="valueAddedServices"
                  value={responseForm.valueAddedServices}
                  onChange={handleResponseChange}
                  placeholder="Additional services offered"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A959]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
                <textarea
                  name="terms"
                  value={responseForm.terms}
                  onChange={handleResponseChange}
                  placeholder="Any terms and conditions"
                  rows="2"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A959]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  name="notes"
                  value={responseForm.notes}
                  onChange={handleResponseChange}
                  placeholder="Any additional information"
                  rows="3"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A959]"
                />
              </div>
              <button
                type="submit"
                disabled={submittingResponse}
                className="w-full bg-[#CDA435] text-white font-bold py-3 rounded-lg shadow-md hover:bg-[#B8941F] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FiSend />
                {submittingResponse ? 'Submitting...' : 'Submit Quote Response'}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <FiLock className="mx-auto text-4xl text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Response Not Available</h3>
            <p className="text-gray-600 mb-4">
              {subscriptionInfo?.maxResponses === 0 
                ? 'Upgrade your plan to respond to quotes and access customer contact information.'
                : 'You have reached your monthly response limit. Upgrade to get more responses.'
              }
            </p>
            <button
              onClick={() => window.location.href = '/company/plans'}
              className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-700 transition-all duration-300"
            >
              Upgrade Plan
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading quotes...</div>;
  }

  return (
    <div className="bg-gray-50 p-4 sm:p-6 mt-20 lg:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Available Quotes</h1>

        {/* Location Information */}
        {locationInfo && locationInfo.companyLocation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-800">Location-Based Filtering Active</h3>
                <p className="text-blue-600 text-sm">
                  Showing quotes relevant to your location: {locationInfo.companyLocation.country}
                  {locationInfo.companyLocation.state && `, ${locationInfo.companyLocation.state}`}
                  {locationInfo.companyLocation.city && `, ${locationInfo.companyLocation.city}`}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-800">{locationInfo.localQuotes}</div>
                <div className="text-sm text-blue-600">Local Matches</div>
                <div className="text-xs text-gray-500">of {locationInfo.totalQuotes} total</div>
              </div>
            </div>
          </div>
        )}

        {/* No Location Data Warning */}
        {locationInfo && !locationInfo.companyLocation?.country && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-yellow-600 mr-3">⚠️</div>
              <div>
                <h3 className="text-lg font-semibold text-yellow-800">Location Information Missing</h3>
                <p className="text-yellow-700 text-sm">
                  To see location-based quote filtering, please update your company profile with your country and state information.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {currentView === 'list' ? (
              <>
                {/* Upgrade Prompt */}
                <UpgradePrompt />
                
                <div className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
                  <p className="text-sm font-semibold text-gray-700">
                    Showing {quotes.length} available quotes
                    {locationInfo && locationInfo.localQuotes > 0 && (
                      <span className="text-green-600 ml-2">
                        ({locationInfo.localQuotes} local matches)
                      </span>
                    )}
                  </p>
                  <div className="flex items-center space-x-2 text-yellow-600">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-yellow-100' : 'hover:bg-yellow-50'}`}><FiGrid /></button>
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-yellow-100' : 'hover:bg-yellow-50'}`}><FiList /></button>
                  </div>
                </div>

                {quotes.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-md">
                    No quotes available at the moment.
                  </div>
                ) : (
                  <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                    {quotes.map(quote => (
                      <QuoteCard key={quote.id} quote={quote} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <QuoteDetail quote={selectedQuote} />
            )}
          </div>

          <div className="lg:col-span-1">
            <RightSidebar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotesPage;
