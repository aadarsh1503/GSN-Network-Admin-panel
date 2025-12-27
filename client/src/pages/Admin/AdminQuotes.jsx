import React, { useState, useEffect } from 'react';
import { FaEye, FaTrash, FaSearch, FaEdit } from 'react-icons/fa';
import { api } from '../../utils/api';
import { adminToast } from '../../utils/adminToast';

const AdminQuotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewingQuote, setViewingQuote] = useState(null);
  const [deletingQuote, setDeletingQuote] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(null);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/admin-panel/quotes');
      setQuotes(data);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      adminToast.error('Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (quote) => {
    try {
      setLoadingDetails(quote.id);
      const details = await api.get(`/api/admin-panel/quotes/${quote.id}`);
      // If API doesn't return detailed data, use the quote data we already have
      setViewingQuote(details || quote);
    } catch (error) {
      console.error('Error loading quote details:', error);
      // Fallback to showing the quote data we already have
      setViewingQuote(quote);
      adminToast.warning('Showing basic quote information');
    } finally {
      setLoadingDetails(null);
    }
  };

  const handleDeleteQuote = async (quoteId) => {
    if (!window.confirm('Are you sure you want to delete this quote? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/api/admin-panel/quotes/${quoteId}`);
      adminToast.success('Quote deleted successfully');
      setQuotes(quotes.filter(q => q.id !== quoteId));
      setDeletingQuote(null);
    } catch (error) {
      adminToast.error('Failed to delete quote');
    }
  };

  const handleUpdateStatus = async (quoteId, newStatus) => {
    try {
      await api.put(`/api/admin-panel/quotes/${quoteId}/status`, { status: newStatus });
      adminToast.success('Quote status updated successfully');
      fetchQuotes();
    } catch (error) {
      adminToast.error('Failed to update quote status');
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = 
      quote.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.product_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.departure_country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.arrival_country?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || quote.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      running: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="p-10 text-center">Loading quotes...</div>;

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="p-6 border-b">
            <h2 className="text-2xl font-semibold">Quote Management</h2>
            <p className="text-gray-600 mt-1">View, manage, and moderate all user quotes</p>
          </div>

          {/* Filters */}
          <div className="p-4 border-b bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search quotes..."
                  className="w-full pl-10 p-2 border rounded-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="p-2 border rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="running">Running</option>
                <option value="closed">Closed</option>
              </select>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">User</th>
                  <th className="p-3 text-left">Route</th>
                  <th className="p-3 text-left">Product</th>
                  <th className="p-3 text-left">Responses</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Created</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.length > 0 ? (
                  filteredQuotes.map((quote) => (
                    <tr key={quote.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{quote.id}</td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{quote.user_name || 'Guest'}</div>
                          <div className="text-sm text-gray-500">{quote.user_email}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <div>{quote.departure_country} → {quote.arrival_country}</div>
                          <div className="text-gray-500">{quote.shipping_mode}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm max-w-xs truncate">
                          {quote.product_description}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-center">
                          <span className="font-bold">{quote.response_count}</span>
                          {quote.accepted_count > 0 && (
                            <span className="text-green-600 text-xs ml-1">
                              ({quote.accepted_count} accepted)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(quote.status)}`}>
                          {quote.status}
                        </span>
                      </td>
                      <td className="p-3 text-sm">
                        {new Date(quote.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewDetails(quote)}
                            disabled={loadingDetails === quote.id}
                            className={`p-2 text-white rounded ${
                              loadingDetails === quote.id 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-blue-500 hover:bg-blue-600'
                            }`}
                            title="View Details"
                          >
                            {loadingDetails === quote.id ? (
                              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                            ) : (
                              <FaEye />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteQuote(quote.id)}
                            className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                            title="Delete Quote"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center p-4 text-gray-500">
                      No quotes found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="p-4 bg-gray-50 border-t">
            <div className="text-sm text-gray-600">
              Showing {filteredQuotes.length} of {quotes.length} quotes
            </div>
          </div>
        </div>
      </div>

      {/* View Details Modal */}
      {viewingQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Quote Details #{viewingQuote.id}</h3>
              <div className="flex space-x-2">
                <select
                  value={viewingQuote.status}
                  onChange={(e) => handleUpdateStatus(viewingQuote.id, e.target.value)}
                  className="p-2 border rounded-md"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="running">Running</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="col-span-2">
                <h4 className="font-semibold mb-2">User Information</h4>
                <p><strong>Name:</strong> {viewingQuote.user_name || 'Guest'}</p>
                <p><strong>Email:</strong> {viewingQuote.user_email}</p>
                <p><strong>Phone:</strong> {viewingQuote.user_phone}</p>
              </div>
              
              <div className="col-span-2">
                <h4 className="font-semibold mb-2">Shipment Details</h4>
                <p><strong>Mode:</strong> {viewingQuote.shipping_mode}</p>
                <p><strong>From:</strong> {viewingQuote.departure_country}, {viewingQuote.departure_city}</p>
                <p><strong>To:</strong> {viewingQuote.arrival_country}, {viewingQuote.arrival_city}</p>
                <p><strong>Product:</strong> {viewingQuote.product_description}</p>
              </div>
            </div>

            {/* Responses */}
            {viewingQuote.responses && viewingQuote.responses.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold mb-3">Company Responses ({viewingQuote.responses.length})</h4>
                <div className="space-y-3">
                  {viewingQuote.responses.map((response) => (
                    <div key={response.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{response.company_name}</p>
                          <p className="text-sm text-gray-600">{response.company_email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">${response.price}</p>
                          <p className="text-sm text-gray-600">{response.transit_time}</p>
                        </div>
                      </div>
                      {response.user_response_status && (
                        <div className="mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            response.user_response_status === 'accepted' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {response.user_response_status}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => handleDeleteQuote(viewingQuote.id)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete Quote
              </button>
              <button
                onClick={() => setViewingQuote(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuotes;
