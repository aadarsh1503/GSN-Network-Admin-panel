import React, { useState, useEffect } from 'react';
import { FiEye, FiClock, FiCheckCircle, FiAlertTriangle, FiMessageSquare, FiUser, FiX } from 'react-icons/fi';
import { api } from '../../utils/api';
import { toast } from 'react-hot-toast';

const AdminDisputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const timestamp = Date.now();
      const data = await api.get(`/api/disputes/admin/all?_t=${timestamp}`);
      setDisputes(data);
    } catch (error) {
      console.error('Error fetching disputes:', error);
      toast.error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    
    if (!responseText.trim()) {
      toast.error('Please enter a response message');
      return;
    }

    if (!newStatus) {
      toast.error('Please select a status');
      return;
    }

    setSubmitting(true);

    try {
      await api.put(`/api/disputes/admin/${selectedDispute.id}/status`, {
        status: newStatus,
        admin_response: responseText,
        resolution_notes: responseText
      });
      
      toast.success('Dispute status updated successfully');
      
      setShowResponseModal(false);
      setResponseText('');
      setNewStatus('');
      setSelectedDispute(null);
      
      // Refresh disputes data with delay
      setTimeout(async () => {
        await fetchDisputes();
      }, 1000);
      
    } catch (error) {
      console.error('Error updating dispute status:', error);
      if (error.response) {
        toast.error(error.response.data.message || 'Failed to update dispute status');
      } else {
        toast.error('Failed to update dispute status');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiClock className="text-yellow-600" />;
      case 'running':
        return <FiAlertTriangle className="text-blue-600" />;
      case 'resolved':
        return <FiCheckCircle className="text-green-600" />;
      case 'closed':
        return <FiCheckCircle className="text-gray-600" />;
      default:
        return <FiClock className="text-gray-600" />;
    }
  };

  const filteredDisputes = disputes.filter(dispute => {
    if (filter === 'all') return true;
    return dispute.status === filter;
  });

  const getFilterCounts = () => {
    return {
      all: disputes.length,
      pending: disputes.filter(d => d.status === 'pending').length,
      running: disputes.filter(d => d.status === 'running').length,
      resolved: disputes.filter(d => d.status === 'resolved').length,
      closed: disputes.filter(d => d.status === 'closed').length,
    };
  };

  const counts = getFilterCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 overflow-x-hidden min-h-screen">
      <div className="max-w-6xl overflow-x-hidden mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Admin - All Disputes</h1>
            <p className="text-gray-600">Manage and resolve all platform disputes</p>
          </div>
          <button 
            onClick={fetchDisputes}
            className="flex items-center bg-blue-500 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
            title="Refresh Data"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: 'all', label: 'All Disputes', count: counts.all },
                { key: 'pending', label: 'Pending', count: counts.pending },
                { key: 'running', label: 'Running', count: counts.running },
                { key: 'resolved', label: 'Resolved', count: counts.resolved },
                { key: 'closed', label: 'Closed', count: counts.closed },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    filter === tab.key
                      ? 'border-yellow-500 text-yellow-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      filter === tab.key ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Disputes List */}
        <div className="bg-white rounded-lg shadow-md overflow-x-hidden">
          {filteredDisputes.length === 0 ? (
            <div className="text-center py-12">
              <FiCheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' ? 'No Disputes Found' : `No ${filter} Disputes`}
              </h3>
              <p className="text-gray-500">
                {filter === 'all' 
                  ? 'There are no disputes in the system at the moment.'
                  : `There are no ${filter} disputes at the moment.`
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-yellow-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispute</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDisputes.map((dispute) => (
                    <tr key={dispute.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {getStatusIcon(dispute.status)}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">#{dispute.id}</div>
                            <div className="text-sm text-gray-500 max-w-xs truncate">{dispute.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <FiUser className="text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{dispute.user_name}</div>
                            <div className="text-sm text-gray-500">{dispute.user_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <FiUser className="text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{dispute.company_name}</div>
                            <div className="text-sm text-gray-500">{dispute.company_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {dispute.reason_title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(dispute.priority)}`}>
                          {dispute.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(dispute.status)}`}>
                          {dispute.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(dispute.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedDispute(dispute);
                            setShowDetailsModal(true);
                          }}
                          className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-colors mr-2"
                          title="View Details"
                        >
                          <FiEye size={16} />
                        </button>
                        {dispute.status !== 'closed' && (
                          <button
                            onClick={() => {
                              setSelectedDispute(dispute);
                              setNewStatus(dispute.status);
                              setShowResponseModal(true);
                            }}
                            className="bg-orange-500 text-white p-2 rounded-md hover:bg-orange-600 transition-colors"
                            title="Update Status"
                          >
                            <FiMessageSquare size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Dispute Details Modal */}
      {showDetailsModal && selectedDispute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Admin - Dispute Details #{selectedDispute.id}</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-white hover:text-gray-200"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <p className="mt-1 text-gray-900">{selectedDispute.title}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Filed By (User)</label>
                    <div className="mt-1">
                      <p className="font-medium text-gray-900">{selectedDispute.user_name}</p>
                      <p className="text-sm text-gray-600">{selectedDispute.user_email}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Against Company</label>
                    <div className="mt-1">
                      <p className="font-medium text-gray-900">{selectedDispute.company_name}</p>
                      <p className="text-sm text-gray-600">{selectedDispute.company_email}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reason</label>
                    <p className="mt-1 text-gray-900">{selectedDispute.reason_title}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedDispute.status)}`}>
                      {selectedDispute.status}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedDispute.priority)}`}>
                      {selectedDispute.priority}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Filed On</label>
                    <p className="mt-1 text-gray-900">{new Date(selectedDispute.created_at).toLocaleString()}</p>
                  </div>

                  {selectedDispute.resolved_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Resolved On</label>
                      <p className="mt-1 text-gray-900">{new Date(selectedDispute.resolved_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedDispute.description}</p>
                  </div>
                </div>

                {selectedDispute.company_response && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Response</label>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedDispute.company_response}</p>
                      {selectedDispute.company_responded_at && (
                        <p className="text-sm text-gray-500 mt-2">
                          Responded on {new Date(selectedDispute.company_responded_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {selectedDispute.admin_response && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Admin Response</label>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedDispute.admin_response}</p>
                      {selectedDispute.resolved_at && (
                        <p className="text-sm text-gray-500 mt-2">
                          Resolved on {new Date(selectedDispute.resolved_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Response & Status Update Modal */}
      {showResponseModal && selectedDispute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            {/* Loading Overlay */}
            {submitting && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-lg font-medium text-gray-700 animate-pulse">
                    Updating dispute status...
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Please wait while we process your update
                  </p>
                </div>
              </div>
            )}
            
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Admin - Update Dispute #{selectedDispute.id}</h3>
              <button 
                onClick={() => {
                  if (!submitting) {
                    setShowResponseModal(false);
                    setResponseText('');
                    setNewStatus('');
                    setSelectedDispute(null);
                  }
                }}
                disabled={submitting}
                className={`text-white transition-all duration-200 ${
                  submitting ? 'opacity-50 cursor-not-allowed' : 'hover:text-gray-200'
                }`}
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {/* Dispute Summary */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Dispute Summary</h4>
                <p className="text-sm text-gray-700 mb-2"><strong>Title:</strong> {selectedDispute.title}</p>
                <p className="text-sm text-gray-700 mb-2"><strong>User:</strong> {selectedDispute.user_name}</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Company:</strong> {selectedDispute.company_name}</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Current Status:</strong> 
                  <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedDispute.status)}`}>
                    {selectedDispute.status}
                  </span>
                </p>
              </div>

              <form onSubmit={handleStatusUpdate}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Update Status *
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      disabled={submitting}
                      className={`w-full p-3 border rounded-lg transition-all duration-200 ${
                        submitting 
                          ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                          : 'focus:ring-2 focus:ring-orange-500 focus:border-transparent hover:border-orange-300'
                      }`}
                      required
                    >
                      <option value="pending">Pending</option>
                      <option value="running">Running</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Response & Resolution Notes *
                    </label>
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      disabled={submitting}
                      className={`w-full p-3 border rounded-lg transition-all duration-200 ${
                        submitting 
                          ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                          : 'focus:ring-2 focus:ring-orange-500 focus:border-transparent hover:border-orange-300'
                      }`}
                      rows="6"
                      placeholder="Provide your admin response and any resolution notes. This will be shared with both the user and company."
                      required
                    />
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <p className="text-sm text-orange-800">
                      <strong>Admin Authority:</strong> As an admin, your status update will be immediately applied and both parties will be notified. 
                      Use this power responsibly to ensure fair resolution of disputes.
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      if (!submitting) {
                        setShowResponseModal(false);
                        setResponseText('');
                        setNewStatus('');
                        setSelectedDispute(null);
                      }
                    }}
                    disabled={submitting}
                    className={`px-4 py-2 text-white rounded transition-all duration-200 ${
                      submitting 
                        ? 'bg-gray-400 cursor-not-allowed opacity-60' 
                        : 'bg-gray-500 hover:bg-gray-600'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-6 py-3 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center min-w-[200px] ${
                      submitting 
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transform hover:scale-105 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                        <span className="animate-pulse">Updating...</span>
                      </>
                    ) : (
                      <>
                        <FiMessageSquare className="mr-2" size={18} />
                        Update Dispute Status
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDisputes;