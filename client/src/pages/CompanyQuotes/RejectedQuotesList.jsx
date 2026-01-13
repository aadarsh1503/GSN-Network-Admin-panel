import React, { useState, useEffect } from 'react';
import { FaSort, FaEye, FaEdit } from 'react-icons/fa';
import Flag from 'react-world-flags';
import api from '../../utils/api';
import FuturisticLoader from '../../components/Loaders/FuturisticLoader';
import FuturisticQuoteModal from '../../components/Modals/FuturisticQuoteModal';

const RejectedCompanyQuotesList = () => {
  const [rejectedQuotes, setRejectedQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [viewingQuote, setViewingQuote] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    fetchRejectedQuotes();
  }, []);

  const fetchRejectedQuotes = async () => {
    try {
      const data = await api.get('/api/admin-panel/quotes');
      // Filter for rejected quotes
      const rejected = data.filter(quote => quote.status === 'rejected');
      setRejectedQuotes(Array.isArray(rejected) ? rejected : []);
    } catch (error) {
      console.error('Error fetching rejected quotes:', error);
      setRejectedQuotes([]);
    } finally {
      setLoading(false);
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

  // Filter and sort quotes
  const filteredQuotes = rejectedQuotes.filter(quote =>
    Object.values(quote).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedQuotes = [...filteredQuotes].sort((a, b) => {
    const aValue = a[sortField] || '';
    const bValue = b[sortField] || '';
    
    if (sortDirection === 'asc') {
      return aValue.toString().localeCompare(bValue.toString());
    } else {
      return bValue.toString().localeCompare(aValue.toString());
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedQuotes.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedQuotes = sortedQuotes.slice(startIndex, startIndex + entriesPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleViewDetails = async (quote) => {
    setIsLoadingDetails(true);
    setViewingQuote(quote); // Show modal immediately with basic data
    
    try {
      const details = await api.get(`/api/admin-panel/quotes/${quote.id}`);
      setViewingQuote(details); // Update with full details
    } catch (error) {
      console.error('Error loading quote details:', error);
      // Keep the modal open with basic quote data
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleUpdateQuoteStatus = async (quoteId, newStatus) => {
    try {
      await api.put(`/api/admin-panel/quotes/${quoteId}/status`, { status: newStatus });
      
      // Update the viewing quote if it's the same one
      if (viewingQuote && viewingQuote.id === quoteId) {
        setViewingQuote(prev => ({ ...prev, status: newStatus }));
      }
      
      fetchRejectedQuotes(); // Refresh the data
    } catch (error) {
      console.error('Failed to update quote status:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-sm flex items-center justify-center min-h-[400px]">
          <FuturisticLoader size="large" message="Loading rejected quotes..." />
        </div>
      </div>
    );
  }

  // Reusable component for table headers with sorting icons
  const TableHeader = ({ children, field }) => (
    <th scope="col" className="px-4 py-3 font-semibold cursor-pointer hover:bg-[#d4b46a]" onClick={() => handleSort(field)}>
      <div className="flex items-center">
        {children}
        <FaSort className={`ml-1.5 h-3 w-3 ${sortField === field ? 'text-[#CDA435]' : 'text-gray-500'}`} />
      </div>
    </th>
  );
  
  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Rejected Quotes List</h2>
        
        {/* Table Controls: Show entries & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Show</span>
            <select 
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#CDA435]"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Search:</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#CDA435]"
              placeholder="Search quotes..."
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="bg-[#CDA435] text-white uppercase text-xs whitespace-nowrap">
              <tr>
                <TableHeader field="id">Quote ID</TableHeader>
                <TableHeader field="shipping_mode">Shipping Mode</TableHeader>
                <TableHeader field="departure_country">Departure Country</TableHeader>
                <TableHeader field="departure_state">Departure State</TableHeader>
                <TableHeader field="departure_type">Departure Type</TableHeader>
                <TableHeader field="arrival_country">Arrival Country</TableHeader>
                <TableHeader field="arrival_state">Arrival State</TableHeader>
                <TableHeader field="arrival_type">Arrival Type</TableHeader>
                <TableHeader field="arrival_date">Arrival Date</TableHeader>
                <TableHeader field="product_description">Product Description</TableHeader>
                <TableHeader field="price">Your Price</TableHeader>
                <TableHeader field="user_name">Customer</TableHeader>
                <TableHeader field="created_at">Response Date</TableHeader>
                <th scope="col" className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedQuotes.length === 0 ? (
                <tr className="border-b">
                  <td colSpan="14" className="text-center py-10 text-gray-500">
                    {searchTerm ? 'No rejected quotes found matching your search.' : 'No rejected quotes available.'}
                  </td>
                </tr>
              ) : (
                paginatedQuotes.map((quote, index) => (
                  <tr key={quote.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-4 py-4 font-medium">#{quote.quote_id}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {quote.shipping_mode}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-4 flex-shrink-0">
                          <Flag code={getCountryCode(quote.departure_country)} className="w-full h-full object-cover rounded" />
                        </div>
                        {quote.departure_country}
                      </div>
                    </td>
                    <td className="px-4 py-4">{quote.departure_state || '-'}</td>
                    <td className="px-4 py-4">{quote.departure_type || '-'}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-4 flex-shrink-0">
                          <Flag code={getCountryCode(quote.arrival_country)} className="w-full h-full object-cover rounded" />
                        </div>
                        {quote.arrival_country}
                      </div>
                    </td>
                    <td className="px-4 py-4">{quote.arrival_state || '-'}</td>
                    <td className="px-4 py-4">{quote.arrival_type || '-'}</td>
                    <td className="px-4 py-4">{new Date(quote.arrival_date).toLocaleDateString()}</td>
                    <td className="px-4 py-4 max-w-xs truncate" title={quote.product_description}>
                      {quote.product_description}
                    </td>
                    <td className="px-4 py-4 font-semibold text-[#CDA435]">${quote.price}</td>
                    <td className="px-4 py-4">{quote.user_name || 'Guest User'}</td>
                    <td className="px-4 py-4">{new Date(quote.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleViewDetails(quote)}
                          className="p-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                          title="View Details"
                          disabled={isLoadingDetails}
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Rejected
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer: Entry count & Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-gray-600 gap-4">
          <div>
            Showing {startIndex + 1} to {Math.min(startIndex + entriesPerPage, sortedQuotes.length)} of {sortedQuotes.length} entries
            {searchTerm && ` (filtered from ${rejectedQuotes.length} total entries)`}
          </div>
          <div className="flex items-center">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-[#CDA435] text-gray-400 rounded-l-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 border-t border-b border-r border-[#CDA435] ${
                  currentPage === page 
                    ? 'text-white bg-[#CDA435]' 
                    : 'text-[#CDA435] hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1 border-t border-b border-r border-[#CDA435] text-[#CDA435] rounded-r-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Next
            </button>
          </div>
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

export default RejectedCompanyQuotesList;