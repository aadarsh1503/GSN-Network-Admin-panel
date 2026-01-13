import React, { useState, useEffect } from 'react';
import { FiPlus, FiEye, FiClock, FiCheckCircle, FiAlertTriangle, FiImage, FiX, FiSearch, FiUpload, FiFileText } from 'react-icons/fi';
import { Building, Search, CheckCircle2, X, Upload, Image as ImageIcon, Eye, FileText } from 'lucide-react';
import { api } from '../../utils/api';
import { toast } from 'react-hot-toast';

const UserDisputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [disputeReasons, setDisputeReasons] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [closingDispute, setClosingDispute] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [closeFeedback, setCloseFeedback] = useState('');
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [attachments, setAttachments] = useState([]);
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
    
    console.log('🚀 Starting user dispute creation process...');
    console.log('📋 Form data:', formData);
    console.log('📁 Attachments:', attachments.map(f => ({ name: f.name, size: f.size, type: f.type })));
    
    if (!formData.company_id || !formData.dispute_reason_id || !formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      console.error('❌ Missing required fields:', {
        company_id: formData.company_id,
        dispute_reason_id: formData.dispute_reason_id,
        title: formData.title,
        description: formData.description
      });
      return;
    }

    setSubmitting(true);

    try {
      console.log('📝 Creating dispute...');
      
      // Create dispute first
      const disputeResponse = await api.post('/api/disputes/create', formData);
      console.log('✅ Dispute creation response:', disputeResponse);
      
      const disputeId = disputeResponse.disputeId;
      console.log('🆔 Dispute ID:', disputeId);

      // Upload attachments if any
      if (attachments.length > 0 && disputeId) {
        console.log(`📤 Starting file upload for ${attachments.length} files...`);
        setUploadingFiles(true);
        await uploadAttachments(disputeId);
      } else {
        console.log('📝 No attachments to upload');
      }

      toast.success('Dispute created successfully');
      console.log('✅ Dispute creation completed successfully');
      
      setShowCreateModal(false);
      setFormData({
        company_id: '',
        dispute_reason_id: '',
        title: '',
        description: '',
        priority: 'medium'
      });
      setAttachments([]);
      setCompanySearchTerm('');
      setShowCompanyDropdown(false);
      
      // Refresh disputes data
      console.log('🔄 Refreshing disputes list...');
      await fetchUserDisputes();
      
    } catch (error) {
      console.error('❌ Error creating dispute:', error);
      console.error('Error details:', error);
      
      // Show error but DON'T redirect automatically
      if (error.message?.includes('Authentication failed') || error.message?.includes('token') || error.message?.includes('expired')) {
        toast.error('Authentication error: ' + error.message + ' - Please check your login status');
        console.log('🔒 Authentication error - showing error instead of redirecting');
      } else {
        toast.error(error.message || 'Failed to create dispute');
      }
    } finally {
      setSubmitting(false);
      setUploadingFiles(false);
    }
  };

  const uploadAttachments = async (disputeId) => {
    try {
      console.log(`🔄 Starting upload process for ${attachments.length} attachment(s)...`);
      console.log(`📋 Dispute ID: ${disputeId}`);
      console.log(`📁 Files to upload:`, attachments.map(f => ({ 
        name: f.name, 
        size: f.size, 
        type: f.type,
        lastModified: f.lastModified
      })));
      
      let uploadedCount = 0;
      
      for (const file of attachments) {
        try {
          console.log(`📤 Processing file: ${file.name}`);
          console.log(`📊 File details:`, {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
          });
          
          // Validate file before upload
          if (!file.type.startsWith('image/')) {
            console.error('❌ File is not an image:', file.type);
            toast.error(`${file.name} is not an image file`);
            continue;
          }
          
          if (file.size > 1 * 1024 * 1024) {
            console.error('❌ File too large:', file.size);
            toast.error(`${file.name} is too large (max 1MB)`);
            continue;
          }
          
          console.log('✅ File validation passed');
          
          // Create FormData for file upload
          const formData = new FormData();
          formData.append('image', file);
          
          console.log('📋 FormData created');
          console.log('🔑 Token check:', localStorage.getItem('token') ? 'Token exists' : 'No token');
          
          console.log('📡 Making upload request to /api/upload/image...');
          
          // Upload to server endpoint using api utility
          const uploadResponse = await api.post('/api/upload/image', formData);
          
          console.log('✅ Upload response received:', uploadResponse);
          
          if (uploadResponse && uploadResponse.url) {
            console.log(`📎 Upload successful, saving attachment to dispute...`);
            console.log(`🔗 Image URL: ${uploadResponse.url}`);
            
            // Save attachment info to database
            const attachmentData = {
              dispute_id: disputeId,
              image_url: uploadResponse.url,
              image_type: 'evidence'
            };
            
            console.log('💾 Attachment data to save:', attachmentData);
            
            const attachmentResponse = await api.post('/api/disputes/attachments', attachmentData);
            
            console.log('✅ Attachment saved to database:', attachmentResponse);
            uploadedCount++;
          } else {
            console.error('❌ No URL in upload response:', uploadResponse);
            toast.error(`Failed to upload ${file.name}: No URL returned`);
          }
        } catch (fileError) {
          console.error(`❌ Error uploading file ${file.name}:`, fileError);
          console.error('📋 Error details:', {
            message: fileError.message,
            stack: fileError.stack,
            response: fileError.response
          });
          toast.error(`Failed to upload ${file.name}: ${fileError.message}`);
        }
      }
      
      if (uploadedCount > 0) {
        toast.success(`${uploadedCount} attachment(s) uploaded successfully`);
        console.log(`✅ Successfully uploaded ${uploadedCount} out of ${attachments.length} files`);
      } else {
        toast.error('Failed to upload attachments');
        console.error('❌ No files were uploaded successfully');
      }
      
    } catch (error) {
      console.error('❌ Error in uploadAttachments function:', error);
      console.error('📋 Function error details:', {
        message: error.message,
        stack: error.stack
      });
      toast.error('Error uploading attachments: ' + error.message);
    }
  };

  const handleFileSelect = (e) => {
    console.log('📁 File selection triggered...');
    
    const files = Array.from(e.target.files);
    console.log('📋 Selected files:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
    
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    console.log('🖼️ Image files:', imageFiles.map(f => ({ name: f.name, size: f.size, type: f.type })));
    
    if (imageFiles.length !== files.length) {
      toast.error('Only image files are allowed');
      console.error('❌ Non-image files detected');
      return;
    }
    
    // Only allow 1 file
    if (imageFiles.length > 1) {
      toast.error('Only 1 attachment allowed');
      console.error('❌ Too many files selected:', imageFiles.length);
      return;
    }
    
    // Check file size limit (1MB per file)
    const oversizedFiles = imageFiles.filter(file => file.size > 1 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`File size limit exceeded. Maximum 1MB per file.`);
      console.error('❌ Oversized files:', oversizedFiles.map(f => ({ name: f.name, size: f.size })));
      return;
    }
    
    console.log('✅ File validation passed');
    setAttachments(imageFiles);
    console.log('📁 Attachments state updated:', imageFiles.map(f => ({ name: f.name, size: f.size })));
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
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

  // Filter companies based on search term
  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(companySearchTerm.toLowerCase()) ||
    company.email?.toLowerCase().includes(companySearchTerm.toLowerCase()) ||
    company.id.toString().includes(companySearchTerm)
  );

  // Get selected company name for display
  const getSelectedCompanyName = () => {
    const selectedCompany = companies.find(c => c.id.toString() === formData.company_id);
    return selectedCompany ? selectedCompany.name : '';
  };

  // Handle company selection
  const handleCompanySelect = (company) => {
    setFormData({...formData, company_id: company.id.toString()});
    setCompanySearchTerm('');
    setShowCompanyDropdown(false);
  };

  // Clear company selection
  const clearCompanySelection = () => {
    setFormData({...formData, company_id: ''});
    setCompanySearchTerm('');
    setShowCompanyDropdown(false);
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
            {(submitting || uploadingFiles) && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-lg font-medium text-gray-700 animate-pulse">
                    {uploadingFiles ? 'Uploading attachments...' : 'Filing your dispute...'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {uploadingFiles ? 'Please wait while we upload your files' : 'Please wait while we process your request'}
                  </p>
                </div>
              </div>
            )}
            
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">File New Dispute</h3>
              <button 
                onClick={() => {
                  if (!submitting && !uploadingFiles) {
                    setShowCreateModal(false);
                    setCompanySearchTerm('');
                    setShowCompanyDropdown(false);
                  }
                }}
                disabled={submitting || uploadingFiles}
                className={`text-white transition-all duration-200 ${
                  (submitting || uploadingFiles) ? 'opacity-50 cursor-not-allowed' : 'hover:text-gray-200'
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
                  <div className="relative">
                    {/* Selected Company Display / Search Input */}
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.company_id ? getSelectedCompanyName() : companySearchTerm}
                        onChange={(e) => {
                          setCompanySearchTerm(e.target.value);
                          setShowCompanyDropdown(true);
                          if (formData.company_id) {
                            // Clear selection when user starts typing
                            setFormData({...formData, company_id: ''});
                          }
                        }}
                        onFocus={() => setShowCompanyDropdown(true)}
                        disabled={submitting || uploadingFiles}
                        className={`w-full p-3 pr-10 border rounded-lg transition-all duration-200 ${
                          (submitting || uploadingFiles)
                            ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                            : 'focus:ring-2 focus:ring-yellow-500 focus:border-transparent hover:border-yellow-300'
                        }`}
                        placeholder="Search for a company you've worked with..."
                        required
                      />
                      
                      {/* Search/Clear Icon */}
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {formData.company_id ? (
                          <button
                            type="button"
                            onClick={clearCompanySelection}
                            className="text-gray-400 hover:text-gray-600"
                            disabled={submitting || uploadingFiles}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        ) : (
                          <Search className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Dropdown List */}
                    {showCompanyDropdown && !submitting && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredCompanies.length > 0 ? (
                          <>
                            {/* Results Count */}
                            <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b">
                              {filteredCompanies.length} compan{filteredCompanies.length !== 1 ? 'ies' : 'y'} found
                              {companySearchTerm && ` for "${companySearchTerm}"`}
                            </div>
                            
                            {/* Company List */}
                            {filteredCompanies.map((company) => (
                              <div
                                key={company.id}
                                onClick={() => handleCompanySelect(company)}
                                className="px-3 py-3 hover:bg-yellow-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <Building className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                          {company.name}
                                        </p>
                                        {company.email && (
                                          <p className="text-xs text-gray-500 truncate">
                                            {company.email}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0 ml-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      ID: {company.id}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Additional company info if available */}
                                {(company.city || company.country) && (
                                  <div className="mt-1 flex items-center text-xs text-gray-400">
                                    <span>📍 {[company.city, company.country].filter(Boolean).join(', ')}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </>
                        ) : (
                          <div className="px-3 py-4 text-center text-gray-500">
                            <Building className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm">No companies found</p>
                            {companySearchTerm && (
                              <p className="text-xs mt-1">
                                Try adjusting your search term "{companySearchTerm}"
                              </p>
                            )}
                            <p className="text-xs mt-2 text-gray-400">
                              Only companies you've worked with are shown
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Click outside to close dropdown */}
                    {showCompanyDropdown && (
                      <div
                        className="fixed inset-0 z-0"
                        onClick={() => setShowCompanyDropdown(false)}
                      />
                    )}
                  </div>
                  
                  {/* Selected Company Info */}
                  {formData.company_id && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-700">
                            Selected: <span className="font-medium">{getSelectedCompanyName()}</span>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={clearCompanySelection}
                          className="text-gray-400 hover:text-gray-600"
                          disabled={submitting}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dispute Reason *
                  </label>
                  <select
                    value={formData.dispute_reason_id}
                    onChange={(e) => setFormData({...formData, dispute_reason_id: e.target.value})}
                    disabled={submitting || uploadingFiles}
                    className={`w-full p-2 border rounded transition-all duration-200 ${
                      (submitting || uploadingFiles) 
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
                    disabled={submitting || uploadingFiles}
                    className={`w-full p-2 border rounded transition-all duration-200 ${
                      (submitting || uploadingFiles) 
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
                    disabled={submitting || uploadingFiles}
                    className={`w-full p-2 border rounded transition-all duration-200 ${
                      (submitting || uploadingFiles) 
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
                    disabled={submitting || uploadingFiles}
                    className={`w-full p-2 border rounded transition-all duration-200 ${
                      (submitting || uploadingFiles) 
                        ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                        : 'focus:ring-2 focus:ring-yellow-500 focus:border-transparent hover:border-yellow-300'
                    }`}
                    rows="4"
                    placeholder="Provide detailed information about the dispute..."
                    required
                  />
                </div>

                {/* File Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attachments (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <div className="text-center">
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-2">
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            Upload images
                          </span>
                          <span className="mt-1 block text-xs text-gray-500">
                            PNG, JPG, GIF up to 1MB (Max 1 file)
                          </span>
                        </label>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleFileSelect}
                          disabled={submitting || uploadingFiles}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Selected Files Preview */}
                  {attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Selected files:</p>
                      <div className="grid grid-cols-1 gap-2">
                        {attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <div className="flex items-center space-x-2">
                              <ImageIcon className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-700 truncate">{file.name}</span>
                              <span className="text-xs text-gray-500">
                                ({(file.size / (1024 * 1024)).toFixed(1)}MB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              className="text-red-500 hover:text-red-700"
                              disabled={submitting || uploadingFiles}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    if (!submitting && !uploadingFiles) {
                      setShowCreateModal(false);
                      setCompanySearchTerm('');
                      setShowCompanyDropdown(false);
                    }
                  }}
                  disabled={submitting || uploadingFiles}
                  className={`px-4 py-2 text-white rounded transition-all duration-200 ${
                    (submitting || uploadingFiles)
                      ? 'bg-gray-400 cursor-not-allowed opacity-60' 
                      : 'bg-gray-500 hover:bg-gray-600'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingFiles}
                  className={`px-6 py-3 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center min-w-[180px] ${
                    (submitting || uploadingFiles)
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 transform hover:scale-105 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {(submitting || uploadingFiles) ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      <span className="animate-pulse">
                        {uploadingFiles ? 'Uploading...' : 'Filing...'}
                      </span>
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

                {/* Attachments Display */}
                {selectedDispute.images && selectedDispute.images.length > 0 && (
                  <div className="md:col-span-2">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <ImageIcon className="mr-2 h-5 w-5 text-yellow-600" />
                      Attachments ({selectedDispute.images.length})
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
                                    className="w-full h-full object-contain bg-white"
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
                                    style={{ cursor: 'pointer' }}
                                  />
                                  
                                  {/* Hover overlay */}
                                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                                    <div className="bg-white bg-opacity-90 rounded-full p-2">
                                      <Eye className="h-4 w-4 text-gray-700" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Image Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="text-sm font-semibold text-gray-800 capitalize">
                                    {image.image_type} Image
                                  </h5>
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                    {image.image_type}
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
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex space-x-2 mt-3">
                                  <button
                                    onClick={() => window.open(image.image_url, '_blank')}
                                    className="inline-flex items-center px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium rounded-lg transition-colors duration-200"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View Full Size
                                  </button>
                                  
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(image.image_url);
                                      toast.success('Image URL copied to clipboard');
                                    }}
                                    className="inline-flex items-center px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white text-xs font-medium rounded-lg transition-colors duration-200"
                                  >
                                    <FileText className="h-3 w-3 mr-1" />
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
                          <ImageIcon className="h-4 w-4 mr-2" />
                          <span className="font-medium">
                            {selectedDispute.images.length} attachment{selectedDispute.images.length !== 1 ? 's' : ''} uploaded
                          </span>
                        </div>
                        <div className="text-yellow-600 text-xs">
                          Click any image to view in full resolution
                        </div>
                      </div>
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