import React, { useState, useEffect } from 'react';
import { FaEye, FaDownload, FaFileInvoiceDollar, FaCreditCard, FaCalendar, FaFilter } from 'react-icons/fa';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'subscriptions', 'quotes'
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewingTransaction, setViewingTransaction] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/company/transaction-history');
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transaction history');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTransaction = async (transactionId) => {
    try {
      const transaction = await api.get(`/api/company/transactions/${transactionId}`);
      setViewingTransaction(transaction);
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      toast.error('Failed to load transaction details');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const getTransactionTypeBadge = (type) => {
    const colors = {
      subscription: 'bg-blue-100 text-blue-800',
      quote_payment: 'bg-purple-100 text-purple-800',
      refund: 'bg-orange-100 text-orange-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
        {type?.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'subscriptions' && transaction.type === 'subscription') ||
                      (activeTab === 'quotes' && transaction.type === 'quote_payment');
    
    const matchesSearch = searchTerm === '' || 
                         transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.reference_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    
    return matchesTab && matchesSearch && matchesStatus;
  });

  // Pagination
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredTransactions.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredTransactions.length / entriesPerPage);

  if (loading) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CDA435]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaCreditCard className="text-[#CDA435]" />
          Transaction History
        </div>
        <div className="text-sm text-gray-600">
          Total: {filteredTransactions.length} transactions
        </div>
      </h2>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => {
              setActiveTab('all');
              setCurrentPage(1);
            }}
            className={`flex-1 px-4 py-2 rounded-md font-semibold transition-all duration-200 ${
              activeTab === 'all'
                ? 'bg-[#CDA435] text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            All Transactions
          </button>
          <button
            onClick={() => {
              setActiveTab('subscriptions');
              setCurrentPage(1);
            }}
            className={`flex-1 px-4 py-2 rounded-md font-semibold transition-all duration-200 ${
              activeTab === 'subscriptions'
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Subscriptions
          </button>
          <button
            onClick={() => {
              setActiveTab('quotes');
              setCurrentPage(1);
            }}
            className={`flex-1 px-4 py-2 rounded-md font-semibold transition-all duration-200 ${
              activeTab === 'quotes'
                ? 'bg-purple-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Quote Payments
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Show</span>
          <select 
            value={entriesPerPage} 
            onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#CDA435]"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          <span>entries</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FaFilter className="text-gray-400" />
            <select 
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#CDA435]"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <label htmlFor="search">Search:</label>
            <input 
              id="search"
              type="text" 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Transaction ID, description..."
              className="border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#CDA435]"
            />
          </div>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <FaCreditCard className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Yet</h3>
          <p className="text-gray-500">Your transaction history will appear here when you make payments.</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-[#D9CBAA] text-gray-800 text-sm">
                <tr>
                  <th className="p-3 text-left font-semibold">Date</th>
                  <th className="p-3 text-left font-semibold">Transaction ID</th>
                  <th className="p-3 text-left font-semibold">Type</th>
                  <th className="p-3 text-left font-semibold">Description</th>
                  <th className="p-3 text-left font-semibold">Amount</th>
                  <th className="p-3 text-left font-semibold">Status</th>
                  <th className="p-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentEntries.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-700">
                      <div className="flex items-center">
                        <FaCalendar className="text-gray-400 mr-2" />
                        {formatDate(transaction.created_at)}
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-700 font-mono">
                      {transaction.transaction_id}
                    </td>
                    <td className="p-3 text-sm text-gray-700">
                      {getTransactionTypeBadge(transaction.type)}
                    </td>
                    <td className="p-3 text-sm text-gray-700">
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        {transaction.reference_id && (
                          <p className="text-xs text-gray-500">Ref: {transaction.reference_id}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-700">
                      <span className="font-semibold text-green-600">
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-700">
                      {getStatusBadge(transaction.status)}
                    </td>
                    <td className="p-3 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewTransaction(transaction.id)}
                          className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
                          title="View Details"
                        >
                          <FaEye size={12} />
                        </button>
                        {transaction.invoice_id && (
                          <button
                            onClick={() => window.open(`/company/invoices/${transaction.invoice_id}`, '_blank')}
                            className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors"
                            title="View Invoice"
                          >
                            <FaFileInvoiceDollar size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredTransactions.length > 0 && (
            <div className="flex flex-col md:flex-row items-center justify-between mt-4 gap-4">
              <div className="text-sm text-gray-600">
                Showing {filteredTransactions.length === 0 ? 0 : indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, filteredTransactions.length)} of {filteredTransactions.length} entries
              </div>
              <div className="flex items-center">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-l-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 border-t border-b border-gray-300 text-gray-800 bg-[#D9CBAA]">
                  {currentPage}
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-r-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Transaction Detail Modal */}
      {viewingTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold text-gray-800">Transaction Details</h3>
              <button
                onClick={() => setViewingTransaction(null)}
                className="text-gray-500 hover:text-red-500 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                  <p className="p-2 bg-gray-50 rounded border font-mono">{viewingTransaction.transaction_id}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <p className="p-2 bg-gray-50 rounded border">{getTransactionTypeBadge(viewingTransaction.type)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <p className="p-2 bg-gray-50 rounded border font-semibold text-green-600">
                    {formatCurrency(viewingTransaction.amount)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <p className="p-2 bg-gray-50 rounded border">{getStatusBadge(viewingTransaction.status)}</p>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="p-2 bg-gray-50 rounded border">{viewingTransaction.description}</p>
                </div>
                
                {viewingTransaction.reference_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reference ID</label>
                    <p className="p-2 bg-gray-50 rounded border font-mono">{viewingTransaction.reference_id}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <p className="p-2 bg-gray-50 rounded border">{formatDate(viewingTransaction.created_at)}</p>
                </div>
                
                {viewingTransaction.payment_method && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <p className="p-2 bg-gray-50 rounded border">{viewingTransaction.payment_method}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => setViewingTransaction(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;