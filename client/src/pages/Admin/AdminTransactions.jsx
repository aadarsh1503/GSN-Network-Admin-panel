import React, { useState, useEffect } from 'react';
import { FaSearch, FaFileDownload, FaTrash } from 'react-icons/fa';
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
      const data = await api.get('/api/admin-panel/transactions');
      setTransactions(data);
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
      txn.product_description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || txn.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
      .filter(txn => txn.status === 'completed')
      .reduce((sum, txn) => sum + parseFloat(txn.amount), 0)
      .toFixed(2);
  };

  const exportToCSV = () => {
    const headers = ['ID', 'User', 'Email', 'Company', 'Quote ID', 'Product', 'Amount', 'Payment Method', 'Reference', 'Status', 'Date'];
    const rows = filteredTransactions.map(txn => [
      txn.id,
      txn.user_name,
      txn.user_email,
      txn.company_name || 'N/A',
      txn.quote_id || 'N/A',
      txn.product_description || 'N/A',
      txn.amount,
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
    a.download = `quote_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-10 text-center">Loading transactions...</div>;

  return (
    <div className="bg-gray-100 min-h-screen  p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Total Transactions</p>
            <p className="text-2xl font-bold">{filteredTransactions.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">${calculateTotalRevenue()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {filteredTransactions.filter(t => t.status === 'completed').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {filteredTransactions.filter(t => t.status === 'pending').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="p-6 border-b flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Quote Transaction History</h2>
              <p className="text-gray-600 mt-1">User payments to companies for accepted quotes</p>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
            >
              <FaFileDownload />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Filters */}
          <div className="p-4 border-b bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users, companies, products..."
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
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
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
                  <th className="p-3 text-left">Company</th>
                  <th className="p-3 text-left">Quote ID</th>
                  <th className="p-3 text-left">Product</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Payment Method</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((txn) => (
                    <tr key={txn.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{txn.id}</td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{txn.user_name}</div>
                          <div className="text-sm text-gray-500">{txn.user_email}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{txn.company_name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{txn.company_email || ''}</div>
                        </div>
                      </td>
                      <td className="p-3">#{txn.quote_id || 'N/A'}</td>
                      <td className="p-3">
                        <div className="text-sm max-w-xs truncate">
                          {txn.product_description || 'N/A'}
                        </div>
                      </td>
                      <td className="p-3 font-bold text-green-600">${txn.amount}</td>
                      <td className="p-3">{txn.payment_method || 'N/A'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(txn.status)}`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="p-3 text-sm">
                        {new Date(txn.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => showDeleteConfirm(txn)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-md transition-colors"
                          title="Delete Transaction"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center p-4 text-gray-500">
                      No quote transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="p-4 bg-gray-50 border-t">
            <div className="text-sm text-gray-600">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirm Delete Transaction
              </h3>
              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  Are you sure you want to delete this transaction? This action cannot be undone.
                </p>
                {deleteConfirm.transactionDetails && (
                  <div className="bg-gray-50 p-3 rounded-md text-sm">
                    <p><strong>Transaction ID:</strong> {deleteConfirm.transactionDetails.id}</p>
                    <p><strong>User:</strong> {deleteConfirm.transactionDetails.user_name}</p>
                    <p><strong>Amount:</strong> ${deleteConfirm.transactionDetails.amount}</p>
                    <p><strong>Status:</strong> {deleteConfirm.transactionDetails.status}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={hideDeleteConfirm}
                  className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteTransaction(deleteConfirm.transactionId)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete Transaction
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTransactions;
