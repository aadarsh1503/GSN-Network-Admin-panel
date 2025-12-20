import React, { useState, useEffect, useMemo } from 'react';
import { FiEye, FiEdit, FiChevronUp, FiChevronDown, FiFilter } from 'react-icons/fi';
import api from '../../utils/api';

const QuotesList = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Table controls
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'descending' });
  const [statusFilter, setStatusFilter] = useState('');

  // Modal state
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const data = await api('/api/quotes/all');
      setQuotes(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedQuote || !newStatus) return;

    try {
      await api(`/api/quotes/${selectedQuote.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });

      // Update local state
      setQuotes(quotes.map(quote => 
        quote.id === selectedQuote.id 
          ? { ...quote, status: newStatus }
          : quote
      ));

      setIsModalOpen(false);
      setSelectedQuote(null);
      setNewStatus('');
    } catch (err) {
      alert('Error updating quote status: ' + err.message);
    }
  };

  const openStatusModal = (quote) => {
    setSelectedQuote(quote);
    setNewStatus(quote.status);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedQuote(null);
    setNewStatus('');
  };

  // Data processing
  const filteredQuotes = useMemo(() => {
    let filtered = quotes;

    if (statusFilter) {
      filtered = filtered.filter(quote => quote.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(quote =>
        Object.values(quote).some(val =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    return filtered;
  }, [quotes, statusFilter, searchTerm]);

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

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      running: 'bg-blue-100 text-blue-800',
      closed: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const totalPages = Math.ceil(sortedQuotes.length / itemsPerPage);
  const startEntry = (currentPage - 1) * itemsPerPage + 1;
  const endEntry = Math.min(startEntry + itemsPerPage - 1, sortedQuotes.length);

  if (loading) return <div className="text-center py-8">Loading quotes...</div>;
  if (error) return <div className="text-red-500 text-center py-8">Error: {error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">All Quotes</h2>
        <div className="flex items-center space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="running">Running</option>
            <option value="closed">Closed</option>
          </select>
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
            placeholder="Search quotes..."
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
              <SortableHeader sortKey="status">Status</SortableHeader>
              <SortableHeader sortKey="created_at">Date</SortableHeader>
              <th className="py-3 px-4 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {paginatedQuotes.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-8 text-gray-500">No quotes found</td>
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
                  <td className="py-3 px-4">{quote.departure_country}</td>
                  <td className="py-3 px-4">{quote.arrival_country}</td>
                  <td className="py-3 px-4 capitalize">{quote.shipping_mode}</td>
                  <td className="py-3 px-4">{getStatusBadge(quote.status)}</td>
                  <td className="py-3 px-4">
                    {new Date(quote.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => openStatusModal(quote)}
                        className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-md transition duration-300"
                        title="Update Status"
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

      {/* Status Update Modal */}
      {isModalOpen && selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Update Quote Status</h3>
            <div className="mb-4">
              <p className="text-gray-600 mb-2">Quote ID: {selectedQuote.id}</p>
              <p className="text-gray-600 mb-4">Product: {selectedQuote.product_description}</p>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="running">Running</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="flex justify-end space-x-4">
              <button 
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button 
                onClick={handleStatusUpdate}
                className="px-4 py-2 bg-[#CDA435] text-white rounded-md hover:bg-opacity-90"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotesList;