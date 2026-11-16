import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { FaEye, FaUser, FaCreditCard, FaCalendar, FaTrash, FaCheck, FaTimes, FaImage, FaWallet, FaTag, FaMobileAlt, FaEnvelope } from 'react-icons/fa';
import { api } from '../../utils/api';
import { adminToast } from '../../utils/adminToast';
import { useCurrency } from '../../contexts/CurrencyContext';

// --- Reusable read-only field (label above value) ---
const Field = ({ label, value, sub, mono }) => (
  <div>
    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
    <div className={`text-sm text-gray-800 break-all ${mono ? 'font-mono text-xs' : 'font-semibold'}`}>
      {value}
    </div>
    {sub && <div className="text-xs text-gray-400 font-normal mt-0.5">{sub}</div>}
  </div>
);

// --- Reusable section heading (gold accent bar + title) ---
const SectionTitle = ({ children, icon }) => (
  <div className="flex items-center gap-2.5 mb-4">
    <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-[#bca142] to-[#9d8635]" />
    {icon && <span className="text-[#bca142] text-sm">{icon}</span>}
    <h4 className="text-base font-bold text-gray-800 tracking-tight">{children}</h4>
  </div>
);

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
  const { format, formatUsd } = useCurrency();
  const location = useLocation();
  const [subscribers, setSubscribers] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Default to 'active' tab, only use location state if explicitly set
  const initialTab = 'active'; // Always default to active
  console.log('🔍 Subscribers Page - Initial Tab:', initialTab);
  console.log('🔍 Location state:', location.state);
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  
  // Handle navigation from notifications - set tab after mount
  useEffect(() => {
    if (location.state?.activeTab === 'incoming') {
      console.log('🔔 Notification redirect detected - switching to incoming tab');
      setActiveTab('incoming');
      // Clear the location state to prevent it from persisting
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
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

      // Close the details modal that triggered the approval
      setViewingRequest(null);

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
      // Close the details modal if the rejection was started from it
      setViewingRequest(null);
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
  const formatCurrency = (amount) => format(amount);

  // Total subscription value (plan price after coupon/proration, BEFORE wallet)
  const subscriptionTotal = (r) =>
    Number(r?.final_amount_bhd ?? r?.amount_paid ?? r?.plan_price ?? 0);

  // Amount actually paid outside the wallet (PayPal / bank transfer).
  // Prefers the stored external_amount_bhd, else derives it from total - wallet.
  const payableExternal = (r) => {
    const ext = r?.external_amount_bhd;
    if (ext !== null && ext !== undefined && ext !== '') return Number(ext);
    const wallet = Number(r?.wallet_amount_applied || 0);
    return Math.max(0, Number((subscriptionTotal(r) - wallet).toFixed(3)));
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
                {/* <SortableHeader sortKey="status" sortConfig={sortConfig} onSort={handleSort}>Status</SortableHeader> */}
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
                      <div className="font-medium text-gray-900">
                        {formatCurrency(payableExternal(item))}
                        {item.coupon_code && (
                          <span className="ml-1 text-xs text-green-600 font-semibold">🎟️ -{formatCurrency(item.coupon_discount_bhd)}</span>
                        )}
                        <div className="text-xs text-gray-400 font-normal">{formatUsd(payableExternal(item))}</div>
                      </div>
                      {Number(item.wallet_amount_applied) > 0 && (
                        <div className="text-xs font-medium text-emerald-600">
                          Wallet used: {formatCurrency(item.wallet_amount_applied)}
                          <span className="block text-xs text-gray-400 font-normal">≈ {formatUsd(item.wallet_amount_applied)}</span>
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        {activeTab === 'active' ? (
                          <>
                            {(item.payment_status === 'completed' || item.payment_status === 'paid' || item.payment_status === 'success') ? (
                              <span className="text-green-600">✓ Paid</span>
                            ) : item.payment_status === 'pending' ? (
                              <span className="text-yellow-600">⏳ Pending</span>
                            ) : item.payment_status === 'failed' || item.payment_status === 'rejected' ? (
                              <span className="text-red-600">✗ Failed</span>
                            ) : (
                              <span className="text-gray-600">• {item.payment_status || 'Unknown'}</span>
                            )}
                            {item.proration_details && (() => {
                              try {
                                const prorationData = typeof item.proration_details === 'string' 
                                  ? JSON.parse(item.proration_details) 
                                  : item.proration_details;
                                
                                // Show UPGRADE badge if proration data exists with a current plan
                                if (prorationData && prorationData.currentPlanName) {
                                  return (
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                        UPGRADE
                                      </span>
                                    </div>
                                  );
                                }
                              } catch (error) {
                                console.error('Error parsing proration details:', error);
                              }
                              return null;
                            })()}
                          </>
                        ) : (
                          <>
                            <span className="text-blue-600">
                              {item.payment_method === 'paypal' ? 'PayPal' : 'Bank Transfer'}
                            </span>
                            {!!item.proration_applied && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                  UPGRADE
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    {activeTab === 'incoming' && (
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-mono text-sm text-gray-700">{item.transaction_id}</div>
                      </td>
                    )}
                    {/* <td className="p-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td> */}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#bca142] to-[#9d8635] px-6 py-4 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">Subscription Request Details</h3>
                <p className="text-white/80 text-xs mt-0.5">Review the request and take action</p>
              </div>
              <button
                onClick={() => setViewingRequest(null)}
                className="text-white/90 hover:text-white hover:bg-white/20 w-9 h-9 rounded-full flex items-center justify-center text-2xl leading-none transition"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              {/* Company Information */}
              <div className="md:col-span-2 pt-1">
                <SectionTitle icon={<FaUser />}>Company Information</SectionTitle>
              </div>

              <Field label="Company Name" value={viewingRequest.company_name || 'N/A'} />
              <Field label="Member Name" value={viewingRequest.user_name || 'N/A'} />
              <Field label="Email" value={viewingRequest.user_email || 'N/A'} />
              <Field label="Mobile Number" value={viewingRequest.user_phone || 'N/A'} />

              {/* Subscription Information */}
              <div className="md:col-span-2 pt-3">
                <SectionTitle icon={<FaCreditCard />}>Subscription Information</SectionTitle>
              </div>

              <Field label="Selected Plan" value={viewingRequest.plan_name || 'N/A'} />
              <Field label="Subscription Price" value={formatCurrency(viewingRequest.plan_price)} sub={formatUsd(viewingRequest.plan_price)} />
              <Field label="Payment Method" value={viewingRequest.payment_method === 'paypal' ? 'PayPal' : 'Bank Transfer'} />
              <Field label="Transaction ID" value={viewingRequest.transaction_id || 'N/A'} mono />

              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Amount to Pay</p>
                <div className="text-lg font-bold text-[#bca142]">{formatCurrency(payableExternal(viewingRequest))}</div>
                <div className="text-xs text-gray-400 font-normal">{formatUsd(payableExternal(viewingRequest))}</div>
                {Number(viewingRequest.wallet_amount_applied) > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Paid via {viewingRequest.payment_method === 'paypal' ? 'PayPal' : 'Bank Transfer'} (after wallet)
                  </p>
                )}
              </div>

              {/* Payment breakdown — shows how much the company paid from wallet */}
              {Number(viewingRequest.wallet_amount_applied) > 0 && (
                <div className="md:col-span-2">
                  <div className="rounded-xl border border-[#e6dcb8] bg-[#faf7ec] p-4">
                    <p className="text-xs font-bold text-[#9d8635] uppercase tracking-wide mb-3 flex items-center gap-2">
                      <FaWallet /> Payment Breakdown
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subscription amount</span>
                        <span className="font-semibold text-gray-800 text-right">
                          {formatCurrency(subscriptionTotal(viewingRequest))}
                          <span className="block text-xs text-gray-400 font-normal">{formatUsd(subscriptionTotal(viewingRequest))}</span>
                        </span>
                      </div>
                      <div className="flex justify-between text-[#9d8635]">
                        <span>Paid from wallet</span>
                        <span className="font-semibold text-right">
                          - {formatCurrency(viewingRequest.wallet_amount_applied)}
                          <span className="block text-xs text-gray-400 font-normal">≈ {formatUsd(viewingRequest.wallet_amount_applied)}</span>
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-[#e6dcb8] pt-2">
                        <span className="font-semibold text-gray-700">
                          Paid via {viewingRequest.payment_method === 'paypal' ? 'PayPal' : 'Bank Transfer'}
                        </span>
                        <span className="font-bold text-[#bca142] text-right">
                          {formatCurrency(payableExternal(viewingRequest))}
                          <span className="block text-xs text-gray-400 font-normal">{formatUsd(payableExternal(viewingRequest))}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Coupon details */}
              {viewingRequest.coupon_code && (
                <div className="md:col-span-2">
                  <div className="rounded-xl border border-[#e6dcb8] bg-[#faf7ec] p-4">
                    <p className="text-xs font-bold text-[#9d8635] uppercase tracking-wide mb-2 flex items-center gap-2">
                      <FaTag /> Coupon Applied
                    </p>
                    <span className="inline-block bg-[#bca142] text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                      {viewingRequest.coupon_code}
                    </span>
                    <p className="text-gray-600 text-xs mt-2">
                      Discount: <strong className="text-[#9d8635]">-{formatCurrency(viewingRequest.coupon_discount_bhd)}</strong>
                      &nbsp;|&nbsp; Original: {formatCurrency(viewingRequest.plan_price)}
                      &nbsp;→&nbsp; Final: <strong className="text-gray-800">{formatCurrency(viewingRequest.final_amount_bhd)}</strong>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      ≈ {formatUsd(viewingRequest.coupon_discount_bhd)} discount · {formatUsd(viewingRequest.plan_price)} original · {formatUsd(viewingRequest.final_amount_bhd)} final
                    </p>
                  </div>
                </div>
              )}


              {/* Proration Details Section */}
              {!!viewingRequest.proration_applied && viewingRequest.proration_details && (() => {
                let prorationData;
                try {
                  prorationData = typeof viewingRequest.proration_details === 'string' 
                    ? JSON.parse(viewingRequest.proration_details) 
                    : viewingRequest.proration_details;
                  
                  // Calculate days used from total days and days remaining
                  const totalDays = parseInt(prorationData.totalDaysInPeriod || 0);
                  const daysRemaining = parseInt(prorationData.daysRemaining || 0);
                  const daysUsed = totalDays - daysRemaining;
                  
                  // Add calculated field
                  prorationData.daysUsed = daysUsed;
                } catch (e) {
                  console.error('Error parsing proration details:', e);
                  return null;
                }

                return (
                  <div className="md:col-span-2 pt-3">
                    <div className="rounded-xl border border-[#e6dcb8] bg-[#faf7ec] p-4">
                      <div className="flex items-center gap-2.5 mb-4">
                        <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-[#bca142] to-[#9d8635]" />
                        <span className="bg-[#bca142] text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">UPGRADE</span>
                        <h4 className="text-base font-bold text-gray-800 tracking-tight">Proration Applied</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <Field label="Old Plan" value={prorationData.currentPlanName || 'Previous Plan'} />
                        <Field label="Days Remaining" value={`${prorationData.daysRemaining || 0} days`} />

                        <div className="md:col-span-2">
                          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Calculation Breakdown</p>
                          <div className="bg-white rounded-lg border border-[#e6dcb8] p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Old Plan Price:</span>
                              <span className="font-semibold text-gray-800 text-right">{formatCurrency(prorationData.currentPlanPrice || 0)}<span className="block text-xs text-gray-400 font-normal">{formatUsd(prorationData.currentPlanPrice || 0)}</span></span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Days Used / Total Days:</span>
                              <span className="font-semibold text-gray-800">
                                {prorationData.daysUsed || 0} / {prorationData.totalDaysInPeriod || 0}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm text-[#9d8635]">
                              <span className="font-medium">Credit from Old Plan:</span>
                              <span className="font-semibold text-right">+ {formatCurrency(prorationData.unusedValue || 0)}<span className="block text-xs text-gray-400 font-normal">≈ {formatUsd(prorationData.unusedValue || 0)}</span></span>
                            </div>
                            <div className="border-t border-[#e6dcb8] pt-2 mt-2" />
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">New Plan Price:</span>
                              <span className="font-semibold text-gray-800 text-right">{formatCurrency(prorationData.newPlanPrice || viewingRequest.plan_price)}<span className="block text-xs text-gray-400 font-normal">{formatUsd(prorationData.newPlanPrice || viewingRequest.plan_price)}</span></span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                              <span className="font-medium">Credit Applied:</span>
                              <span className="font-semibold text-right">- {formatCurrency(prorationData.unusedValue || 0)}<span className="block text-xs text-gray-400 font-normal">≈ {formatUsd(prorationData.unusedValue || 0)}</span></span>
                            </div>
                            <div className="border-t-2 border-[#bca142] pt-2 mt-2" />
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-gray-800">Final Amount to Pay:</span>
                              <span className="font-bold text-[#bca142] text-lg text-right">
                                {formatCurrency(prorationData.amountToCharge || viewingRequest.amount_paid || viewingRequest.plan_price)}
                                <span className="block text-xs text-gray-400 font-normal">{formatUsd(prorationData.amountToCharge || viewingRequest.amount_paid || viewingRequest.plan_price)}</span>
                              </span>
                            </div>
                            <div className="rounded-lg bg-[#faf7ec] border border-[#e6dcb8] p-2 mt-2">
                              <p className="text-xs text-[#9d8635] text-center font-medium">
                                Customer saves {formatCurrency(prorationData.unusedValue || prorationData.savings || 0)} with proration
                                <span className="block text-xs text-gray-400 font-normal">≈ {formatUsd(prorationData.unusedValue || prorationData.savings || 0)}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <Field label="Request Date" value={new Date(viewingRequest.created_at).toLocaleString()} />

              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold capitalize border ${getStatusColor(viewingRequest.status)}`}>
                  {viewingRequest.status}
                </span>
              </div>

              {/* Payment Proof - Only show for Bank Transfer */}
              {viewingRequest.payment_proof_url && viewingRequest.payment_method !== 'paypal' && (
                <div className="md:col-span-2 pt-3">
                  <SectionTitle icon={<FaImage />}>Payment Proof</SectionTitle>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
                      <FaImage className="text-[#bca142]" />
                      <span>Payment Receipt</span>
                    </div>
                    <img
                      src={viewingRequest.payment_proof_url}
                      alt="Payment Proof"
                      className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:opacity-95 transition"
                      onClick={() => window.open(viewingRequest.payment_proof_url, '_blank')}
                    />
                    <p className="text-xs text-gray-500 mt-2">Click image to view full size</p>
                  </div>
                </div>
              )}

              {/* PayPal Transaction Info - Only show for PayPal */}
              {viewingRequest.payment_method === 'paypal' && viewingRequest.paypal_order_id && (
                <div className="md:col-span-2 pt-3">
                  <SectionTitle icon={<FaCreditCard />}>PayPal Transaction</SectionTitle>
                  <div className="rounded-xl border border-[#e6dcb8] bg-[#faf7ec] p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <Field label="PayPal Order ID" value={viewingRequest.paypal_order_id} mono />
                      {viewingRequest.paypal_payer_id && (
                        <Field label="Payer ID" value={viewingRequest.paypal_payer_id} mono />
                      )}
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm text-[#9d8635] font-medium">
                      <FaCheck className="text-[#bca142]" />
                      <span>Payment verified through PayPal</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            </div>

            {/* Footer actions */}
            <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 flex flex-col sm:flex-row sm:justify-between gap-3 flex-shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={() => handleApproveRequest(viewingRequest.id)}
                  disabled={processingRequest === viewingRequest.id}
                  className="px-6 py-2.5 rounded-lg font-semibold text-white shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 bg-gradient-to-r from-[#bca142] to-[#9d8635] hover:opacity-90"
                >
                  {processingRequest === viewingRequest.id ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Approving…
                    </>
                  ) : (
                    <>
                      <FaCheck /> Approve Request
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setRequestToReject(viewingRequest);
                    setShowRejectionModal(true);
                  }}
                  disabled={processingRequest === viewingRequest.id}
                  className="px-6 py-2.5 rounded-lg font-semibold text-red-600 bg-white border border-red-200 transition disabled:opacity-50 flex items-center gap-2 hover:bg-red-50"
                >
                  <FaTimes /> Reject Request
                </button>
              </div>
              <button
                onClick={() => setViewingRequest(null)}
                className="px-5 py-2.5 rounded-lg font-semibold text-gray-600 bg-white border border-gray-300 hover:bg-gray-100 transition"
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
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processingRequest === requestToReject.id ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Rejecting…
                  </>
                ) : (
                  'Reject Request'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Subscription Details Modal */}
      {viewingSubscriber && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#bca142] to-[#9d8635] px-6 py-4 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">Subscription Details</h3>
                <p className="text-white/80 text-xs mt-0.5">Active subscription information</p>
              </div>
              <button
                onClick={() => setViewingSubscriber(null)}
                className="text-white/90 hover:text-white hover:bg-white/20 w-9 h-9 rounded-full flex items-center justify-center text-2xl leading-none transition"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              {/* Member Information */}
              <div className="md:col-span-2 pt-1">
                <SectionTitle icon={<FaUser />}>Member Information</SectionTitle>
              </div>

              <Field label="Name" value={viewingSubscriber.user_name || 'N/A'} />
              <Field label="Email" value={viewingSubscriber.user_email || 'N/A'} />
              <Field label="Phone" value={viewingSubscriber.user_phone || 'N/A'} />
              <Field label="Role" value={<span className="capitalize">{viewingSubscriber.user_role}</span>} />

              {/* Subscription Information */}
              <div className="md:col-span-2 pt-3">
                <SectionTitle icon={<FaCreditCard />}>Subscription Information</SectionTitle>
              </div>

              <Field label="Plan Name" value={viewingSubscriber.plan_name || 'N/A'} />
              <Field label="Plan Price" value={formatCurrency(viewingSubscriber.plan_price)} sub={formatUsd(viewingSubscriber.plan_price)} />
              <Field label="Duration" value={`${viewingSubscriber.duration_months} months`} />

              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Amount Paid</p>
                <div className="text-lg font-bold text-[#bca142]">{formatCurrency(payableExternal(viewingSubscriber))}</div>
                <div className="text-xs text-gray-400 font-normal">{formatUsd(payableExternal(viewingSubscriber))}</div>
              </div>

              {/* Wallet contribution for active subscriber */}
              {Number(viewingSubscriber.wallet_amount_applied) > 0 && (
                <div className="md:col-span-2">
                  <div className="rounded-xl border border-[#e6dcb8] bg-[#faf7ec] p-4">
                    <p className="text-xs font-bold text-[#9d8635] uppercase tracking-wide mb-3 flex items-center gap-2">
                      <FaWallet /> Payment Breakdown
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subscription amount</span>
                        <span className="font-semibold text-gray-800 text-right">
                          {formatCurrency(subscriptionTotal(viewingSubscriber))}
                          <span className="block text-xs text-gray-400 font-normal">{formatUsd(subscriptionTotal(viewingSubscriber))}</span>
                        </span>
                      </div>
                      <div className="flex justify-between text-[#9d8635]">
                        <span>Paid from wallet</span>
                        <span className="font-semibold text-right">
                          - {formatCurrency(viewingSubscriber.wallet_amount_applied)}
                          <span className="block text-xs text-gray-400 font-normal">≈ {formatUsd(viewingSubscriber.wallet_amount_applied)}</span>
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-[#e6dcb8] pt-2">
                        <span className="font-semibold text-gray-700">
                          Paid via {viewingSubscriber.payment_method === 'paypal' ? 'PayPal' : 'Bank Transfer'}
                        </span>
                        <span className="font-bold text-[#bca142] text-right">
                          {formatCurrency(payableExternal(viewingSubscriber))}
                          <span className="block text-xs text-gray-400 font-normal">{formatUsd(payableExternal(viewingSubscriber))}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Coupon details for active subscriber */}
              {viewingSubscriber.coupon_code && (
                <div className="md:col-span-2">
                  <div className="rounded-xl border border-[#e6dcb8] bg-[#faf7ec] p-4">
                    <p className="text-xs font-bold text-[#9d8635] uppercase tracking-wide mb-2 flex items-center gap-2">
                      <FaTag /> Coupon Used
                    </p>
                    <span className="inline-block bg-[#bca142] text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                      {viewingSubscriber.coupon_code}
                    </span>
                    <p className="text-gray-600 text-xs mt-2">
                      Discount: <strong className="text-[#9d8635]">-{formatCurrency(viewingSubscriber.coupon_discount_bhd)}</strong>
                      &nbsp;|&nbsp; Original: {formatCurrency(viewingSubscriber.plan_price)}
                      &nbsp;→&nbsp; Final paid: <strong className="text-gray-800">{formatCurrency(viewingSubscriber.final_amount_bhd || viewingSubscriber.amount_paid)}</strong>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      ≈ {formatUsd(viewingSubscriber.coupon_discount_bhd)} discount · {formatUsd(viewingSubscriber.plan_price)} original · {formatUsd(viewingSubscriber.final_amount_bhd || viewingSubscriber.amount_paid)} final
                    </p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold capitalize border ${getStatusColor(viewingSubscriber.status)}`}>
                  {viewingSubscriber.status}
                </span>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Payment Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold capitalize border ${
                  (viewingSubscriber.payment_status === 'completed' || viewingSubscriber.payment_status === 'paid' || viewingSubscriber.payment_status === 'success')
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : viewingSubscriber.payment_status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    : 'bg-red-100 text-red-800 border-red-200'
                }`}>
                  {viewingSubscriber.payment_status || 'Unknown'}
                </span>
              </div>

              <Field label="Start Date" value={formatDate(viewingSubscriber.start_date)} />
              <Field label="End Date" value={formatDate(viewingSubscriber.end_date)} />

              {viewingSubscriber.transaction_id && (
                <Field label="Transaction ID" value={viewingSubscriber.transaction_id} mono />
              )}

              <Field label="Subscription Date" value={new Date(viewingSubscriber.created_at).toLocaleString()} />

              {/* Proration Details Section */}
              {viewingSubscriber.proration_details && (() => {
                let prorationData;
                try {
                  prorationData = typeof viewingSubscriber.proration_details === 'string'
                    ? JSON.parse(viewingSubscriber.proration_details)
                    : viewingSubscriber.proration_details;

                  // Calculate days used from total days and days remaining
                  const totalDays = parseInt(prorationData.totalDaysInPeriod || 0);
                  const daysRemaining = parseInt(prorationData.daysRemaining || 0);
                  prorationData.daysUsed = totalDays - daysRemaining;
                } catch (e) {
                  console.error('Error parsing proration details:', e);
                  return null;
                }

                if (!(prorationData && Object.keys(prorationData).length > 0)) return null;

                return (
                  <div className="md:col-span-2 pt-3">
                    <div className="rounded-xl border border-[#e6dcb8] bg-[#faf7ec] p-4">
                      <div className="flex items-center gap-2.5 mb-4">
                        <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-[#bca142] to-[#9d8635]" />
                        <span className="bg-[#bca142] text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">UPGRADE</span>
                        <h4 className="text-base font-bold text-gray-800 tracking-tight">Proration Applied</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <Field label="Old Plan" value={prorationData.currentPlanName || 'Previous Plan'} />
                        <Field label="Days Remaining" value={`${prorationData.daysRemaining || 0} days`} />

                        <div className="md:col-span-2">
                          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Calculation Breakdown</p>
                          <div className="bg-white rounded-lg border border-[#e6dcb8] p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Old Plan Price:</span>
                              <span className="font-semibold text-gray-800 text-right">{formatCurrency(prorationData.currentPlanPrice || 0)}<span className="block text-xs text-gray-400 font-normal">{formatUsd(prorationData.currentPlanPrice || 0)}</span></span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Days Used / Total Days:</span>
                              <span className="font-semibold text-gray-800">
                                {prorationData.daysUsed || 0} / {prorationData.totalDaysInPeriod || 0}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm text-[#9d8635]">
                              <span className="font-medium">Credit from Old Plan:</span>
                              <span className="font-semibold text-right">+ {formatCurrency(prorationData.unusedValue || 0)}<span className="block text-xs text-gray-400 font-normal">≈ {formatUsd(prorationData.unusedValue || 0)}</span></span>
                            </div>
                            <div className="border-t border-[#e6dcb8] pt-2 mt-2" />
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">New Plan Price:</span>
                              <span className="font-semibold text-gray-800 text-right">{formatCurrency(prorationData.newPlanPrice || viewingSubscriber.plan_price)}<span className="block text-xs text-gray-400 font-normal">{formatUsd(prorationData.newPlanPrice || viewingSubscriber.plan_price)}</span></span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                              <span className="font-medium">Credit Applied:</span>
                              <span className="font-semibold text-right">- {formatCurrency(prorationData.unusedValue || 0)}<span className="block text-xs text-gray-400 font-normal">≈ {formatUsd(prorationData.unusedValue || 0)}</span></span>
                            </div>
                            <div className="border-t-2 border-[#bca142] pt-2 mt-2" />
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-gray-800">Final Amount Paid:</span>
                              <span className="font-bold text-[#bca142] text-lg text-right">
                                {formatCurrency(prorationData.amountToCharge || viewingSubscriber.amount_paid)}
                                <span className="block text-xs text-gray-400 font-normal">{formatUsd(prorationData.amountToCharge || viewingSubscriber.amount_paid)}</span>
                              </span>
                            </div>
                            <div className="rounded-lg bg-[#faf7ec] border border-[#e6dcb8] p-2 mt-2">
                              <p className="text-xs text-[#9d8635] text-center font-medium">
                                Customer saved {formatCurrency(prorationData.unusedValue || prorationData.savings || 0)} with proration
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 flex justify-end flex-shrink-0">
              <button
                onClick={() => setViewingSubscriber(null)}
                className="px-5 py-2.5 rounded-lg font-semibold text-gray-600 bg-white border border-gray-300 hover:bg-gray-100 transition"
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