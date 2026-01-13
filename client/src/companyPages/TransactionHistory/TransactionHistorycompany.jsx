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
        bg: 'bg-green-100', 
        text: 'text-green-800', 
        icon: FiCheckCircle,
        label: 'Verified'
      },
      rejected: { 
        bg: 'bg-red-100', 
        text: 'text-red-800', 
        icon: FiXCircle,
        label: 'Rejected'
      },
      pending: { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-800', 
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
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  // Payment method icons for subscriptions
  const getPaymentIcon = (paymentMethod) => {
    switch (paymentMethod?.toLowerCase()) {
      case 'paypal':
        return <FaPaypal className="text-blue-600" />;
      case 'credit_card':
      case 'card':
        return <FiCreditCard className="text-green-600" />;
      case 'bank_transfer':
        return <FaUniversity className="text-purple-600" />;
      case 'manual':
      default:
        return <FaMoneyBillWave className="text-[#CDA435]" />;
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#CDA435] mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading transaction history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-2">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#CDA435] to-[#D9B95B] bg-clip-text text-transparent mb-4">
              Transaction History
            </h1>
            <p className="text-gray-600 text-lg mb-6">
              View your payment verifications and subscription transactions
            </p>
            
            {/* Toggle Buttons */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setViewMode('verifications')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  viewMode === 'verifications'
                    ? 'bg-gradient-to-r from-[#CDA435] to-[#D9B95B] text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FiShield className="text-lg" />
                Payment Verifications
              </button>
              <button
                onClick={() => setViewMode('subscriptions')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  viewMode === 'subscriptions'
                    ? 'bg-gradient-to-r from-[#CDA435] to-[#D9B95B] text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FiRepeat className="text-lg" />
                Subscription Transactions
              </button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiFilter className="text-[#CDA435]" />
                Filters & Search
              </h2>
              <span className="text-sm text-gray-500">
                {filteredData.length} of {currentData.length} {viewMode === 'verifications' ? 'verifications' : 'transactions'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 transition-colors"
                >
                  <FiX className="text-sm" />
                  Clear All
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  showFilters 
                    ? 'bg-[#CDA435] text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FiFilter className="text-sm" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
          </div>

          {/* Search Bar - Always Visible */}
          <div className="mb-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={viewMode === 'verifications' 
                  ? "Search by customer, quote ID, product, or country..." 
                  : "Search by plan name, payment method, or amount..."
                }
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Advanced Filters - Collapsible */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Name</label>
                  <input
                    type="text"
                    placeholder="Customer name"
                    value={filters.customerName}
                    onChange={(e) => setFilters(prev => ({ ...prev, customerName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                  />
                </div>
              )}

              {/* Amount Range Filters */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Min Amount ($)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.amountMin}
                  onChange={(e) => setFilters(prev => ({ ...prev, amountMin: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Max Amount ($)</label>
                <input
                  type="number"
                  placeholder="10000"
                  value={filters.amountMax}
                  onChange={(e) => setFilters(prev => ({ ...prev, amountMax: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                />
              </div>

              {/* Date Range Filters */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Data Table */}
        {filteredData.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-6 bg-gradient-to-r from-[#CDA435] to-[#D9B95B] rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              {viewMode === 'verifications' ? (
                <FiShield className="text-4xl text-white" />
              ) : (
                <FiRepeat className="text-4xl text-white" />
              )}
            </div>
            {currentData.length === 0 ? (
              <>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  No {viewMode === 'verifications' ? 'Payment Verifications' : 'Subscription Transactions'} Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  {viewMode === 'verifications' 
                    ? 'Payment verifications you perform will appear here.'
                    : 'Your subscription transactions will appear here.'
                  }
                </p>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">No Results Match Your Filters</h3>
                <p className="text-gray-600 mb-6">Try adjusting your filters to see more results.</p>
                <button
                  onClick={clearFilters}
                  className="px-8 py-4 bg-gradient-to-r from-[#CDA435] to-[#D9B95B] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 mx-auto"
                >
                  <FiRefreshCw className="text-lg" />
                  Clear All Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="table-container">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-[#CDA435] to-[#D9B95B] text-white">
                  <tr>
                    {viewMode === 'verifications' ? (
                      // Payment Verifications Table Headers
                      <>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Quote ID</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Customer</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Route</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Amount</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Action</th>
                      </>
                    ) : (
                      // Subscription Transactions Table Headers
                      <>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Transaction ID</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Plan Name</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Amount</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Payment Method</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Action</th>
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
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="p-2 bg-gradient-to-r from-[#CDA435] to-[#D9B95B] rounded-lg text-white mr-3">
                                <FiFileText className="text-sm" />
                              </div>
                              <span className="text-sm font-medium text-gray-900">#{item.quote_id}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.user_name}</div>
                              <div className="text-sm text-gray-500">{item.user_email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {item.departure_country && (
                                <>
                                  <div className="w-5 h-4 flex-shrink-0">
                                    <Flag code={getCountryCode(item.departure_country)} className="w-full h-full object-cover rounded" />
                                  </div>
                                  <span className="text-xs text-gray-600">{item.departure_country}</span>
                                  <span className="text-gray-400">→</span>
                                  <div className="w-5 h-4 flex-shrink-0">
                                    <Flag code={getCountryCode(item.arrival_country)} className="w-full h-full object-cover rounded" />
                                  </div>
                                  <span className="text-xs text-gray-600">{item.arrival_country}</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-lg font-bold text-green-600">${item.price}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getVerificationStatusBadge(item.payment_status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(item.verification_date || item.payment_proof_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleViewDetails(item)}
                              className="gradient-btn transaction-view-btn flex items-center gap-2 px-3 py-2 text-white rounded-lg transition-all duration-200 text-sm font-medium"
                              title="View Verification Details"
                            >
                              <FiEye className="text-sm" />
                              <span className="mobile-hide-text">View</span>
                            </button>
                          </td>
                        </>
                      ) : (
                        // Subscription Transaction Row
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="p-2 bg-gradient-to-r from-[#CDA435] to-[#D9B95B] rounded-lg text-white mr-3">
                                <FiRepeat className="text-sm" />
                              </div>
                              <span className="text-sm font-medium text-gray-900">#{item.id}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.plan_name}</div>
                              {item.plan_description && (
                                <div className="text-sm text-gray-500">{item.plan_description}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-lg font-bold text-green-600">${item.amount_paid}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {getPaymentIcon(item.payment_method)}
                              <span className="text-sm text-gray-900">{getPaymentMethodName(item.payment_method)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getSubscriptionStatusBadge(item.payment_status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(item.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleViewDetails(item)}
                              className="gradient-btn transaction-view-btn flex items-center gap-2 px-3 py-2 text-white rounded-lg transition-all duration-200 text-sm font-medium"
                              title="View Transaction Details"
                            >
                              <FiEye className="text-sm" />
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-[#CDA435] to-[#D9B95B] bg-clip-text text-transparent">
                  {viewMode === 'verifications' ? 'Payment Verification Details' : 'Transaction Details'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <FiX className="text-2xl text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                {viewMode === 'verifications' ? (
                  <>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h3 className="font-semibold text-gray-800 mb-2">Quote Information</h3>
                      <p><strong>Quote ID:</strong> #{selectedVerification.quote_id}</p>
                      <p><strong>Amount:</strong> ${selectedVerification.price}</p>
                      <p><strong>Status:</strong> {selectedVerification.payment_status}</p>
                      <p><strong>Verified At:</strong> {formatDate(selectedVerification.verification_date || selectedVerification.payment_proof_date)}</p>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <h3 className="font-semibold text-gray-800 mb-2">Customer Information</h3>
                      <p><strong>Name:</strong> {selectedVerification.user_name}</p>
                      <p><strong>Email:</strong> {selectedVerification.user_email}</p>
                    </div>
                    
                    {selectedVerification.payment_notes && (
                      <div className="p-4 bg-yellow-50 rounded-xl">
                        <h3 className="font-semibold text-gray-800 mb-2">Verification Notes</h3>
                        <p>{selectedVerification.payment_notes}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h3 className="font-semibold text-gray-800 mb-2">Subscription Details</h3>
                      <p><strong>Plan:</strong> {selectedVerification.plan_name}</p>
                      <p><strong>Amount:</strong> ${selectedVerification.amount_paid}</p>
                      <p><strong>Status:</strong> {selectedVerification.payment_status}</p>
                      <p><strong>Payment Method:</strong> {getPaymentMethodName(selectedVerification.payment_method)}</p>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-xl">
                      <h3 className="font-semibold text-gray-800 mb-2">Subscription Period</h3>
                      <p><strong>Start Date:</strong> {formatDate(selectedVerification.start_date)}</p>
                      <p><strong>End Date:</strong> {formatDate(selectedVerification.end_date)}</p>
                      <p><strong>Transaction Date:</strong> {formatDate(selectedVerification.created_at)}</p>
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