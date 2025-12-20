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
  FaShippingFast
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const QuoteDetails = () => {
  const { quoteId } = useParams();
  const [quote, setQuote] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchQuoteDetails();
    fetchQuoteResponses();
  }, [quoteId]);

  const fetchQuoteDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user-quotes/my-quotes', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const quotes = await response.json();
        const currentQuote = quotes.find(q => q.id === parseInt(quoteId));
        setQuote(currentQuote);
      }
    } catch (error) {
      console.error('Error fetching quote details:', error);
      toast.error('Failed to fetch quote details');
    }
  };

  const fetchQuoteResponses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/user-quotes/${quoteId}/responses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setResponses(data);
      } else {
        toast.error('Failed to fetch quote responses');
      }
    } catch (error) {
      console.error('Error fetching quote responses:', error);
      toast.error('Failed to fetch quote responses');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptResponse = async (responseId, companyId) => {
    if (!window.confirm('Are you sure you want to accept this quote? This action cannot be undone.')) {
      return;
    }

    setActionLoading(responseId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user-quotes/accept-response', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quoteId: parseInt(quoteId),
          quoteResponseId: responseId,
          companyId: companyId
        })
      });

      if (response.ok) {
        toast.success('Quote response accepted successfully! The company has been notified.');
        fetchQuoteResponses();
        fetchQuoteDetails();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to accept quote response');
      }
    } catch (error) {
      console.error('Error accepting quote response:', error);
      toast.error('Failed to accept quote response');
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
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user-quotes/reject-response', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quoteId: parseInt(quoteId),
          quoteResponseId: responseId,
          companyId: companyId
        })
      });

      if (response.ok) {
        toast.success('Quote response rejected. The company has been notified.');
        fetchQuoteResponses();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to reject quote response');
      }
    } catch (error) {
      console.error('Error rejecting quote response:', error);
      toast.error('Failed to reject quote response');
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

  const hasAcceptedResponse = responses.some(response => response.user_response_status === 'accepted');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Quote not found</h3>
        <Link to="/user/quotes" className="text-blue-600 hover:text-blue-700">
          Back to Quotes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/user/quotes"
            className="flex items-center text-blue-600 hover:text-blue-700"
          >
            <FaArrowLeft className="mr-2" />
            Back to Quotes
          </Link>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(quote.status)}`}>
            {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
          </span>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Quote #{quote.id}
        </h1>
        <p className="text-gray-600">
          {quote.departure_country} → {quote.arrival_country} | {quote.shipping_mode}
        </p>
      </div>

      {/* Quote Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quote Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Shipment Information</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Product:</span> {quote.product_description}</p>
              <p><span className="font-medium">Shipping Mode:</span> {quote.shipping_mode}</p>
              <p><span className="font-medium">Arrival Date:</span> {formatDate(quote.arrival_date)}</p>
              {quote.quantity && <p><span className="font-medium">Quantity:</span> {quote.quantity}</p>}
              {quote.weight && <p><span className="font-medium">Weight:</span> {quote.weight}</p>}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Route Information</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">From:</span> {quote.departure_city}, {quote.departure_country}</p>
              <p><span className="font-medium">To:</span> {quote.arrival_city}, {quote.arrival_country}</p>
              {quote.incoterms && <p><span className="font-medium">Incoterms:</span> {quote.incoterms}</p>}
              {quote.packing && <p><span className="font-medium">Packing:</span> {quote.packing}</p>}
            </div>
          </div>
        </div>
        
        {quote.notes && (
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-2">Additional Notes</h3>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{quote.notes}</p>
          </div>
        )}
      </div>

      {/* Quote Responses */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quote Responses ({responses.length})
        </h2>

        {responses.length === 0 ? (
          <div className="text-center py-8">
            <FaShippingFast className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No responses yet</h3>
            <p className="text-gray-500">Companies will respond to your quote request soon.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {responses.map((response) => (
              <div key={response.id} className="border rounded-lg p-6">
                {/* Company Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <FaBuilding className="text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-semibold text-gray-900">{response.company_name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <FaEnvelope className="mr-1" />
                          {response.company_email}
                        </span>
                        {response.company_phone && (
                          <span className="flex items-center">
                            <FaPhone className="mr-1" />
                            {response.company_phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {response.user_response_status && (
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(response.user_response_status)}`}>
                      {response.user_response_status.charAt(0).toUpperCase() + response.user_response_status.slice(1)}
                    </span>
                  )}
                </div>

                {/* Quote Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center text-green-600 mb-2">
                      <FaDollarSign className="mr-2" />
                      <span className="font-medium">Price</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">${response.price}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center text-blue-600 mb-2">
                      <FaClock className="mr-2" />
                      <span className="font-medium">Transit Time</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{response.transit_time}</p>
                  </div>
                  
                  {response.valid_until && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center text-orange-600 mb-2">
                        <FaClock className="mr-2" />
                        <span className="font-medium">Valid Until</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatDate(response.valid_until)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Additional Details */}
                {(response.inclusions || response.value_added_services || response.terms || response.notes) && (
                  <div className="space-y-3 mb-4">
                    {response.inclusions && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Inclusions</h4>
                        <p className="text-sm text-gray-600">{response.inclusions}</p>
                      </div>
                    )}
                    
                    {response.value_added_services && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Value Added Services</h4>
                        <p className="text-sm text-gray-600">{response.value_added_services}</p>
                      </div>
                    )}
                    
                    {response.terms && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Terms & Conditions</h4>
                        <p className="text-sm text-gray-600">{response.terms}</p>
                      </div>
                    )}
                    
                    {response.notes && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Additional Notes</h4>
                        <p className="text-sm text-gray-600">{response.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                {!response.user_response_status && !hasAcceptedResponse && (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleAcceptResponse(response.id, response.company_id)}
                      disabled={actionLoading === response.id}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {actionLoading === response.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <FaCheck className="mr-2" />
                      )}
                      Accept Quote
                    </button>
                    
                    <button
                      onClick={() => handleRejectResponse(response.id, response.company_id)}
                      disabled={actionLoading === response.id}
                      className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {actionLoading === response.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <FaTimes className="mr-2" />
                      )}
                      Reject Quote
                    </button>
                  </div>
                )}

                {hasAcceptedResponse && !response.user_response_status && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-sm text-yellow-800">
                      You have already accepted another quote for this request.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuoteDetails;