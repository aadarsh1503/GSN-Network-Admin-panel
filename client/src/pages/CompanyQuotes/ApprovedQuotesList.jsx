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
      
      // Use the admin panel API to get all quotes with company details
      const data = await api.get('/api/admin-panel/quotes');
      console.log('✅ Quotes loaded from admin panel API');
      console.log('📊 Total quotes received:', data.length);
      
      // Filter for quotes that have accepted responses (approved quotes)
      const approvedQuotes = data.filter(quote => {
        return quote.status === 'approved' || 
               (quote.company_name && quote.company_name !== 'null' && quote.accepted_price && quote.accepted_price !== 'null');
      });
      
      console.log(`📊 Approved quotes: ${approvedQuotes.length}/${data.length}`);
      
      if (approvedQuotes.length > 0) {
        // Debug first few quotes to understand data structure
        console.log('📊 Sample approved quote data:');
        approvedQuotes.slice(0, 2).forEach((quote, index) => {
          console.log(`Quote ${index + 1}:`, {
            id: quote.id,
            user: quote.user_name,
            company_name: quote.company_name,
            company_email: quote.company_email,
            accepted_price: quote.accepted_price,
            accepted_at: quote.accepted_at,
            status: quote.status
          });
        });
      }
      
      setQuotesWithResponses(Array.isArray(approvedQuotes) ? approvedQuotes : []);
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
        quote.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.company_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(quote => {
        const acceptedDate = quote.accepted_at ? new Date(quote.accepted_at).toISOString().split('T')[0] : null;
        return acceptedDate === dateFilter;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      if (sortConfig.key === 'accepted_at') {
        aValue = new Date(a.accepted_at || 0);
        bValue = new Date(b.accepted_at || 0);
      } else if (sortConfig.key === 'price') {
        aValue = parseFloat(a.accepted_price || 0);
        bValue = parseFloat(b.accepted_price || 0);
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
      <span className={`px-1 py-0.5 rounded text-xs font-medium ${colors[status] || 'bg-green-100 text-green-800'}`}>
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
      <div className="bg-gray-50 min-h-screen p-2 sm:p-3">
        <div className="max-w-full mx-auto">
          <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-center min-h-[300px]">
            <FuturisticLoader size="large" message="Loading approved quotes..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-2 sm:p-3">
      <div className="max-w-full mx-auto">
        {/* Compact Filter Section */}
        <div className="bg-white p-3 rounded-lg shadow-sm mb-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end">
            <div className="w-full">
              <label htmlFor="date" className="block text-xs font-medium text-gray-700 mb-1">
                <FiCalendar className="inline mr-1" />
                Accepted Date
              </label>
              <input
                type="date"
                id="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div className="w-full">
              <label htmlFor="search" className="block text-xs font-medium text-gray-700 mb-1">
                <FiSearch className="inline mr-1" />
                Search
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div className="w-full">
              <button 
                onClick={() => {
                  setDateFilter('');
                  setSearchTerm('');
                }}
                className="w-full flex items-center justify-center px-3 py-1.5 text-sm bg-[#d4b46a] text-white font-medium rounded-md shadow-sm hover:bg-[#c8a860] transition-colors"
              >
                <FiFilter className="mr-1" />
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Compact Table Section */}
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Approved Quotes ({filteredQuotes.length})</h2>
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <span>Show</span>
              <select 
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="border border-gray-300 rounded px-1 py-0.5 bg-white text-xs"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Compact Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-gray-600">
              <thead className="bg-[#e6c98c] text-gray-700 uppercase text-xs">
                <tr>
                  <th scope="col" className="px-2 py-2 font-semibold">
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort('id')}>
                      #
                      <FaSort className="ml-1 h-2 w-2 text-gray-500" />
                    </div>
                  </th>
                  <th scope="col" className="px-2 py-2 font-semibold min-w-[140px]">
                    Route
                  </th>
                  <th scope="col" className="px-2 py-2 font-semibold">
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort('shipping_mode')}>
                      Mode
                      <FaSort className="ml-1 h-2 w-2 text-gray-500" />
                    </div>
                  </th>
                  <th scope="col" className="px-2 py-2 font-semibold min-w-[120px]">
                    Customer
                  </th>
                  <th scope="col" className="px-2 py-2 font-semibold min-w-[140px]">
                    Company
                  </th>
                  <th scope="col" className="px-2 py-2 font-semibold">
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort('price')}>
                      Price
                      <FaSort className="ml-1 h-2 w-2 text-gray-500" />
                    </div>
                  </th>
                  <th scope="col" className="px-2 py-2 font-semibold">
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort('accepted_at')}>
                      Accepted
                      <FaSort className="ml-1 h-2 w-2 text-gray-500" />
                    </div>
                  </th>
                  <th scope="col" className="px-2 py-2 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-2 py-2 font-semibold">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-2 py-6 text-center text-gray-500 text-sm">
                      {quotesWithResponses.length === 0 ? 'No approved quotes found. When customers accept company responses, they will appear here.' : 'No quotes match your current filters.'}
                    </td>
                  </tr>
                ) : (
                  currentItems.map((quote, index) => (
                    <tr key={quote.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-2 py-2 text-xs">{indexOfFirstItem + index + 1}</td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1 min-w-[140px]">
                          <div className="w-4 h-3 flex-shrink-0">
                            <Flag code={getCountryCode(quote.departure_country)} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-xs truncate max-w-[40px]" title={quote.departure_country}>{quote.departure_country?.substring(0, 3)}</span>
                          <span className="text-gray-400 text-xs">→</span>
                          <div className="w-4 h-3 flex-shrink-0">
                            <Flag code={getCountryCode(quote.arrival_country)} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-xs truncate max-w-[40px]" title={quote.arrival_country}>{quote.arrival_country?.substring(0, 3)}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-xs">{quote.shipping_mode}</td>
                      <td className="px-2 py-2">
                        <div className="min-w-[120px]">
                          <div className="font-medium text-xs truncate">{quote.user_name || 'Guest'}</div>
                          {quote.user_email && (
                            <div className="text-xs text-gray-500 truncate">{quote.user_email}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        {quote.company_name && quote.company_name !== 'null' ? (
                          <div className="min-w-[140px]">
                            <div className="font-medium text-xs text-blue-600 truncate">{quote.company_name}</div>
                            <div className="text-xs text-gray-500 truncate">{quote.company_email || 'No email'}</div>
                            {quote.accepted_at && (
                              <div className="text-xs text-green-600">
                                {new Date(quote.accepted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">No company</span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {quote.accepted_price && quote.accepted_price !== 'null' ? (
                          <div className="min-w-[120px]">
                            <div className="font-bold text-xs text-green-600">${quote.accepted_price}</div>
                            <div className="text-xs text-gray-500 truncate">{quote.accepted_transit_time || 'N/A'}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">No quote</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-xs">
                        {quote.accepted_at && quote.accepted_at !== 'null' ? 
                          new Date(quote.accepted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 
                          (quote.created_at ? new Date(quote.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A')
                        }
                      </td>
                      <td className="px-2 py-2">
                        {getStatusBadge(quote.status)}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center space-x-1">
                          <button 
                            onClick={() => handleViewDetails(quote)}
                            className="p-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                            title="View Details"
                            disabled={isLoadingDetails}
                          >
                            <FiEye className="w-3 h-3" />
                          </button>
                          <select
                            value={quote.status}
                            onChange={(e) => handleUpdateQuoteStatus(quote.id, e.target.value)}
                            className="text-xs p-1 border rounded bg-white"
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

          {/* Compact Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-xs text-gray-600 gap-2">
              <div>
                {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredQuotes.length)} of {filteredQuotes.length}
              </div>
              <div className="flex items-center">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-xs border border-gray-300 rounded-l-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-2 py-1 text-xs border-t border-b ${
                        currentPage === pageNum 
                          ? 'text-white bg-[#d4b46a]' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-xs border border-gray-300 rounded-r-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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