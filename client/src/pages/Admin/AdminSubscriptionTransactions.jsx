import React, { useState, useEffect } from 'react';
import { FaSearch, FaFileDownload } from 'react-icons/fa';
import { api } from '../../utils/api';
import { adminToast } from '../../utils/adminToast';

const AdminSubscriptionTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/admin-panel/subscription-transactions');
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching subscription transactions:', error);
      adminToast.error('Failed to load subscription transactions');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = 
      txn.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.plan_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.transaction_reference?.toLowerCase().includes(searchTerm.toLowerCase());
    
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
    const headers = ['ID', 'User', 'Email', 'Plan', 'Amount', 'Payment Method', 'Reference', 'Status', 'Date'];
    const rows = filteredTransactions.map(txn => [
      txn.id,
      txn.user_name,
      txn.user_email,
      txn.plan_name || 'N/A',
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
    a.download = `subscription_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-10 text-center">Loading subscription transactions...</div>;

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6">
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
              <h2 className="text-2xl font-semibold">Subscription Transaction History</h2>
              <p className="text-gray-600 mt-1">Member payments for subscription plans</p>
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
                  placeholder="Search users, plans, transactions..."
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
                  <th className="p-3 text-left">Plan</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Payment Method</th>
                  <th className="p-3 text-left">Reference</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Date</th>
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
                      <td className="p-3">{txn.plan_name || 'N/A'}</td>
                      <td className="p-3 font-bold text-green-600">${txn.amount}</td>
                      <td className="p-3">{txn.payment_method || 'N/A'}</td>
                      <td className="p-3 text-sm">{txn.transaction_reference || 'N/A'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(txn.status)}`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="p-3 text-sm">
                        {new Date(txn.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center p-4 text-gray-500">
                      No subscription transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="p-4 bg-gray-50 border-t">
            <div className="text-sm text-gray-600">
              Showing {filteredTransactions.length} of {transactions.length} subscription transactions
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSubscriptionTransactions;