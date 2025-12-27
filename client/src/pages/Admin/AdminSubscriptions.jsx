import React, { useState, useEffect } from 'react';
import { FaEye, FaSearch, FaFilter } from 'react-icons/fa';
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

  if (loading) return <div className="p-10 text-center">Loading subscriptions...</div>;

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="p-6 border-b">
            <h2 className="text-2xl font-semibold">Subscription Management</h2>
            <p className="text-gray-600 mt-1">View and manage all user subscriptions</p>
          </div>

          {/* Filters */}
          <div className="p-4 border-b bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                className="p-2 border rounded-md"
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
                  <th className="p-3 text-left">Start Date</th>
                  <th className="p-3 text-left">End Date</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Payment</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.length > 0 ? (
                  filteredSubscriptions.map((sub) => (
                    <tr key={sub.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{sub.id}</td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{sub.user_name}</div>
                          <div className="text-sm text-gray-500">{sub.user_email}</div>
                        </div>
                      </td>
                      <td className="p-3">{sub.plan_name}</td>
                      <td className="p-3">${sub.amount_paid}</td>
                      <td className="p-3">{new Date(sub.start_date).toLocaleDateString()}</td>
                      <td className="p-3">{new Date(sub.end_date).toLocaleDateString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(sub.status)}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getPaymentBadge(sub.payment_status)}`}>
                          {sub.payment_status}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleViewDetails(sub)}
                          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center p-4 text-gray-500">
                      No subscriptions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="p-4 bg-gray-50 border-t">
            <div className="text-sm text-gray-600">
              Showing {filteredSubscriptions.length} of {subscriptions.length} subscriptions
            </div>
          </div>
        </div>
      </div>

      {/* View Details Modal */}
      {viewingSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Subscription Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Subscription ID</label>
                <p className="mt-1">{viewingSubscription.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                <p className="mt-1">{viewingSubscription.transaction_id || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">User Information</label>
                <p className="mt-1">{viewingSubscription.user_name}</p>
                <p className="text-sm text-gray-500">{viewingSubscription.user_email}</p>
                <p className="text-sm text-gray-500">{viewingSubscription.user_phone}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Plan Details</label>
                <p className="mt-1 font-medium">{viewingSubscription.plan_name}</p>
                <p className="text-sm text-gray-500">Duration: {viewingSubscription.duration_months} months</p>
                <p className="text-sm text-gray-500">Price: ${viewingSubscription.plan_price}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount Paid</label>
                <p className="mt-1 text-lg font-bold text-green-600">${viewingSubscription.amount_paid}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm ${getStatusBadge(viewingSubscription.status)}`}>
                  {viewingSubscription.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <p className="mt-1">{new Date(viewingSubscription.start_date).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <p className="mt-1">{new Date(viewingSubscription.end_date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingSubscription(null)}
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

export default AdminSubscriptions;
