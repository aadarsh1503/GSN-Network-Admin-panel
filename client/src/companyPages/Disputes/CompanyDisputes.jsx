import { useState, useEffect } from 'react';
import { FiEye, FiClock, FiCheckCircle, FiAlertTriangle, FiMessageSquare, FiUser, FiPlus, FiX, FiEdit } from 'react-icons/fi';
import { api } from '../../utils/api';
import { toast } from 'react-hot-toast';

const CompanyDisputes = () => {
  const [disputesAgainstCompany, setDisputesAgainstCompany] = useState([]);
  const [disputesByCompany, setDisputesByCompany] = useState([]);
  const [disputeReasons, setDisputeReasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [activeTab, setActiveTab] = useState('against'); // 'against' or 'by'
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    dispute_reason_id: '',
    title: '',
    description: '',
    priority: 'medium'
  });

  // Fetch company's disputes and dispute reasons
  useEffect(() => {
    fetchDisputeData();
    fetchDisputeReasons();
  }, []);

  const fetchDisputeData = async () => {
    try {
      setLoading(true);
      console.log('Fetching dispute data...');
      
      // Add cache-busting parameter
      const timestamp = Date.now();
      
      // Fetch disputes against this company
      const againstData = await api.get(`/api/disputes/company-disputes?_t=${timestamp}`);
      console.log('Disputes against company:', againstData);
      setDisputesAgainstCompany(againstData);
      
      // Fetch disputes filed by this company
      const byData = await api.get(`/api/disputes/my-disputes?_t=${timestamp}`);
      console.log('Disputes by company:', byData);
      setDisputesByCompany(byData);
    } catch (error) {
      console.error('Error fetching disputes:', error);
      toast.error('Failed to load disputes');
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
    }
  };

  const handleResponse = async (e) => {
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
      console.log('Sending combined response and status change:', {
        disputeId: selectedDispute.id,
        response: responseText,
        status: newStatus,
        suggestedStatus: newStatus !== selectedDispute.status ? newStatus : null
      });
      
      // Send company response to backend
      await api.post(`/api/disputes/company-response/${selectedDispute.id}`, {
        response: responseText,
        suggested_status: newStatus !== selectedDispute.status ? newStatus : null
      });
      
      // If status is different, also update the status
      if (newStatus !== selectedDispute.status) {
        console.log('Status is different, updating status...');
        await api.put(`/api/disputes/company-status/${selectedDispute.id}`, {
          status: newStatus,
          reason: responseText // Use the response text as the reason
        });
      }
      
      toast.success('Response and status updated successfully');
      
      setShowResponseModal(false);
      setResponseText('');
      setNewStatus('');
      setSelectedDispute(null);
      
      // Refresh disputes data with delay
      setTimeout(async () => {
        console.log('Refreshing dispute data after combined update...');
        await fetchDisputeData();
      }, 1000);
      
    } catch (error) {
      console.error('Error submitting response:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        toast.error(error.response.data.message || 'Failed to submit response');
      } else {
        toast.error('Failed to submit response');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDispute = async (e) => {
    e.preventDefault();
    
    if (!formData.dispute_reason_id || !formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // For company disputes against platform, we'll use a special company_id (admin ID)
      const disputeData = {
        ...formData,
        company_id: 1, // Admin ID - companies file disputes against the platform/admin
      };
      
      await api.post('/api/disputes/create', disputeData);
      toast.success('Dispute filed successfully');
      setShowCreateModal(false);
      setFormData({
        dispute_reason_id: '',
        title: '',
        description: '',
        priority: 'medium'
      });
      fetchDisputeData();
    } catch (error) {
      console.error('Error creating dispute:', error);
      toast.error(error.response?.data?.message || 'Failed to create dispute');
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

  const filteredDisputes = (activeTab === 'against' ? disputesAgainstCompany : disputesByCompany).filter(dispute => {
    if (filter === 'all') return true;
    return dispute.status === filter;
  });

  const getFilterCounts = () => {
    const disputes = activeTab === 'against' ? disputesAgainstCompany : disputesByCompany;
    return {
      all: disputes.length,
      pending: disputes.filter(d => d.status === 'pending').length,
      running: disputes.filter(d => d.status === 'running').length,
      resolved: disputes.filter(d => d.status === 'resolved').length,
      closed: disputes.filter(d => d.status === 'closed').length,
    };
  };

  const counts = getFilterCounts();

  const handleOpenChat = (dispute) => {
    // Determine who to chat with based on the dispute context
    let recipientId, recipientName;
    
    if (activeTab === 'against') {
      // For disputes against company, chat with the user who filed it
      recipientId = dispute.user_id;
      recipientName = dispute.user_name;
    } else {
      // For disputes filed by company, chat with admin (assuming admin has ID 1)
      recipientId = 1;
      recipientName = 'Platform Admin';
    }
    
    // Navigate to messages page with the recipient
    window.location.href = `/company/messages?recipient=${recipientId}&name=${encodeURIComponent(recipientName)}`;
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bca142]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 overflow-x-hidden min-h-screen">
      <div className="max-w-6xl overflow-x-hidden  mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Company Disputes</h1>
            <p className="text-gray-600">Manage disputes filed against your company and file disputes against the platform</p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={fetchDisputeData}
              className="flex items-center bg-[#bca142] text-white font-bold py-2 px-4 rounded-md hover:bg-black transition-colors"
              title="Refresh Data"
            >
              🔄 Refresh
            </button>
            {activeTab === 'by' && (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="flex items-center bg-black text-white font-bold py-2 px-4 rounded-md hover:bg-[#bca142] transition-colors"
              >
                <FiPlus className="mr-2" />
                File New Dispute
              </button>
            )}
          </div>
        </div>

        {/* Main Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => {
                  setActiveTab('against');
                  setFilter('all');
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'against'
                    ? 'border-[#bca142] text-[#bca142]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Disputes Against Us
                {disputesAgainstCompany.length > 0 && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === 'against' ? 'bg-[#bca142] text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {disputesAgainstCompany.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab('by');
                  setFilter('all');
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'by'
                    ? 'border-[#bca142] text-[#bca142]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Our Disputes
                {disputesByCompany.length > 0 && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === 'by' ? 'bg-[#bca142] text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {disputesByCompany.length}
                  </span>
                )}
              </button>
            </nav>
          </div>
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
                      ? 'border-[#bca142] text-[#bca142]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      filter === tab.key ? 'bg-[#bca142] text-white' : 'bg-gray-100 text-gray-600'
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
                {filter === 'all' 
                  ? (activeTab === 'against' ? 'No Disputes Filed Against You' : 'No Disputes Filed by You')
                  : `No ${filter} Disputes`
                }
              </h3>
              <p className="text-gray-500 mb-4">
                {filter === 'all' 
                  ? (activeTab === 'against' 
                      ? 'Great! No disputes have been filed against your company.' 
                      : 'You haven\'t filed any disputes against the platform.'
                    )
                  : `There are no ${filter} disputes at the moment.`
                }
              </p>
              {activeTab === 'by' && filter === 'all' && (
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-[#bca142] text-white px-4 py-2 rounded-md hover:bg-black transition-colors"
                >
                  File Your First Dispute
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#bca142] text-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Dispute</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      {activeTab === 'against' ? 'User' : 'Against'}
                    </th>
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Reason</th> */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
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
                            <div className="text-sm font-medium text-gray-900">
                              {activeTab === 'against' ? dispute.user_name : 'Platform Admin'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {activeTab === 'against' ? dispute.user_email : 'admin@platform.com'}
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {dispute.reason_title}
                      </td> */}
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
                          className="bg-[#bca142] text-white p-2 rounded-md hover:bg-black transition-colors mr-2"
                          title="View Details"
                        >
                          <FiEye size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenChat(dispute)}
                          className="bg-black text-white p-2 rounded-md hover:bg-[#bca142] transition-colors mr-2"
                          title="Open Chat"
                        >
                          <FiMessageSquare size={16} />
                        </button>
                        {dispute.status !== 'resolved' && dispute.status !== 'closed' && (
                          <button
                            onClick={() => {
                              setSelectedDispute(dispute);
                              setNewStatus(dispute.status); // Initialize with current status
                              setShowResponseModal(true);
                            }}
                            className="bg-gray-500 text-white p-2 rounded-md hover:bg-gray-600 transition-colors"
                            title="Respond & Update Status"
                          >
                            <FiEdit size={16} />
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
            <div className="bg-[#bca142] px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Dispute Details #{selectedDispute.id}</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-white hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
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
                    <label className="block text-sm font-medium text-gray-700">Filed By</label>
                    <div className="mt-1">
                      <p className="font-medium text-gray-900">{selectedDispute.user_name}</p>
                      <p className="text-sm text-gray-600">{selectedDispute.user_email}</p>
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
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedDispute.description}</p>
                  </div>
                </div>

                {selectedDispute.images && selectedDispute.images.length > 0 && (
                  <div className="md:col-span-2">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <svg className="mr-2 h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Evidence Images ({selectedDispute.images.length})
                    </h4>
                    
                    <div className="space-y-4">
                      {selectedDispute.images.map((image, index) => {
                        console.log(`🖼️ Rendering image ${index + 1}:`, {
                          url: image.image_url,
                          type: image.image_type,
                          id: image.id
                        });
                        
                        return (
                          <div key={index} className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-200">
                            <div className="flex items-start space-x-4">
                              {/* Image Preview */}
                              <div className="flex-shrink-0">
                                <div className="relative w-32 h-32 bg-white rounded-lg border-2 border-yellow-300 overflow-hidden shadow-md">
                                  <img
                                    src={image.image_url}
                                    alt={`Evidence ${index + 1}`}
                                    className="w-full h-full object-contain bg-white cursor-pointer"
                                    onClick={() => {
                                      console.log('🔗 Opening image in new tab:', image.image_url);
                                      window.open(image.image_url, '_blank');
                                    }}
                                    onError={(e) => {
                                      console.error('❌ Image failed to load:', image.image_url);
                                      e.target.style.backgroundColor = '#fef3c7';
                                      e.target.style.display = 'flex';
                                      e.target.style.alignItems = 'center';
                                      e.target.style.justifyContent = 'center';
                                      e.target.innerHTML = '<div style="text-align: center; color: #d97706; font-size: 12px;"><div>📷</div><div>Failed to load</div></div>';
                                    }}
                                    onLoad={(e) => {
                                      console.log('✅ Image loaded successfully:', image.image_url);
                                      console.log('📐 Image dimensions:', e.target.naturalWidth + 'x' + e.target.naturalHeight);
                                      
                                      // Ensure proper display for small images
                                      if (e.target.naturalWidth <= 10 && e.target.naturalHeight <= 10) {
                                        console.warn('⚠️ Very small image detected, adjusting display');
                                        e.target.style.objectFit = 'none';
                                        e.target.style.imageRendering = 'pixelated';
                                        e.target.style.transform = 'scale(10)';
                                      }
                                    }}
                                  />
                                  
                                  {/* Hover overlay */}
                                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                                    <div className="bg-white bg-opacity-90 rounded-full p-2">
                                      <FiEye className="h-4 w-4 text-gray-700" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Image Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="text-sm font-semibold text-gray-800 capitalize">
                                    {image.image_type || 'Evidence'} Image
                                  </h5>
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                    {image.image_type || 'evidence'}
                                  </span>
                                </div>
                                
                                <div className="space-y-2 text-sm text-gray-600">
                                  <div className="flex items-center">
                                    <span className="font-medium mr-2">File ID:</span>
                                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">#{image.id}</span>
                                  </div>
                                  
                                  <div className="flex items-center">
                                    <span className="font-medium mr-2">Status:</span>
                                    <span className="text-green-600 font-medium">✓ Uploaded Successfully</span>
                                  </div>
                                  
                                  {image.created_at && (
                                    <div className="flex items-center">
                                      <span className="font-medium mr-2">Uploaded:</span>
                                      <span className="text-gray-600">{new Date(image.created_at).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex space-x-2 mt-3">
                                  <button
                                    onClick={() => window.open(image.image_url, '_blank')}
                                    className="inline-flex items-center px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium rounded-lg transition-colors duration-200"
                                  >
                                    <FiEye className="h-3 w-3 mr-1" />
                                    View Full Size
                                  </button>
                                  
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(image.image_url);
                                      toast.success('Image URL copied to clipboard');
                                    }}
                                    className="inline-flex items-center px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white text-xs font-medium rounded-lg transition-colors duration-200"
                                  >
                                    <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Copy URL
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Gallery Footer */}
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-yellow-700">
                          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">
                            {selectedDispute.images.length} evidence image{selectedDispute.images.length !== 1 ? 's' : ''} attached
                          </span>
                        </div>
                        <div className="text-yellow-600 text-xs">
                          Click any image to view in full resolution
                        </div>
                      </div>
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

                {selectedDispute.company_response && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Response</label>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedDispute.company_response}</p>
                      {selectedDispute.company_suggested_status && (
                        <p className="text-sm text-gray-500 mt-2">
                          Company suggested status: <span className="font-medium">{selectedDispute.company_suggested_status}</span>
                        </p>
                      )}
                      {selectedDispute.company_responded_at && (
                        <p className="text-sm text-gray-500 mt-1">
                          Responded on {new Date(selectedDispute.company_responded_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {selectedDispute.company_requested_status && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Status Change Request</label>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Requested Status:</strong> <span className="font-medium">{selectedDispute.company_requested_status}</span>
                      </p>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedDispute.company_status_reason}</p>
                      {selectedDispute.company_status_requested_at && (
                        <p className="text-sm text-gray-500 mt-2">
                          Requested on {new Date(selectedDispute.company_status_requested_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-between">
              <div>
                {selectedDispute.status === 'pending' && (
                  <div className="text-sm text-gray-600">
                    <FiClock className="inline mr-1" />
                    This dispute is waiting to be started by the company.
                  </div>
                )}
                {selectedDispute.status === 'running' && (
                  <div className="text-sm text-blue-600">
                    <FiAlertTriangle className="inline mr-1" />
                    This dispute is currently being worked on by the company.
                  </div>
                )}
                {selectedDispute.status === 'resolved' && (
                  <div className="text-sm text-green-600">
                    <FiCheckCircle className="inline mr-1" />
                    This dispute has been resolved by the company. Waiting for user confirmation.
                  </div>
                )}
                {selectedDispute.status === 'closed' && (
                  <div className="text-sm text-gray-600">
                    <FiCheckCircle className="inline mr-1" />
                    This dispute has been closed.
                  </div>
                )}
              </div>
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

      {/* Create Dispute Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-[#bca142] px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">File Dispute Against Platform</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-white hover:text-gray-200"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateDispute} className="p-6">
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> This dispute will be filed against the platform administration. 
                    Use this for issues related to billing, technical problems, policy concerns, or other platform-related matters.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dispute Reason *
                  </label>
                  <select
                    value={formData.dispute_reason_id}
                    onChange={(e) => setFormData({...formData, dispute_reason_id: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#bca142] focus:border-transparent"
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
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#bca142] focus:border-transparent"
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
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#bca142] focus:border-transparent"
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
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#bca142] focus:border-transparent"
                    rows="4"
                    placeholder="Provide detailed information about your concern with the platform..."
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#bca142] text-white rounded hover:bg-black transition-colors"
                >
                  File Dispute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Response & Status Change Modal */}
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
                    Please wait while we process your response
                  </p>
                </div>
              </div>
            )}
            
            <div className="bg-[#bca142] px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Respond & Update Status - Dispute #{selectedDispute.id}</h3>
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
                <p className="text-sm text-gray-700 mb-2"><strong>Filed by:</strong> {selectedDispute.user_name}</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Reason:</strong> {selectedDispute.reason_title}</p>
                <p className="text-sm text-gray-700 mb-2"><strong>Current Status:</strong> 
                  <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedDispute.status)}`}>
                    {selectedDispute.status}
                  </span>
                </p>
                <p className="text-sm text-gray-700"><strong>Description:</strong> {selectedDispute.description}</p>
              </div>

              <form onSubmit={handleResponse}>
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
                          : 'focus:ring-2 focus:ring-[#bca142] focus:border-transparent hover:border-gray-300'
                      }`}
                      required
                    >
                      <option value="pending">Pending</option>
                      <option value="running">Running</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {newStatus !== selectedDispute.status ? 
                        `Status will change from "${selectedDispute.status}" to "${newStatus}"` : 
                        'No status change'
                      }
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Response & Reason *
                    </label>
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      disabled={submitting}
                      className={`w-full p-3 border rounded-lg transition-all duration-200 ${
                        submitting 
                          ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                          : 'focus:ring-2 focus:ring-[#bca142] focus:border-transparent hover:border-gray-300'
                      }`}
                      rows="6"
                      placeholder="Provide your response to this dispute and explain any status changes. This message will be shared with the user."
                      required
                    />
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Your response and status change will be immediately applied and the user will be notified. 
                      Make sure to provide a clear explanation of your actions and any resolution steps taken.
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
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-[#bca142] hover:bg-black transform hover:scale-105 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                        <span className="animate-pulse">Processing...</span>
                      </>
                    ) : (
                      <>
                        <FiMessageSquare className="mr-2" size={18} />
                        Submit Response & Update Status
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

export default CompanyDisputes;