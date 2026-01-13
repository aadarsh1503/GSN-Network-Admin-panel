import { useState, useEffect } from 'react';
import { 
  FaSearch, FaFileDownload, FaTrash, FaFilter, FaChartLine, 
  FaCreditCard, FaReceipt, FaEye, FaCalendarAlt 
} from 'react-icons/fa';
import { api } from '../../utils/api';
import { adminToast } from '../../utils/adminToast';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, transactionId: null, transactionDetails: null });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // Fetch verified payment transactions from enhanced quotes (all companies)
      const [verifiedPayments, subscriptionTransactions] = await Promise.all([
        api.get('/api/enhanced-quotes/all-company-responses-with-payments').catch(() => 
          // Fallback to accepted quotes if enhanced endpoint doesn't exist
          api.get('/api/admin-panel/accepted-quote-transactions')
        ),
        api.get('/api/admin-panel/subscription-transactions').catch(() => [])
      ]);
      
      // Process verified payments data
      let quoteTransactions = [];
      if (Array.isArray(verifiedPayments)) {
        // If this is enhanced quotes data, filter for verified payments only
        if (verifiedPayments.length > 0 && verifiedPayments[0].payment_status !== undefined) {
          quoteTransactions = verifiedPayments
            .filter(item => item.payment_status === 'verified')
            .map(item => ({
              id: item.id || `${item.quote_id}-${item.quote_response_id}`,
              user_id: item.user_id,
              user_name: item.user_name,
              user_email: item.user_email,
              company_id: item.company_id,
              company_name: item.company_name,
              company_email: item.company_email,
              quote_id: item.quote_id,
              product_description: item.product_description,
              amount: item.price,
              payment_method: 'verified_payment',
              transaction_reference: `VERIFIED-${item.quote_id}-${item.quote_response_id}`,
              status: 'verified',
              created_at: item.verification_date || item.created_at,
              transaction_type: 'quote'
            }));
        } else {
          // This is the fallback accepted quotes data
          quoteTransactions = verifiedPayments.map(t => ({ ...t, transaction_type: 'quote' }));
        }
      }
      
      // Combine both types of transactions
      const combinedTransactions = [
        ...quoteTransactions,
        ...subscriptionTransactions.map(t => ({ ...t, transaction_type: 'subscription' }))
      ];
      
      // Sort by date (newest first)
      combinedTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setTransactions(combinedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      adminToast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    try {
      await api.delete(`/api/admin-panel/transactions/${transactionId}`);
      adminToast.success('Transaction deleted successfully');
      setDeleteConfirm({ show: false, transactionId: null, transactionDetails: null });
      fetchTransactions(); // Refresh the list
    } catch (error) {
      console.error('Error deleting transaction:', error);
      adminToast.error('Failed to delete transaction');
    }
  };

  const showDeleteConfirm = (transaction) => {
    setDeleteConfirm({
      show: true,
      transactionId: transaction.id,
      transactionDetails: transaction
    });
  };

  const hideDeleteConfirm = () => {
    setDeleteConfirm({ show: false, transactionId: null, transactionDetails: null });
  };

  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = 
      txn.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.transaction_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.product_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.plan_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || txn.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getTransactionTypeIcon = (type) => {
    return type === 'subscription' ? '📋' : '📦';
  };

  const getTransactionTypeName = (type) => {
    return type === 'subscription' ? 'Subscription' : 'Quote Payment';
  };

  const getStatusBadge = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const calculateTotalRevenue = () => {
    return filteredTransactions
      .filter(txn => txn.status === 'completed' || txn.status === 'verified' || txn.status === 'paid')
      .reduce((sum, txn) => sum + parseFloat(txn.amount || txn.amount_paid || 0), 0)
      .toFixed(2);
  };

  const getTransactionStats = () => {
    const quoteTransactions = filteredTransactions.filter(t => t.transaction_type === 'quote');
    const subscriptionTransactions = filteredTransactions.filter(t => t.transaction_type === 'subscription');
    
    return {
      total: filteredTransactions.length,
      quotes: quoteTransactions.length,
      subscriptions: subscriptionTransactions.length,
      quoteRevenue: quoteTransactions
        .filter(t => t.status === 'completed' || t.status === 'verified')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
      subscriptionRevenue: subscriptionTransactions
        .filter(t => t.status === 'paid' || t.status === 'completed')
        .reduce((sum, t) => sum + parseFloat(t.amount_paid || 0), 0)
    };
  };

  const stats = getTransactionStats();

  const exportToCSV = () => {
    const headers = ['ID', 'Type', 'User', 'Email', 'Company', 'Quote/Plan', 'Product/Description', 'Amount', 'Payment Method', 'Reference', 'Status', 'Date'];
    const rows = filteredTransactions.map(txn => [
      txn.id,
      getTransactionTypeName(txn.transaction_type),
      txn.user_name,
      txn.user_email,
      txn.company_name || 'N/A',
      txn.quote_id || txn.plan_name || 'N/A',
      txn.product_description || txn.plan_description || 'N/A',
      txn.amount || txn.amount_paid,
      txn.payment_method || 'N/A',
      txn.transaction_reference || 'N/A',
      txn.status,
      new Date(txn.created_at).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-1">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaChartLine className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Transaction Management
                </h1>
                <p className="text-slate-600 mt-1">Monitor all quote payments and subscription transactions</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Live Data</span>
              </div>
              <button
                onClick={exportToCSV}
                className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <FaFileDownload />
                <span className="font-medium">Export CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Total Transactions</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                <FaReceipt className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">${calculateTotalRevenue()}</p>
              </div>
              {/* <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg flex items-center justify-center">
                <FaChartLine className="text-emerald-600" />
              </div> */}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Quote Payments</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.quotes}</p>
                <p className="text-sm text-slate-500">${stats.quoteRevenue.toFixed(2)}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-lg">📦</span>
              </div>
            </div>
          </div>

          {/* <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Subscriptions</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{stats.subscriptions}</p>
                <p className="text-sm text-slate-500">${stats.subscriptionRevenue.toFixed(2)}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                <FaCreditCard className="text-purple-600" />
              </div>
            </div>
          </div> */}

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {filteredTransactions.filter(t => ['completed', 'verified', 'paid'].includes(t.status)).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-lg">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {filteredTransactions.filter(t => t.status === 'pending').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center">
                <span className="text-amber-600 text-lg">⏳</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg flex items-center justify-center">
              <FaFilter className="text-white text-sm" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Filters & Search</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="verified">Verified</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            
            {/* <div className="flex items-center space-x-2">
              <button
                onClick={() => setSearchTerm('Quote Payment')}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-300 font-medium"
              >
                <span>📦</span>
                <span>Quotes</span>
              </button>
              <button
                onClick={() => setSearchTerm('Subscription')}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all duration-300 font-medium"
              >
                <span>📋</span>
                <span>Subscriptions</span>
              </button>
            </div> */}
            
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
              }}
              className="bg-gradient-to-r from-slate-500 to-slate-600 text-white px-6 py-3 rounded-xl hover:from-slate-600 hover:to-slate-700 transition-all duration-300 font-medium"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Company</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Quote/Plan</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Product/Description</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Payment Method</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((txn) => (
                    <tr key={`${txn.transaction_type}-${txn.id}`} className="hover:bg-slate-50/50 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-slate-600">{txn.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                            <span className="text-sm">{getTransactionTypeIcon(txn.transaction_type)}</span>
                          </div>
                          <span className="text-sm font-medium text-slate-700">{getTransactionTypeName(txn.transaction_type)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-slate-800">{txn.user_name}</div>
                          <div className="text-sm text-slate-500">{txn.user_email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-slate-800">{txn.company_name || 'N/A'}</div>
                          <div className="text-sm text-slate-500">{txn.company_email || ''}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {txn.transaction_type === 'quote' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            #{txn.quote_id || 'N/A'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                            {txn.plan_name || 'N/A'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600 max-w-xs truncate">
                          {txn.product_description || txn.plan_description || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-lg font-bold text-emerald-600">
                          ${txn.amount || txn.amount_paid}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{txn.payment_method || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(txn.status)}`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                          <FaCalendarAlt className="text-slate-400" />
                          <span>{new Date(txn.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => showDeleteConfirm(txn)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Delete Transaction"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" className="text-center py-12">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                          <FaReceipt className="text-slate-400 text-xl" />
                        </div>
                        <p className="text-slate-500 font-medium">No transactions found</p>
                        <p className="text-slate-400 text-sm">Try adjusting your search filters</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary Footer */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200 px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2 text-slate-600">
                <FaReceipt className="text-slate-400" />
                <span>Showing {filteredTransactions.length} of {transactions.length} transactions</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-600">
                <span className="text-blue-600">📦</span>
                <span>Quote Payments: {stats.quotes} (${stats.quoteRevenue.toFixed(2)})</span>
              </div>
              {/* <div className="flex items-center space-x-2 text-slate-600">
                <FaCreditCard className="text-purple-600" />
                <span>Subscriptions: {stats.subscriptions} (${stats.subscriptionRevenue.toFixed(2)})</span>
              </div> */}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-white/20">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <FaTrash className="text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Confirm Delete Transaction
                  </h3>
                </div>
                
                <div className="mb-6">
                  <p className="text-slate-600 mb-4">
                    Are you sure you want to delete this transaction? This action cannot be undone.
                  </p>
                  {deleteConfirm.transactionDetails && (
                    <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Transaction ID:</span>
                        <span className="font-medium text-slate-800">{deleteConfirm.transactionDetails.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">User:</span>
                        <span className="font-medium text-slate-800">{deleteConfirm.transactionDetails.user_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Amount:</span>
                        <span className="font-bold text-emerald-600">${deleteConfirm.transactionDetails.amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(deleteConfirm.transactionDetails.status)}`}>
                          {deleteConfirm.transactionDetails.status}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={hideDeleteConfirm}
                    className="px-6 py-3 text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all duration-300 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteTransaction(deleteConfirm.transactionId)}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 font-medium shadow-lg"
                  >
                    Delete Transaction
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTransactions;
