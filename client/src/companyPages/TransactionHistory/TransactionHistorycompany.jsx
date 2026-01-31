import React, { useState, useEffect, useMemo } from 'react';
import { 
  FiEye, FiCheckCircle, FiXCircle, FiClock, FiUser, FiMail, 
  FiDollarSign, FiCalendar, FiFileText, FiFilter, FiSearch,
  FiRefreshCw, FiX, FiTruck, FiMapPin, FiCreditCard, FiToggleLeft,
  FiToggleRight, FiRepeat, FiShield
} from 'react-icons/fi';
import { FaPaypal, FaUniversity, FaMoneyBillWave } from 'react-icons/fa';
import Flag from 'react-world-flags';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import toast from 'react-hot-toast';
import './TransactionHistorycompany.css';

const TransactionHistorycompany = () => {
  // Toggle between payment verifications and subscription transactions
  const [viewMode, setViewMode] = useState('verifications'); // 'verifications' or 'subscriptions'
  
  // Payment Verifications State
  const [verifications, setVerifications] = useState([]);
  const [selectedVerification, setSelectedVerification] = useState(null);
  
  // Subscription Transactions State
  const [subscriptionTransactions, setSubscriptionTransactions] = useState([]);
  
  // Common State
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
    customerName: ''
  });

  useEffect(() => {
    if (viewMode === 'verifications') {
      fetchVerificationHistory();
    } else {
      fetchSubscriptionTransactions();
    }
  }, [viewMode]);

  const fetchVerificationHistory = async () => {
    try {
      setLoading(true);
      // Use the same API as payment management to get verified payments
      const data = await api.get('/api/enhanced-quotes/company-responses-with-payments');
      
      // Filter for payments that have been verified or rejected by this company
      const verifiedPayments = data.filter(item => {
        return item.payment_status === 'verified' || item.payment_status === 'rejected';
      });
      
      setVerifications(Array.isArray(verifiedPayments) ? verifiedPayments : []);
    } catch (error) {
      console.error('Error fetching verification history:', error);
      toast.error('Failed to load verification history');
      setVerifications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionTransactions = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/subscriptions/company/subscription-transactions');
      setSubscriptionTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching subscription transactions:', error);
      toast.error('Failed to load subscription transactions');
      setSubscriptionTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Get current data based on view mode
  const currentData = viewMode === 'verifications' ? verifications : subscriptionTransactions;

  // Filter data based on current filters and view mode
  const filteredData = useMemo(() => {
    return currentData.filter(item => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        let searchableText = '';
        
        if (viewMode === 'verifications') {
          searchableText = [
            item.user_name,
            item.user_email,
            item.quote_id?.toString(),
            item.product_description,
            item.departure_country,
            item.arrival_country
          ].join(' ').toLowerCase();
        } else {
          searchableText = [
            item.plan_name,
            item.payment_method,
            item.amount_paid?.toString()
          ].join(' ').toLowerCase();
        }
        
        if (!searchableText.includes(searchTerm)) return false;
      }

      // Status filter
      if (filters.status) {
        const itemStatus = viewMode === 'verifications' ? item.payment_status : item.payment_status;
        if (itemStatus !== filters.status) return false;
      }

      // Customer name filter (only for verifications)
      if (filters.customerName && viewMode === 'verifications') {
        if (!item.user_name?.toLowerCase().includes(filters.customerName.toLowerCase())) return false;
      }

      // Amount filters
      const amount = viewMode === 'verifications' ? item.price : item.amount_paid;
      if (filters.amountMin && parseFloat(amount) < parseFloat(filters.amountMin)) return false;
      if (filters.amountMax && parseFloat(amount) > parseFloat(filters.amountMax)) return false;

      // Date filters
      if (filters.dateFrom) {
        const itemDate = new Date(viewMode === 'verifications' ? item.verification_date : item.created_at);
        const fromDate = new Date(filters.dateFrom);
        if (itemDate < fromDate) return false;
      }
      if (filters.dateTo) {
        const itemDate = new Date(viewMode === 'verifications' ? item.verification_date : item.created_at);
        const toDate = new Date(filters.dateTo);
        if (itemDate > toDate) return false;
      }

      return true;
    });
  }, [currentData, filters, viewMode]);

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      amountMin: '',
      amountMax: '',
      customerName: ''
    });
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  // Payment verification status badge
  const getVerificationStatusBadge = (status) => {
    const statusConfig = {
      verified: { 
        bg: 'bg-[#bca142]', 
        text: 'text-white', 
        icon: FiCheckCircle,
        label: 'Verified'
      },
      rejected: { 
        bg: 'bg-[#bca142]', 
        text: 'text-white', 
        icon: FiXCircle,
        label: 'Rejected'
      },
      pending: { 
        bg: 'bg-[#bca142]', 
        text: 'text-white', 
        icon: FiClock,
        label: 'Pending'
      }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${config.bg} ${config.text}`}>
        <IconComponent className="text-xs" />
        {config.label}
      </span>
    );
  };

  // Subscription transaction status badge
  const getSubscriptionStatusBadge = (status) => {
    const colors = {
      paid: 'bg-[#bca142] text-white',
      pending: 'bg-[#bca142] text-white',
      failed: 'bg-[#bca142] text-white',
      refunded: 'bg-[#bca142] text-white'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-[#bca142] text-white'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  // Payment method icons for subscriptions
  const getPaymentIcon = (paymentMethod) => {
    switch (paymentMethod?.toLowerCase()) {
      case 'paypal':
        return <FaPaypal className="text-[#bca142]" />;
      case 'credit_card':
      case 'card':
        return <FiCreditCard className="text-[#bca142]" />;
      case 'bank_transfer':
        return <FaUniversity className="text-[#bca142]" />;
      case 'manual':
      default:
        return <FaMoneyBillWave className="text-[#bca142]" />;
    }
  };

  const getPaymentMethodName = (paymentMethod) => {
    switch (paymentMethod?.toLowerCase()) {
      case 'paypal':
        return 'PayPal';
      case 'credit_card':
      case 'card':
        return 'Credit Card';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'manual':
      default:
        return 'Manual Payment';
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

  const handleViewDetails = (item) => {
    setSelectedVerification(item);
    setShowModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return 'N/A';
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#bca142] mx-auto mb-4"></div>
          <p className="text-xl text-black">Loading transaction history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-2">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4 border border-gray-200">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#bca142] mb-2">
              Transaction History
            </h1>
            
            {/* Toggle Buttons */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setViewMode('verifications')}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200 text-sm ${
                  viewMode === 'verifications'
                    ? 'bg-[#bca142] text-white shadow-lg'
                    : 'bg-gray-100 text-black hover:bg-gray-200'
                }`}
              >
                <FiShield className="text-sm" />
                Payment Verifications
              </button>
              <button
                onClick={() => setViewMode('subscriptions')}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200 text-sm ${
                  viewMode === 'subscriptions'
                    ? 'bg-[#bca142] text-white shadow-lg'
                    : 'bg-gray-100 text-black hover:bg-gray-200'
                }`}
              >
                <FiRepeat className="text-sm" />
                Subscription Transactions
              </button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-lg p-3 mb-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-black flex items-center gap-1">
                <FiFilter className="text-[#bca142] text-xs" />
                Filters & Search
              </h2>
              <span className="text-xs text-gray-500">
                {filteredData.length} of {currentData.length} {viewMode === 'verifications' ? 'verifications' : 'transactions'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-black transition-colors"
                >
                  <FiX className="text-xs" />
                  Clear All
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition-all duration-200 text-xs ${
                  showFilters 
                    ? 'bg-[#bca142] text-white' 
                    : 'bg-gray-100 text-black hover:bg-gray-200'
                }`}
              >
                <FiFilter className="text-xs" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
          </div>

          {/* Search Bar - Always Visible */}
          <div className="mb-2">
            <div className="relative">
              <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder={viewMode === 'verifications' 
                  ? "Search by customer, quote ID, product, or country..." 
                  : "Search by plan name, payment method, or amount..."
                }
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Advanced Filters - Collapsible */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 pt-2 border-t border-gray-200">
              {/* Status Filter */}
              <div>
                <label className="block text-xs font-semibold text-black mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  {viewMode === 'verifications' ? (
                    <>
                      <option value="verified">Verified</option>
                      <option value="rejected">Rejected</option>
                      <option value="pending">Pending</option>
                    </>
                  ) : (
                    <>
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </>
                  )}
                </select>
              </div>

              {/* Customer Name Filter - Only for verifications */}
              {viewMode === 'verifications' && (
                <div>
                  <label className="block text-xs font-semibold text-black mb-1">Customer Name</label>
                  <input
                    type="text"
                    placeholder="Customer name"
                    value={filters.customerName}
                    onChange={(e) => setFilters(prev => ({ ...prev, customerName: e.target.value }))}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent"
                  />
                </div>
              )}

              {/* Amount Range Filters */}
              <div>
                <label className="block text-xs font-semibold text-black mb-1">Min Amount ($)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.amountMin}
                  onChange={(e) => setFilters(prev => ({ ...prev, amountMin: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-black mb-1">Max Amount ($)</label>
                <input
                  type="number"
                  placeholder="10000"
                  value={filters.amountMax}
                  onChange={(e) => setFilters(prev => ({ ...prev, amountMax: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent"
                />
              </div>

              {/* Date Range Filters */}
              <div>
                <label className="block text-xs font-semibold text-black mb-1">From Date</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-black mb-1">To Date</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Data Table */}
        {filteredData.length === 0 ? (
          <div className="text-center py-8">
            <div className="p-4 bg-[#bca142] rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              {viewMode === 'verifications' ? (
                <FiShield className="text-2xl text-white" />
              ) : (
                <FiRepeat className="text-2xl text-white" />
              )}
            </div>
            {currentData.length === 0 ? (
              <>
                <h3 className="text-xl font-bold text-black mb-2">
                  No {viewMode === 'verifications' ? 'Payment Verifications' : 'Subscription Transactions'} Yet
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  {viewMode === 'verifications' 
                    ? 'Payment verifications you perform will appear here.'
                    : 'Your subscription transactions will appear here.'
                  }
                </p>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-black mb-2">No Results Match Your Filters</h3>
                <p className="text-gray-600 mb-4 text-sm">Try adjusting your filters to see more results.</p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 bg-[#bca142] text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 mx-auto text-sm"
                >
                  <FiRefreshCw className="text-sm" />
                  Clear All Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="table-container">
              <table className="min-w-full">
                <thead className="bg-[#bca142] text-white">
                  <tr>
                    {viewMode === 'verifications' ? (
                      // Payment Verifications Table Headers
                      <>
                        <th className="px-3 py-2 text-left text-xs font-semibold">Quote ID</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold">Customer</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold">Route</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold">Amount</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold">Action</th>
                      </>
                    ) : (
                      // Subscription Transactions Table Headers
                      <>
                        <th className="px-3 py-2 text-left text-xs font-semibold">Transaction ID</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold">Plan Name</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold">Amount</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold">Payment Method</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold">Action</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      {viewMode === 'verifications' ? (
                        // Payment Verification Row
                        <>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="p-1 bg-[#bca142] rounded-lg text-white mr-2">
                                <FiFileText className="text-xs" />
                              </div>
                              <span className="text-xs font-medium text-gray-900">#{item.quote_id}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div>
                              <div className="text-xs font-medium text-gray-900">{item.user_name}</div>
                              <div className="text-xs text-gray-500">{item.user_email}</div>
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center space-x-1">
                              {item.departure_country && (
                                <>
                                  <div className="w-4 h-3 flex-shrink-0">
                                    <Flag code={getCountryCode(item.departure_country)} className="w-full h-full object-cover rounded" />
                                  </div>
                                  <span className="text-xs text-gray-600">{item.departure_country}</span>
                                  <span className="text-gray-400">→</span>
                                  <div className="w-4 h-3 flex-shrink-0">
                                    <Flag code={getCountryCode(item.arrival_country)} className="w-full h-full object-cover rounded" />
                                  </div>
                                  <span className="text-xs text-gray-600">{item.arrival_country}</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className="text-sm font-bold text-black">${item.price}</span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {getVerificationStatusBadge(item.payment_status)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                            {formatDate(item.verification_date || item.payment_proof_date)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <button
                              onClick={() => handleViewDetails(item)}
                              className="gradient-btn transaction-view-btn flex items-center gap-1 px-2 py-1 text-white rounded-lg transition-all duration-200 text-xs font-medium"
                              title="View Verification Details"
                            >
                              <FiEye className="text-xs" />
                              <span className="mobile-hide-text">View</span>
                            </button>
                          </td>
                        </>
                      ) : (
                        // Subscription Transaction Row
                        <>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="p-1 bg-[#bca142] rounded-lg text-white mr-2">
                                <FiRepeat className="text-xs" />
                              </div>
                              <span className="text-xs font-medium text-gray-900">#{item.id}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div>
                              <div className="text-xs font-medium text-gray-900">{item.plan_name}</div>
                              {item.plan_description && (
                                <div className="text-xs text-gray-500">{item.plan_description}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className="text-sm font-bold text-black">${item.amount_paid}</span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center space-x-1">
                              {getPaymentIcon(item.payment_method)}
                              <span className="text-xs text-gray-900">{getPaymentMethodName(item.payment_method)}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {getSubscriptionStatusBadge(item.payment_status)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                            {formatDate(item.created_at)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <button
                              onClick={() => handleViewDetails(item)}
                              className="gradient-btn transaction-view-btn flex items-center gap-1 px-2 py-1 text-white rounded-lg transition-all duration-200 text-xs font-medium"
                              title="View Transaction Details"
                            >
                              <FiEye className="text-xs" />
                              <span className="mobile-hide-text">View</span>
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal for viewing details */}
      {showModal && selectedVerification && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-[#bca142]">
                  {viewMode === 'verifications' ? 'Payment Verification Details' : 'Transaction Details'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="text-lg text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-3">
                {viewMode === 'verifications' ? (
                  <>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-black mb-2 text-sm">Quote Information</h3>
                      <p className="text-sm"><strong>Quote ID:</strong> #{selectedVerification.quote_id}</p>
                      <p className="text-sm"><strong>Amount:</strong> ${selectedVerification.price}</p>
                      <p className="text-sm"><strong>Status:</strong> {selectedVerification.payment_status}</p>
                      <p className="text-sm"><strong>Verified At:</strong> {formatDate(selectedVerification.verification_date || selectedVerification.payment_proof_date)}</p>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-black mb-2 text-sm">Customer Information</h3>
                      <p className="text-sm"><strong>Name:</strong> {selectedVerification.user_name}</p>
                      <p className="text-sm"><strong>Email:</strong> {selectedVerification.user_email}</p>
                    </div>
                    
                    {selectedVerification.payment_notes && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold text-black mb-2 text-sm">Verification Notes</h3>
                        <p className="text-sm">{selectedVerification.payment_notes}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-black mb-2 text-sm">Subscription Details</h3>
                      <p className="text-sm"><strong>Plan:</strong> {selectedVerification.plan_name}</p>
                      <p className="text-sm"><strong>Amount:</strong> ${selectedVerification.amount_paid}</p>
                      <p className="text-sm"><strong>Status:</strong> {selectedVerification.payment_status}</p>
                      <p className="text-sm"><strong>Payment Method:</strong> {getPaymentMethodName(selectedVerification.payment_method)}</p>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-black mb-2 text-sm">Subscription Period</h3>
                      <p className="text-sm"><strong>Start Date:</strong> {formatDate(selectedVerification.start_date)}</p>
                      <p className="text-sm"><strong>End Date:</strong> {formatDate(selectedVerification.end_date)}</p>
                      <p className="text-sm"><strong>Transaction Date:</strong> {formatDate(selectedVerification.created_at)}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistorycompany;