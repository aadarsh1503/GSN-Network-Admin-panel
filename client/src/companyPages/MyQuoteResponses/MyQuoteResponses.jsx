import { useState, useEffect } from 'react';
import { FaEye, FaEdit, FaCheck, FaTimes, FaClock, FaUser } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';

const MyQuoteResponses = () => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  useEffect(() => {
    fetchMyResponses();
  }, []);

  const fetchMyResponses = async () => {
    try {
      const data = await api.get('/api/company-quotes/my-responses');
      setResponses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching responses:', error);
      toast.error('Failed to fetch responses');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (responseId, newStatus) => {
    if (updatingStatus === responseId) return;
    
    setUpdatingStatus(responseId);
    try {
      await api.put(`/api/company-quotes/response/${responseId}/status`, { status: newStatus });
      toast.success('Response status updated successfully');
      fetchMyResponses(); // Refresh the responses
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getUserResponseStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Quote Responses</h1>
        <p className="text-gray-600">Manage your submitted quote responses and track their status</p>
      </div>

      {/* Responses List */}
      <div className="bg-white rounded-lg shadow">
        {Array.isArray(responses) && responses.length === 0 ? (
          <div className="text-center py-12">
            <FaEye className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No responses yet</h3>
            <p className="text-gray-500">You haven't submitted any quote responses yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quote Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    My Response
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer Response
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    My Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(responses) && responses.map((response) => (
                  <tr key={response.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          Quote #{response.quote_id}
                        </div>
                        <div className="text-gray-600">
                          {response.departure_country} → {response.arrival_country}
                        </div>
                        <div className="text-gray-500 capitalize">
                          {response.shipping_mode}
                        </div>
                        <div className="text-gray-500 truncate max-w-xs">
                          {response.product_description}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                          <FaUser className="text-gray-600 text-sm" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {response.user_name || 'Guest User'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {response.user_email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          ${response.price}
                        </div>
                        <div className="text-gray-600">
                          {response.transit_time}
                        </div>
                        {response.valid_until && (
                          <div className="text-gray-500 text-xs">
                            Valid until: {formatDate(response.valid_until)}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {response.user_response_status ? (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUserResponseStatusColor(response.user_response_status)}`}>
                          {response.user_response_status.charAt(0).toUpperCase() + response.user_response_status.slice(1)}
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full text-gray-600 bg-gray-100">
                          Pending
                        </span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={response.status}
                        onChange={(e) => handleStatusChange(response.id, e.target.value)}
                        disabled={updatingStatus === response.id}
                        className={`px-2 py-1 text-xs font-medium rounded border-0 ${getStatusColor(response.status)} ${
                          updatingStatus === response.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(response.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyQuoteResponses;