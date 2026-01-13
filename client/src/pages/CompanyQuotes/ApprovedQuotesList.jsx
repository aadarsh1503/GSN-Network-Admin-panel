import { useState, useEffect } from 'react';
import { FiFilter, FiEye, FiSearch, FiCalendar } from 'react-icons/fi';
import { FaSort } from 'react-icons/fa';
import Flag from 'react-world-flags';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import FuturisticLoader from '../../components/Loaders/FuturisticLoader';
import FuturisticQuoteModal from '../../components/Modals/FuturisticQuoteModal';

const ApprovedCompanyQuotesList = () => {
  const [quotesWithResponses, setQuotesWithResponses] = useState([]);
  const [viewingQuote, setViewingQuote] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'accepted_at', direction: 'desc' });

  useEffect(() => {
    fetchApprovedQuotes();
  }, []);

  useEffect(() => {
    filterAndSortQuotes();
  }, [quotesWithResponses, searchTerm, dateFilter, sortConfig]);

  const fetchApprovedQuotes = async () => {
    try {
      setLoading(true);
      
      // Try the new comprehensive admin API first
      try {
        const data = await api.get('/api/enhanced-quotes/admin/comprehensive-quotes/approved');
        setQuotesWithResponses(Array.isArray(data) ? data : []);
        return;
      } catch (enhancedError) {
        console.log('Enhanced API not available, falling back to admin panel API');
        
        // Fallback to the original admin panel API
        const data = await api.get('/api/admin-panel/quotes');
        
        // Get detailed information for quotes that have responses
        const quotesWithDetails = [];
        
        for (const quote of data) {
          if (quote.response_count > 0) {
            try {
              const details = await api.get(`/api/admin-panel/quotes/${quote.id}`);
              // Filter for accepted responses only
              const acceptedResponses = details.responses?.filter(response => 
                response.user_response_status === 'accepted'
              ) || [];
              
              if (acceptedResponses.length > 0) {
                quotesWithDetails.push({
                  ...details,
                  acceptedResponses
                });
              }
            } catch (error) {
              console.error(`Error fetching details for quote ${quote.id}:`, error);
            }
          }
        }
        
        setQuotesWithResponses(quotesWithDetails);
      }
    } catch (error) {
      console.error('Error fetching approved quotes:', error);
      toast.error('Failed to fetch approved quotes');
      setQuotesWithResponses([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortQuotes = () => {
    let filtered = [...quotesWithResponses];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(quote =>
        quote.product_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.departure_country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.arrival_country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.acceptedResponses?.some(response => 
          response.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(quote => {
        return quote.acceptedResponses?.some(response => {
          const acceptedDate = new Date(response.accepted_at).toISOString().split('T')[0];
          return acceptedDate === dateFilter;
        });
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      if (sortConfig.key === 'accepted_at') {
        aValue = new Date(a.acceptedResponses?.[0]?.accepted_at || 0);
        bValue = new Date(b.acceptedResponses?.[0]?.accepted_at || 0);
      } else if (sortConfig.key === 'price') {
        aValue = parseFloat(a.acceptedResponses?.[0]?.price || 0);
        bValue = parseFloat(b.acceptedResponses?.[0]?.price || 0);
      } else {
        aValue = a[sortConfig.key] || '';
        bValue = b[sortConfig.key] || '';
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setFilteredQuotes(filtered);
    setCurrentPage(1);
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleViewDetails = async (quote) => {
    setIsLoadingDetails(true);
    setViewingQuote(quote); // Show modal immediately with basic data
    
    try {
      const details = await api.get(`/api/admin-panel/quotes/${quote.id}`);
      setViewingQuote(details); // Update with full details
    } catch (error) {
      console.error('Error loading quote details:', error);
      toast.error('Failed to load complete quote details');
      // Keep the modal open with basic quote data
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleUpdateQuoteStatus = async (quoteId, newStatus) => {
    try {
      await api.put(`/api/admin-panel/quotes/${quoteId}/status`, { status: newStatus });
      toast.success('Quote status updated successfully');
      fetchApprovedQuotes(); // Refresh the data
    } catch (error) {
      toast.error('Failed to update quote status');
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
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-green-100 text-green-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Active'}
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

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredQuotes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-center min-h-[400px]">
            <FuturisticLoader size="large" message="Loading approved quotes..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Filter Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            <div className="w-full">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                <FiCalendar className="inline mr-1" />
                Accepted Date
              </label>
              <input
                type="date"
                id="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div className="w-full">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                <FiSearch className="inline mr-1" />
                Search
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search quotes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div className="w-full lg:col-span-2">
              <button 
                onClick={() => {
                  setDateFilter('');
                  setSearchTerm('');
                }}
                className="w-full flex items-center justify-center px-6 py-2 bg-[#d4b46a] text-white font-semibold rounded-md shadow-sm hover:bg-[#c8a860] transition-colors"
              >
                <FiFilter className="mr-2" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Approved Company Quotes ({filteredQuotes.length})</h2>
            <div className="text-sm text-green-600 font-medium">
              ✓ These are quotes where customers accepted your responses
            </div>
          </div>
          
          {/* Table Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Show</span>
              <select 
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-2 py-1 bg-white"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>
            <div className="text-sm text-gray-600">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredQuotes.length)} of {filteredQuotes.length} entries
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="bg-[#e6c98c] text-gray-700 uppercase text-xs">
                <tr>
                  <th scope="col" className="px-6 py-3 font-semibold">
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort('id')}>
                      Sr.No
                      <FaSort className="ml-1.5 h-3 w-3 text-gray-500" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 font-semibold">
                    Route
                  </th>
                  <th scope="col" className="px-6 py-3 font-semibold">
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort('shipping_mode')}>
                      Shipping Mode
                      <FaSort className="ml-1.5 h-3 w-3 text-gray-500" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 font-semibold">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 font-semibold">
                    Company
                  </th>
                  <th scope="col" className="px-6 py-3 font-semibold">
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort('price')}>
                      Price
                      <FaSort className="ml-1.5 h-3 w-3 text-gray-500" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 font-semibold">
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort('accepted_at')}>
                      Accepted Date
                      <FaSort className="ml-1.5 h-3 w-3 text-gray-500" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 font-semibold">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                      {quotesWithResponses.length === 0 ? 'No approved quotes found. When customers accept company responses, they will appear here.' : 'No quotes match your current filters.'}
                    </td>
                  </tr>
                ) : (
                  currentItems.map((quote, index) => (
                    <tr key={quote.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4">{indexOfFirstItem + index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-4 flex-shrink-0">
                            <Flag code={getCountryCode(quote.departure_country)} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-xs">{quote.departure_country}</span>
                          <span className="text-gray-400">→</span>
                          <div className="w-6 h-4 flex-shrink-0">
                            <Flag code={getCountryCode(quote.arrival_country)} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-xs">{quote.arrival_country}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{quote.shipping_mode}</td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium">{quote.user_name || 'N/A'}</div>
                          {quote.user_email && (
                            <div className="text-xs text-gray-500">{quote.user_email}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium">{quote.company_name || quote.acceptedResponses?.[0]?.company_name || 'N/A'}</div>
                          {(quote.company_email || quote.acceptedResponses?.[0]?.company_email) && (
                            <div className="text-xs text-gray-500">{quote.company_email || quote.acceptedResponses[0].company_email}</div>
                          )}
                          {(quote.accepted_at || quote.acceptedResponses?.[0]?.accepted_at) && (
                            <div className="text-xs text-green-600">
                              Accepted: {new Date(quote.accepted_at || quote.acceptedResponses[0].accepted_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-green-600">
                        ${quote.accepted_price || quote.acceptedResponses?.[0]?.price || 'N/A'}
                        {(quote.accepted_transit_time || quote.acceptedResponses?.[0]?.transit_time) && (
                          <div className="text-xs text-gray-500">{quote.accepted_transit_time || quote.acceptedResponses[0].transit_time}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {(quote.accepted_at || quote.acceptedResponses?.[0]?.accepted_at) ? 
                          new Date(quote.accepted_at || quote.acceptedResponses[0].accepted_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(quote.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleViewDetails(quote)}
                            className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                            title="View Details"
                            disabled={isLoadingDetails}
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <select
                            value={quote.status}
                            onChange={(e) => handleUpdateQuoteStatus(quote.id, e.target.value)}
                            className="text-xs p-1 border rounded"
                            title="Update Status"
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="running">Running</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-gray-600 gap-4">
              <div>
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredQuotes.length)} of {filteredQuotes.length} entries
              </div>
              <div className="flex items-center">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-l-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-4 py-1 border-t border-b ${
                      currentPage === i + 1 
                        ? 'text-white bg-[#d4b46a]' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-r-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Futuristic Quote Details Modal */}
      <FuturisticQuoteModal
        quote={viewingQuote}
        isOpen={!!viewingQuote}
        onClose={() => setViewingQuote(null)}
        onUpdateStatus={handleUpdateQuoteStatus}
        isLoading={isLoadingDetails}
      />
    </div>
  );
};

export default ApprovedCompanyQuotesList;