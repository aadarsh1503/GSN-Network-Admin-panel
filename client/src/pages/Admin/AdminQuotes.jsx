import React, { useState, useEffect } from 'react';
import { FaEye, FaTrash, FaSearch, FaEdit, FaDollarSign, FaFileDownload } from 'react-icons/fa';
import { api } from '../../utils/api';
import { adminToast } from '../../utils/adminToast';

const AdminQuotes = () => {
  console.log('🚀 [FRONTEND DEBUG] AdminQuotes component initialized!');
  
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [viewingQuote, setViewingQuote] = useState(null);
  const [selectedResponseIndex, setSelectedResponseIndex] = useState(null);
  const [deletingQuote, setDeletingQuote] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(null);

  useEffect(() => {
    console.log('🚀 [FRONTEND DEBUG] useEffect triggered - calling fetchQuotes...');
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      // console.log('🚨 [FRONTEND DEBUG] === STARTING FETCH QUOTES ===');
      // console.log('🔍 [FRONTEND DEBUG] Fetching quotes from API...');
      // console.log('🌐 [FRONTEND DEBUG] API Base URL:', 'http://localhost:5000');
      // console.log('📡 [FRONTEND DEBUG] Endpoint:', '/api/admin-panel/quotes');
      
      // Add cache busting to ensure fresh data
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      console.log('🔄 [FRONTEND DEBUG] Cache busting params:', { timestamp, random });
      
      const data = await api.get(`/api/admin-panel/quotes?t=${timestamp}&r=${random}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      console.log('✅ [FRONTEND DEBUG] API Response received successfully!');
      console.log('📊 [FRONTEND DEBUG] Raw response data type:', typeof data);
      console.log('📊 [FRONTEND DEBUG] Raw response is array:', Array.isArray(data));
      console.log('📊 [FRONTEND DEBUG] Raw response length:', data?.length || 'N/A');
      console.log('📊 [FRONTEND DEBUG] Full raw response:', data);
      
      console.log('✅ [FRONTEND DEBUG] Received quotes data:', {
        totalQuotes: data.length,
        sampleQuote: data.length > 0 ? data[0] : null
      });
      
      if (data.length > 0) {
        console.log('\n📊 [FRONTEND DEBUG] === DETAILED QUOTE ANALYSIS ===');
        console.log('🔍 [FRONTEND DEBUG] First quote full object:', JSON.stringify(data[0], null, 2));
        
        data.slice(0, 3).forEach((quote, index) => {
          console.log(`\n--- Frontend Quote ${index + 1} (ID: ${quote.id}) ---`);
          console.log(`👤 Customer: ${quote.user_name} (${quote.user_email})`);
          console.log(`🏢 Company Name: "${quote.company_name}" (type: ${typeof quote.company_name})`);
          console.log(`📧 Company Email: "${quote.company_email}" (type: ${typeof quote.company_email})`);
          console.log(`💰 Accepted Price: "${quote.accepted_price}" (type: ${typeof quote.accepted_price})`);
          console.log(`📦 Product: ${quote.product_description}`);
          console.log(`📊 Response Count: ${quote.response_count}`);
          console.log(`✅ Accepted Count: ${quote.accepted_count}`);
          console.log(`💳 Payment Status: ${quote.payment_status || 'MISSING'}`);
          console.log(`📅 Status: ${quote.status}`);
          console.log(`🔑 All quote keys:`, Object.keys(quote));
        });
        
        // Check company data availability
        const quotesWithCompany = data.filter(q => q.company_name);
        const quotesWithoutCompany = data.filter(q => !q.company_name);
        
        console.log('\n📈 [FRONTEND DEBUG] === COMPANY DATA SUMMARY ===');
        console.log(`🏢 Quotes with company data: ${quotesWithCompany.length}`);
        console.log(`❌ Quotes without company data: ${quotesWithoutCompany.length}`);
        console.log(`📊 Company data fields present: ${data.length > 0 && 'company_name' in data[0] ? 'YES' : 'NO'}`);
        
        if (quotesWithCompany.length > 0) {
          console.log('\n🏢 [FRONTEND DEBUG] Quotes WITH company data:');
          quotesWithCompany.slice(0, 5).forEach((quote, index) => {
            console.log(`  ${index + 1}. Quote #${quote.id}: "${quote.company_name}" (${quote.company_email}) - $${quote.accepted_price}`);
          });
        }
        
        if (quotesWithoutCompany.length > 0) {
          console.log('\n❌ [FRONTEND DEBUG] Quotes WITHOUT company data:');
          quotesWithoutCompany.slice(0, 5).forEach((quote, index) => {
            console.log(`  ${index + 1}. Quote #${quote.id}: ${quote.user_name} - ${quote.product_description} (${quote.response_count} responses)`);
          });
        }
      } else {
        console.log('⚠️ [FRONTEND DEBUG] No quotes received from API!');
      }
      
      console.log('🔄 [FRONTEND DEBUG] Setting quotes state...');
      setQuotes(data);
      console.log('✅ [FRONTEND DEBUG] Quotes state updated successfully!');
      console.log('🚨 [FRONTEND DEBUG] === FETCH QUOTES COMPLETED ===\n');
      
    } catch (error) {
      console.error('❌ [FRONTEND DEBUG] === ERROR IN FETCH QUOTES ===');
      console.error('❌ [FRONTEND DEBUG] Error object:', error);
      console.error('❌ [FRONTEND DEBUG] Error message:', error.message);
      console.error('❌ [FRONTEND DEBUG] Error stack:', error.stack);
      adminToast.error('Failed to load quotes');
    } finally {
      setLoading(false);
      console.log('🏁 [FRONTEND DEBUG] Loading state set to false');
    }
  };

  const handleViewDetails = async (quote) => {
    try {
      setLoadingDetails(quote.id);
      const details = await api.get(`/api/enhanced-quotes/admin/${quote.id}/responses-with-bank-details`);
      // Create a quote object with responses
      const quoteWithResponses = {
        ...quote,
        responses: details || []
      };
      setViewingQuote(quoteWithResponses);
      setSelectedResponseIndex(null); // Show all responses
    } catch (error) {
      console.error('Error loading quote details:', error);
      // Fallback to showing the quote data we already have
      setViewingQuote(quote);
      setSelectedResponseIndex(null);
      adminToast.warning('Showing basic quote information');
    } finally {
      setLoadingDetails(null);
    }
  };

  const handleViewSpecificResponse = async (quote, responseIndex) => {
    try {
      setLoadingDetails(quote.id);
      const details = await api.get(`/api/enhanced-quotes/admin/${quote.id}/responses-with-bank-details`);
      const quoteWithResponses = {
        ...quote,
        responses: details || []
      };
      setViewingQuote(quoteWithResponses);
      setSelectedResponseIndex(responseIndex); // Show only specific response
    } catch (error) {
      console.error('Error loading quote details:', error);
      setViewingQuote(quote);
      setSelectedResponseIndex(responseIndex);
      adminToast.warning('Showing basic quote information');
    } finally {
      setLoadingDetails(null);
    }
  };

  const handleDeleteQuote = async (quoteId) => {
    if (!window.confirm('Are you sure you want to delete this quote? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/api/admin-panel/quotes/${quoteId}`);
      adminToast.success('Quote deleted successfully');
      setQuotes(quotes.filter(q => q.id !== quoteId));
      setDeletingQuote(null);
    } catch (error) {
      adminToast.error('Failed to delete quote');
    }
  };

  const handleUpdateStatus = async (quoteId, newStatus) => {
    try {
      await api.put(`/api/admin-panel/quotes/${quoteId}/status`, { status: newStatus });
      adminToast.success('Quote status updated successfully');
      fetchQuotes();
    } catch (error) {
      adminToast.error('Failed to update quote status');
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = 
      quote.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.product_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.departure_country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.arrival_country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.company_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || quote.status === statusFilter;
    const matchesPayment = !paymentFilter || getPaymentStatus(quote) === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Add console.log for filtering results
  console.log('🔍 [FRONTEND DEBUG] === FILTERING RESULTS ===');
  console.log('📊 [FRONTEND DEBUG] Total quotes before filtering:', quotes.length);
  console.log('📊 [FRONTEND DEBUG] Filtered quotes count:', filteredQuotes.length);
  console.log('🔍 [FRONTEND DEBUG] Search term:', searchTerm);
  console.log('🔍 [FRONTEND DEBUG] Status filter:', statusFilter);
  console.log('🔍 [FRONTEND DEBUG] Payment filter:', paymentFilter);
  
  if (filteredQuotes.length > 0) {
    console.log('📋 [FRONTEND DEBUG] First filtered quote company data:');
    const firstQuote = filteredQuotes[0];
    console.log(`  - Quote ID: ${firstQuote.id}`);
    console.log(`  - Company Name: "${firstQuote.company_name}" (${typeof firstQuote.company_name})`);
    console.log(`  - Company Email: "${firstQuote.company_email}" (${typeof firstQuote.company_email})`);
    console.log(`  - Has company_name: ${!!firstQuote.company_name}`);
    console.log(`  - Company name length: ${firstQuote.company_name?.length || 0}`);
  }

  const getPaymentStatus = (quote) => {
    // Use the payment status from the accepted quote if available
    if (quote.payment_status === 'verified') return 'verified';
    if (quote.payment_status === 'rejected') return 'rejected';
    if (quote.payment_proof_url) return 'pending';
    if (quote.has_payment_proof) return 'awaiting';
    if (quote.accepted_count > 0) return 'awaiting';
    if (quote.response_count === 0) return 'no_responses';
    return 'no_accepted';
  };

  const getPaymentStatusBadge = (quote) => {
    const status = getPaymentStatus(quote);
    const colors = {
      verified: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      awaiting: 'bg-blue-100 text-blue-800',
      no_accepted: 'bg-gray-100 text-gray-600',
      no_responses: 'bg-gray-100 text-gray-600'
    };
    
    const labels = {
      verified: 'Payment Verified',
      pending: 'Payment Pending',
      rejected: 'Payment Rejected',
      awaiting: 'Awaiting Payment',
      no_accepted: 'No Accepted Quotes',
      no_responses: 'No Responses'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const calculateTotalRevenue = () => {
    return quotes
      .filter(quote => quote.payment_status === 'verified')
      .reduce((sum, quote) => sum + parseFloat(quote.accepted_price || 0), 0)
      .toFixed(2);
  };

  const exportToCSV = () => {
    const headers = ['Quote ID', 'User', 'Email', 'Route', 'Product', 'Company', 'Company Email', 'Responses', 'Accepted', 'Revenue', 'Payment Status', 'Status', 'Created'];
    const rows = filteredQuotes.map(quote => {
      const revenue = quote.payment_status === 'verified' ? parseFloat(quote.accepted_price || 0) : 0;
      
      return [
        quote.id,
        quote.user_name || 'Guest',
        quote.user_email,
        `${quote.departure_country} → ${quote.arrival_country}`,
        quote.product_description,
        quote.company_name || 'No company assigned',
        quote.company_email || '',
        quote.response_count || 0,
        quote.accepted_count || 0,
        `$${revenue.toFixed(2)}`,
        getPaymentStatus(quote),
        quote.status,
        new Date(quote.created_at).toLocaleDateString()
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotes_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      running: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Add comprehensive render logging
  console.log('🎨 [FRONTEND DEBUG] === COMPONENT RENDER START ===');
  console.log('🎨 [FRONTEND DEBUG] Loading state:', loading);
  console.log('🎨 [FRONTEND DEBUG] Quotes state length:', quotes.length);
  console.log('🎨 [FRONTEND DEBUG] Quotes state type:', typeof quotes);
  console.log('🎨 [FRONTEND DEBUG] Quotes state is array:', Array.isArray(quotes));
  
  if (quotes.length > 0) {
    console.log('🎨 [FRONTEND DEBUG] First quote in state:', quotes[0]);
    console.log('🎨 [FRONTEND DEBUG] First quote company_name:', quotes[0].company_name);
    console.log('🎨 [FRONTEND DEBUG] First quote company_email:', quotes[0].company_email);
  }

  if (loading) {
    console.log('🎨 [FRONTEND DEBUG] Showing loading state...');
    return <div className="p-10 text-center">Loading quotes...</div>;
  }

  console.log('🎨 [FRONTEND DEBUG] Proceeding to render main component...');

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Total Quotes</p>
            <p className="text-2xl font-bold">{filteredQuotes.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">${calculateTotalRevenue()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Verified Payments</p>
            <p className="text-2xl font-bold text-green-600">
              {filteredQuotes.filter(q => getPaymentStatus(q) === 'verified').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Pending Payments</p>
            <p className="text-2xl font-bold text-yellow-600">
              {filteredQuotes.filter(q => getPaymentStatus(q) === 'pending').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Active Quotes</p>
            <p className="text-2xl font-bold text-blue-600">
              {filteredQuotes.filter(q => ['pending', 'approved', 'running'].includes(q.status)).length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          {/* Debug Info Panel */}
          {quotes.length > 0 && (
            <div className="p-4 bg-blue-50 border-b">
              <div className="text-sm">
                <strong>🔍 Debug Info:</strong> 
                <span className="ml-2">Total: {quotes.length}</span>
                <span className="ml-2 text-green-600">With Company: {quotes.filter(q => q.company_name).length}</span>
                <span className="ml-2 text-red-600">Without Company: {quotes.filter(q => !q.company_name).length}</span>
                <span className="ml-2 text-blue-600">With Price: {quotes.filter(q => q.accepted_price).length}</span>
              </div>
              {quotes.length > 0 && quotes[0].company_name && (
                <div className="text-xs text-gray-600 mt-1">
                  Sample: Quote #{quotes[0].id} → {quotes[0].company_name} ({quotes[0].company_email}) - ${quotes[0].accepted_price}
                </div>
              )}
            </div>
          )}
          
          {/* Header */}
          <div className="p-6 border-b flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Quote Management</h2>
              <p className="text-gray-600 mt-1">View, manage, and track quote payments</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={fetchQuotes}
                disabled={loading}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
              >
                {loading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <FaSearch />
                )}
                <span>{loading ? 'Refreshing...' : 'Force Refresh'}</span>
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
              >
                <FaFileDownload />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 border-b bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search quotes..."
                  className="w-full pl-10 p-2 border rounded-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="p-2 border rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="running">Running</option>
                <option value="closed">Closed</option>
              </select>
              <select
                className="p-2 border rounded-md"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="">All Payments</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="awaiting">Awaiting</option>
                <option value="no_accepted">No Accepted</option>
              </select>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setPaymentFilter('');
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">User</th>
                  <th className="p-3 text-left">Route</th>
                  <th className="p-3 text-left">Product</th>
                  <th className="p-3 text-left">Working Company</th>
                  <th className="p-3 text-left">Responses</th>
                  <th className="p-3 text-left">Revenue</th>
                  <th className="p-3 text-left">Payment Status</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Created</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.length > 0 ? (
                  filteredQuotes.map((quote) => {
                    // Add detailed console.log for each quote being rendered
                    console.log(`🎨 [FRONTEND DEBUG] === RENDERING QUOTE ${quote.id} ===`);
                    console.log(`🎨 [FRONTEND DEBUG] Quote object:`, quote);
                    console.log(`🎨 [FRONTEND DEBUG] Company name value: "${quote.company_name}"`);
                    console.log(`🎨 [FRONTEND DEBUG] Company name type: ${typeof quote.company_name}`);
                    console.log(`🎨 [FRONTEND DEBUG] Company name truthy: ${!!quote.company_name}`);
                    console.log(`🎨 [FRONTEND DEBUG] Company email value: "${quote.company_email}"`);
                    console.log(`🎨 [FRONTEND DEBUG] Will show company info: ${quote.company_name ? 'YES' : 'NO'}`);
                    
                    const revenue = quote.payment_status === 'verified' ? parseFloat(quote.accepted_price || 0) : 0;
                    
                    return (
                      <tr key={quote.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{quote.id}</td>
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{quote.user_name || 'Guest'}</div>
                            <div className="text-sm text-gray-500">{quote.user_email}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <div>{quote.departure_country} → {quote.arrival_country}</div>
                            <div className="text-gray-500">{quote.shipping_mode}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm max-w-xs truncate">
                            {quote.product_description}
                          </div>
                        </td>
                        <td className="p-3">
                          {(() => {
                            console.log(`🎨 [FRONTEND DEBUG] Rendering company cell for quote ${quote.id}`);
                            console.log(`🎨 [FRONTEND DEBUG] Company name check: "${quote.company_name}" -> ${!!quote.company_name}`);
                            
                            if (quote.company_name) {
                              console.log(`✅ [FRONTEND DEBUG] Showing company info for quote ${quote.id}: ${quote.company_name}`);
                              return (
                                <div>
                                  <div className="font-medium text-blue-600">{quote.company_name}</div>
                                  <div className="text-sm text-gray-500">{quote.company_email}</div>
                                  {quote.accepted_at && (
                                    <div className="text-xs text-green-600">
                                      Accepted: {new Date(quote.accepted_at).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              );
                            } else {
                              console.log(`❌ [FRONTEND DEBUG] No company for quote ${quote.id}, showing "No company assigned"`);
                              return (
                                <span className="text-gray-400 text-sm">No company assigned</span>
                              );
                            }
                          })()}
                        </td>
                        <td className="p-3">
                          <div className="text-center">
                            <span className="font-bold">{quote.response_count}</span>
                            {quote.accepted_count > 0 && (
                              <span className="text-green-600 text-xs ml-1">
                                ({quote.accepted_count} accepted)
                              </span>
                            )}
                            {quote.response_count > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1 justify-center">
                                {Array.from({ length: Math.min(quote.response_count, 10) }, (_, i) => (
                                  <button
                                    key={i}
                                    onClick={() => handleViewSpecificResponse(quote, i)}
                                    className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                                    title={`View response ${i + 1}`}
                                  >
                                    {i + 1}
                                  </button>
                                ))}
                                {quote.response_count > 10 && (
                                  <span className="text-xs text-gray-500">+{quote.response_count - 10}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center">
                            <FaDollarSign className="text-green-500 mr-1" />
                            <span className="font-bold text-green-600">
                              ${quote.accepted_price ? parseFloat(quote.accepted_price).toFixed(2) : '0.00'}
                            </span>
                          </div>
                          {quote.accepted_price && quote.accepted_transit_time && (
                            <div className="text-xs text-gray-500 mt-1">
                              Transit: {quote.accepted_transit_time}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          {getPaymentStatusBadge(quote)}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(quote.status)}`}>
                            {quote.status}
                          </span>
                        </td>
                        <td className="p-3 text-sm">
                          {new Date(quote.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewDetails(quote)}
                              disabled={loadingDetails === quote.id}
                              className={`p-2 text-white rounded ${
                                loadingDetails === quote.id 
                                  ? 'bg-gray-400 cursor-not-allowed' 
                                  : 'bg-blue-500 hover:bg-blue-600'
                              }`}
                              title="View Details"
                            >
                              {loadingDetails === quote.id ? (
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                              ) : (
                                <FaEye />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteQuote(quote.id)}
                              className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                              title="Delete Quote"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="11" className="text-center p-4 text-gray-500">
                      No quotes found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="p-4 bg-gray-50 border-t">
            <div className="text-sm text-gray-600">
              Showing {filteredQuotes.length} of {quotes.length} quotes
            </div>
          </div>
        </div>
      </div>

      {/* View Details Modal */}
      {viewingQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Quote Details #{viewingQuote.id}</h3>
              <div className="flex space-x-2">
                <select
                  value={viewingQuote.status}
                  onChange={(e) => handleUpdateStatus(viewingQuote.id, e.target.value)}
                  className="p-2 border rounded-md"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="running">Running</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="col-span-2">
                <h4 className="font-semibold mb-2">User Information</h4>
                <p><strong>Name:</strong> {viewingQuote.user_name || 'Guest'}</p>
                <p><strong>Email:</strong> {viewingQuote.user_email}</p>
                <p><strong>Phone:</strong> {viewingQuote.user_phone}</p>
              </div>
              
              <div className="col-span-2">
                <h4 className="font-semibold mb-2">Shipment Details</h4>
                <p><strong>Mode:</strong> {viewingQuote.shipping_mode}</p>
                <p><strong>From:</strong> {viewingQuote.departure_country}, {viewingQuote.departure_city}</p>
                <p><strong>To:</strong> {viewingQuote.arrival_country}, {viewingQuote.arrival_city}</p>
                <p><strong>Product:</strong> {viewingQuote.product_description}</p>
              </div>
            </div>

            {/* Responses */}
            {viewingQuote.responses && viewingQuote.responses.length > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold">
                    Company Responses 
                    {selectedResponseIndex !== null 
                      ? ` - Response ${selectedResponseIndex + 1}` 
                      : ` (${viewingQuote.responses.length})`
                    }
                  </h4>
                  {selectedResponseIndex !== null && (
                    <button
                      onClick={() => setSelectedResponseIndex(null)}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      View All Responses
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {(selectedResponseIndex !== null 
                    ? [viewingQuote.responses[selectedResponseIndex]].filter(Boolean)
                    : viewingQuote.responses
                  ).map((response, index) => (
                    <div key={response.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{response.company_name}</p>
                          <p className="text-sm text-gray-600">{response.company_email}</p>
                          {selectedResponseIndex === null && (
                            <p className="text-xs text-blue-600 mt-1">
                              Response #{viewingQuote.responses.indexOf(response) + 1}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">${response.price}</p>
                          <p className="text-sm text-gray-600">{response.transit_time}</p>
                        </div>
                      </div>
                      
                      {/* Response Status */}
                      <div className="flex items-center justify-between">
                        <div>
                          {response.user_response_status && (
                            <span className={`px-2 py-1 rounded-full text-xs mr-2 ${
                              response.user_response_status === 'accepted' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {response.user_response_status}
                            </span>
                          )}
                          
                          {/* Payment Status for accepted responses */}
                          {response.user_response_status === 'accepted' && (
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              response.payment_status === 'verified' ? 'bg-green-100 text-green-800' :
                              response.payment_status === 'rejected' ? 'bg-red-100 text-red-800' :
                              response.payment_proof_url ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {response.payment_status === 'verified' ? '✓ Payment Verified' :
                               response.payment_status === 'rejected' ? '✗ Payment Rejected' :
                               response.payment_proof_url ? '⏳ Payment Pending' :
                               '💳 Awaiting Payment'}
                            </span>
                          )}
                        </div>
                        
                        {/* Revenue for verified payments */}
                        {response.user_response_status === 'accepted' && response.payment_status === 'verified' && (
                          <div className="flex items-center text-green-600">
                            <FaDollarSign className="mr-1" />
                            <span className="font-bold">Revenue: ${response.price}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Payment verification date */}
                      {response.verification_date && (
                        <div className="mt-2 text-xs text-gray-500">
                          Verified: {new Date(response.verification_date).toLocaleDateString()}
                        </div>
                      )}
                      
                      {/* Payment notes */}
                      {response.payment_notes && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                          <strong>Payment Notes:</strong> {response.payment_notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Revenue Summary */}
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-green-800">
                      {selectedResponseIndex !== null 
                        ? `Revenue from Response ${selectedResponseIndex + 1}:` 
                        : 'Total Revenue from this Quote:'
                      }
                    </span>
                    <span className="text-xl font-bold text-green-600">
                      ${(selectedResponseIndex !== null 
                        ? (viewingQuote.responses[selectedResponseIndex]?.user_response_status === 'accepted' && 
                           viewingQuote.responses[selectedResponseIndex]?.payment_status === 'verified'
                           ? parseFloat(viewingQuote.responses[selectedResponseIndex]?.price || 0)
                           : 0)
                        : viewingQuote.responses
                            .filter(r => r.user_response_status === 'accepted' && r.payment_status === 'verified')
                            .reduce((sum, r) => sum + parseFloat(r.price || 0), 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => handleDeleteQuote(viewingQuote.id)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete Quote
              </button>
              <button
                onClick={() => {
                  setViewingQuote(null);
                  setSelectedResponseIndex(null);
                }}
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

export default AdminQuotes;
