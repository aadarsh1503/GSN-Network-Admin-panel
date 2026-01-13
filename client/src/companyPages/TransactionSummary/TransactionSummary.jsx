import React, { useState, useEffect } from 'react';
import { 
  FiDollarSign, FiTrendingUp, FiCreditCard, FiCalendar, 
  FiEye, FiRefreshCw, FiArrowUpRight, FiArrowDownRight 
} from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const TransactionSummary = () => {
  const [transactionData, setTransactionData] = useState({
    totalAmount: 0,
    verifiedPayments: 0,
    pendingPayments: 0,
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactionSummary();
  }, []);

  const fetchTransactionSummary = async () => {
    try {
      setLoading(true);
      
      // Fetch payment verifications data
      const data = await api.get('/api/enhanced-quotes/company-responses-with-payments');
      
      if (Array.isArray(data)) {
        // Calculate totals
        const verifiedPayments = data.filter(item => item.payment_status === 'verified');
        const pendingPayments = data.filter(item => 
          item.payment_proof_url && !item.payment_status
        );
        
        const totalAmount = verifiedPayments.reduce((sum, item) => {
          return sum + parseFloat(item.price || 0);
        }, 0);

        // Get recent transactions (last 5)
        const recentTransactions = verifiedPayments
          .sort((a, b) => new Date(b.verification_date) - new Date(a.verification_date))
          .slice(0, 5);

        setTransactionData({
          totalAmount,
          verifiedPayments: verifiedPayments.length,
          pendingPayments: pendingPayments.length,
          recentTransactions
        });
      }
    } catch (error) {
      console.error('Error fetching transaction summary:', error);
      toast.error('Failed to load transaction summary');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 h-fit">
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-yellow-200 border-t-[#CDA435]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 h-fit">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FiDollarSign className="text-[#CDA435]" />
            Transaction Summary
          </h3>
          <p className="text-gray-600 text-sm">Your payment verification overview</p>
        </div>
        <button
          onClick={fetchTransactionSummary}
          className="p-2 text-gray-500 hover:text-[#CDA435] transition-colors"
          title="Refresh Data"
        >
          <FiRefreshCw className="text-lg" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Total Revenue */}
        {/* <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                ${transactionData.totalAmount.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white bg-opacity-80 backdrop-blur-sm text-green-600">
              <FiTrendingUp className="text-lg" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-xs text-green-600">
            <FiArrowUpRight className="mr-1" />
            <span>From verified payments</span>
          </div>
        </div> */}

        {/* Verified Payments */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Verified Payments</p>
              <p className="text-2xl font-bold text-blue-600">
                {transactionData.verifiedPayments}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white bg-opacity-80 backdrop-blur-sm text-blue-600">
              <FiCreditCard className="text-lg" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-xs text-blue-600">
            <FiArrowUpRight className="mr-1" />
            <span>Completed transactions</span>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Verification</p>
              <p className="text-2xl font-bold text-yellow-600">
                {transactionData.pendingPayments}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white bg-opacity-80 backdrop-blur-sm text-yellow-600">
              <FiCalendar className="text-lg" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-xs text-yellow-600">
            <FiArrowDownRight className="mr-1" />
            <span>Awaiting your review</span>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-800">Recent Transactions</h4>
          <a 
            href="/company/transaction-History-Company"
            className="text-sm text-[#CDA435] hover:text-[#B8941F] transition-colors flex items-center gap-1"
          >
            View All
            <FiEye className="text-xs" />
          </a>
        </div>

        {transactionData.recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FiDollarSign className="mx-auto text-4xl mb-2 text-gray-300" />
            <p>No verified transactions yet</p>
            <p className="text-sm">Verified payments will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactionData.recentTransactions.map((transaction, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:bg-gray-100 transition-colors hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-800">
                        Quote #{transaction.quote_id}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Verified
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 truncate">
                      {transaction.user_name} • {transaction.product_description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(transaction.verification_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      ${parseFloat(transaction.price || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
        <a
          href="/company/payment-management"
          className="flex-1 bg-gradient-to-r from-[#CDA435] to-[#D9B95B] text-white text-center py-2 px-4 rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium"
        >
          Verify Payments
        </a>
        <a
          href="/company/transaction-History-Company"
          className="flex-1 border border-[#CDA435] text-[#CDA435] text-center py-2 px-4 rounded-lg hover:bg-[#CDA435] hover:text-white transition-all duration-200 text-sm font-medium"
        >
          View History
        </a>
      </div>
    </div>
  );
};

export default TransactionSummary;