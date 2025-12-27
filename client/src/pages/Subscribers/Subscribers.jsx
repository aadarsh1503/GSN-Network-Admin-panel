import React, { useState, useEffect, useMemo } from 'react';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { FaEye, FaUser, FaCreditCard, FaCalendar } from 'react-icons/fa';
import { api } from '../../utils/api';
import { adminToast } from '../../utils/adminToast';

// --- Reusable Component for Sortable Table Headers ---
const SortableHeader = ({ children, sortKey, sortConfig, onSort }) => {
    const isSorted = sortConfig.key === sortKey;
    return (
        <th 
            className="p-3 text-left text-sm font-semibold text-gray-600 tracking-wider cursor-pointer hover:bg-gray-100"
            onClick={() => onSort(sortKey)}
        >
            <div className="flex items-center">
                <span>{children}</span>
                <div className="flex flex-col ml-auto">
                    <FiChevronUp className={`h-3 w-3 -mb-1 ${isSorted && sortConfig.direction === 'asc' ? 'text-gray-700' : 'text-gray-400'}`}/>
                    <FiChevronDown className={`h-3 w-3 -mt-1 ${isSorted && sortConfig.direction === 'desc' ? 'text-gray-700' : 'text-gray-400'}`}/>
                </div>
            </div>
        </th>
    );
};

const Subscribers = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [viewingSubscriber, setViewingSubscriber] = useState(null);

  // Fetch subscribers data
  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/admin-panel/subscriptions');
        setSubscribers(response);
      } catch (error) {
        console.error('Error fetching subscribers:', error);
        adminToast.error('Failed to load subscribers data');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscribers();
  }, []);

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Handle view subscriber details
  const handleViewSubscriber = async (subscriber) => {
    try {
      const details = await api.get(`/api/admin-panel/subscriptions/${subscriber.id}`);
      setViewingSubscriber(details);
    } catch (error) {
      adminToast.error('Failed to load subscriber details');
    }
  };

  // Filter and sort subscribers
  const filteredAndSortedSubscribers = useMemo(() => {
    let filtered = [...subscribers];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(subscriber =>
        subscriber.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subscriber.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subscriber.plan_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subscriber.status?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle different data types
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [subscribers, searchTerm, sortConfig]);

  // Pagination
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredAndSortedSubscribers.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredAndSortedSubscribers.length / entriesPerPage);

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CDA435]"></div>
      </div>
    );
  }
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Subscription Members</h1>
            <p className="text-gray-600 text-sm mt-1">Members who have purchased subscription plans</p>
          </div>
          <div className="bg-yellow-50 text-[#CDA435] px-4 py-2 rounded-lg">
            <span className="font-semibold">{filteredAndSortedSubscribers.length}</span> Subscribers
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <div className="flex items-center text-sm text-gray-600">
            <span>Show</span>
            <select 
              className="mx-2 border border-gray-300 rounded-md p-1"
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <span>entries</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <label htmlFor="search" className="mr-2">Search:</label>
            <input 
              id="search"
              type="text" 
              className="border border-gray-300 rounded-md p-1.5"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, email, plan..."
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#D9B95B]">
              <tr>
                <SortableHeader sortKey="id" sortConfig={sortConfig} onSort={handleSort}>Sr. No</SortableHeader>
                <SortableHeader sortKey="user_name" sortConfig={sortConfig} onSort={handleSort}>Member Name</SortableHeader>
                <SortableHeader sortKey="user_email" sortConfig={sortConfig} onSort={handleSort}>Email</SortableHeader>
                <SortableHeader sortKey="plan_name" sortConfig={sortConfig} onSort={handleSort}>Plan</SortableHeader>
                <SortableHeader sortKey="amount_paid" sortConfig={sortConfig} onSort={handleSort}>Amount</SortableHeader>
                <SortableHeader sortKey="status" sortConfig={sortConfig} onSort={handleSort}>Status</SortableHeader>
                <SortableHeader sortKey="start_date" sortConfig={sortConfig} onSort={handleSort}>Start Date</SortableHeader>
                <SortableHeader sortKey="end_date" sortConfig={sortConfig} onSort={handleSort}>End Date</SortableHeader>
                <th className="p-3 text-left text-sm font-semibold text-gray-600 tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentEntries.length > 0 ? (
                currentEntries.map((subscriber, index) => (
                  <tr key={subscriber.id} className="hover:bg-gray-50">
                    <td className="p-3 whitespace-nowrap text-gray-700">{indexOfFirstEntry + index + 1}</td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-yellow-50 rounded-full flex items-center justify-center mr-3">
                          <FaUser className="text-[#CDA435] text-sm" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{subscriber.user_name}</div>
                          <div className="text-xs text-gray-500">ID: {subscriber.user_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap text-gray-700">{subscriber.user_email}</td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{subscriber.plan_name}</div>
                      <div className="text-xs text-gray-500">{subscriber.duration_months} months</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{formatCurrency(subscriber.amount_paid)}</div>
                      <div className="text-xs text-gray-500">
                        {subscriber.payment_status === 'completed' ? (
                          <span className="text-green-600">✓ Paid</span>
                        ) : (
                          <span className="text-red-600">✗ {subscriber.payment_status}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(subscriber.status)}`}>
                        {subscriber.status}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap text-gray-700">
                      <div className="flex items-center">
                        <FaCalendar className="text-gray-400 mr-1" />
                        {formatDate(subscriber.start_date)}
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap text-gray-700">
                      <div className="flex items-center">
                        <FaCalendar className="text-gray-400 mr-1" />
                        {formatDate(subscriber.end_date)}
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <button
                        onClick={() => handleViewSubscriber(subscriber)}
                        className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center p-8">
                    <div className="text-gray-500">
                      <FaUser className="mx-auto text-4xl mb-2 opacity-50" />
                      <p>No subscription members found</p>
                      {searchTerm && <p className="text-sm">Try adjusting your search criteria</p>}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-gray-600">
          <p>
            Showing {filteredAndSortedSubscribers.length > 0 ? indexOfFirstEntry + 1 : 0} to{' '}
            {Math.min(indexOfLastEntry, filteredAndSortedSubscribers.length)} of{' '}
            {filteredAndSortedSubscribers.length} entries
          </p>
          <div className="flex items-center mt-2 sm:mt-0">
            <button 
              className="px-3 py-1 border border-[#D9B95B] text-[#D9B95B] rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="px-3 py-1 border-y border-[#D9B95B] bg-[#D9B95B] text-white">
              {currentPage}
            </span>
            <button 
              className="px-3 py-1 border border-[#D9B95B] text-[#D9B95B] rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Subscriber Details Modal */}
      {viewingSubscriber && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-xl font-bold">Subscription Details</h3>
              <button 
                onClick={() => setViewingSubscriber(null)} 
                className="text-gray-500 hover:text-black text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Member Information */}
              <div className="md:col-span-2">
                <h4 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">Member Information</h4>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="p-2 bg-gray-50 rounded border">{viewingSubscriber.user_name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="p-2 bg-gray-50 rounded border">{viewingSubscriber.user_email}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <p className="p-2 bg-gray-50 rounded border">{viewingSubscriber.user_phone || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <p className="p-2 bg-gray-50 rounded border capitalize">{viewingSubscriber.user_role}</p>
              </div>

              {/* Subscription Information */}
              <div className="md:col-span-2 mt-4">
                <h4 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">Subscription Information</h4>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                <p className="p-2 bg-gray-50 rounded border">{viewingSubscriber.plan_name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Price</label>
                <p className="p-2 bg-gray-50 rounded border">{formatCurrency(viewingSubscriber.plan_price)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <p className="p-2 bg-gray-50 rounded border">{viewingSubscriber.duration_months} months</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
                <p className="p-2 bg-gray-50 rounded border">{formatCurrency(viewingSubscriber.amount_paid)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <p className={`p-2 rounded border ${getStatusColor(viewingSubscriber.status)}`}>
                  {viewingSubscriber.status}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                <p className={`p-2 rounded border ${viewingSubscriber.payment_status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {viewingSubscriber.payment_status}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <p className="p-2 bg-gray-50 rounded border">{formatDate(viewingSubscriber.start_date)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <p className="p-2 bg-gray-50 rounded border">{formatDate(viewingSubscriber.end_date)}</p>
              </div>
              
              {viewingSubscriber.transaction_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                  <p className="p-2 bg-gray-50 rounded border font-mono text-sm">{viewingSubscriber.transaction_id}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Date</label>
                <p className="p-2 bg-gray-50 rounded border">{new Date(viewingSubscriber.created_at).toLocaleString()}</p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setViewingSubscriber(null)}
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

export default Subscribers;