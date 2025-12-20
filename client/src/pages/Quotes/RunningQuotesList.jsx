import React, { useState, useEffect, useMemo } from 'react';
import { FiEye, FiEdit, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import api from '../../utils/api';

const RunningQuotesList = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Table controls
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'descending' });

  useEffect(() => {
    fetchRunningQuotes();
  }, []);

  const fetchRunningQuotes = async () => {
    try {
      setLoading(true);
      const data = await api('/api/quotes/status/running');
      setQuotes(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseQuote = async (quoteId) => {
    if (!window.confirm('Are you sure you want to close this quote?')) return;

    try {
      await api(`/api/quotes/${quoteId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'closed' })
      });

      // Remove from running list
      setQuotes(quotes.filter(quote => quote.id !== quoteId));
    } catch (err) {
      alert('Error closing quote: ' + err.message);
    }
  };

  // Data processing
  const filteredQuotes = useMemo(() => {
    if (!searchTerm) return quotes;
    return quotes.filter(quote =>
      Object.values(quote).some(val =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [quotes, searchTerm]);

  const sortedQuotes = useMemo(() => {
    let sortable = [...filteredQuotes];
    if (sortConfig.key) {
      sortable.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortable;
  }, [filteredQuotes, sortConfig]);

  const paginatedQuotes = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * itemsPerPage;
    const lastPageIndex = firstPageIndex + itemsPerPage;
    return sortedQuotes.slice(firstPageIndex, lastPageIndex);
  }, [sortedQuotes, currentPage, itemsPerPage]);

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const SortableHeader = ({ children, sortKey }) => (
    <th className="py-3 px-4 text-left font-semibold cursor-pointer" onClick={() => handleSort(sortKey)}>
      <div className="flex items-center">
        {children}
        {sortConfig.key === sortKey ? (
          sortConfig.direction === 'ascending' ? 
            <FiChevronUp className="ml-1" /> : 
            <FiChevronDown className="ml-1" />
        ) : null}
      </div>
    </th>
  );

  const totalPages = Math.ceil(sortedQuotes.length / itemsPerPage);
  const startEntry = (currentPage - 1) * itemsPerPage + 1;
  const endEntry = Math.min(startEntry + itemsPerPage - 1, sortedQuotes.length);

  if (loading) return <div className="text-center py-8">Loading running quotes...</div>;
  if (error) return <div className="text-red-500 text-center py-8">Error: {error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Running Quotes</h2>
        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          Total: {quotes.length}
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2 text-gray-600">
          <span>Show</span>
          <select 
            value={itemsPerPage}
            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          <span>entries</span>
        </div>
        <div className="flex items-center space-x-2">
          <label htmlFor="search" className="text-gray-600">Search:</label>
          <input 
            id="search"
            type="text" 
            placeholder="Search running quotes..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-[#e0c58a] text-gray-700">
            <tr>
              <SortableHeader sortKey="id">ID</SortableHeader>
              <SortableHeader sortKey="user_name">User</SortableHeader>
              <SortableHeader sortKey="product_description">Product</SortableHeader>
              <SortableHeader sortKey="departure_country">From</SortableHeader>
              <SortableHeader sortKey="arrival_country">To</SortableHeader>
              <SortableHeader sortKey="shipping_mode">Mode</SortableHeader>
              <SortableHeader sortKey="arrival_date">Arrival Date</SortableHeader>
              <SortableHeader sortKey="created_at">Started</SortableHeader>
              <th className="py-3 px-4 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {paginatedQuotes.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-8 text-gray-500">No running quotes found</td>
              </tr>
            ) : (
              paginatedQuotes.map((quote) => (
                <tr key={quote.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{quote.id}</td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium">{quote.user_name || 'Guest'}</div>
                      <div className="text-sm text-gray-500">{quote.user_email || quote.contact_email}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="max-w-xs truncate" title={quote.product_description}>
                      {quote.product_description}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium">{quote.departure_country}</div>
                      <div className="text-sm text-gray-500">{quote.departure_city}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium">{quote.arrival_country}</div>
                      <div className="text-sm text-gray-500">{quote.arrival_city}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 capitalize">{quote.shipping_mode}</td>
                  <td className="py-3 px-4">
                    {new Date(quote.arrival_date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    {new Date(quote.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleCloseQuote(quote.id)}
                        className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-md transition duration-300"
                        title="Close Quote"
                      >
                        <FiEdit />
                      </button>
                      <button 
                        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md transition duration-300"
                        title="View Details"
                      >
                        <FiEye />
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
      <div className="flex justify-between items-center mt-4">
        <div className="text-gray-600">
          Showing {sortedQuotes.length > 0 ? startEntry : 0} to {endEntry} of {sortedQuotes.length} entries
        </div>
        <div className="flex items-center">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded-l-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-3 py-1 border-t border-b bg-[#e0c58a] text-gray-800 font-bold">
            {currentPage}
          </span>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-3 py-1 border border-gray-300 rounded-r-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default RunningQuotesList;