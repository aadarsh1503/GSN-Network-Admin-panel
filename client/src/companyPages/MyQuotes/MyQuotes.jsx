import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Flag from 'react-world-flags';
import { FiEye, FiMessageSquare } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import useMarkAsRead from '../../hooks/useMarkAsRead';
import LoadingSpinner, { InlineSpinner } from '../../components/LoadingSpinner/LoadingSpinner';

const MyQuotes = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Mark quote-related notifications as read when this page is visited
  useMarkAsRead('quotes');

  useEffect(() => {
    fetchMyQuotes();
  }, []);

  const fetchMyQuotes = async () => {
    try {
      const data = await api.get('/api/company-quotes/accepted-quotes');
      setQuotes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuoteResponses = async (quoteId) => {
    setLoadingResponses(true);
    try {
      const data = await api.get(`/api/company-quotes/quote/${quoteId}/responses`);
      setResponses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching responses:', error);
      toast.error('Failed to load responses');
      setResponses([]);
    } finally {
      setLoadingResponses(false);
    }
  };

  const handleViewDetails = async (quote) => {
    setSelectedQuote(quote);
    await fetchQuoteResponses(quote.id);
  };

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await api.put(`/api/company-quotes/quote/${selectedQuote.id}/status`, { status: newStatus });
      toast.success('Quote status updated successfully!');
      
      // Update the selected quote immediately
      setSelectedQuote({ ...selectedQuote, status: newStatus });
      
      // Update the quotes list immediately without refetching
      setQuotes(prevQuotes => 
        prevQuotes.map(quote => 
          quote.id === selectedQuote.id 
            ? { ...quote, status: newStatus }
            : quote
        )
      );
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleMessageCustomer = () => {
    // Navigate to messages page with the customer's user ID
    if (selectedQuote && selectedQuote.user_id) {
      // Navigate to messages page and pass the customer info
      navigate('/company/messages', {
        state: {
          openConversation: {
            userId: selectedQuote.user_id,
            userName: selectedQuote.user_name || 'Customer',
            userEmail: selectedQuote.user_email
          },
          quoteId: selectedQuote.id
        }
      });
    } else if (selectedQuote && selectedQuote.user_name) {
      // Fallback: if no user_id but we have customer info, still navigate
      navigate('/company/messages', {
        state: {
          customerInfo: {
            name: selectedQuote.user_name,
            email: selectedQuote.user_email,
            phone: selectedQuote.user_phone
          },
          quoteId: selectedQuote.id
        }
      });
    } else {
      toast.error('Customer information not available for messaging');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      running: 'bg-blue-100 text-blue-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
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

  if (loading) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full">
        <LoadingSpinner size="lg" text="Loading your quotes..." />
      </div>
    );
  }

  if (selectedQuote) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full">
        <button 
          onClick={() => { setSelectedQuote(null); setResponses([]); }}
          className="text-sm text-[#CDA435] hover:underline mb-4"
        >
          &larr; Back to My Quotes
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">Quote Details</h2>

        {/* Quote Info */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex items-center gap-3 text-xl font-bold mb-4">
            <div className="w-8 h-6 flex-shrink-0">
              <Flag code={getCountryCode(selectedQuote.departure_country)} className="w-full h-full object-cover" />
            </div>
            <span>{selectedQuote.departure_country}</span>
            <span className="font-light text-gray-500">To</span>
            <div className="w-8 h-6 flex-shrink-0">
              <Flag code={getCountryCode(selectedQuote.arrival_country)} className="w-full h-full object-cover" />
            </div>
            <span>{selectedQuote.arrival_country}</span>
          </div>

          {/* Customer Info */}
          {(selectedQuote.user_name || selectedQuote.user_email) && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-2">Customer Information:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                {selectedQuote.user_name && (
                  <div><strong>Name:</strong> {selectedQuote.user_name}</div>
                )}
                {selectedQuote.user_email && (
                  <div><strong>Email:</strong> {selectedQuote.user_email}</div>
                )}
                {selectedQuote.user_phone && (
                  <div><strong>Phone:</strong> {selectedQuote.user_phone}</div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><strong>Mode:</strong> {selectedQuote.shipping_mode}</div>
            <div>
              <strong>Status:</strong> 
              <div className="inline-flex items-center ml-2">
                <select
                  value={selectedQuote.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updatingStatus}
                  className="px-2 py-1 text-xs font-medium rounded border border-gray-300 focus:ring-2 focus:ring-[#CDA435] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="pending">Pending</option>
                  <option value="running">Running</option>
                  <option value="closed">Closed</option>
                </select>
                {updatingStatus && (
                  <div className="ml-2">
                    <InlineSpinner text="Updating..." />
                  </div>
                )}
              </div>
            </div>
            <div><strong>Arrive by:</strong> {new Date(selectedQuote.arrival_date).toLocaleDateString()}</div>
            <div><strong>Your Price:</strong> ${selectedQuote.price}</div>
          </div>
          <div className="mt-4">
            <strong>Product:</strong> {selectedQuote.product_description}
          </div>
          {selectedQuote.accepted_at && (
            <div className="mt-2 text-sm text-green-600">
              <strong>Accepted on:</strong> {new Date(selectedQuote.accepted_at).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Responses */}
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          All Responses ({responses.length})
        </h3>

        {loadingResponses ? (
          <LoadingSpinner size="md" text="Loading responses..." />
        ) : responses.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            No responses available for this quote.
          </div>
        ) : (
          <div className="space-y-4">
            {responses.map((response) => (
              <div key={response.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {response.company_logo ? (
                      <img src={response.company_logo} alt={response.company_name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#CDA435] flex items-center justify-center text-white font-bold">
                        {response.company_name?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{response.company_name}</p>
                      <p className="text-sm text-gray-500">{response.company_email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#CDA435]">${response.price}</p>
                    <p className="text-sm text-gray-500">{response.transit_time}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  {response.inclusions && (
                    <div><strong>Inclusions:</strong> {response.inclusions}</div>
                  )}
                  {response.value_added_services && (
                    <div><strong>Value Added:</strong> {response.value_added_services}</div>
                  )}
                  {response.valid_until && (
                    <div><strong>Valid Until:</strong> {new Date(response.valid_until).toLocaleDateString()}</div>
                  )}
                </div>

                {response.notes && (
                  <p className="text-sm text-gray-600 mb-4">{response.notes}</p>
                )}

                <div className="flex gap-2">
                  {response.user_response_status === 'accepted' && (
                    <span className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm">
                      ✓ Accepted by Customer
                    </span>
                  )}
                  {response.user_response_status === 'rejected' && (
                    <span className="bg-red-100 text-red-800 px-4 py-2 rounded-lg text-sm">
                      ✗ Rejected by Customer
                    </span>
                  )}
                  {!response.user_response_status && (
                    <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-sm">
                      ⏳ Pending Customer Response
                    </span>
                  )}
                  <button 
                    onClick={handleMessageCustomer}
                    className="border border-[#CDA435] text-[#CDA435] px-4 py-2 rounded-lg hover:bg-yellow-50 text-sm flex items-center gap-2"
                  >
                    <FiMessageSquare /> Message Customer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-2 border-b pb-4">
        My Accepted Quotes
      </h2>
      <p className="text-gray-600 mb-4">Quotes where your responses have been accepted by customers</p>
      <div>
        {quotes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">You have no accepted quotes yet. Start responding to available quotes to see them here.</p>
            <a href="/company/available-quotes" className="bg-[#CDA435] text-white px-6 py-2 rounded-lg hover:bg-opacity-90">
              View Available Quotes
            </a>
          </div>
        ) : (
          quotes.map((quote) => (
            <article key={quote.id} className="py-6 border-b border-gray-200 last:border-b-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="flex items-center gap-3 text-xl md:text-2xl font-bold text-gray-800">
                    <div className="w-8 h-6 flex-shrink-0">
                      <Flag code={getCountryCode(quote.departure_country)} className="w-full h-full object-cover" />
                    </div>
                    <span>{quote.departure_country}</span>
                    <span className="font-light text-gray-500">To</span>
                    <div className="w-8 h-6 flex-shrink-0">
                      <Flag code={getCountryCode(quote.arrival_country)} className="w-full h-full object-cover" />
                    </div>
                    <span>{quote.arrival_country}</span>
                  </h3>
                  <div className="mt-4 space-y-2 text-gray-600">
                    <p><span className="font-semibold">Mode:</span> {quote.shipping_mode}</p>
                    <p><span className="font-semibold">Product:</span> {quote.product_description}</p>
                    <p><span className="font-semibold">Arrive by:</span> {new Date(quote.arrival_date).toLocaleDateString()}</p>
                    <p><span className="font-semibold">Your Price:</span> ${quote.price}</p>
                    {quote.user_name && (
                      <p><span className="font-semibold">Customer:</span> {quote.user_name}</p>
                    )}
                    {quote.accepted_at && (
                      <p className="text-green-600"><span className="font-semibold">✓ Accepted on:</span> {new Date(quote.accepted_at).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(quote.status)}
                  <button
                    onClick={() => handleViewDetails(quote)}
                    className="mt-4 flex items-center gap-2 text-[#CDA435] hover:underline"
                  >
                    <FiEye /> View Details
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
};

export default MyQuotes;
