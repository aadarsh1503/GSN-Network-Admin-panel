import React, { useState, useEffect } from 'react';
import { FiFilter, FiEye, FiSearch, FiCalendar } from 'react-icons/fi';
import { FaSort } from 'react-icons/fa';
import Flag from 'react-world-flags';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import FuturisticLoader from '../../components/Loaders/FuturisticLoader';
import FuturisticQuoteModal from '../../components/Modals/FuturisticQuoteModal';

const AllCompanyQuotesList = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [viewingQuote, setViewingQuote] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    fetchAllQuotes();
  }, []);

  useEffect(() => {
    filterAndSortQuotes();
  }, [quotes, searchTerm, dateFilter, statusFilter, sortConfig]);

  const fetchAllQuotes = async () => {
    try {
      setLoading(true);
      
      // Use the admin panel API (includes company details)
      const data = await api.get('/api/admin-panel/quotes');
      console.log('✅ Quotes loaded from admin panel API');
      console.log('📊 Total quotes received:', data.length);
      
      if (data.length > 0) {
        // Debug first few quotes to understand data structure
        console.log('📊 Sample quote data:');
        data.slice(0, 2).forEach((quote, index) => {
          console.log(`Quote ${index + 1}:`, {
            id: quote.id,
            user: quote.user_name,
            company_name: quote.company_name,
            company_email: quote.company_email,
            accepted_price: quote.accepted_price,
            status: quote.status
          });
        });
        
        const quotesWithCompany = data.filter(q => q.company_name && q.company_name !== 'null');
        console.log(`📊 Quotes with company: ${quotesWithCompany.length}/${data.length}`);
      }
      
      setQuotes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      toast.error('Failed to fetch quotes');
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortQuotes = () => {
    let filtered = [...quotes];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(quote =>
        quote.product_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.departure_country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.arrival_country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.company_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(quote => {
        const quoteDate = new Date(quote.created_at).toISOString().split('T')[0];
        return quoteDate === dateFilter;
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(quote => quote.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'created_at' || sortConfig.key === 'arrival_date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
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
      
      // Update the viewing quote if it's the same one
      if (viewingQuote && viewingQuote.id === quoteId) {
        setViewingQuote(prev => ({ ...prev, status: newStatus }));
      }
      
      fetchAllQuotes(); // Refresh the data
    } catch (error) {
      toast.error('Failed to update quote status');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      running: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const getPaymentStatusBadge = (quote) => {
    if (!quote.company_name || quote.company_name === 'null') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          No Company Assigned
        </span>
      );
    }

    if (quote.payment_status === 'verified') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✓ Payment Verified
        </span>
      );
    }

    if (quote.payment_status === 'rejected') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          ✗ Payment Rejected
        </span>
      );
    }

    if (quote.payment_proof_url && quote.payment_proof_url !== 'null') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          ⏳ Payment Pending
        </span>
      );
    }

    if (quote.has_payment_proof) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          💳 Awaiting Payment
        </span>
      );
    }

    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        No Payment Required
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
        <div className="max-w-7xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-center min-h-[400px]">
            <FuturisticLoader size="large" message="Loading all quotes..." />
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
                Date
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
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Quote Status
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="running">Running</option>
                <option value="closed">Closed</option>
              </select>
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
            <div className="w-full">
              <button 
                onClick={() => {
                  setDateFilter('');
                  setStatusFilter('all');
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
          <h2 className="text-xl font-bold text-gray-800 mb-4">All Quotes ({filteredQuotes.length})</h2>
          
          {loading && (
            <div className="text-center py-4 text-blue-600">
              <div className="inline-flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Loading comprehensive quote data...
              </div>
            </div>
          )}
          
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
                    User
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
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 font-semibold">
                    Working Company
                  </th>
                  <th scope="col" className="px-6 py-3 font-semibold">
                    Price & Payment
                  </th>
                  <th scope="col" className="px-6 py-3 font-semibold">
                    Responses
                  </th>
                  <th scope="col" className="px-6 py-3 font-semibold">
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort('status')}>
                      Status
                      <FaSort className="ml-1.5 h-3 w-3 text-gray-500" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 font-semibold">
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort('created_at')}>
                      Created Date
                      <FaSort className="ml-1.5 h-3 w-3 text-gray-500" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 font-semibold">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="px-6 py-8 text-center text-gray-500">
                      {quotes.length === 0 ? 'No quotes found.' : 'No quotes match your current filters.'}
                    </td>
                  </tr>
                ) : (
                  currentItems.map((quote, index) => (
                    <tr key={quote.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4">{indexOfFirstItem + index + 1}</td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium">{quote.user_name || 'Guest'}</div>
                          <div className="text-sm text-gray-500">{quote.user_email}</div>
                          {quote.user_role && (
                            <div className="text-xs text-blue-600 capitalize">{quote.user_role}</div>
                          )}
                        </div>
                      </td>
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
                      <td className="px-6 py-4 max-w-xs truncate" title={quote.product_description}>
                        {quote.product_description}
                      </td>
                      <td className="px-6 py-4">
                        {quote.company_name && quote.company_name !== 'null' ? (
                          <div>
                            <div className="font-medium text-blue-600">{quote.company_name}</div>
                            <div className="text-sm text-gray-500">{quote.company_email || 'No email'}</div>
                            {quote.accepted_at && (
                              <div className="text-xs text-green-600">
                                Accepted: {new Date(quote.accepted_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No company assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {quote.accepted_price && quote.accepted_price !== 'null' ? (
                          <div>
                            <div className="font-bold text-green-600">${quote.accepted_price}</div>
                            <div className="text-xs text-gray-500">{quote.accepted_transit_time || 'N/A'}</div>
                            {getPaymentStatusBadge(quote)}
                            {quote.verification_date && quote.verification_date !== 'null' && (
                              <div className="text-xs text-green-600 mt-1">
                                Verified: {new Date(quote.verification_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No accepted quote</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold">{quote.response_count || 0}</span>
                        {quote.accepted_count > 0 && (
                          <span className="text-green-600 text-xs ml-1">
                            ({quote.accepted_count} accepted)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(quote.status)}
                      </td>
                      <td className="px-6 py-4">{new Date(quote.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleViewDetails(quote)}
                            className="p-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                            title="View Details"
                            disabled={isLoadingDetails}
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
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

export default AllCompanyQuotesList;