import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Flag from 'react-world-flags';
import { 
  FiEye, FiMessageSquare, FiDollarSign, FiTruck, FiCalendar, 
  FiUser, FiMail, FiPhone, FiMapPin, FiPackage, FiClock,
  FiCheckCircle, FiXCircle, FiAlertCircle, FiEdit3, FiStar,
  FiCreditCard, FiFileText, FiArrowLeft, FiFilter, FiSearch,
  FiRefreshCw, FiX
} from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import useMarkAsRead from '../../hooks/useMarkAsRead';
import LoadingSpinner, { InlineSpinner } from '../../components/LoadingSpinner/LoadingSpinner';
import './MyQuotes.css';

const MyQuotes = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    paymentStatus: '',
    shippingMode: '',
    departureCountry: '',
    arrivalCountry: '',
    priceMin: '',
    priceMax: '',
    dateFrom: '',
    dateTo: '',
    customerName: ''
  });

  // Mark quote-related notifications as read when this page is visited
  useMarkAsRead('quotes');

  // Get unique values for filter dropdowns
  const uniqueValues = useMemo(() => {
    return {
      shippingModes: [...new Set(quotes.map(q => q.shipping_mode).filter(Boolean))],
      departureCountries: [...new Set(quotes.map(q => q.departure_country).filter(Boolean))],
      arrivalCountries: [...new Set(quotes.map(q => q.arrival_country).filter(Boolean))],
      customerNames: [...new Set(quotes.map(q => q.user_name).filter(Boolean))]
    };
  }, [quotes]);

  // Filter quotes based on current filters
  const filteredQuotes = useMemo(() => {
    return quotes.filter(quote => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText = [
          quote.product_description,
          quote.user_name,
          quote.user_email,
          quote.departure_country,
          quote.arrival_country,
          quote.shipping_mode,
          quote.id?.toString()
          
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchTerm)) return false;
      }

      // Status filter
      if (filters.status && quote.status !== filters.status) return false;

      // Payment status filter
      if (filters.paymentStatus) {
        const paymentStatus = getPaymentStatusKey(quote);
        if (paymentStatus !== filters.paymentStatus) return false;
      }

      // Shipping mode filter
      if (filters.shippingMode && quote.shipping_mode !== filters.shippingMode) return false;

      // Country filters
      if (filters.departureCountry && quote.departure_country !== filters.departureCountry) return false;
      if (filters.arrivalCountry && quote.arrival_country !== filters.arrivalCountry) return false;

      // Price filters
      if (filters.priceMin && parseFloat(quote.price) < parseFloat(filters.priceMin)) return false;
      if (filters.priceMax && parseFloat(quote.price) > parseFloat(filters.priceMax)) return false;

      // Date filters
      if (filters.dateFrom) {
        const quoteDate = new Date(quote.arrival_date);
        const fromDate = new Date(filters.dateFrom);
        if (quoteDate < fromDate) return false;
      }
      if (filters.dateTo) {
        const quoteDate = new Date(quote.arrival_date);
        const toDate = new Date(filters.dateTo);
        if (quoteDate > toDate) return false;
      }

      // Customer name filter
      if (filters.customerName && quote.user_name !== filters.customerName) return false;

      return true;
    });
  }, [quotes, filters]);

  // Get payment status key for filtering
  const getPaymentStatusKey = (quote) => {
    if (quote.status === 'approved' && quote.payment_status === 'verified') return 'approved_verified';
    if (!quote.has_payment_proof) return 'no_payment';
    if (quote.payment_status === 'verified') return 'verified';
    if (quote.payment_status === 'rejected') return 'rejected';
    if (quote.payment_proof_url) return 'pending';
    return 'awaiting';
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      paymentStatus: '',
      shippingMode: '',
      departureCountry: '',
      arrivalCountry: '',
      priceMin: '',
      priceMax: '',
      dateFrom: '',
      dateTo: '',
      customerName: ''
    });
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  useEffect(() => {
    fetchCompanyProfile();
    fetchMyQuotes();
  }, []);

  const fetchCompanyProfile = async () => {
    try {
      const profile = await api.get('/api/user/company-profile');
      setCompanyProfile(profile);
    } catch (error) {
      console.error('Error fetching company profile:', error);
      // Don't show error toast as this is not critical
    }
  };

  const fetchMyQuotes = async () => {
    try {
      // Use the same API as transaction history for consistency
      const data = await api.get('/api/enhanced-quotes/company-responses-with-payments');
      
      // Filter for quotes that have been accepted by users OR have verified payments
      const activeQuotes = data.filter(item => {
        return item.user_response_status === 'accepted' || 
               item.payment_status === 'verified' ||
               item.payment_proof_url; // Has payment proof uploaded
      });
      
      setQuotes(Array.isArray(activeQuotes) ? activeQuotes : []);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      // Fallback to original API
      try {
        const fallbackData = await api.get('/api/company-quotes/accepted-quotes');
        setQuotes(Array.isArray(fallbackData) ? fallbackData : []);
      } catch (fallbackError) {
        console.error('Fallback API also failed:', fallbackError);
        setQuotes([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (quote) => {
    setSelectedQuote(quote);
    // No need to fetch responses anymore since we're showing customer profile
  };

  const handleStatusChange = async (quoteId, newStatus) => {
    setStatusUpdatingId(quoteId);
    try {
      await api.put(`/api/company-quotes/quote/${quoteId}/status`, { status: newStatus });
      
      // Enhanced success feedback with more details
      const quote = quotes.find(q => q.id === quoteId);
      const customerName = quote?.user_name || 'Customer';
      
      toast.success(
        `✅ Quote #${quoteId} status updated to "${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}"!\n\n${customerName} will be notified immediately and see the update on their dashboard.`,
        {
          duration: 5000,
          icon: '📊'
        }
      );
      
      // Update the quotes list immediately without refetching
      setQuotes(prevQuotes => 
        prevQuotes.map(quote => 
          quote.id === quoteId 
            ? { ...quote, status: newStatus, updated_at: new Date().toISOString() }
            : quote
        )
      );
      
      // Update selected quote if it's the same one
      if (selectedQuote && selectedQuote.id === quoteId) {
        setSelectedQuote({ ...selectedQuote, status: newStatus });
      }
    } catch (error) {
      console.error('Status update error:', error);
      
      // Handle 404 errors (quote not found)
      if (error.message.includes('404') || error.message.includes('not found')) {
        toast.error('Quote not found. Refreshing data...');
        // Remove the quote from the list and refresh data
        setQuotes(prevQuotes => prevQuotes.filter(quote => quote.id !== quoteId));
        fetchMyQuotes(); // Refresh the data
      } else {
        toast.error(error.message || 'Failed to update status');
      }
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleStatusChangeFromModal = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await api.put(`/api/company-quotes/quote/${selectedQuote.id}/status`, { status: newStatus });
      
      // Enhanced success feedback
      const customerName = selectedQuote?.user_name || 'Customer';
      toast.success(
        `✅ Quote #${selectedQuote.id} status updated to "${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}"!\n\n${customerName} will see this update immediately on their dashboard.`,
        {
          duration: 5000,
          icon: '📊'
        }
      );
      
      // Update the selected quote immediately
      setSelectedQuote({ ...selectedQuote, status: newStatus });
      
      // Update the quotes list immediately without refetching
      setQuotes(prevQuotes => 
        prevQuotes.map(quote => 
          quote.id === selectedQuote.id 
            ? { ...quote, status: newStatus, updated_at: new Date().toISOString() }
            : quote
        )
      );
    } catch (error) {
      console.error('Status update error:', error);
      
      // Handle 404 errors (quote not found)
      if (error.message.includes('404') || error.message.includes('not found')) {
        toast.error('Quote not found. Returning to quotes list...');
        setSelectedQuote(null); // Close the modal
        // Remove the quote from the list and refresh data
        setQuotes(prevQuotes => prevQuotes.filter(quote => quote.id !== selectedQuote.id));
        fetchMyQuotes(); // Refresh the data
      } else {
        toast.error(error.message || 'Failed to update status');
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleMessageCustomer = () => {
    // Navigate to messages page with the customer's user ID
    if (selectedQuote && selectedQuote.user_id) {
      // Navigate to messages page and pass the customer info
      navigate('/company/messages', {
        state: {
          openConversation: {
            userId: selectedQuote.user_id,
            userName: selectedQuote.user_name || 'Customer',
            userEmail: selectedQuote.user_email
          },
          quoteId: selectedQuote.id
        }
      });
    } else if (selectedQuote && selectedQuote.user_name) {
      // Fallback: if no user_id but we have customer info, still navigate
      navigate('/company/messages', {
        state: {
          customerInfo: {
            name: selectedQuote.user_name,
            email: selectedQuote.user_email,
            phone: selectedQuote.user_phone
          },
          quoteId: selectedQuote.id
        }
      });
    } else {
      toast.error('Customer information not available for messaging');
    }
  };

  const getPaymentStatusBadge = (quote) => {
    // For approved quotes, show the approval status prominently
    if (quote.status === 'approved' && quote.payment_status === 'verified') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✅ Quote Approved & Payment Verified
        </span>
      );
    }

    if (!quote.has_payment_proof) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          No Payment Required
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

    if (quote.payment_proof_url) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          ⏳ Payment Pending Verification
        </span>
      );
    }

    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        💳 Awaiting Payment Proof
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      running: 'bg-blue-100 text-blue-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#CDA435] mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading your quotes...</p>
        </div>
      </div>
    );
  }

  if (selectedQuote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button 
            onClick={() => setSelectedQuote(null)}
            className="mb-6 flex items-center gap-2 text-[#CDA435] hover:text-[#D9B95B] transition-colors font-medium"
          >
            <FiArrowLeft className="text-lg" />
            Back to My Quotes
          </button>

          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#CDA435] to-[#D9B95B] bg-clip-text text-transparent mb-4">
              Quote Details
            </h1>
            
            {/* Company Information */}
            {companyProfile && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <FiUser className="text-blue-600" />
                  Your Company Information
                </h3>
                <div className="flex flex-col md:flex-row gap-4">
                  {companyProfile.name && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-700">Company:</span>
                      <span className="text-sm text-blue-800 font-semibold">{companyProfile.name}</span>
                    </div>
                  )}
                  {companyProfile.email && (
                    <div className="flex items-center gap-2">
                      <FiMail className="text-blue-600 text-sm" />
                      <span className="text-sm font-medium text-blue-700">Email:</span>
                      <span className="text-sm text-blue-800">{companyProfile.email}</span>
                    </div>
                  )}
                  {companyProfile.phone && (
                    <div className="flex items-center gap-2">
                      <FiPhone className="text-blue-600 text-sm" />
                      <span className="text-sm font-medium text-blue-700">Phone:</span>
                      <span className="text-sm text-blue-800">{companyProfile.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Quote Route */}
            <div className="flex items-center gap-4 text-2xl font-bold mb-6">
              <div className="w-10 h-8 flex-shrink-0">
                <Flag code={getCountryCode(selectedQuote.departure_country)} className="w-full h-full object-cover rounded" />
              </div>
              <span className="text-gray-800">{selectedQuote.departure_country}</span>
              <FiArrowLeft className="text-[#CDA435] rotate-180" />
              <div className="w-10 h-8 flex-shrink-0">
                <Flag code={getCountryCode(selectedQuote.arrival_country)} className="w-full h-full object-cover rounded" />
              </div>
              <span className="text-gray-800">{selectedQuote.arrival_country}</span>
            </div>

            {/* Status and Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700">Status:</span>
                  <select
                    value={selectedQuote.status}
                    onChange={(e) => handleStatusChangeFromModal(e.target.value)}
                    disabled={updatingStatus}
                    className="px-3 py-2 text-sm font-medium rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-[#CDA435] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="running">Running</option>
                    <option value="closed">Closed</option>
                  </select>
                  {updatingStatus && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#CDA435]"></div>
                  )}
                </div>
              </div>
              
              <button 
                onClick={handleMessageCustomer}
                className="px-6 py-3 bg-gradient-to-r from-[#CDA435] to-[#D9B95B] text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
              >
                <FiMessageSquare className="text-lg" />
                Message Customer
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Quote & Customer Info */}
            <div className="space-y-8">
              {/* Quote Information */}
              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <FiFileText className="text-[#CDA435]" />
                  Quote Information
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <FiDollarSign className="text-[#CDA435] text-lg" />
                    <div>
                      <p className="text-sm text-gray-500">Your Price</p>
                      <p className="font-bold text-xl text-[#CDA435]">${selectedQuote.price}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <FiTruck className="text-[#CDA435] text-lg" />
                    <div>
                      <p className="text-sm text-gray-500">Shipping Mode</p>
                      <p className="font-medium text-gray-800">{selectedQuote.shipping_mode}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <FiCalendar className="text-[#CDA435] text-lg" />
                    <div>
                      <p className="text-sm text-gray-500">Delivery Date</p>
                      <p className="font-medium text-gray-800">{new Date(selectedQuote.arrival_date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <FiPackage className="text-[#CDA435] text-lg mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Product Description</p>
                      <p className="font-medium text-gray-800">{selectedQuote.product_description}</p>
                    </div>
                  </div>

                  {selectedQuote.accepted_at && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
                      <FiCheckCircle className="text-green-500 text-lg" />
                      <div>
                        <p className="text-sm text-green-600">Accepted On</p>
                        <p className="font-medium text-green-800">{new Date(selectedQuote.accepted_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Company Information */}
              {companyProfile && (
                <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-200 p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <FiUser className="text-blue-600" />
                    Your Company Information
                  </h3>
                  
                  <div className="space-y-4">
                    {companyProfile.name && (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                        <FiUser className="text-blue-600 text-lg" />
                        <div>
                          <p className="text-sm text-blue-600">Company Name</p>
                          <p className="font-medium text-blue-800">{companyProfile.name}</p>
                        </div>
                      </div>
                    )}

                    {companyProfile.email && (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                        <FiMail className="text-blue-600 text-lg" />
                        <div>
                          <p className="text-sm text-blue-600">Company Email</p>
                          <p className="font-medium text-blue-800">{companyProfile.email}</p>
                        </div>
                      </div>
                    )}

                    {companyProfile.phone && (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                        <FiPhone className="text-blue-600 text-lg" />
                        <div>
                          <p className="text-sm text-blue-600">Company Phone</p>
                          <p className="font-medium text-blue-800">{companyProfile.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Customer Information */}
              {(selectedQuote.user_name || selectedQuote.user_email) && (
                <div className="bg-white rounded-2xl shadow-xl border-2 border-purple-200 p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <FiUser className="text-purple-600" />
                    Customer Information
                  </h3>
                  
                  <div className="space-y-4">
                    {selectedQuote.user_name && (
                      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-200">
                        <FiUser className="text-purple-600 text-lg" />
                        <div>
                          <p className="text-sm text-purple-600">Customer Name</p>
                          <p className="font-medium text-purple-800">{selectedQuote.user_name}</p>
                        </div>
                      </div>
                    )}

                    {selectedQuote.user_email && (
                      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-200">
                        <FiMail className="text-purple-600 text-lg" />
                        <div>
                          <p className="text-sm text-purple-600">Customer Email</p>
                          <p className="font-medium text-purple-800">{selectedQuote.user_email}</p>
                        </div>
                      </div>
                    )}

                    {selectedQuote.user_phone && (
                      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-200">
                        <FiPhone className="text-purple-600 text-lg" />
                        <div>
                          <p className="text-sm text-purple-600">Customer Phone</p>
                          <p className="font-medium text-purple-800">{selectedQuote.user_phone}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-3">Quick Actions</h4>
                    <div className="flex flex-wrap gap-3">
                      <button 
                        onClick={handleMessageCustomer}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <FiMessageSquare className="text-sm" />
                        Message
                      </button>
                      
                      {selectedQuote.user_email && (
                        <a 
                          href={`mailto:${selectedQuote.user_email}?subject=Regarding Your Quote #${selectedQuote.id}`}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-medium rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                        >
                          <FiMail className="text-sm" />
                          Email
                        </a>
                      )}
                      
                      {selectedQuote.user_phone && (
                        <a 
                          href={`tel:${selectedQuote.user_phone}`}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                        >
                          <FiPhone className="text-sm" />
                          Call
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Payment Status */}
            <div className="space-y-8">
              {/* Payment Status */}
              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <FiCreditCard className="text-[#CDA435]" />
                  Payment Status
                </h3>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border-2 border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      {getPaymentStatusBadge(selectedQuote)}
                    </div>
                    
                    {selectedQuote.payment_status === 'verified' && selectedQuote.verification_date && (
                      <p className="text-sm text-green-600 flex items-center gap-2">
                        <FiCheckCircle className="text-green-500" />
                        <strong>Payment verified on:</strong> {new Date(selectedQuote.verification_date).toLocaleDateString()}
                      </p>
                    )}
                    
                    {selectedQuote.payment_status === 'rejected' && (
                      <div className="text-sm text-red-600">
                        <p className="flex items-center gap-2">
                          <FiXCircle className="text-red-500" />
                          <strong>Payment rejected</strong>
                        </p>
                        {selectedQuote.payment_notes && (
                          <p className="mt-1"><strong>Notes:</strong> {selectedQuote.payment_notes}</p>
                        )}
                      </div>
                    )}
                    
                    {selectedQuote.payment_proof_url && !selectedQuote.payment_status && (
                      <p className="text-sm text-yellow-600 flex items-center gap-2">
                        <FiClock className="text-yellow-500" />
                        <strong>Payment proof uploaded, awaiting your verification</strong>
                      </p>
                    )}
                    
                    {selectedQuote.has_payment_proof && !selectedQuote.payment_proof_url && (
                      <p className="text-sm text-blue-600 flex items-center gap-2">
                        <FiAlertCircle className="text-blue-500" />
                        <strong>Waiting for customer to upload payment proof</strong>
                      </p>
                    )}
                  </div>
                  
                  {selectedQuote.payment_proof_url && !selectedQuote.payment_status && (
                    <button
                      onClick={() => navigate('/company/payment-management')}
                      className="w-full px-4 py-3 bg-gradient-to-r from-[#CDA435] to-[#D9B95B] text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <FiEye className="text-lg" />
                      Verify Payment Now
                    </button>
                  )}
                  
                  {selectedQuote.payment_proof_url && (
                    <button
                      onClick={() => window.open(selectedQuote.payment_proof_url, '_blank')}
                      className="w-full px-4 py-3 border-2 border-[#CDA435] text-[#CDA435] font-semibold rounded-xl hover:bg-[#CDA435] hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <FiFileText className="text-lg" />
                      View Payment Proof
                    </button>
                  )}
                </div>
              </div>

              {/* Business Notes */}
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-6 border-2 border-yellow-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FiStar className="text-yellow-500" />
                  Business Notes
                </h3>
                <div className="bg-white/80 rounded-xl p-4 border border-yellow-200">
                  <p className="text-sm text-yellow-800 leading-relaxed">
                    💡 <strong>Tip:</strong> This customer has {selectedQuote.status === 'approved' ? 'approved' : 'accepted'} your quote. 
                    Keep them updated on shipment progress and maintain good communication for future business opportunities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#CDA435] to-[#D9B95B] bg-clip-text text-transparent mb-4">
              My Active Quotes
            </h1>
            <p className="text-gray-600 text-lg mb-6">
              Quotes where customers have accepted your responses or uploaded payment proof
            </p>
            
            {/* Company Info Display */}
            {/* {companyProfile && (
              <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 max-w-3xl mx-auto">
                <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center justify-center gap-2">
                  <FiUser className="text-blue-600" />
                  Your Company Account
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {companyProfile.name && (
                    <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg border border-blue-200">
                      <FiUser className="text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Company:</span>
                      <span className="text-sm text-blue-800 font-bold">{companyProfile.name}</span>
                    </div>
                  )}
                  {companyProfile.email && (
                    <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg border border-blue-200">
                      <FiMail className="text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Email:</span>
                      <span className="text-sm text-blue-800">{companyProfile.email}</span>
                    </div>
                  )}
                  {companyProfile.phone && (
                    <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg border border-blue-200 md:col-span-2">
                      <FiPhone className="text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Phone:</span>
                      <span className="text-sm text-blue-800">{companyProfile.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )} */}
            
            <div className="flex items-center justify-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Approved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Running</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Closed</span>
              </div>
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
                {filteredQuotes.length} of {quotes.length} quotes
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
                placeholder="Search quotes by ID, product, customer, country, or shipping mode..."
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quote Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="running">Running</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Payment Status Filter */}
              {/* <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Status</label>
                <select
                  value={filters.paymentStatus}
                  onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                >
                  <option value="">All Payment Statuses</option>
                  <option value="approved_verified">Approved & Verified</option>
                  <option value="verified">Payment Verified</option>
                  <option value="pending">Pending Verification</option>
                  <option value="rejected">Payment Rejected</option>
                  <option value="awaiting">Awaiting Payment Proof</option>
                  <option value="no_payment">No Payment Required</option>
                </select>
              </div> */}

              {/* Shipping Mode Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Shipping Mode</label>
                <select
                  value={filters.shippingMode}
                  onChange={(e) => setFilters(prev => ({ ...prev, shippingMode: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                >
                  <option value="">All Shipping Modes</option>
                  {uniqueValues.shippingModes.map(mode => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </select>
              </div>

              {/* Departure Country Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">From Country</label>
                <select
                  value={filters.departureCountry}
                  onChange={(e) => setFilters(prev => ({ ...prev, departureCountry: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                >
                  <option value="">All Departure Countries</option>
                  {uniqueValues.departureCountries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              {/* Arrival Country Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">To Country</label>
                <select
                  value={filters.arrivalCountry}
                  onChange={(e) => setFilters(prev => ({ ...prev, arrivalCountry: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                >
                  <option value="">All Arrival Countries</option>
                  {uniqueValues.arrivalCountries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              {/* Customer Name Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Customer</label>
                <select
                  value={filters.customerName}
                  onChange={(e) => setFilters(prev => ({ ...prev, customerName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                >
                  <option value="">All Customers</option>
                  {uniqueValues.customerNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Price Range Filters */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Min Price ($)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.priceMin}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceMin: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Max Price ($)</label>
                <input
                  type="number"
                  placeholder="10000"
                  value={filters.priceMax}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceMax: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                />
              </div>

              {/* Date Range Filters */}
              {/* <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery From</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery To</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                />
              </div> */}

              {/* Quick Filter Buttons */}
              <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2"></label>
                {/* <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, paymentStatus: 'pending' }))}
                    className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full hover:bg-yellow-200 transition-colors"
                  >
                    Pending Payments
                  </button>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, status: 'running' }))}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    Running Orders
                  </button>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, paymentStatus: 'verified' }))}
                    className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors"
                  >
                    Verified Payments
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                      setFilters(prev => ({ 
                        ...prev, 
                        dateFrom: today.toISOString().split('T')[0],
                        dateTo: nextWeek.toISOString().split('T')[0]
                      }));
                    }}
                    className="px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded-full hover:bg-purple-200 transition-colors"
                  >
                    Due This Week
                  </button>
                </div> */}
              </div>
            </div>
          )}
        </div>

        {/* Quotes Table */}
        {filteredQuotes.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-6 bg-gradient-to-r from-[#CDA435] to-[#D9B95B] rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <FiFileText className="text-4xl text-white" />
            </div>
            {quotes.length === 0 ? (
              <>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">No Active Quotes Yet</h3>
                <p className="text-gray-600 mb-6">Quotes will appear here when customers accept your responses or upload payment proof.</p>
                <a 
                  href="/company/available-quotes" 
                  className="px-8 py-4 bg-gradient-to-r from-[#CDA435] to-[#D9B95B] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  View Available Quotes
                </a>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">No Quotes Match Your Filters</h3>
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
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-[#CDA435] to-[#D9B95B] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Quote ID</th>
                    {/* <th className="px-6 py-4 text-left text-sm font-semibold">Company</th> */}
                    <th className="px-6 py-4 text-left text-sm font-semibold">Customer</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Route</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Product</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Shipping Mode</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Delivery Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Payment Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredQuotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                      {/* Quote ID */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-gradient-to-r from-[#CDA435] to-[#D9B95B] rounded-lg text-white mr-3">
                            <FiFileText className="text-sm" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">#{quote.id}</span>
                        </div>
                      </td>

                      {/* Company */}
                      {/* <td className="px-6 py-4 whitespace-nowrap">
                        <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
                          <div className="text-sm font-medium text-blue-900 flex items-center gap-1">
                            <FiUser className="text-blue-600 text-xs" />
                            {companyProfile?.name || 'Your Company'}
                          </div>
                          <div className="text-xs text-blue-600 flex items-center gap-1">
                            <FiMail className="text-blue-500 text-xs" />
                            {companyProfile?.email || 'N/A'}
                          </div>
                        </div>
                      </td> */}

                      {/* Customer */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="bg-purple-50 p-2 rounded-lg border border-purple-200">
                          <div className="text-sm font-medium text-purple-900 flex items-center gap-1">
                            <FiUser className="text-purple-600 text-xs" />
                            {quote.user_name || 'N/A'}
                          </div>
                          <div className="text-xs text-purple-600 flex items-center gap-1">
                            <FiMail className="text-purple-500 text-xs" />
                            {quote.user_email || 'N/A'}
                          </div>
                        </div>
                      </td>

                      {/* Route */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-4 flex-shrink-0">
                            <Flag code={getCountryCode(quote.departure_country)} className="w-full h-full object-cover rounded" />
                          </div>
                          <span className="text-xs text-gray-600">{quote.departure_country}</span>
                          <span className="text-gray-400">→</span>
                          <div className="w-5 h-4 flex-shrink-0">
                            <Flag code={getCountryCode(quote.arrival_country)} className="w-full h-full object-cover rounded" />
                          </div>
                          <span className="text-xs text-gray-600">{quote.arrival_country}</span>
                        </div>
                      </td>

                      {/* Product */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={quote.product_description}>
                          {quote.product_description}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-green-600">${quote.price}</span>
                      </td>

                      {/* Shipping Mode */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiTruck className="text-[#CDA435] mr-2" />
                          <span className="text-sm text-gray-900">{quote.shipping_mode}</span>
                        </div>
                      </td>

                      {/* Delivery Date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiCalendar className="text-[#CDA435] mr-2" />
                          <span className="text-sm text-gray-900">{new Date(quote.arrival_date).toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={quote.status}
                          onChange={(e) => handleStatusChange(quote.id, e.target.value)}
                          disabled={statusUpdatingId === quote.id}
                          className={`px-3 py-1 text-xs font-bold rounded-full border-2 focus:ring-2 focus:ring-[#CDA435] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                            quote.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                            quote.status === 'approved' ? 'bg-green-100 text-green-800 border-green-300' :
                            quote.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-300' :
                            quote.status === 'running' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                            'bg-gray-100 text-gray-800 border-gray-300'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="running">Running</option>
                          <option value="closed">Closed</option>
                        </select>
                        {statusUpdatingId === quote.id && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#CDA435] mt-1"></div>
                        )}
                      </td>

                      {/* Payment Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="max-w-xs">
                          {getPaymentStatusBadge(quote)}
                          {quote.payment_status === 'verified' && quote.verification_date && (
                            <div className="text-xs text-green-600 mt-1">
                              Verified: {new Date(quote.verification_date).toLocaleDateString()}
                            </div>
                          )}
                          {quote.accepted_at && (
                            <div className="text-xs text-green-600 mt-1">
                              Accepted: {new Date(quote.accepted_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewDetails(quote)}
                          className="gradient-btn quotes-btn flex items-center gap-2 px-3 py-2 text-white rounded-lg transition-all duration-200 text-sm font-medium"
                          title="View Quote Details"
                        >
                          <FiEye className="text-sm" />
                          <span className="mobile-hide-text">View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyQuotes;
