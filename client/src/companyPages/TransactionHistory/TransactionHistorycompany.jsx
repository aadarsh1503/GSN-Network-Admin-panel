import React, { useState, useEffect, useMemo } from 'react';
import { 
  FiEye, FiCheckCircle, FiXCircle, FiClock, FiUser, FiMail, 
  FiDollarSign, FiCalendar, FiFileText, FiFilter, FiSearch,
  FiRefreshCw, FiX, FiTruck, FiMapPin, FiCreditCard, FiToggleLeft,
  FiToggleRight, FiRepeat, FiShield, FiTag, FiExternalLink, FiPackage
} from 'react-icons/fi';
import { FaPaypal, FaUniversity, FaMoneyBillWave } from 'react-icons/fa';
import Flag from 'react-world-flags';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import toast from 'react-hot-toast';
import { useCurrency } from '../../contexts/CurrencyContext';
import { currencyForCountry } from '../../utils/currency';
import './TransactionHistorycompany.css';

// --- Presentational helpers used by the details modal ---
const InfoSection = ({ title, icon: Icon, children, className = '' }) => (
  <div className={`border border-gray-200 rounded-xl overflow-hidden ${className}`}>
    <div className="flex items-center gap-2 px-4 py-2 bg-[#bca142]/10 border-b border-[#bca142]/25">
      {Icon && <Icon className="text-[#bca142]" />}
      <h3 className="text-xs font-bold uppercase tracking-wide text-black">{title}</h3>
    </div>
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">{children}</div>
  </div>
);

const InfoItem = ({ label, value, full = false }) => (
  <div className={full ? 'sm:col-span-2' : ''}>
    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
    <div className="text-sm text-gray-900 break-words mt-0.5">
      {value === null || value === undefined || value === '' ? (
        <span className="text-gray-300">—</span>
      ) : (
        value
      )}
    </div>
  </div>
);

// 1 / true / '1' -> Yes
const yesNo = (val) => (val === 1 || val === true || val === '1' ? 'Yes' : 'No');

// Join the non-empty parts of a route / address into a single readable string.
const joinParts = (parts, sep = ', ') => {
  const clean = (parts || []).filter((v) => v !== null && v !== undefined && v !== '');
  return clean.length ? clean.join(sep) : null;
};

// Inclusions / value added services arrive either as an array or a JSON string
// (sometimes a plain comma separated list). Render all three shapes safely.
const formatList = (val) => {
  if (val === null || val === undefined || val === '') return null;
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.join(', ');
      } catch {
        /* not JSON — fall through and show the raw string */
      }
    }
  }
  return val;
};

const TransactionHistorycompany = () => {
  // Every amount is stored in its native currency — quote payments (PayPal) in
  // USD, subscriptions in BHD — and shown here in the viewer's local currency.
  const { format, formatUsd, formatIn } = useCurrency();

  // Toggle between payment verifications and subscription transactions
  const [viewMode, setViewMode] = useState('verifications'); // 'verifications' or 'subscriptions'

  // Currency the raw filter values are compared against.
  const sourceCurrency = viewMode === 'verifications' ? 'USD' : 'BHD';
  
  // Payment Verifications State
  const [verifications, setVerifications] = useState([]);
  const [selectedVerification, setSelectedVerification] = useState(null);
  // Details modal starts with the essential ("half") info and can expand to the
  // full ("max") info on demand.
  const [showFullDetails, setShowFullDetails] = useState(false);
  
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
    setShowFullDetails(false);
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
                <label className="block text-xs font-semibold text-black mb-1">Min Amount ({sourceCurrency})</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.amountMin}
                  onChange={(e) => setFilters(prev => ({ ...prev, amountMin: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-black mb-1">Max Amount ({sourceCurrency})</label>
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
                            <span className="text-sm font-bold text-black">{format(item.price, 'USD')}</span>
                            <span className="block text-[11px] text-gray-500">≈ {formatUsd(item.price, 'USD')}</span>
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
                            <span className="text-sm font-bold text-black">{format(item.amount_paid)}</span>
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#bca142]/10 flex items-center justify-center flex-shrink-0">
                  <FiFileText className="text-[#bca142] text-lg" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-black">
                    {viewMode === 'verifications' ? 'Payment Verification Details' : 'Transaction Details'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {viewMode === 'verifications'
                      ? `Quote #${selectedVerification.quote_id}`
                      : selectedVerification.transaction_id || selectedVerification.plan_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {viewMode === 'verifications'
                  ? getVerificationStatusBadge(selectedVerification.payment_status)
                  : getSubscriptionStatusBadge(selectedVerification.payment_status || selectedVerification.status)}
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="text-lg text-gray-500" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {viewMode === 'verifications' ? (
                <>
                  <InfoSection title="Quote Information" icon={FiFileText}>
                    <InfoItem label="Quote ID" value={`#${selectedVerification.quote_id}`} />
                    <InfoItem
                      label="Amount"
                      value={
                        <span className="font-semibold text-[#bca142]">
                          {format(selectedVerification.price, 'USD')}
                          <span className="block text-xs font-normal text-gray-500">
                            ≈ {formatUsd(selectedVerification.price, 'USD')}
                            {currencyForCountry(selectedVerification.user_country) && (
                              <> · Customer sees ≈ {formatIn(selectedVerification.price, currencyForCountry(selectedVerification.user_country), 'USD')}</>
                            )}
                          </span>
                        </span>
                      }
                    />
                    <InfoItem
                      label="Payment Status"
                      value={<span className="capitalize">{selectedVerification.payment_status}</span>}
                    />
                    <InfoItem
                      label="Verified At"
                      value={formatDate(selectedVerification.verification_date || selectedVerification.payment_proof_date)}
                    />
                    <InfoItem label="Quote Created" value={formatDate(selectedVerification.quote_created_at)} />
                    <InfoItem label="Response Valid Until" value={formatDate(selectedVerification.valid_until)} />
                  </InfoSection>

                  <InfoSection title="Customer Information" icon={FiUser}>
                    <InfoItem label="Name" value={selectedVerification.user_name} />
                    <InfoItem label="Email" value={selectedVerification.user_email} />
                    <InfoItem label="Phone" value={selectedVerification.user_phone} />
                    <InfoItem label="Contact Name" value={selectedVerification.contact_name} />
                    <InfoItem label="Contact Email" value={selectedVerification.contact_email} />
                    <InfoItem label="Contact Phone" value={selectedVerification.contact_phone} />
                  </InfoSection>

                  {showFullDetails && (
                    <>
                  <InfoSection title="Shipment & Route" icon={FiTruck}>
                    <InfoItem label="Shipping Mode" value={selectedVerification.shipping_mode} />
                    <InfoItem label="Transit Time" value={selectedVerification.transit_time} />
                    <InfoItem
                      label="Departure"
                      value={joinParts([
                        selectedVerification.departure_city,
                        selectedVerification.departure_state,
                        selectedVerification.departure_country,
                      ])}
                    />
                    <InfoItem label="Departure Type" value={selectedVerification.departure_type} />
                    <InfoItem
                      label="Arrival"
                      value={joinParts([
                        selectedVerification.arrival_city,
                        selectedVerification.arrival_state,
                        selectedVerification.arrival_country,
                      ])}
                    />
                    <InfoItem label="Arrival Type" value={selectedVerification.arrival_type} />
                    <InfoItem label="Arrival Date" value={formatDate(selectedVerification.arrival_date)} full />
                  </InfoSection>

                  <InfoSection title="Cargo Details" icon={FiPackage}>
                    <InfoItem label="Product Description" value={selectedVerification.product_description} full />
                    <InfoItem label="Packing" value={selectedVerification.packing} />
                    <InfoItem label="Incoterms" value={selectedVerification.incoterms} />
                    <InfoItem label="Quantity" value={selectedVerification.quantity} />
                    <InfoItem label="Weight" value={selectedVerification.weight} />
                    <InfoItem label="Cargo Type" value={selectedVerification.cargo_type} />
                    <InfoItem
                      label="Dimensions (L × W × H)"
                      value={(() => {
                        const dims = joinParts(
                          [selectedVerification.length, selectedVerification.width, selectedVerification.height],
                          ' × '
                        );
                        if (!dims) return null;
                        return `${dims}${selectedVerification.dimension_unit ? ` ${selectedVerification.dimension_unit}` : ''}`;
                      })()}
                    />
                    <InfoItem label="Stackable" value={yesNo(selectedVerification.is_stackable)} />
                    <InfoItem label="Hazardous" value={yesNo(selectedVerification.is_hazardous)} />
                    <InfoItem label="Insurance" value={yesNo(selectedVerification.has_insurance)} />
                  </InfoSection>
                    </>
                  )}

                  <InfoSection title="Payment" icon={FiCreditCard}>
                    <InfoItem label="Payment Method" value={getPaymentMethodName(selectedVerification.payment_method)} />
                    <InfoItem label="Proof Uploaded" value={yesNo(selectedVerification.payment_proof_uploaded)} />
                    <InfoItem label="PayPal Order ID" value={selectedVerification.paypal_order_id} />
                    <InfoItem label="PayPal Payer ID" value={selectedVerification.paypal_payer_id} />
                    <InfoItem label="Proof Date" value={formatDate(selectedVerification.payment_proof_date)} />
                    {selectedVerification.payment_proof_url && (
                      <InfoItem
                        label="Proof of Payment"
                        full
                        value={
                          <a
                            href={selectedVerification.payment_proof_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-[#bca142] font-semibold hover:underline"
                          >
                            <FiExternalLink />
                            View proof
                            {selectedVerification.payment_proof_filename
                              ? ` (${selectedVerification.payment_proof_filename})`
                              : ''}
                          </a>
                        }
                      />
                    )}
                  </InfoSection>

                  {showFullDetails && (selectedVerification.has_coupon === 1 || selectedVerification.coupon_original_amount != null) && (
                    <InfoSection title="Coupon & Discount" icon={FiTag}>
                      <InfoItem
                        label="Original Amount"
                        value={
                          selectedVerification.coupon_original_amount != null
                            ? format(selectedVerification.coupon_original_amount, 'USD')
                            : null
                        }
                      />
                      <InfoItem
                        label="Discount"
                        value={
                          selectedVerification.coupon_discount_amount != null
                            ? `- ${format(selectedVerification.coupon_discount_amount, 'USD')}`
                            : null
                        }
                      />
                      <InfoItem
                        label="Final Amount"
                        value={
                          selectedVerification.coupon_final_amount != null
                            ? format(selectedVerification.coupon_final_amount, 'USD')
                            : null
                        }
                      />
                      <InfoItem
                        label="Discount Type"
                        value={
                          selectedVerification.coupon_discount_type
                            ? `${selectedVerification.coupon_discount_type}${
                                selectedVerification.coupon_discount_value != null
                                  ? ` — ${selectedVerification.coupon_discount_value}`
                                  : ''
                              }`
                            : null
                        }
                      />
                    </InfoSection>
                  )}

                  {showFullDetails && selectedVerification.bank_name && (
                    <InfoSection title="Bank Details" icon={FaUniversity}>
                      <InfoItem label="Bank Name" value={selectedVerification.bank_name} />
                      <InfoItem label="Account Holder" value={selectedVerification.account_holder_name} />
                      <InfoItem label="Account Number" value={selectedVerification.account_number} />
                      <InfoItem label="SWIFT Code" value={selectedVerification.swift_code} />
                      <InfoItem label="IBAN" value={selectedVerification.iban_number} />
                      <InfoItem label="Branch" value={selectedVerification.branch_name} />
                      {selectedVerification.payment_instructions && (
                        <InfoItem label="Payment Instructions" value={selectedVerification.payment_instructions} full />
                      )}
                    </InfoSection>
                  )}

                  {showFullDetails && (selectedVerification.inclusions ||
                    selectedVerification.value_added_services ||
                    selectedVerification.terms ||
                    selectedVerification.response_notes ||
                    selectedVerification.customer_notes) && (
                    <InfoSection title="Terms & Inclusions" icon={FiFileText}>
                      <InfoItem label="Inclusions" value={formatList(selectedVerification.inclusions)} full />
                      <InfoItem
                        label="Value Added Services"
                        value={formatList(selectedVerification.value_added_services)}
                        full
                      />
                      <InfoItem label="Terms" value={selectedVerification.terms} full />
                      <InfoItem label="Response Notes" value={selectedVerification.response_notes} full />
                      <InfoItem label="Customer Notes" value={selectedVerification.customer_notes} full />
                    </InfoSection>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowFullDetails((v) => !v)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#bca142]/40 text-[#bca142] font-semibold text-sm hover:bg-[#bca142]/10 transition-colors"
                  >
                    <FiToggleRight className={`text-lg transition-transform ${showFullDetails ? 'rotate-180' : ''}`} />
                    {showFullDetails ? 'Show less details' : 'Show full details'}
                  </button>

                  <InfoSection title="Verification Notes" icon={FiShield}>
                    <InfoItem
                      label="Notes"
                      value={selectedVerification.verification_notes || selectedVerification.payment_notes}
                      full
                    />
                  </InfoSection>
                </>
              ) : (
                <>
                  <InfoSection title="Subscription Details" icon={FiRepeat}>
                    <InfoItem label="Plan" value={selectedVerification.plan_name} />
                    <InfoItem
                      label="Amount Paid"
                      value={<span className="font-semibold text-[#bca142]">{format(selectedVerification.amount_paid)}</span>}
                    />
                    <InfoItem
                      label="Payment Status"
                      value={<span className="capitalize">{selectedVerification.payment_status || selectedVerification.status}</span>}
                    />
                    <InfoItem label="Payment Method" value={getPaymentMethodName(selectedVerification.payment_method)} />
                    <InfoItem label="Transaction ID" value={selectedVerification.transaction_id} />
                    <InfoItem label="Plan Price" value={format(selectedVerification.plan_price)} />
                    <InfoItem
                      label="Duration"
                      value={
                        selectedVerification.duration_months
                          ? `${selectedVerification.duration_months} month${selectedVerification.duration_months > 1 ? 's' : ''}`
                          : null
                      }
                    />
                    <InfoItem label="Type" value={selectedVerification.type} />
                  </InfoSection>

                  <InfoSection title="Subscription Period" icon={FiCalendar}>
                    <InfoItem label="Start Date" value={formatDate(selectedVerification.start_date)} />
                    <InfoItem label="End Date" value={formatDate(selectedVerification.end_date)} />
                    <InfoItem label="Transaction Date" value={formatDate(selectedVerification.created_at)} full />
                  </InfoSection>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistorycompany;