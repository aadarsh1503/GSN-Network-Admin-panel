import React, { useState, useEffect, useMemo } from 'react';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { FaEye, FaUser, FaCreditCard, FaCalendar, FaTrash, FaCheck, FaTimes, FaImage } from 'react-icons/fa';
import { api } from '../../utils/api';
import { adminToast } from '../../utils/adminToast';

// --- Reusable Component for Sortable Table Headers ---
const SortableHeader = ({ children, sortKey, sortConfig, onSort }) => {
    const isSorted = sortConfig.key === sortKey;
    return (
        <th 
            className="p-3 text-left text-sm font-semibold text-white tracking-wider cursor-pointer hover:bg-gray-100"
            onClick={() => onSort(sortKey)}
        >
            <div className="flex items-center">
                <span>{children}</span>
                <div className="flex flex-col ml-auto">
                    <FiChevronUp className={`h-3 w-3 -mb-1 ${isSorted && sortConfig.direction === 'asc' ? 'text-white' : 'text-gray-300'}`}/>
                    <FiChevronDown className={`h-3 w-3 -mt-1 ${isSorted && sortConfig.direction === 'desc' ? 'text-white' : 'text-gray-300'}`}/>
                </div>
            </div>
        </th>
    );
};

const Subscribers = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'incoming'
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [viewingSubscriber, setViewingSubscriber] = useState(null);
  const [viewingRequest, setViewingRequest] = useState(null);
  
  // Plan filtering
  const [planFilter, setPlanFilter] = useState('all');
  const [availablePlans, setAvailablePlans] = useState([]);
  
  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subscriberToDelete, setSubscriberToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  
  // Request actions
  const [processingRequest, setProcessingRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [requestToReject, setRequestToReject] = useState(null);

  // Fetch subscribers data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch both active subscribers and incoming requests
        const [subscribersResponse, requestsResponse] = await Promise.all([
          api.get('/api/admin-panel/subscriptions'),
          api.get('/api/admin-panel/subscription-requests')
        ]);
        
        setSubscribers(subscribersResponse);
        setIncomingRequests(requestsResponse);
        
        // Extract unique plans for filtering
        const allPlans = [...subscribersResponse, ...requestsResponse];
        const plans = [...new Set(allPlans.map(sub => sub.plan_name))].filter(Boolean);
        setAvailablePlans(plans);
      } catch (error) {
        console.error('Error fetching data:', error);
        adminToast.error('Failed to load subscribers data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Handle delete subscriber
  const handleDeleteSubscriber = async () => {
    if (!subscriberToDelete || !deletionReason.trim()) {
      adminToast.error('Please provide a reason for deletion');
      return;
    }
    
    try {
      setIsDeleting(true);
      await api.delete(`/api/admin-panel/subscriptions/${subscriberToDelete.id}`, {
        body: { reason: deletionReason.trim() }
      });
      
      // Remove from local state
      setSubscribers(prev => prev.filter(sub => sub.id !== subscriberToDelete.id));
      
      adminToast.success('Subscriber deleted successfully. Related invoices have been marked as cancelled.');
      setShowDeleteModal(false);
      setSubscriberToDelete(null);
      setDeletionReason('');
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      if (error.message.includes('Reason for deletion is required')) {
        adminToast.error('Please provide a reason for deletion');
      } else {
        adminToast.error('Failed to delete subscriber');
      }
    } finally {
      setIsDeleting(false);
    }
  };
  const handleViewSubscriber = async (subscriber) => {
    try {
      const details = await api.get(`/api/admin-panel/subscriptions/${subscriber.id}`);
      setViewingSubscriber(details);
    } catch (error) {
      adminToast.error('Failed to load subscriber details');
    }
  };

  const handleViewRequest = async (request) => {
    try {
      const details = await api.get(`/api/admin-panel/subscription-requests/${request.id}`);
      setViewingRequest(details);
    } catch (error) {
      adminToast.error('Failed to load request details');
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      setProcessingRequest(requestId);
      await api.post(`/api/admin-panel/subscription-requests/${requestId}/approve`);
      
      adminToast.success('Subscription request approved successfully');
      
      // Refresh data
      const [subscribersResponse, requestsResponse] = await Promise.all([
        api.get('/api/admin-panel/subscriptions'),
        api.get('/api/admin-panel/subscription-requests')
      ]);
      
      setSubscribers(subscribersResponse);
      setIncomingRequests(requestsResponse);
    } catch (error) {
      console.error('Error approving request:', error);
      adminToast.error('Failed to approve request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async () => {
    if (!requestToReject || !rejectionReason.trim()) {
      adminToast.error('Please provide a rejection reason');
      return;
    }

    try {
      setProcessingRequest(requestToReject.id);
      await api.post(`/api/admin-panel/subscription-requests/${requestToReject.id}/reject`, {
        reason: rejectionReason
      });
      
      adminToast.success('Subscription request rejected');
      
      // Refresh data
      const requestsResponse = await api.get('/api/admin-panel/subscription-requests');
      setIncomingRequests(requestsResponse);
      
      setShowRejectionModal(false);
      setRequestToReject(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting request:', error);
      adminToast.error('Failed to reject request');
    } finally {
      setProcessingRequest(null);
    }
  };

  // Filter and sort data based on active tab
  const filteredAndSortedData = useMemo(() => {
    const currentData = activeTab === 'active' ? subscribers : incomingRequests;
    let filtered = [...currentData];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.plan_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply plan filter
    if (planFilter !== 'all') {
      filtered = filtered.filter(item => item.plan_name === planFilter);
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
  }, [activeTab, subscribers, incomingRequests, searchTerm, planFilter, sortConfig]);

  // Pagination
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredAndSortedData.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredAndSortedData.length / entriesPerPage);

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
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bca142]"></div>
      </div>
    );
  }
  return (
    <div className="p-4 sm:p-6 lg:p-1 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Subscription Management</h1>
            <p className="text-gray-600 text-sm mt-1">Manage subscription requests and active members</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-yellow-50 text-[#bca142] px-4 py-2 rounded-lg">
              <span className="font-semibold">{activeTab === 'active' ? subscribers.length : incomingRequests.length}</span> 
              {activeTab === 'active' ? ' Active Subscribers' : ' Pending Requests'}
            </div>
          </div>
        </div>

        {/* Toggle Tabs */}
        <div className="mb-6">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => {
                setActiveTab('incoming');
                setCurrentPage(1);
              }}
              className={`flex-1 px-4 py-2 rounded-md font-semibold transition-all duration-200 ${
                activeTab === 'incoming'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Incoming Requests ({incomingRequests.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('active');
                setCurrentPage(1);
              }}
              className={`flex-1 px-4 py-2 rounded-md font-semibold transition-all duration-200 ${
                activeTab === 'active'
                  ? 'bg-[#bca142] text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Active Subscribers ({subscribers.length})
            </button>
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
          
          <div className="flex items-center gap-4">
            {/* Plan Filter */}
            <div className="flex items-center text-sm text-gray-600">
              <label htmlFor="planFilter" className="mr-2">Plan:</label>
              <select 
                id="planFilter"
                className="border border-gray-300 rounded-md p-1.5"
                value={planFilter}
                onChange={(e) => {
                  setPlanFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Plans</option>
                {availablePlans.map(plan => (
                  <option key={plan} value={plan}>{plan}</option>
                ))}
              </select>
            </div>
            
            {/* Search */}
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
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#bca142]">
              <tr>
                <SortableHeader sortKey="id" sortConfig={sortConfig} onSort={handleSort}>Sr. No</SortableHeader>
                <SortableHeader sortKey="user_name" sortConfig={sortConfig} onSort={handleSort}>Member Name</SortableHeader>
                <SortableHeader sortKey="user_email" sortConfig={sortConfig} onSort={handleSort}>Email</SortableHeader>
                <SortableHeader sortKey="plan_name" sortConfig={sortConfig} onSort={handleSort}>Plan</SortableHeader>
                <SortableHeader sortKey="amount_paid" sortConfig={sortConfig} onSort={handleSort}>Amount</SortableHeader>
                {activeTab === 'incoming' && (
                  <SortableHeader sortKey="transaction_id" sortConfig={sortConfig} onSort={handleSort}>Transaction ID</SortableHeader>
                )}
                <SortableHeader sortKey="status" sortConfig={sortConfig} onSort={handleSort}>Status</SortableHeader>
                {activeTab === 'active' ? (
                  <>
                    <SortableHeader sortKey="start_date" sortConfig={sortConfig} onSort={handleSort}>Start Date</SortableHeader>
                    <SortableHeader sortKey="end_date" sortConfig={sortConfig} onSort={handleSort}>End Date</SortableHeader>
                  </>
                ) : (
                  <SortableHeader sortKey="created_at" sortConfig={sortConfig} onSort={handleSort}>Request Date</SortableHeader>
                )}
                <th className="p-3 text-left text-sm font-semibold text-white tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentEntries.length > 0 ? (
                currentEntries.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="p-3 whitespace-nowrap text-gray-700">{indexOfFirstEntry + index + 1}</td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-yellow-50 rounded-full flex items-center justify-center mr-3">
                          <FaUser className="text-[#bca142] text-sm" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{item.user_name}</div>
                          <div className="text-xs text-gray-500">ID: {item.user_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap text-gray-700">{item.user_email}</td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{item.plan_name}</div>
                      <div className="text-xs text-gray-500">{item.duration_months} months</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{formatCurrency(item.amount_paid || item.plan_price)}</div>
                      <div className="text-xs text-gray-500">
                        {activeTab === 'active' ? (
                          item.payment_status === 'completed' ? (
                            <span className="text-green-600">✓ Paid</span>
                          ) : (
                            <span className="text-red-600">✗ {item.payment_status}</span>
                          )
                        ) : (
                          <span className="text-blue-600">Bank Transfer</span>
                        )}
                      </div>
                    </td>
                    {activeTab === 'incoming' && (
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-mono text-sm text-gray-700">{item.transaction_id}</div>
                      </td>
                    )}
                    <td className="p-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    {activeTab === 'active' ? (
                      <>
                        <td className="p-3 whitespace-nowrap text-gray-700">
                          <div className="flex items-center">
                            <FaCalendar className="text-gray-400 mr-1" />
                            {formatDate(item.start_date)}
                          </div>
                        </td>
                        <td className="p-3 whitespace-nowrap text-gray-700">
                          <div className="flex items-center">
                            <FaCalendar className="text-gray-400 mr-1" />
                            {formatDate(item.end_date)}
                          </div>
                        </td>
                      </>
                    ) : (
                      <td className="p-3 whitespace-nowrap text-gray-700">
                        <div className="flex items-center">
                          <FaCalendar className="text-gray-400 mr-1" />
                          {formatDate(item.created_at)}
                        </div>
                      </td>
                    )}
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => activeTab === 'active' ? handleViewSubscriber(item) : handleViewRequest(item)}
                          className="p-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        {activeTab === 'incoming' ? (
                          <>
                            <button
                              onClick={() => handleApproveRequest(item.id)}
                              disabled={processingRequest === item.id}
                              className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
                              title="Approve Request"
                            >
                              <FaCheck />
                            </button>
                            <button
                              onClick={() => {
                                setRequestToReject(item);
                                setShowRejectionModal(true);
                              }}
                              disabled={processingRequest === item.id}
                              className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                              title="Reject Request"
                            >
                              <FaTimes />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setSubscriberToDelete(item);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            title="Delete Subscriber"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={activeTab === 'incoming' ? "10" : "9"} className="text-center p-8">
                    <div className="text-gray-500">
                      <FaUser className="mx-auto text-4xl mb-2 opacity-50" />
                      <p>No {activeTab === 'active' ? 'active subscribers' : 'pending requests'} found</p>
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
            Showing {filteredAndSortedData.length > 0 ? indexOfFirstEntry + 1 : 0} to{' '}
            {Math.min(indexOfLastEntry, filteredAndSortedData.length)} of{' '}
            {filteredAndSortedData.length} entries
          </p>
          <div className="flex items-center mt-2 sm:mt-0">
            <button 
              className="px-3 py-1 border border-[#bca142] text-[#bca142] rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="px-3 py-1 border-y border-[#bca142] bg-[#bca142] text-white">
              {currentPage}
            </span>
            <button 
              className="px-3 py-1 border border-[#bca142] text-[#bca142] rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Request Details Modal */}
      {viewingRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-xl font-bold">Subscription Request Details</h3>
              <button 
                onClick={() => setViewingRequest(null)} 
                className="text-gray-500 hover:text-black text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Information */}
              <div className="md:col-span-2">
                <h4 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">Company Information</h4>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <p className="p-2 bg-gray-50 rounded border">{viewingRequest.company_name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member Name</label>
                <p className="p-2 bg-gray-50 rounded border">{viewingRequest.user_name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="p-2 bg-gray-50 rounded border">{viewingRequest.user_email}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <p className="p-2 bg-gray-50 rounded border">{viewingRequest.user_phone || 'N/A'}</p>
              </div>

              {/* Subscription Information */}
              <div className="md:col-span-2 mt-4">
                <h4 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">Subscription Information</h4>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selected Plan</label>
                <p className="p-2 bg-gray-50 rounded border">{viewingRequest.plan_name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Price</label>
                <p className="p-2 bg-gray-50 rounded border">{formatCurrency(viewingRequest.plan_price)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <p className="p-2 bg-gray-50 rounded border">Bank Transfer</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                <p className="p-2 bg-gray-50 rounded border font-mono">{viewingRequest.transaction_id}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Request Date</label>
                <p className="p-2 bg-gray-50 rounded border">{new Date(viewingRequest.created_at).toLocaleString()}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <p className={`p-2 rounded border ${getStatusColor(viewingRequest.status)}`}>
                  {viewingRequest.status}
                </p>
              </div>

              {/* Payment Proof */}
              {viewingRequest.payment_proof_url && (
                <div className="md:col-span-2 mt-4">
                  <h4 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">Payment Proof</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <FaImage className="text-blue-500" />
                      <span className="font-medium">Payment Receipt</span>
                    </div>
                    <img 
                      src={viewingRequest.payment_proof_url} 
                      alt="Payment Proof" 
                      className="max-w-full h-auto rounded-lg border shadow-sm cursor-pointer"
                      onClick={() => window.open(viewingRequest.payment_proof_url, '_blank')}
                    />
                    <p className="text-xs text-gray-500 mt-2">Click image to view full size</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-between">
              <div className="flex gap-3">
                <button 
                  onClick={() => handleApproveRequest(viewingRequest.id)}
                  disabled={processingRequest === viewingRequest.id}
                  className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
                >
                  <FaCheck /> Approve Request
                </button>
                <button 
                  onClick={() => {
                    setRequestToReject(viewingRequest);
                    setShowRejectionModal(true);
                  }}
                  disabled={processingRequest === viewingRequest.id}
                  className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
                >
                  <FaTimes /> Reject Request
                </button>
              </div>
              <button 
                onClick={() => setViewingRequest(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && requestToReject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Reject Subscription Request</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting {requestToReject.user_name}'s subscription request:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows="4"
              placeholder="Enter rejection reason..."
              required
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setRequestToReject(null);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectRequest}
                disabled={!rejectionReason.trim() || processingRequest === requestToReject.id}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
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
      
      {/* Delete Confirmation Modal with Reason */}
      {showDeleteModal && subscriberToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <FaTrash className="text-red-600 text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Subscriber</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete the subscription for <strong>"{subscriberToDelete.user_name}"</strong>?
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> The subscription will be deleted, but related invoices will be marked as "cancelled" instead of being deleted to maintain records.
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for deletion <span className="text-red-500">*</span>
              </label>
              <textarea
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows="3"
                placeholder="Please provide a reason for deleting this subscription..."
                required
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSubscriberToDelete(null);
                  setDeletionReason('');
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubscriber}
                disabled={!deletionReason.trim() || isDeleting}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <FaTrash />
                    Delete Subscriber
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscribers;