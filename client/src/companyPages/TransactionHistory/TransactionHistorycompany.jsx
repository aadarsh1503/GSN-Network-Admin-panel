import React, { useState, useEffect } from 'react';
import { FaSort, FaEye, FaCreditCard, FaPaypal, FaUniversity, FaMoneyBillWave } from 'react-icons/fa';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import toast from 'react-hot-toast';

const TransactionHistorycompany = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/company-quotes/transactions');
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transaction history');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentIcon = (paymentMethod) => {
    switch (paymentMethod?.toLowerCase()) {
      case 'paypal':
        return <FaPaypal className="text-blue-600" />;
      case 'credit_card':
      case 'card':
        return <FaCreditCard className="text-green-600" />;
      case 'bank_transfer':
        return <FaUniversity className="text-purple-600" />;
      case 'manual':
      default:
        return <FaMoneyBillWave className="text-amber-600" />;
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

  const getStatusBadge = (status) => {
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter(transaction => {
    const term = searchTerm.toLowerCase();
    return (
      transaction.plan_name?.toLowerCase().includes(term) ||
      transaction.payment_method?.toLowerCase().includes(term) ||
      transaction.amount_paid?.toString().includes(term)
    );
  });

  // Pagination
  const indexOfLastEntry = currentPage * entries;
  const indexOfFirstEntry = indexOfLastEntry - entries;
  const currentEntries = filteredTransactions.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredTransactions.length / entries);

  // Reusable component for sortable table headers
  const SortableHeader = ({ children }) => (
    <div className="flex items-center justify-between cursor-pointer group">
      <span>{children}</span>
      <FaSort className="text-gray-400 group-hover:text-gray-600" />
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full max-w-6xl mx-auto">
        <LoadingSpinner size="lg" text="Loading transaction history..." />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Transaction History</h2>

      {/* Top Controls: Show Entries and Search */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Show</span>
          <select 
            value={entries} 
            onChange={(e) => { setEntries(Number(e.target.value)); setCurrentPage(1); }}
            className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          <span>entries</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <label htmlFor="search">Search:</label>
          <input 
            id="search"
            type="text" 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Plan name, payment method..."
            className="border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <FaMoneyBillWave className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Yet</h3>
            <p className="text-gray-500">Your subscription transactions will appear here.</p>
          </div>
        ) : (
          <table className="min-w-full bg-white">
            <thead className="bg-[#D9CBAA] text-gray-800 text-sm">
              <tr>
                <th className="p-3 text-left font-semibold w-16"><SortableHeader>Sr.No</SortableHeader></th>
                <th className="p-3 text-left font-semibold"><SortableHeader>Transaction ID</SortableHeader></th>
                <th className="p-3 text-left font-semibold"><SortableHeader>Plan Name</SortableHeader></th>
                <th className="p-3 text-left font-semibold"><SortableHeader>Amount</SortableHeader></th>
                <th className="p-3 text-left font-semibold"><SortableHeader>Payment Method</SortableHeader></th>
                <th className="p-3 text-left font-semibold"><SortableHeader>Status</SortableHeader></th>
                <th className="p-3 text-left font-semibold"><SortableHeader>Subscription Period</SortableHeader></th>
                <th className="p-3 text-left font-semibold"><SortableHeader>Date</SortableHeader></th>
                <th className="p-3 text-left font-semibold w-20"><SortableHeader>Action</SortableHeader></th>
              </tr>
            </thead>
            <tbody>
              {currentEntries.map((transaction, index) => (
                <tr key={transaction.id} className="border-b border-gray-200 hover:bg-gray-50 align-middle">
                  <td className="p-3 text-sm text-gray-700">{indexOfFirstEntry + index + 1}</td>
                  <td className="p-3 text-sm text-gray-700 font-mono">#{transaction.id}</td>
                  <td className="p-3 text-sm text-gray-700">
                    <span className="font-semibold text-[#CDA435]">{transaction.plan_name}</span>
                    {transaction.plan_description && (
                      <div className="text-xs text-gray-500 mt-1">{transaction.plan_description}</div>
                    )}
                  </td>
                  <td className="p-3 text-sm text-gray-700">
                    <span className="font-semibold text-green-600">${transaction.amount_paid}</span>
                  </td>
                  <td className="p-3 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      {getPaymentIcon(transaction.payment_method)}
                      <span>{getPaymentMethodName(transaction.payment_method)}</span>
                    </div>
                  </td>
                  <td className="p-3 text-sm text-gray-700">
                    {getStatusBadge(transaction.payment_status)}
                  </td>
                  <td className="p-3 text-sm text-gray-700">
                    <div className="text-xs">
                      <div><strong>Start:</strong> {formatDate(transaction.start_date)}</div>
                      <div><strong>End:</strong> {formatDate(transaction.end_date)}</div>
                    </div>
                  </td>
                  <td className="p-3 text-sm text-gray-700 whitespace-nowrap">
                    {formatDate(transaction.transaction_date)}
                  </td>
                  <td className="p-3 text-sm text-gray-700">
                    <button 
                      className="bg-[#D9CBAA] text-gray-800 p-2 rounded-full hover:opacity-80 transition-opacity"
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Bottom Controls: Entry Count and Pagination */}
      {transactions.length > 0 && (
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
    </div>
  );
};

export default TransactionHistorycompany;