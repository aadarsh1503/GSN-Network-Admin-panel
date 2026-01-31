import { useState, useEffect } from 'react';
import { 
  FiEye, FiClock, FiCheckCircle, FiAlertTriangle, FiMessageSquare, 
  FiUser, FiX, FiTrash2, FiEdit, FiSearch, FiFilter, FiRefreshCw,
  FiUsers, FiBriefcase, FiHome, FiShield, FiZap, FiTrendingUp
} from 'react-icons/fi';
import { api } from '../../utils/api';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '../../components/Modal/ConfirmationModal';

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
  
  // Enhanced search and filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [disputeToDelete, setDisputeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteDispute = async () => {
    if (!disputeToDelete) return;
    
    try {
      setIsDeleting(true);
      await api.delete(`/api/disputes/admin/${disputeToDelete.id}`);
      
      // Remove from local state
      setDisputes(prev => prev.filter(dispute => dispute.id !== disputeToDelete.id));
      
      toast.success('Dispute deleted successfully');
      setShowDeleteModal(false);
      setDisputeToDelete(null);
    } catch (error) {
      console.error('Error deleting dispute:', error);
      toast.error('Failed to delete dispute');
    } finally {
      setIsDeleting(false);
    }
  };

  const getUserTypeIcon = (role) => {
    switch (role) {
      case 'user':
        return <FiUser className="text-blue-500" />;
      case 'business':
        return <FiBriefcase className="text-purple-500" />;
      case 'company':
        return <FiHome className="text-green-500" />;
      case 'admin':
        return <FiShield className="text-red-500" />;
      default:
        return <FiUser className="text-gray-500" />;
    }
  };

  const getUserTypeBadge = (role) => {
    const configs = {
      user: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Regular User' },
      business: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Business Owner' },
      company: { bg: 'bg-green-100', text: 'text-green-800', label: 'Company Member' },
      admin: { bg: 'bg-red-100', text: 'text-red-800', label: 'Admin' }
    };
    
    const config = configs[role] || { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Unknown' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {getUserTypeIcon(role)}
        <span className="ml-1">{config.label}</span>
      </span>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'running':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiClock className="text-yellow-600" />;
      case 'running':
        return <FiZap className="text-blue-600" />;
      case 'resolved':
        return <FiCheckCircle className="text-green-600" />;
      case 'closed':
        return <FiCheckCircle className="text-gray-600" />;
      default:
        return <FiClock className="text-gray-600" />;
    }
  };

  const filteredDisputes = disputes.filter(dispute => {
    // Status filter
    const statusMatch = filter === 'all' || dispute.status === filter;
    
    // User type filter
    const userTypeMatch = userTypeFilter === 'all' || 
      dispute.user_role === userTypeFilter || 
      dispute.company_role === userTypeFilter;
    
    // Priority filter
    const priorityMatch = priorityFilter === 'all' || dispute.priority === priorityFilter;
    
    // Search filter
    const searchMatch = !searchTerm || 
      dispute.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.reason_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.id?.toString().includes(searchTerm);
    
    return statusMatch && userTypeMatch && priorityMatch && searchMatch;
  });

  // Sort disputes
  const sortedDisputes = [...filteredDisputes].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'created_at') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedDisputes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDisputes = sortedDisputes.slice(startIndex, endIndex);

  const getFilterCounts = () => {
    return {
      all: disputes.length,
      pending: disputes.filter(d => d.status === 'pending').length,
      running: disputes.filter(d => d.status === 'running').length,
      resolved: disputes.filter(d => d.status === 'resolved').length,
      closed: disputes.filter(d => d.status === 'closed').length,
    };
  };

  const getUserTypeCounts = () => {
    return {
      all: disputes.length,
      user: disputes.filter(d => d.user_role === 'user' || d.company_role === 'user').length,
      business: disputes.filter(d => d.user_role === 'business' || d.company_role === 'business').length,
      company: disputes.filter(d => d.user_role === 'company' || d.company_role === 'company').length,
      admin: disputes.filter(d => d.user_role === 'admin' || d.company_role === 'admin').length,
    };
  };

  const counts = getFilterCounts();
  const userTypeCounts = getUserTypeCounts();

  const handleOpenChat = (dispute) => {
    // Admin can chat with either user or company
    // For now, let's default to the user who filed the dispute
    const recipientId = dispute.user_id;
    const recipientName = dispute.user_name;
    
    // Navigate to admin messages page with the recipient
    window.location.href = `/admin/messages?recipient=${recipientId}&name=${encodeURIComponent(recipientName)}`;
  };

  const resetFilters = () => {
    setFilter('all');
    setUserTypeFilter('all');
    setPriorityFilter('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#bca142]/10">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#bca142]/30 border-t-[#bca142] mx-auto"></div>
            <FiZap className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#bca142] animate-pulse" size={24} />
          </div>
          <p className="mt-4 text-lg font-medium text-gray-700 animate-pulse">Loading Disputes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#bca142]/10 p-3">
      <div className="max-w-6xl mx-auto">
        {/* Compact Header */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-4 mb-4">
          <div className="flex flex-col lg:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-2 lg:mb-0">
              <div className="p-2 bg-[#bca142] rounded-lg">
                <FiShield className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-black">
                  Admin Disputes
                </h1>
                <p className="text-gray-600 text-sm">Manage disputes</p>
              </div>
            </div>
            <button 
              onClick={fetchDisputes}
              className="flex items-center space-x-2 bg-[#bca142] text-white font-semibold py-2 px-4 rounded-lg hover:bg-black transition-all duration-300 shadow-lg text-sm"
            >
              <FiRefreshCw size={16} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Compact Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Total', value: counts.all, icon: FiUsers, color: 'bg-[#bca142]' },
            { label: 'Pending', value: counts.pending, icon: FiClock, color: 'bg-[#bca142]' },
            { label: 'Running', value: counts.running, icon: FiZap, color: 'bg-[#bca142]' },
            { label: 'Resolved', value: counts.resolved, icon: FiCheckCircle, color: 'bg-[#bca142]' }
          ].map((stat, index) => (
            <div key={index} className="bg-white/80 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-3 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-2 ${stat.color} rounded-lg`}>
                  <stat.icon className="text-white" size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Compact Filters */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-4 mb-4">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-3 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search disputes..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-3 py-2 bg-white/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300 text-sm"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center space-x-2">
              <select
                value={userTypeFilter}
                onChange={(e) => { setUserTypeFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 bg-white/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bca142] transition-all duration-300 text-sm"
              >
                <option value="all">All Users</option>
                <option value="user">Users</option>
                <option value="business">Business</option>
                <option value="company">Company</option>
                <option value="admin">Admin</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 bg-white/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bca142] transition-all duration-300 text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="px-3 py-2 bg-white/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bca142] transition-all duration-300 text-sm"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>

              <button
                onClick={resetFilters}
                className="flex items-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-300 text-sm"
              >
                <FiX size={14} />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Disputes Table */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 overflow-hidden">
          {sortedDisputes.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-3 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FiCheckCircle className="text-gray-400" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No Matching Disputes' : (filter === 'all' ? 'No Disputes Found' : `No ${filter} Disputes`)}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto text-sm">
                {searchTerm 
                  ? `No disputes match your search criteria "${searchTerm}"`
                  : (filter === 'all' 
                    ? 'The dispute center is currently empty.'
                    : `There are no ${filter} disputes at the moment.`
                  )
                }
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#bca142]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Dispute Info</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Filed By</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Against</th>
                      {/* <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Reason</th> */}
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Priority</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Created</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedDisputes.map((dispute, index) => (
                      <tr key={dispute.id} className="hover:bg-[#bca142]/10 transition-all duration-300">
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <div className="p-1.5 bg-[#bca142]/20 rounded-lg">
                              {getStatusIcon(dispute.status)}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-gray-900">#{dispute.id}</div>
                              <div className="text-xs text-gray-600 max-w-xs truncate font-medium">{dispute.title}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <div className="p-1.5 bg-[#bca142]/20 rounded-lg">
                              {getUserTypeIcon(dispute.user_role)}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-900">{dispute.user_name}</div>
                              <div className="text-xs text-gray-500 mb-1">{dispute.user_email}</div>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                dispute.user_role === 'user' ? 'bg-blue-100 text-blue-800' :
                                dispute.user_role === 'business' ? 'bg-purple-100 text-purple-800' :
                                dispute.user_role === 'company' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {dispute.user_role === 'user' ? 'User' :
                                 dispute.user_role === 'business' ? 'Biz' :
                                 dispute.user_role === 'company' ? 'Co' : 'Admin'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <div className="p-1.5 bg-[#bca142]/20 rounded-lg">
                              {getUserTypeIcon(dispute.company_role)}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-900">{dispute.company_name}</div>
                              <div className="text-xs text-gray-500 mb-1">{dispute.company_email}</div>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                dispute.company_role === 'user' ? 'bg-blue-100 text-blue-800' :
                                dispute.company_role === 'business' ? 'bg-purple-100 text-purple-800' :
                                dispute.company_role === 'company' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {dispute.company_role === 'user' ? 'User' :
                                 dispute.company_role === 'business' ? 'Biz' :
                                 dispute.company_role === 'company' ? 'Co' : 'Admin'}
                              </span>
                            </div>
                          </div>
                        </td>
                        {/* <td className="px-4 py-3">
                          <div className="text-xs font-medium text-gray-900 bg-gray-50 px-2 py-1 rounded-lg">
                            {dispute.reason_title}
                          </div>
                        </td> */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-bold rounded-full ${getPriorityColor(dispute.priority)}`}>
                            <FiTrendingUp className="mr-1" size={10} />
                            {dispute.priority.charAt(0).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-bold rounded-full ${getStatusColor(dispute.status)}`}>
                            {getStatusIcon(dispute.status)}
                            <span className="ml-1">{dispute.status.charAt(0).toUpperCase()}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-medium text-gray-900">
                            {new Date(dispute.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(dispute.created_at).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => {
                                setSelectedDispute(dispute);
                                setShowDetailsModal(true);
                              }}
                              className="p-1.5 bg-black text-white rounded-lg hover:bg-[#bca142] transition-all duration-300 transform hover:scale-105 shadow-lg"
                              title="View Details"
                            >
                              <FiEye size={12} />
                            </button>
                            <button
                              onClick={() => handleOpenChat(dispute)}
                              className="p-1.5 bg-[#bca142] text-white rounded-lg hover:bg-black transition-all duration-300 transform hover:scale-105 shadow-lg"
                              title="Open Chat"
                            >
                              <FiMessageSquare size={12} />
                            </button>
                            {dispute.status !== 'closed' && (
                              <button
                                onClick={() => {
                                  setSelectedDispute(dispute);
                                  setNewStatus(dispute.status);
                                  setShowResponseModal(true);
                                }}
                                className="p-1.5 bg-[#bca142] text-white rounded-lg hover:bg-black transition-all duration-300 transform hover:scale-105 shadow-lg"
                                title="Update Status"
                              >
                                <FiEdit size={12} />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setDisputeToDelete(dispute);
                                setShowDeleteModal(true);
                              }}
                              className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                              title="Delete Dispute"
                            >
                              <FiTrash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Enhanced Pagination */}
              <div className="bg-[#bca142] px-6 py-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                  <div className="text-sm text-white">
                    Showing <span className="font-bold text-white">{startIndex + 1}</span> to{' '}
                    <span className="font-bold text-white">{Math.min(endIndex, sortedDisputes.length)}</span> of{' '}
                    <span className="font-bold text-white">{sortedDisputes.length}</span> results
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      <span>Previous</span>
                    </button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                              currentPage === pageNum
                                ? 'bg-black text-white shadow-lg transform scale-105'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      <span>Next</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Enhanced Dispute Details Modal */}
      {showDetailsModal && selectedDispute && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
            <div className="bg-[#bca142] px-8 py-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <FiShield className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Dispute Details #{selectedDispute.id}</h2>
                  <p className="text-gray-100">Advanced dispute analysis & management</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-all duration-300"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Dispute Title</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedDispute.title}</p>
                  </div>
                  
                  <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                    <label className="block text-sm font-bold text-gray-700 mb-3">Filed By (User Profile)</label>
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        {getUserTypeIcon(selectedDispute.user_role)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{selectedDispute.user_name}</p>
                        <p className="text-sm text-gray-600 mb-2">{selectedDispute.user_email}</p>
                        {getUserTypeBadge(selectedDispute.user_role)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
                    <label className="block text-sm font-bold text-gray-700 mb-3">Against (Target Profile)</label>
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-green-100 rounded-xl">
                        {getUserTypeIcon(selectedDispute.company_role)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{selectedDispute.company_name}</p>
                        <p className="text-sm text-gray-600 mb-2">{selectedDispute.company_email}</p>
                        {getUserTypeBadge(selectedDispute.company_role)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Dispute Reason</label>
                    <p className="text-lg font-semibold text-gray-900 bg-white px-4 py-2 rounded-lg">{selectedDispute.reason_title}</p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                      <span className={`inline-flex items-center px-3 py-2 text-sm font-bold rounded-lg ${getStatusColor(selectedDispute.status)}`}>
                        {getStatusIcon(selectedDispute.status)}
                        <span className="ml-2">{selectedDispute.status.toUpperCase()}</span>
                      </span>
                    </div>
                    
                    <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Priority</label>
                      <span className={`inline-flex items-center px-3 py-2 text-sm font-bold rounded-lg ${getPriorityColor(selectedDispute.priority)}`}>
                        <FiTrendingUp className="mr-1" size={14} />
                        {selectedDispute.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Filed On</label>
                    <p className="text-lg font-semibold text-gray-900">{new Date(selectedDispute.created_at).toLocaleString()}</p>
                  </div>

                  {selectedDispute.resolved_at && (
                    <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Resolved On</label>
                      <p className="text-lg font-semibold text-gray-900">{new Date(selectedDispute.resolved_at).toLocaleString()}</p>
                    </div>
                  )}

                  {/* Special Admin vs User indicator */}
                  {(selectedDispute.user_role === 'admin' || selectedDispute.company_role === 'admin') && (
                    <div className="bg-red-100 p-6 rounded-xl border-2 border-red-300">
                      <div className="flex items-center space-x-3">
                        <FiShield className="text-red-600" size={24} />
                        <div>
                          <p className="font-bold text-red-800">⚠️ ADMIN INVOLVED</p>
                          <p className="text-sm text-red-700">This dispute involves an admin user - handle with special attention</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Full Width Description */}
                <div className="lg:col-span-2">
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <label className="block text-sm font-bold text-gray-700 mb-3">Dispute Description</label>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 max-h-40 overflow-y-auto">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedDispute.description}</p>
                    </div>
                  </div>
                </div>

                {selectedDispute.company_response && (
                  <div className="lg:col-span-2">
                    <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                      <label className="block text-sm font-bold text-gray-700 mb-3">Company Response</label>
                      <div className="bg-white p-4 rounded-lg border border-green-300">
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedDispute.company_response}</p>
                        {selectedDispute.company_responded_at && (
                          <p className="text-sm text-green-600 mt-3 font-medium">
                            Responded on {new Date(selectedDispute.company_responded_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {selectedDispute.admin_response && (
                  <div className="lg:col-span-2">
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                      <label className="block text-sm font-bold text-gray-700 mb-3">Admin Response</label>
                      <div className="bg-white p-4 rounded-lg border border-blue-300">
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedDispute.admin_response}</p>
                        {selectedDispute.resolved_at && (
                          <p className="text-sm text-blue-600 mt-3 font-medium">
                            Resolved on {new Date(selectedDispute.resolved_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-8 py-6 flex justify-end border-t border-gray-200">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="bg-[#bca142] hover:bg-black text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Response & Status Update Modal */}
      {showResponseModal && selectedDispute && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl border border-white/20">
            {/* Loading Overlay */}
            {submitting && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-lg font-medium text-gray-700 animate-pulse">
                    Updating dispute status...
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Please wait while we process your update
                  </p>
                </div>
              </div>
            )}
            
            <div className="bg-[#bca142] px-8 py-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <FiEdit className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Update Dispute #{selectedDispute.id}</h3>
                  <p className="text-gray-100">Admin status management</p>
                </div>
              </div>
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
                className={`p-2 bg-white/20 rounded-lg text-white transition-all duration-300 ${
                  submitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/30'
                }`}
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-8">
              {/* Dispute Summary */}
              <div className="bg-gray-50 p-6 rounded-xl mb-6 border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                  <FiShield className="mr-2 text-blue-600" />
                  Dispute Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-700"><strong>Title:</strong> {selectedDispute.title}</p>
                    <p className="text-gray-700"><strong>User:</strong> {selectedDispute.user_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-700"><strong>Company:</strong> {selectedDispute.company_name}</p>
                    <p className="text-gray-700 flex items-center">
                      <strong>Current Status:</strong> 
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedDispute.status)}`}>
                        {selectedDispute.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleStatusUpdate}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Update Status *
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      disabled={submitting}
                      className={`w-full p-4 border rounded-xl transition-all duration-300 ${
                        submitting 
                          ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                          : 'focus:ring-2 focus:ring-[#bca142] focus:border-transparent hover:border-orange-300 bg-white/50'
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
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Admin Response & Resolution Notes *
                    </label>
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      disabled={submitting}
                      className={`w-full p-4 border rounded-xl transition-all duration-300 ${
                        submitting 
                          ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                          : 'focus:ring-2 focus:ring-[#bca142] focus:border-transparent hover:border-orange-300 bg-white/50'
                      }`}
                      rows="6"
                      placeholder="Provide your admin response and any resolution notes. This will be shared with both the user and company."
                      required
                    />
                  </div>
                  
                  <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
                    <div className="flex items-start space-x-3">
                      <FiShield className="text-orange-600 mt-1" size={20} />
                      <div>
                        <p className="text-sm text-orange-800 font-medium">
                          <strong>Admin Authority:</strong> Your status update will be immediately applied and both parties will be notified.
                        </p>
                        <p className="text-sm text-orange-700 mt-1">
                          Use this power responsibly to ensure fair resolution of disputes.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4 mt-8">
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
                    className={`px-6 py-3 text-white rounded-xl font-semibold transition-all duration-300 ${
                      submitting 
                        ? 'bg-gray-400 cursor-not-allowed opacity-60' 
                        : 'bg-gray-500 hover:bg-gray-600 transform hover:scale-105 shadow-lg'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-8 py-3 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center min-w-[200px] ${
                      submitting 
                        ? 'bg-yellow-400 cursor-not-allowed' 
                        : 'bg-[#bca142] hover:bg-black transform hover:scale-105 shadow-lg hover:shadow-xl'
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
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDisputeToDelete(null);
        }}
        onConfirm={handleDeleteDispute}
        title="Delete Dispute"
        message={`Are you sure you want to delete dispute #${disputeToDelete?.id} "${disputeToDelete?.title}"? This action will permanently remove all dispute data and cannot be undone.`}
        confirmText="Delete Dispute"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AdminDisputes;