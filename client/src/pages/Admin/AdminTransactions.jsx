import { useState, useEffect } from 'react';
import { 
  FiSearch, FiDownload, FiTrash, FiFilter, FiTrendingUp, 
  FiCreditCard, FiFileText, FiEye, FiCalendar 
} from 'react-icons/fi';
import { FaSort, FaTrash } from 'react-icons/fa';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, transactionId: null, transactionDetails: null });

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterAndSortTransactions();
  }, [transactions, searchTerm, statusFilter, sortConfig]);

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
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortTransactions = () => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(txn =>
        txn.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.transaction_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.product_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.plan_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(txn => txn.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'created_at') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      } else if (sortConfig.key === 'amount') {
        aValue = parseFloat(aValue || 0);
        bValue = parseFloat(bValue || 0);
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setFilteredTransactions(filtered);
    setCurrentPage(1);
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleDeleteTransaction = async (transactionId) => {
    try {
      await api.delete(`/api/admin-panel/transactions/${transactionId}`);
      toast.success('Transaction deleted successfully');
      setDeleteConfirm({ show: false, transactionId: null, transactionDetails: null });
      fetchTransactions(); // Refresh the list
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
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

  const getTransactionTypeIcon = (type) => {
    return type === 'subscription' ? '📋' : '📦';
  };

  const getTransactionTypeName = (type) => {
    return type === 'subscription' ? 'Subscription' : 'Quote Payment';
  };

  const getStatusBadge = (status) => {
    const colors = {
      completed: 'bg-[#bca142] text-white',
      verified: 'bg-[#bca142] text-white',
      paid: 'bg-[#bca142] text-white',
      pending: 'bg-yellow-100 text-[#bca142]',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-1 py-0.5 rounded text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const calculateTotalRevenue = () => {
    return filteredTransactions
      .filter(txn => ['completed', 'verified', 'paid'].includes(txn.status))
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
        .filter(t => ['completed', 'verified'].includes(t.status))
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
      subscriptionRevenue: subscriptionTransactions
        .filter(t => ['paid', 'completed'].includes(t.status))
        .reduce((sum, t) => sum + parseFloat(t.amount_paid || 0), 0)
    };
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Type', 'User', 'Email', 'Company', 'Quote/Plan', 'Product/Description', 'Amount', 'Reference', 'Status', 'Date'];
    const rows = filteredTransactions.map(txn => [
      txn.id,
      getTransactionTypeName(txn.transaction_type),
      txn.user_name,
      txn.user_email,
      txn.company_name || 'N/A',
      txn.quote_id || txn.plan_name || 'N/A',
      txn.product_description || txn.plan_description || 'N/A',
      txn.amount || txn.amount_paid,
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
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const stats = getTransactionStats();

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen p-2 sm:p-3">
        <div className="max-w-full mx-auto">
          <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-white text-sm">Loading transactions...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-2 sm:p-3">
      <div className="max-w-full mx-auto">
        {/* Compact Stats Section */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-lg font-bold text-gray-800">{stats.total}</p>
              </div>
              <FiFileText className="text-[#bca142]" />
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Revenue</p>
                <p className="text-lg font-bold text-[#bca142]">${calculateTotalRevenue()}</p>
              </div>
              <FiTrendingUp className="text-[#bca142]" />
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Quotes</p>
                <p className="text-lg font-bold text-[#bca142]">{stats.quotes}</p>
              </div>
              <span className="text-[#bca142]">📦</span>
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Completed</p>
                <p className="text-lg font-bold text-[#bca142]">
                  {filteredTransactions.filter(t => ['completed', 'verified', 'paid'].includes(t.status)).length}
                </p>
              </div>
              <span className="text-[#bca142]">✅</span>
            </div>
          </div>
        </div>

        {/* Compact Filter Section */}
        <div className="bg-white p-3 rounded-lg shadow-sm mb-3">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
            <div className="w-full">
              <label htmlFor="search" className="block text-xs font-medium text-gray-700 mb-1">
                <FiSearch className="inline mr-1" />
                Search
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#bca142] focus:border-[#bca142]"
              />
            </div>
            <div className="w-full">
              <label htmlFor="status-filter" className="block text-xs font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#bca142] focus:border-[#bca142] bg-white"
              >
                <option value="">All</option>
                <option value="completed">Completed</option>
                <option value="verified">Verified</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <div className="w-full">
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                }}
                className="w-full flex items-center justify-center px-3 py-1.5 text-sm bg-[#bca142] text-white font-medium rounded-md shadow-sm hover:bg-[#B8941F] transition-colors"
              >
                <FiFilter className="mr-1" />
                Clear
              </button>
            </div>
            <div className="w-full">
              <button
                onClick={exportToCSV}
                className="w-full flex items-center justify-center px-3 py-1.5 text-sm bg-green-600 text-white font-medium rounded-md shadow-sm hover:bg-green-700 transition-colors"
              >
                <FiDownload className="mr-1" />
                Export
              </button>
            </div>
            <div className="w-full">
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <span>Show</span>
                <select 
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="border border-gray-300 rounded px-1 py-0.5 bg-white text-xs"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Table Section */}
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Transactions ({filteredTransactions.length})</h2>
            <div className="text-xs text-[#bca142] font-medium">
              💰 Payment Management
            </div>
          </div>

          {/* Compact Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-gray-600">
              <thead className="bg-[#bca142] text-white uppercase text-xs">
                <tr>
                  <th scope="col" className="px-2 py-2 font-semibold">
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort('id')}>
                      #
                      <FaSort className="ml-1 h-2 w-2 text-white" />
                    </div>
                  </th>
                  <th scope="col" className="px-2 py-2 font-semibold min-w-[120px]">
                    Type
                  </th>
                  <th scope="col" className="px-2 py-2 font-semibold min-w-[140px]">
                    User
                  </th>
                  <th scope="col" className="px-2 py-2 font-semibold min-w-[140px]">
                    Company
                  </th>
                  <th scope="col" className="px-2 py-2 font-semibold min-w-[150px]">
                    Product/Plan
                  </th>
                  <th scope="col" className="px-2 py-2 font-semibold">
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort('amount')}>
                      Amount
                      <FaSort className="ml-1 h-2 w-2 text-white" />
                    </div>
                  </th>
                  <th scope="col" className="px-2 py-2 font-semibold min-w-[120px]">
                    Reference
                  </th>
                  <th scope="col" className="px-2 py-2 font-semibold">
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort('status')}>
                      Status
                      <FaSort className="ml-1 h-2 w-2 text-white" />
                    </div>
                  </th>
                  <th scope="col" className="px-2 py-2 font-semibold">
                    <div className="flex items-center cursor-pointer" onClick={() => handleSort('created_at')}>
                      Date
                      <FaSort className="ml-1 h-2 w-2 text-white" />
                    </div>
                  </th>
                  <th scope="col" className="px-2 py-2 font-semibold">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-2 py-6 text-center text-gray-500 text-sm">
                      {transactions.length === 0 ? 'No transactions found.' : 'No transactions match your current filters.'}
                    </td>
                  </tr>
                ) : (
                  currentItems.map((transaction, index) => (
                    <tr key={transaction.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-2 py-2 text-xs">{indexOfFirstItem + index + 1}</td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1 min-w-[120px]">
                          <span className="text-lg">{getTransactionTypeIcon(transaction.transaction_type)}</span>
                          <span className="text-xs font-medium">{getTransactionTypeName(transaction.transaction_type)}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="min-w-[140px]">
                          <div className="font-medium text-xs truncate">{transaction.user_name || 'N/A'}</div>
                          <div className="text-xs text-gray-500 truncate">{transaction.user_email || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="min-w-[140px]">
                          {transaction.company_name ? (
                            <>
                              <div className="font-medium text-xs text-[#bca142] truncate">{transaction.company_name}</div>
                              <div className="text-xs text-gray-500 truncate">{transaction.company_email || 'No email'}</div>
                            </>
                          ) : (
                            <span className="text-gray-400 text-xs">No company</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2 max-w-[150px]">
                        <div className="text-xs truncate" title={transaction.product_description || transaction.plan_name || transaction.plan_description}>
                          {transaction.product_description || transaction.plan_name || transaction.plan_description || 'N/A'}
                        </div>
                        {transaction.quote_id && (
                          <div className="text-xs text-[#bca142]">Quote #{transaction.quote_id}</div>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <div className="font-bold text-xs text-[#bca142]">
                          ${transaction.amount || transaction.amount_paid || '0.00'}
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="text-xs truncate min-w-[120px]" title={transaction.transaction_reference}>
                          {transaction.transaction_reference || 'N/A'}
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="px-2 py-2 text-xs">
                        {new Date(transaction.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center">
                          <button 
                            onClick={() => showDeleteConfirm(transaction)}
                            className="p-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
                            title="Delete Transaction"
                          >
                            <FiTrash className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Compact Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-xs text-gray-600 gap-2">
              <div>
                {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredTransactions.length)} of {filteredTransactions.length}
              </div>
              <div className="flex items-center">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-xs border border-gray-300 rounded-l-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-2 py-1 text-xs border-t border-b ${
                        currentPage === pageNum 
                          ? 'text-white bg-[#bca142]' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-xs border border-gray-300 rounded-r-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <FaTrash className="text-red-600 w-3 h-3" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Confirm Delete Transaction
                  </h3>
                </div>
                
                <div className="mb-4">
                  <p className="text-gray-500 mb-3 text-sm">
                    Are you sure you want to delete this transaction? This action cannot be undone.
                  </p>
                  {deleteConfirm.transactionDetails && (
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Transaction ID:</span>
                        <span className="font-medium text-gray-800">{deleteConfirm.transactionDetails.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">User:</span>
                        <span className="font-medium text-gray-800">{deleteConfirm.transactionDetails.user_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Amount:</span>
                        <span className="font-bold text-[#bca142]">${deleteConfirm.transactionDetails.amount || deleteConfirm.transactionDetails.amount_paid}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        {getStatusBadge(deleteConfirm.transactionDetails.status)}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={hideDeleteConfirm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteTransaction(deleteConfirm.transactionId)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
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
