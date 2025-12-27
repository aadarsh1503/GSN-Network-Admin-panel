import React, { useState, useEffect } from 'react';
import { FiPlus, FiEye, FiClock, FiCheckCircle, FiAlertTriangle, FiImage, FiX } from 'react-icons/fi';
import { api } from '../../utils/api';
import { toast } from 'react-hot-toast';

const UserDisputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [disputeReasons, setDisputeReasons] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [closingDispute, setClosingDispute] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [closeFeedback, setCloseFeedback] = useState('');
  const [formData, setFormData] = useState({
    company_id: '',
    dispute_reason_id: '',
    title: '',
    description: '',
    priority: 'medium'
  });

  // Fetch user's disputes
  useEffect(() => {
    fetchUserDisputes();
    fetchDisputeReasons();
    fetchCompanies();
  }, []);

  const fetchUserDisputes = async () => {
    try {
      setLoading(true);
      // This endpoint would need to be created to get disputes for the current user
      const data = await api.get('/api/disputes/my-disputes');
      setDisputes(data);
    } catch (error) {
      console.error('Error fetching user disputes:', error);
      toast.error('Failed to load your disputes');
      // Set empty array to prevent component from breaking
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDisputeReasons = async () => {
    try {
      const data = await api.get('/api/disputes/reasons');
      setDisputeReasons(data);
    } catch (error) {
      console.error('Error fetching dispute reasons:', error);
      // Set empty array to prevent component from breaking
      setDisputeReasons([]);
    }
  };

  const fetchCompanies = async () => {
    try {
      // This fetches companies the user has interacted with
      const data = await api.get('/api/disputes/user-companies');
      setCompanies(data);
    } catch (error) {
      console.error('Error fetching companies:', error);
      // Fallback: If user hasn't interacted with companies, provide empty array
      // This prevents the error from blocking the component
      setCompanies([]);
    }
  };

  const handleCreateDispute = async (e) => {
    e.preventDefault();
    
    if (!formData.company_id || !formData.dispute_reason_id || !formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/api/disputes/create', formData);
      toast.success('Dispute created successfully');
      setShowCreateModal(false);
      setFormData({
        company_id: '',
        dispute_reason_id: '',
        title: '',
        description: '',
        priority: 'medium'
      });
      
      // Refresh disputes data with delay
      setTimeout(async () => {
        await fetchUserDisputes();
      }, 1000);
      
    } catch (error) {
      console.error('Error creating dispute:', error);
      toast.error(error.response?.data?.message || 'Failed to create dispute');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseDispute = async (e) => {
    e.preventDefault();
    
    setClosingDispute(true);

    try {
      await api.put(`/api/disputes/user-close/${selectedDispute.id}`, {
        feedback: closeFeedback
      });
      toast.success('Dispute closed successfully');
      setShowCloseModal(false);
      setCloseFeedback('');
      setSelectedDispute(null);
      
      // Refresh disputes data with delay
      setTimeout(async () => {
        await fetchUserDisputes();
      }, 1000);
      
    } catch (error) {
      console.error('Error closing dispute:', error);
      toast.error(error.response?.data?.message || 'Failed to close dispute');
    } finally {
      setClosingDispute(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">My Disputes</h1>
            <p className="text-gray-600">Manage your disputes with companies</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center bg-yellow-500 text-white font-bold py-2 px-4 rounded-md hover:bg-yellow-600 transition-colors"
          >
            <FiPlus className="mr-2" />
            File New Dispute
          </button>
        </div>

        {/* Disputes List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {disputes.length === 0 ? (
            <div className="text-center py-12">
              <FiAlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Disputes Filed</h3>
              <p className="text-gray-500 mb-4">You haven't filed any disputes yet.</p>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors"
              >
                File Your First Dispute
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-yellow-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispute</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {disputes.map((dispute) => (
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {dispute.company_name}
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
                        {dispute.status === 'resolved' && (
                          <button
                            onClick={() => {
                              setSelectedDispute(dispute);
                              setShowCloseModal(true);
                            }}
                            className="bg-green-500 text-white p-2 rounded-md hover:bg-green-600 transition-colors"
                            title="Close Dispute"
                          >
                            <FiCheckCircle size={16} />
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

      {/* Create Dispute Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            {/* Loading Overlay */}
            {submitting && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-lg font-medium text-gray-700 animate-pulse">
                    Filing your dispute...
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Please wait while we process your request
                  </p>
                </div>
              </div>
            )}
            
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">File New Dispute</h3>
              <button 
                onClick={() => {
                  if (!submitting) {
                    setShowCreateModal(false);
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
            
            <form onSubmit={handleCreateDispute} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company *
                  </label>
                  <select
                    value={formData.company_id}
                    onChange={(e) => setFormData({...formData, company_id: e.target.value})}
                    disabled={submitting}
                    className={`w-full p-2 border rounded transition-all duration-200 ${
                      submitting 
                        ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                        : 'focus:ring-2 focus:ring-yellow-500 focus:border-transparent hover:border-yellow-300'
                    }`}
                    required
                  >
                    <option value="">Select a company</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dispute Reason *
                  </label>
                  <select
                    value={formData.dispute_reason_id}
                    onChange={(e) => setFormData({...formData, dispute_reason_id: e.target.value})}
                    disabled={submitting}
                    className={`w-full p-2 border rounded transition-all duration-200 ${
                      submitting 
                        ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                        : 'focus:ring-2 focus:ring-yellow-500 focus:border-transparent hover:border-yellow-300'
                    }`}
                    required
                  >
                    <option value="">Select a reason</option>
                    {disputeReasons.map(reason => (
                      <option key={reason.id} value={reason.id}>{reason.title}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    disabled={submitting}
                    className={`w-full p-2 border rounded transition-all duration-200 ${
                      submitting 
                        ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                        : 'focus:ring-2 focus:ring-yellow-500 focus:border-transparent hover:border-yellow-300'
                    }`}
                    placeholder="Brief description of the issue"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    disabled={submitting}
                    className={`w-full p-2 border rounded transition-all duration-200 ${
                      submitting 
                        ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                        : 'focus:ring-2 focus:ring-yellow-500 focus:border-transparent hover:border-yellow-300'
                    }`}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    disabled={submitting}
                    className={`w-full p-2 border rounded transition-all duration-200 ${
                      submitting 
                        ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                        : 'focus:ring-2 focus:ring-yellow-500 focus:border-transparent hover:border-yellow-300'
                    }`}
                    rows="4"
                    placeholder="Provide detailed information about the dispute..."
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    if (!submitting) {
                      setShowCreateModal(false);
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
                  className={`px-6 py-3 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center min-w-[180px] ${
                    submitting 
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 transform hover:scale-105 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      <span className="animate-pulse">Filing...</span>
                    </>
                  ) : (
                    <>
                      <FiPlus className="mr-2" size={18} />
                      File Dispute
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispute Details Modal */}
      {showDetailsModal && selectedDispute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Dispute Details #{selectedDispute.id}</h2>
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
                    <label className="block text-sm font-medium text-gray-700">Company</label>
                    <p className="mt-1 text-gray-900">{selectedDispute.company_name}</p>
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
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="mt-1 text-gray-900">{new Date(selectedDispute.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedDispute.description}</p>
                </div>

                {selectedDispute.admin_response && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Admin Response</label>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedDispute.admin_response}</p>
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

      {/* Close Dispute Modal */}
      {showCloseModal && selectedDispute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            {/* Loading Overlay */}
            {closingDispute && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-lg font-medium text-gray-700 animate-pulse">
                    Closing dispute...
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Please wait while we process your request
                  </p>
                </div>
              </div>
            )}
            
            <div className="bg-gradient-to-r from-green-500 to-blue-500 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Close Dispute #{selectedDispute.id}</h3>
              <button 
                onClick={() => {
                  if (!closingDispute) {
                    setShowCloseModal(false);
                    setCloseFeedback('');
                    setSelectedDispute(null);
                  }
                }}
                disabled={closingDispute}
                className={`text-white transition-all duration-200 ${
                  closingDispute ? 'opacity-50 cursor-not-allowed' : 'hover:text-gray-200'
                }`}
              >
                <FiX size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCloseDispute} className="p-6">
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-900 mb-2">Dispute Resolution Confirmation</h4>
                  <p className="text-sm text-green-800 mb-2">
                    <strong>Title:</strong> {selectedDispute.title}
                  </p>
                  <p className="text-sm text-green-800 mb-2">
                    <strong>Company:</strong> {selectedDispute.company_name}
                  </p>
                  <p className="text-sm text-green-800">
                    This dispute has been marked as <strong>resolved</strong> by the company. 
                    By closing this dispute, you confirm that the issue has been satisfactorily addressed.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback (Optional)
                  </label>
                  <textarea
                    value={closeFeedback}
                    onChange={(e) => setCloseFeedback(e.target.value)}
                    disabled={closingDispute}
                    className={`w-full p-3 border rounded-lg transition-all duration-200 ${
                      closingDispute 
                        ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                        : 'focus:ring-2 focus:ring-green-500 focus:border-transparent hover:border-green-300'
                    }`}
                    rows="4"
                    placeholder="Share your experience with how this dispute was resolved (optional)..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    if (!closingDispute) {
                      setShowCloseModal(false);
                      setCloseFeedback('');
                      setSelectedDispute(null);
                    }
                  }}
                  disabled={closingDispute}
                  className={`px-4 py-2 text-white rounded transition-all duration-200 ${
                    closingDispute 
                      ? 'bg-gray-400 cursor-not-allowed opacity-60' 
                      : 'bg-gray-500 hover:bg-gray-600'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={closingDispute}
                  className={`px-6 py-3 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center min-w-[160px] ${
                    closingDispute 
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transform hover:scale-105 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {closingDispute ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      <span className="animate-pulse">Closing...</span>
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="mr-2" size={18} />
                      Close Dispute
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDisputes;