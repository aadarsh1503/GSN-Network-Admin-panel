import { useState, useEffect } from 'react';
import { 
  FaEye, FaSearch, FaFilter, FaCreditCard, FaUsers, FaCalendarAlt, 
  FaChartPie, FaDollarSign, FaClock, FaCheckCircle, FaTimes 
} from 'react-icons/fa';
import { api } from '../../utils/api';
import { adminToast } from '../../utils/adminToast';

const AdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [viewingSubscription, setViewingSubscription] = useState(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/admin-panel/subscriptions');
      setSubscriptions(data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      adminToast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (subscription) => {
    try {
      const details = await api.get(`/api/admin-panel/subscriptions/${subscription.id}`);
      setViewingSubscription(details);
    } catch (error) {
      adminToast.error('Failed to load subscription details');
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = 
      sub.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.plan_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || sub.status === statusFilter;
    const matchesPayment = !paymentFilter || sub.payment_status === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentBadge = (status) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getSubscriptionStats = () => {
    const activeSubscriptions = filteredSubscriptions.filter(s => s.status === 'active');
    const expiredSubscriptions = filteredSubscriptions.filter(s => s.status === 'expired');
    const cancelledSubscriptions = filteredSubscriptions.filter(s => s.status === 'cancelled');
    const paidSubscriptions = filteredSubscriptions.filter(s => s.payment_status === 'paid');
    
    const totalRevenue = paidSubscriptions.reduce((sum, s) => sum + parseFloat(s.amount_paid || 0), 0);
    const monthlyRevenue = paidSubscriptions
      .filter(s => {
        const startDate = new Date(s.start_date);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        return startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear;
      })
      .reduce((sum, s) => sum + parseFloat(s.amount_paid || 0), 0);

    return {
      total: filteredSubscriptions.length,
      active: activeSubscriptions.length,
      expired: expiredSubscriptions.length,
      cancelled: cancelledSubscriptions.length,
      totalRevenue,
      monthlyRevenue,
      paidCount: paidSubscriptions.length
    };
  };

  const stats = getSubscriptionStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-1">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-[#bca142] rounded-xl flex items-center justify-center shadow-lg">
                <FaCreditCard className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Subscription Management
                </h1>
                <p className="text-gray-600 mt-1">View and manage all user subscriptions</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-[#bca142] rounded-full animate-pulse"></div>
                <span>Live Data</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Subscriptions</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-[#bca142] rounded-lg flex items-center justify-center">
                <FaUsers className="text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-[#bca142] mt-1">${stats.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="w-10 h-10 bg-[#bca142] rounded-lg flex items-center justify-center">
                <FaDollarSign className="text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Active Plans</p>
                <p className="text-2xl font-bold text-[#bca142] mt-1">{stats.active}</p>
              </div>
              <div className="w-10 h-10 bg-[#bca142] rounded-lg flex items-center justify-center">
                <FaCheckCircle className="text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Expired</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.expired}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <FaClock className="text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Cancelled</p>
                <p className="text-2xl font-bold text-gray-600 mt-1">{stats.cancelled}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <FaTimes className="text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-[#bca142] rounded-lg flex items-center justify-center">
              <FaFilter className="text-white text-sm" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Filters & Search</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users, plans, transactions..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <select
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <option value="">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setPaymentFilter('');
              }}
              className="bg-[#bca142] text-white px-6 py-3 rounded-xl hover:bg-[#B8941F] transition-all duration-300 font-medium"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#bca142]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Plan</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Start Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">End Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Payment</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSubscriptions.length > 0 ? (
                  filteredSubscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-gray-600">{sub.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-[#bca142] rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {sub.user_name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{sub.user_name}</div>
                            <div className="text-sm text-gray-500">{sub.user_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-[#bca142] rounded-lg flex items-center justify-center">
                            <FaCreditCard className="text-white text-sm" />
                          </div>
                          <span className="font-medium text-gray-700">{sub.plan_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-lg font-bold text-[#bca142]">${sub.amount_paid}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <FaCalendarAlt className="text-gray-400" />
                          <span>{new Date(sub.start_date).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <FaCalendarAlt className="text-gray-400" />
                          <span>{new Date(sub.end_date).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(sub.status)}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPaymentBadge(sub.payment_status)}`}>
                          {sub.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewDetails(sub)}
                          className="p-2 text-black hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center py-12">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                          <FaCreditCard className="text-slate-400 text-xl" />
                        </div>
                        <p className="text-slate-500 font-medium">No subscriptions found</p>
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
            <div className="flex items-center justify-between text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <FaCreditCard className="text-slate-400" />
                <span>Showing {filteredSubscriptions.length} of {subscriptions.length} subscriptions</span>
              </div>
              <div className="flex items-center space-x-4">
                <span>Active: {stats.active}</span>
                <span>•</span>
                <span>Revenue: ${stats.totalRevenue.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* View Details Modal */}
        {viewingSubscription && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-white/20 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <FaEye className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Subscription Details</h3>
                  </div>
                  <button
                    onClick={() => setViewingSubscription(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                  >
                    <FaTimes />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Subscription Info */}
                  <div className="bg-slate-50 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center space-x-2">
                      <FaCreditCard className="text-purple-600" />
                      <span>Subscription Information</span>
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-600">Subscription ID</label>
                        <p className="mt-1 font-mono text-slate-800">{viewingSubscription.id}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600">Transaction ID</label>
                        <p className="mt-1 font-mono text-slate-800">{viewingSubscription.transaction_id || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600">Plan Details</label>
                        <p className="mt-1 font-semibold text-slate-800">{viewingSubscription.plan_name}</p>
                        <p className="text-sm text-slate-500">Duration: {viewingSubscription.duration_months} months</p>
                        <p className="text-sm text-slate-500">Price: ${viewingSubscription.plan_price}</p>
                      </div>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="bg-slate-50 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center space-x-2">
                      <FaUsers className="text-blue-600" />
                      <span>User Information</span>
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-bold">
                            {viewingSubscription.user_name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{viewingSubscription.user_name}</p>
                          <p className="text-sm text-slate-500">{viewingSubscription.user_email}</p>
                          <p className="text-sm text-slate-500">{viewingSubscription.user_phone}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Info */}
                  <div className="bg-slate-50 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center space-x-2">
                      <FaDollarSign className="text-emerald-600" />
                      <span>Financial Details</span>
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-600">Amount Paid</label>
                        <p className="mt-1 text-2xl font-bold text-emerald-600">${viewingSubscription.amount_paid}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600">Payment Status</label>
                        <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getPaymentBadge(viewingSubscription.payment_status)}`}>
                          {viewingSubscription.payment_status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Dates */}
                  <div className="bg-slate-50 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center space-x-2">
                      <FaCalendarAlt className="text-blue-600" />
                      <span>Status & Timeline</span>
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-600">Status</label>
                        <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(viewingSubscription.status)}`}>
                          {viewingSubscription.status}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600">Start Date</label>
                        <p className="mt-1 text-slate-800">{new Date(viewingSubscription.start_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600">End Date</label>
                        <p className="mt-1 text-slate-800">{new Date(viewingSubscription.end_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setViewingSubscription(null)}
                    className="px-6 py-3 bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-xl hover:from-slate-600 hover:to-slate-700 transition-all duration-300 font-medium"
                  >
                    Close Details
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

export default AdminSubscriptions;
