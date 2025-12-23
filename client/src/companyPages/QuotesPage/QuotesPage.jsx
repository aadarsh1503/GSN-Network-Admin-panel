import { useState, useEffect } from 'react';
import { FiEye, FiPhone, FiGrid, FiList, FiSend } from 'react-icons/fi';
import Flag from 'react-world-flags';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const RightSidebar = () => (
  <div className="space-y-6 mt-2">
    <a href="/company/quote" className="block w-full bg-[#C9A959] text-white font-bold py-3 rounded-lg shadow-md hover:bg-yellow-700 transition-colors text-center">
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
      // Fetch approved quotes that companies can respond to
      const data = await api.get('/api/quotes/status/approved');
      setQuotes(data);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      // If not admin, try fetching all pending/approved quotes
      try {
        const allData = await api.get('/api/quotes/all');
        setQuotes(allData.filter(q => ['pending', 'approved'].includes(q.status)));
      } catch (err) {
        console.error('Error:', err);
      }
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
    <div className="bg-white p-6 rounded-lg shadow-md">
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
      </div>
      <div className="mt-4">
        <button 
          onClick={() => handleViewDetails(quote)} 
          className="h-10 w-10 flex items-center justify-center border-2 border-[#C9A959] text-[#C9A959] rounded-full hover:bg-yellow-50"
        >
          <FiEye size={20}/>
        </button>
      </div>
    </div>
  );

  const QuoteDetail = ({ quote }) => {
    const DetailRow = ({ label, value }) => (
      <p className="border-b py-2"><span className="font-semibold text-gray-800">{label}:</span> {value || 'N/A'}</p>
    );

    return (
      <div>
        <button onClick={handleCloseDetails} className="text-sm text-yellow-600 hover:underline mb-4">&larr; Back to Quotes List</button>
        
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
          </div>
        </div>

        {/* Response Form */}
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
              className="w-full bg-[#C9A959] text-white font-bold py-3 rounded-lg shadow-md hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FiSend />
              {submittingResponse ? 'Submitting...' : 'Submit Quote Response'}
            </button>
          </form>
        </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {currentView === 'list' ? (
              <>
                <div className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
                  <p className="text-sm font-semibold text-gray-700">
                    Showing {quotes.length} available quotes
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
