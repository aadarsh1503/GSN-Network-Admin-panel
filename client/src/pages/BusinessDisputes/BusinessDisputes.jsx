import { useState, useEffect } from 'react';
import { 
  FaExclamationTriangle, 
  FaEye, 
  FaPlus, 
  FaFilter, 
  FaSearch,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaComments,
  FaFileAlt,
  FaUser,
  FaBuilding,
  FaUpload,
  FaImage
} from 'react-icons/fa';
import { 
  AlertTriangle, 
  Eye, 
  Plus, 
  Filter,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  FileText,
  User,
  Building,
  Calendar,
  ArrowUpRight,
  Upload,
  Image as ImageIcon,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const BusinessDisputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [disputeReasons, setDisputeReasons] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [formData, setFormData] = useState({
    company_id: '',
    dispute_reason_id: '',
    title: '',
    description: '',
    priority: 'medium'
  });

  useEffect(() => {
    // Check if user is authenticated and has proper role
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    console.log('🔍 BusinessDisputes - Authentication Check:');
    console.log('🔑 Token exists:', token ? 'Yes' : 'No');
    console.log('👤 User data:', user);
    console.log('🏢 User role:', user.role);
    
    if (!token) {
      console.log('❌ No token found - showing error instead of redirecting');
      toast.error('Please login first to access business disputes');
      return;
    }
    
    // Check if user is a business user
    if (user.role !== 'business') {
      console.log('❌ User is not a business user - showing error instead of redirecting');
      toast.error('Access denied. Business account required.');
      return;
    }
    
    console.log('✅ Authentication passed, loading data...');
    fetchDisputes();
    fetchCompanies();
    fetchDisputeReasons();
  }, []);

  const fetchDisputes = async () => {
    try {
      // For business users, only fetch disputes they have filed against companies
      const response = await api.get('/api/disputes/my-disputes');
      
      const disputesData = response || [];
      
      // Transform API response to match component structure
      const transformedDisputes = disputesData.map(dispute => {
        return {
          id: dispute.id,
          title: dispute.title,
          description: dispute.description,
          status: dispute.status,
          priority: dispute.priority || 'medium',
          category: dispute.reason_title || 'other',
          quoteId: dispute.quote_id || null,
          companyName: dispute.company_name, // Company we filed against
          createdAt: dispute.created_at,
          updatedAt: dispute.updated_at,
          responseCount: dispute.response_count || 0,
          attachments: dispute.images ? dispute.images.length : 0,
          estimatedResolution: dispute.estimated_resolution || dispute.created_at,
          images: dispute.images || []
        };
      });
      
      setDisputes(transformedDisputes);
    } catch (error) {
      console.error('❌ Error fetching disputes:', error);
      
      // Check if it's an authentication error
      if (error.response?.status === 401 || error.message?.includes('token')) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      
      toast.error('Failed to load disputes');
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      // For businesses, get companies they have actually worked with (similar to user disputes logic)
      const response = await api.get('/api/business/companies');
      setCompanies(response || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      
      // Check if it's an authentication error
      if (error.response?.status === 401 || error.message?.includes('token')) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      
      setCompanies([]);
    }
  };

  const fetchDisputeReasons = async () => {
    try {
      const response = await api.get('/api/disputes/reasons');
      setDisputeReasons(response || []);
    } catch (error) {
      console.error('Error fetching dispute reasons:', error);
      
      // Check if it's an authentication error
      if (error.response?.status === 401 || error.message?.includes('token')) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      
      setDisputeReasons([]);
    }
  };

  const handleCreateDispute = async (e) => {
    e.preventDefault();
    
    console.log('🚀 Starting dispute creation process...');
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

      toast.success('Business dispute filed successfully');
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
      await fetchDisputes();
      
    } catch (error) {
      console.error('❌ Error creating dispute:', error);
      console.error('Error details:', error);
      
      // Show error but DON'T redirect automatically
      if (error.message?.includes('Authentication failed') || error.message?.includes('token') || error.message?.includes('expired')) {
        toast.error('Authentication error: ' + error.message + ' - Please check your login status');
        console.log('🔒 Authentication error - showing error instead of redirecting');
      } else {
        toast.error(error.message || 'Failed to file dispute');
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

  const handleViewDetails = (dispute) => {
    setSelectedDispute(dispute);
    setShowDetailsModal(true);
  };

  // Removed complex messaging functions for now - keeping it simple

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <Clock className="text-orange-500" />;
      case 'investigating': return <AlertTriangle className="text-yellow-500" />;
      case 'resolved': return <CheckCircle2 className="text-green-500" />;
      case 'closed': return <XCircle className="text-gray-500" />;
      default: return <Clock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'investigating': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      case 'medium': return 'border-l-blue-500 bg-blue-50';
      case 'low': return 'border-l-gray-500 bg-gray-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-blue-100 text-blue-800 border-blue-200',
      low: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colors[priority]}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const getCategoryLabel = (category) => {
    const labels = {
      delivery_delay: 'Delivery Delay',
      damage_claim: 'Damage Claim',
      documentation: 'Documentation',
      billing: 'Billing Issue',
      service_quality: 'Service Quality',
      other: 'Other'
    };
    return labels[category] || category;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredDisputes = disputes.filter(dispute => {
    const matchesSearch = dispute.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dispute.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dispute.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || dispute.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-slate-700">Loading disputes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 rounded-xl p-6 border border-yellow-200/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent mb-2">
              Business Disputes
            </h1>
            <p className="text-slate-600">File and manage disputes against logistics companies</p>
            <div className="flex items-center space-x-4 mt-3">
              <div className="flex items-center space-x-2 bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600">Business Support</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full">
                <Building className="h-3 w-3 text-yellow-600" />
                <span className="text-sm text-yellow-700">{disputes.length} Active Cases</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="h-4 w-4" />
              <span>File Dispute</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['open', 'investigating', 'resolved', 'closed'].map((status) => {
          const count = disputes.filter(d => d.status === status).length;
          const percentage = disputes.length > 0 ? ((count / disputes.length) * 100).toFixed(1) : 0;
          
          return (
            <div
              key={status}
              className={`bg-white/80 backdrop-blur-lg rounded-xl p-5 border transition-all duration-300 hover:shadow-xl cursor-pointer transform hover:scale-105 ${
                filter === status ? 'ring-2 ring-blue-500 border-blue-200' : 'border-white/20'
              }`}
              onClick={() => setFilter(filter === status ? 'all' : status)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-3 rounded-xl ${getStatusColor(status).replace('text-', 'bg-').replace('bg-', 'bg-').replace('-800', '-100').replace('-100', '-500')} text-white`}>
                  {getStatusIcon(status)}
                </div>
                <span className="text-2xl font-bold text-slate-800">{count}</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 capitalize mb-1">{status}</h3>
              <p className="text-sm text-slate-600">{percentage}% of total</p>
            </div>
          );
        })}
      </div>

      {/* Filters and Search */}
      <div className="bg-white/80 backdrop-blur-lg rounded-xl p-5 shadow-lg border border-white/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search disputes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-600">Filter:</span>
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Disputes Table */}
      <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 overflow-hidden">
        {filteredDisputes.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gradient-to-br from-yellow-100 to-amber-200 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <Building className="text-yellow-600 h-16 w-16" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">
              {searchTerm || filter !== 'all' ? 'No disputes match your criteria' : 'No disputes filed yet'}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'You haven\'t filed any disputes against logistics companies yet.'
              }
            </p>
            {(!searchTerm && filter === 'all') && (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="h-4 w-4" />
                <span>File Business Dispute</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-yellow-50 to-amber-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Dispute</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Title & Description</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Company</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Priority</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Responses</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Attachments</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Created</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredDisputes.map((dispute) => (
                  <tr key={dispute.id} className="hover:bg-gradient-to-r hover:from-yellow-50/50 hover:to-amber-50/50 transition-all duration-300">
                    {/* Dispute Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${getStatusColor(dispute.status).replace('text-', 'bg-').replace('bg-', 'bg-').replace('-800', '-100').replace('-100', '-500')} text-white`}>
                          {getStatusIcon(dispute.status)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">Dispute #{dispute.id}</div>
                          {dispute.quoteId && dispute.quoteId !== null && (
                            <div className="text-xs text-slate-500">Quote #{dispute.quoteId}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Title & Description */}
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm font-semibold text-slate-800 mb-1" title={dispute.title}>
                          {dispute.title}
                        </div>
                        <div className="text-xs text-slate-600 truncate" title={dispute.description}>
                          {dispute.description}
                        </div>
                      </div>
                    </td>

                    {/* Company */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-slate-800">{dispute.companyName}</span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700">{getCategoryLabel(dispute.category)}</span>
                    </td>

                    {/* Priority */}
                    <td className="px-6 py-4">
                      {getPriorityBadge(dispute.priority)}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(dispute.status)}`}>
                        {getStatusIcon(dispute.status)}
                        <span className="capitalize">{dispute.status}</span>
                      </span>
                    </td>

                    {/* Responses */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                        <span className="text-lg font-bold text-slate-800">{dispute.responseCount}</span>
                      </div>
                    </td>

                    {/* Attachments */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-purple-500" />
                        <span className="text-lg font-bold text-slate-800">{dispute.attachments}</span>
                      </div>
                    </td>

                    {/* Created */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-700">
                        {formatDate(dispute.createdAt)}
                      </div>
                      <div className="text-xs text-slate-500">
                        Est. Resolution: {new Date(dispute.estimatedResolution).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleViewDetails(dispute)}
                        className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium hover:underline"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredDisputes.length > 0 && (
        <div className="flex justify-center">
          <div className="bg-white/80 backdrop-blur-lg rounded-xl px-6 py-3 border border-white/20">
            <span className="text-sm text-slate-600">
              Showing {filteredDisputes.length} of {disputes.length} disputes
            </span>
          </div>
        </div>
      )}

      {/* Create Business Dispute Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            {/* Loading Overlay */}
            {(submitting || uploadingFiles) && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-lg font-medium text-gray-700 animate-pulse">
                    {uploadingFiles ? 'Uploading attachments...' : 'Filing your business dispute...'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {uploadingFiles ? 'Please wait while we upload your files' : 'Please wait while we process your request'}
                  </p>
                </div>
              </div>
            )}
            
            <div className="bg-gradient-to-r from-yellow-500 to-amber-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">File Business Dispute</h3>
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
                <XCircle size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateDispute} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logistics Company *
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
                        placeholder="Search for a logistics company..."
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
                    {showCompanyDropdown && !submitting && !uploadingFiles && (
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
                          disabled={submitting || uploadingFiles}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dispute Category *
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
                    <option value="">Select dispute category</option>
                    {disputeReasons.map(reason => (
                      <option key={reason.id} value={reason.id}>{reason.title}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dispute Title *
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
                    placeholder="Brief summary of the business issue"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority Level
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
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Detailed Description *
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
                    placeholder="Provide detailed information about the business dispute, including dates, quote numbers, and specific issues..."
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
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 transform hover:scale-105 shadow-lg hover:shadow-xl'
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
                      <Building className="mr-2" size={18} />
                      File Business Dispute
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
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Dispute Details #{selectedDispute.id}</h3>
              <button 
                onClick={() => setShowDetailsModal(false)}
                className="text-white hover:text-gray-200 transition-all duration-200"
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Basic Info */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Basic Information</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedDispute.status)}`}>
                          {selectedDispute.status.charAt(0).toUpperCase() + selectedDispute.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Priority:</span>
                        {getPriorityBadge(selectedDispute.priority)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Category:</span>
                        <span className="text-sm font-medium text-gray-800">{getCategoryLabel(selectedDispute.category)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Filed Against:</span>
                        <span className="text-sm font-medium text-gray-800">{selectedDispute.companyName}</span>
                      </div>
                      {selectedDispute.quoteId && selectedDispute.quoteId !== null && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Quote ID:</span>
                          <span className="text-sm font-medium text-gray-800">#{selectedDispute.quoteId}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Timeline</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Created:</span>
                        <span className="text-sm text-gray-800">{formatDate(selectedDispute.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Last Updated:</span>
                        <span className="text-sm text-gray-800">{formatDate(selectedDispute.updatedAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Est. Resolution:</span>
                        <span className="text-sm text-gray-800">{formatDate(selectedDispute.estimatedResolution)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Description and Attachments */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Description</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-800 mb-2">{selectedDispute.title}</h5>
                      <p className="text-sm text-gray-600 leading-relaxed">{selectedDispute.description}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Statistics</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600">{selectedDispute.responseCount}</div>
                        <div className="text-xs text-blue-600">Responses</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-purple-600">{selectedDispute.attachments}</div>
                        <div className="text-xs text-purple-600">Attachments</div>
                      </div>
                    </div>
                  </div>

                  {/* Attachments */}
                  {selectedDispute.images && selectedDispute.images.length > 0 && (
                    <div>
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

              {/* Actions */}
              <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-all duration-200"
                >
                  Close
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all duration-200"
                  onClick={() => {
                    toast.info('Response functionality will be added later');
                  }}
                >
                  Respond to Dispute
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessDisputes;