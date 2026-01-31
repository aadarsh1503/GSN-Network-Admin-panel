import { useState, useEffect, useMemo } from 'react';
import { 
  FiEye, FiEdit, FiChevronUp, FiChevronDown, FiMessageSquare, 
  FiSearch, FiFilter, FiRefreshCw, FiUsers, FiBriefcase, 
  FiHome, FiShield, FiZap, FiTrendingUp, FiX, FiClock,
  FiCheckCircle, FiAlertTriangle, FiStar, FiMail, FiTrash2, FiUser
} from 'react-icons/fi';
import api from '../../utils/api';

const AllTicketsList = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Enhanced filtering and search
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'descending' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [recipientFilter, setRecipientFilter] = useState('all'); // New filter for recipient type

  // Modal state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/tickets/admin/all');
      setTickets(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTicketResponse = async () => {
    if (!selectedTicket || !newStatus) return;

    try {
      setSubmitting(true);
      await api.put(`/api/tickets/${selectedTicket.id}/status`, { 
        status: newStatus,
        adminResponse: adminResponse || undefined
      });

      // Update local state
      setTickets(tickets.map(ticket => 
        ticket.id === selectedTicket.id 
          ? { ...ticket, status: newStatus, admin_response: adminResponse }
          : ticket
      ));

      setIsModalOpen(false);
      setSelectedTicket(null);
      setAdminResponse('');
      setNewStatus('');
    } catch (err) {
      alert('Error updating ticket: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!ticketToDelete) return;
    
    try {
      setIsDeleting(true);
      await api.delete(`/api/tickets/admin/${ticketToDelete.id}`);
      
      // Remove from local state
      setTickets(prev => prev.filter(ticket => ticket.id !== ticketToDelete.id));
      
      alert('Ticket deleted successfully');
      setShowDeleteModal(false);
      setTicketToDelete(null);
    } catch (error) {
      console.error('Error deleting ticket:', error);
      alert('Failed to delete ticket');
    } finally {
      setIsDeleting(false);
    }
  };

  const openResponseModal = (ticket) => {
    setSelectedTicket(ticket);
    setNewStatus(ticket.status);
    setAdminResponse(ticket.admin_response || '');
    setIsModalOpen(true);
  };

  const openDetailsModal = (ticket) => {
    setSelectedTicket(ticket);
    setIsDetailsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsDetailsModalOpen(false);
    setSelectedTicket(null);
    setAdminResponse('');
    setNewStatus('');
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setUserTypeFilter('all');
    setCategoryFilter('all');
    setRecipientFilter('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // User type functions
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

  const getRecipientBadge = (recipientType) => {
    const configs = {
      admin: { bg: 'bg-red-100', text: 'text-red-800', label: 'To Admin', icon: <FiShield className="mr-1" size={12} /> },
      company: { bg: 'bg-green-100', text: 'text-green-800', label: 'To Company', icon: <FiHome className="mr-1" size={12} /> }
    };
    
    const config = configs[recipientType] || configs.admin;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        <span>{config.label}</span>
      </span>
    );
  };

  // Data processing with enhanced filtering
  const filteredTickets = useMemo(() => {
    let filtered = tickets;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    if (userTypeFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.user_role === userTypeFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.category === categoryFilter);
    }

    if (recipientFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.recipient_type === recipientFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [tickets, statusFilter, priorityFilter, userTypeFilter, categoryFilter, recipientFilter, searchTerm]);

  const sortedTickets = useMemo(() => {
    let sortable = [...filteredTickets];
    if (sortConfig.key) {
      sortable.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortable;
  }, [filteredTickets, sortConfig]);

  const paginatedTickets = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * itemsPerPage;
    const lastPageIndex = firstPageIndex + itemsPerPage;
    return sortedTickets.slice(firstPageIndex, lastPageIndex);
  }, [sortedTickets, currentPage, itemsPerPage]);

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const SortableHeader = ({ children, sortKey }) => (
    <th className="py-3 px-3 text-left font-semibold cursor-pointer hover:bg-[#bca142]/10 transition-colors duration-200" onClick={() => handleSort(sortKey)}>
      <div className="flex items-center">
        {children}
        {sortConfig.key === sortKey ? (
          sortConfig.direction === 'ascending' ? 
            <FiChevronUp className="ml-1 text-white" /> : 
            <FiChevronDown className="ml-1 text-white" />
        ) : null}
      </div>
    </th>
  );

  const getStatusBadge = (status) => {
    const statusConfigs = {
      pending: { 
        bg: 'bg-gradient-to-r from-yellow-100 to-amber-100', 
        text: 'text-yellow-800', 
        border: 'border-yellow-200',
        icon: <FiClock className="mr-1" size={12} />
      },
      answered: { 
        bg: 'bg-gradient-to-r from-blue-100 to-cyan-100', 
        text: 'text-blue-800', 
        border: 'border-blue-200',
        icon: <FiMessageSquare className="mr-1" size={12} />
      },
      closed: { 
        bg: 'bg-gradient-to-r from-gray-100 to-slate-100', 
        text: 'text-gray-800', 
        border: 'border-gray-200',
        icon: <FiCheckCircle className="mr-1" size={12} />
      }
    };

    const config = statusConfigs[status] || statusConfigs.pending;

    return (
      <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full border ${config.bg} ${config.text} ${config.border}`}>
        {config.icon}
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfigs = {
      low: { 
        bg: 'bg-gradient-to-r from-green-100 to-emerald-100', 
        text: 'text-green-800', 
        border: 'border-green-200',
        icon: <FiTrendingUp className="mr-1" size={12} />
      },
      medium: { 
        bg: 'bg-gradient-to-r from-yellow-100 to-orange-100', 
        text: 'text-yellow-800', 
        border: 'border-yellow-200',
        icon: <FiTrendingUp className="mr-1" size={12} />
      },
      high: { 
        bg: 'bg-gradient-to-r from-orange-100 to-red-100', 
        text: 'text-orange-800', 
        border: 'border-orange-200',
        icon: <FiTrendingUp className="mr-1" size={12} />
      },
      urgent: { 
        bg: 'bg-gradient-to-r from-red-100 to-pink-100', 
        text: 'text-red-800', 
        border: 'border-red-200',
        icon: <FiAlertTriangle className="mr-1" size={12} />
      }
    };

    const config = priorityConfigs[priority] || priorityConfigs.medium;

    return (
      <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full border ${config.bg} ${config.text} ${config.border}`}>
        {config.icon}
        {priority?.charAt(0).toUpperCase() + priority?.slice(1)}
      </span>
    );
  };

  // Get filter counts
  const getFilterCounts = () => {
    return {
      all: tickets.length,
      pending: tickets.filter(t => t.status === 'pending').length,
      answered: tickets.filter(t => t.status === 'answered').length,
      closed: tickets.filter(t => t.status === 'closed').length,
    };
  };

  const getUserTypeCounts = () => {
    return {
      all: tickets.length,
      user: tickets.filter(t => t.user_role === 'user').length,
      business: tickets.filter(t => t.user_role === 'business').length,
      company: tickets.filter(t => t.user_role === 'company').length,
      admin: tickets.filter(t => t.user_role === 'admin').length,
    };
  };

  const counts = getFilterCounts();
  const userTypeCounts = getUserTypeCounts();
  const totalPages = Math.ceil(sortedTickets.length / itemsPerPage);
  const startEntry = (currentPage - 1) * itemsPerPage + 1;
  const endEntry = Math.min(startEntry + itemsPerPage - 1, sortedTickets.length);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#bca142]/10 via-[#bca142]/5 to-[#bca142]/20">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#bca142]/30 border-t-[#bca142] mx-auto"></div>
            <FiZap className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#bca142] animate-pulse" size={24} />
          </div>
          <p className="mt-4 text-lg font-medium text-gray-700 animate-pulse">Loading Support Tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#bca142]/10 via-[#bca142]/5 to-[#bca142]/20">
        <div className="text-center">
          <FiAlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Tickets</h3>
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={fetchTickets}
            className="bg-[#bca142] text-white px-6 py-3 rounded-xl font-semibold hover:from-black hover:to-[#bca142] transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#bca142]/10 via-[#bca142]/5 to-[#bca142]/20 p-3">
      <div className="max-w-6xl mx-auto">
        {/* Compact Header */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-4 mb-4">
          <div className="flex flex-col lg:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-2 lg:mb-0">
              <div className="p-2 bg-[#bca142] rounded-lg">
                <FiMail className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Support Tickets
                </h1>
                <p className="text-gray-600 text-sm">Manage customer support</p>
              </div>
            </div>
            <button 
              onClick={fetchTickets}
              className="flex items-center space-x-2 bg-[#bca142] text-white font-semibold py-2 px-4 rounded-lg hover:from-black hover:to-[#bca142] transition-all duration-300 shadow-lg text-sm"
            >
              <FiRefreshCw size={16} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Compact Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Total', value: counts.all, icon: FiMail, color: 'from-[#bca142] to-[#bca142]' },
            { label: 'Pending', value: counts.pending, icon: FiClock, color: 'from-[#bca142] to-[#bca142]' },
            { label: 'Answered', value: counts.answered, icon: FiMessageSquare, color: 'from-[#bca142] to-[#bca142]' },
            { label: 'Closed', value: counts.closed, icon: FiCheckCircle, color: 'from-[#bca142] to-[#bca142]' }
          ].map((stat, index) => (
            <div key={index} className="bg-white/80 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-3 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-2 bg-gradient-to-r ${stat.color} rounded-lg`}>
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
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-3 py-2 bg-white/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300 text-sm"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 bg-white/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bca142] transition-all duration-300 text-sm"
              >
                <option value="all">All ({counts.all})</option>
                <option value="pending">Pending ({counts.pending})</option>
                <option value="answered">Answered ({counts.answered})</option>
                <option value="closed">Closed ({counts.closed})</option>
              </select>

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
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
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

        {/* Tickets Table */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 overflow-hidden">
          {sortedTickets.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-3 bg-gradient-to-r from-yellow-100 to-amber-200 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FiMail className="text-yellow-600" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No Matching Tickets' : (statusFilter === 'all' ? 'No Tickets Found' : `No ${statusFilter} Tickets`)}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto text-sm">
                {searchTerm 
                  ? `No tickets match your search criteria "${searchTerm}"`
                  : (statusFilter === 'all' 
                    ? 'The support center is currently empty.'
                    : `There are no ${statusFilter} tickets at the moment.`
                  )
                }
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-[#bca142]">
                    <tr>
                      <SortableHeader sortKey="ticket_number">Ticket</SortableHeader>
                      <SortableHeader sortKey="user_name">User</SortableHeader>
                      <SortableHeader sortKey="subject">Subject</SortableHeader>
                      <SortableHeader sortKey="priority">Priority</SortableHeader>
                      <SortableHeader sortKey="status">Status</SortableHeader>
                      <SortableHeader sortKey="created_at">Date</SortableHeader>
                      <th className="py-4 px-3 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedTickets.map((ticket, index) => (
                      <tr key={ticket.id} className={`hover:bg-[#bca142]/10 transition-all duration-300 ${
                        ticket.user_role === 'admin' ? 'bg-red-50/30' : ''
                      }`}>
                        <td className="px-3 py-3">
                          <div className="flex items-center space-x-2">
                            <div className="p-1 bg-[#bca142]/20 rounded-lg flex-shrink-0">
                              <FiMail className="text-[#bca142]" size={12} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-gray-900 truncate">{ticket.ticket_number}</div>
                              <div className="text-xs text-gray-500 truncate">
                                {new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                              {ticket.user_role === 'admin' && (
                                <div className="text-xs text-red-600 font-bold">⚠️</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center space-x-2">
                            <div className="p-1 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg flex-shrink-0">
                              {getUserTypeIcon(ticket.user_role)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-gray-900 truncate" title={ticket.user_name}>{ticket.user_name}</div>
                              <div className="text-xs text-gray-500 truncate" title={ticket.user_email}>{ticket.user_email}</div>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                ticket.user_role === 'user' ? 'bg-blue-100 text-blue-800' :
                                ticket.user_role === 'business' ? 'bg-purple-100 text-purple-800' :
                                ticket.user_role === 'company' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {ticket.user_role === 'user' ? 'User' :
                                 ticket.user_role === 'business' ? 'Business' :
                                 ticket.user_role === 'company' ? 'Company' : 'Admin'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-gray-900 truncate mb-1" title={ticket.subject}>
                              {ticket.subject}
                            </div>
                            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg inline-block capitalize truncate max-w-full">
                              {ticket.category}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-bold rounded-full ${
                            ticket.priority === 'low' ? 'bg-green-100 text-green-800' :
                            ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {ticket.priority?.charAt(0).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-bold rounded-full ${
                            ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            ticket.status === 'answered' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {ticket.status?.charAt(0).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-xs font-medium text-gray-900 truncate">
                            {new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {new Date(ticket.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => openDetailsModal(ticket)}
                              className="p-1.5 bg-black text-white rounded-lg hover:bg-[#bca142] transition-all duration-300 transform hover:scale-105 shadow-lg flex-shrink-0"
                              title="View Details"
                            >
                              <FiEye size={12} />
                            </button>
                            <button
                              onClick={() => openResponseModal(ticket)}
                              className="p-1.5 bg-[#bca142] text-white rounded-lg hover:bg-black transition-all duration-300 transform hover:scale-105 shadow-lg flex-shrink-0"
                              title="Respond"
                            >
                              <FiMessageSquare size={12} />
                            </button>
                            <button
                              onClick={() => {
                                setTicketToDelete(ticket);
                                setShowDeleteModal(true);
                              }}
                              className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-300 transform hover:scale-105 shadow-lg flex-shrink-0"
                              title="Delete"
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
                    Showing <span className="font-bold text-white">{sortedTickets.length > 0 ? startEntry : 0}</span> to{' '}
                    <span className="font-bold text-white">{endEntry}</span> of{' '}
                    <span className="font-bold text-white">{sortedTickets.length}</span> results
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
                      disabled={currentPage === totalPages || totalPages === 0}
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

      {/* Enhanced Ticket Details Modal */}
      {isDetailsModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
            <div className="bg-gradient-to-r from-yellow-500 via-amber-600 to-orange-500 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <FiMail className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Ticket Details {selectedTicket.ticket_number}</h2>
                  <p className="text-yellow-100">Complete ticket information & history</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-all duration-300"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-xl border border-yellow-200">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Ticket Information</label>
                    <div className="space-y-2">
                      <p className="text-lg font-semibold text-gray-900">{selectedTicket.ticket_number}</p>
                      <p className="text-sm text-gray-600">Created: {new Date(selectedTicket.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
                    <label className="block text-sm font-bold text-gray-700 mb-3">User Profile</label>
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl">
                        {getUserTypeIcon(selectedTicket.user_role)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{selectedTicket.user_name}</p>
                        <p className="text-sm text-gray-600 mb-2">{selectedTicket.user_email}</p>
                        {getUserTypeBadge(selectedTicket.user_role)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200">
                    <label className="block text-sm font-bold text-gray-700 mb-3">Ticket Recipient</label>
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gradient-to-r from-yellow-100 to-amber-100 rounded-xl">
                        {selectedTicket.recipient_type === 'company' ? <FiHome className="text-green-600" size={20} /> : <FiShield className="text-red-600" size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{selectedTicket.recipient_name}</p>
                        {getRecipientBadge(selectedTicket.recipient_type)}
                        {selectedTicket.recipient_type === 'company' && (
                          <p className="text-sm text-green-600 font-medium mt-1">This ticket was sent to a company for support</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedTicket.subject}</p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                      {getStatusBadge(selectedTicket.status)}
                    </div>
                    
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-xl border border-orange-200">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Priority</label>
                      {getPriorityBadge(selectedTicket.priority)}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-xl border border-gray-200">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                    <p className="text-lg font-semibold text-gray-900 capitalize bg-white px-4 py-2 rounded-lg">{selectedTicket.category}</p>
                  </div>

                  {/* Special Admin Alert */}
                  {selectedTicket.user_role === 'admin' && (
                    <div className="bg-gradient-to-r from-red-100 to-pink-100 p-6 rounded-xl border-2 border-red-300">
                      <div className="flex items-center space-x-3">
                        <FiShield className="text-red-600" size={24} />
                        <div>
                          <p className="font-bold text-red-800">⚠️ ADMIN TICKET</p>
                          <p className="text-sm text-red-700">This ticket was created by an admin user - handle with priority</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Full Width Description */}
                <div className="lg:col-span-2">
                  <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 rounded-xl border border-slate-200">
                    <label className="block text-sm font-bold text-gray-700 mb-3">Ticket Description</label>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 max-h-40 overflow-y-auto">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedTicket.description}</p>
                    </div>
                  </div>
                </div>

                {selectedTicket.admin_response && (
                  <div className="lg:col-span-2">
                    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-xl border border-yellow-200">
                      <label className="block text-sm font-bold text-gray-700 mb-3">Admin Response</label>
                      <div className="bg-white p-4 rounded-lg border border-yellow-300">
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedTicket.admin_response}</p>
                        {selectedTicket.responded_at && (
                          <p className="text-sm text-yellow-600 mt-3 font-medium">
                            Responded on {new Date(selectedTicket.responded_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 px-8 py-6 flex justify-end border-t border-gray-200">
              <button
                onClick={closeModal}
                className="bg-gradient-to-r from-gray-500 to-slate-600 hover:from-gray-600 hover:to-slate-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Response Modal */}
      {isModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl border border-white/20">
            {/* Loading Overlay */}
            {submitting && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-lg font-medium text-gray-700 animate-pulse">
                    Updating ticket status...
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Please wait while we process your response
                  </p>
                </div>
              </div>
            )}
            
            <div className="bg-gradient-to-r from-yellow-500 to-amber-600 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <FiMessageSquare className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Respond to Ticket {selectedTicket.ticket_number}</h3>
                  <p className="text-yellow-100">Admin ticket management</p>
                </div>
              </div>
              <button 
                onClick={closeModal}
                disabled={submitting}
                className={`p-2 bg-white/20 rounded-lg text-white transition-all duration-300 ${
                  submitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/30'
                }`}
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-8">
              {/* Ticket Summary */}
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-xl mb-6 border border-yellow-200">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                  <FiMail className="mr-2 text-yellow-600" />
                  Ticket Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-700"><strong>Ticket:</strong> {selectedTicket.ticket_number}</p>
                    <p className="text-gray-700"><strong>User:</strong> {selectedTicket.user_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-700"><strong>Category:</strong> {selectedTicket.category}</p>
                    <p className="text-gray-700 flex items-center">
                      <strong>Priority:</strong> 
                      <span className="ml-2">{getPriorityBadge(selectedTicket.priority)}</span>
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-gray-700"><strong>Subject:</strong> {selectedTicket.subject}</p>
                </div>
                <div className="mt-4">
                  <strong className="text-gray-700">Description:</strong>
                  <div className="mt-2 p-3 bg-white rounded-lg border border-yellow-300 text-sm max-h-32 overflow-y-auto">
                    {selectedTicket.description}
                  </div>
                </div>
              </div>

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
                        : 'focus:ring-2 focus:ring-yellow-500 focus:border-transparent hover:border-yellow-300 bg-white/50'
                    }`}
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="answered">Answered</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Admin Response
                  </label>
                  <textarea
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    disabled={submitting}
                    className={`w-full p-4 border rounded-xl transition-all duration-300 ${
                      submitting 
                        ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                        : 'focus:ring-2 focus:ring-yellow-500 focus:border-transparent hover:border-yellow-300 bg-white/50'
                    }`}
                    rows="6"
                    placeholder="Enter your response to the user. This will be sent to them via email notification."
                  />
                </div>
                
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-xl border border-yellow-200">
                  <div className="flex items-start space-x-3">
                    <FiMail className="text-yellow-600 mt-1" size={20} />
                    <div>
                      <p className="text-sm text-yellow-800 font-medium">
                        <strong>Admin Response:</strong> Your response will be sent to the user and logged in the ticket history.
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Use professional language and provide clear, helpful information to resolve the user's issue.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-8">
                <button
                  onClick={closeModal}
                  disabled={submitting}
                  className={`px-6 py-3 text-white rounded-xl font-semibold transition-all duration-300 ${
                    submitting 
                      ? 'bg-gray-400 cursor-not-allowed opacity-60' 
                      : 'bg-gradient-to-r from-gray-500 to-slate-600 hover:from-gray-600 hover:to-slate-700 transform hover:scale-105 shadow-lg'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleTicketResponse}
                  disabled={submitting || !newStatus}
                  className={`px-8 py-3 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center min-w-[200px] ${
                    submitting || !newStatus
                      ? 'bg-gray-400 cursor-not-allowed opacity-60' 
                      : 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 transform hover:scale-105 shadow-lg hover:shadow-xl'
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
                      Update Ticket
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && ticketToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl max-w-md w-full shadow-2xl border border-white/20">
            <div className="bg-gradient-to-r from-red-500 to-pink-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FiTrash2 className="text-white" size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">Delete Ticket</h3>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-all duration-300"
              >
                <FiX size={16} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="p-4 bg-gradient-to-r from-red-100 to-pink-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <FiAlertTriangle className="text-red-600" size={32} />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Are you sure?</h4>
                <p className="text-gray-600">
                  Do you want to delete ticket <strong>{ticketToDelete.ticket_number}</strong>?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  This action cannot be undone and will permanently remove all ticket data.
                </p>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTicket}
                  disabled={isDeleting}
                  className={`px-6 py-2 text-white rounded-lg font-semibold transition-all duration-300 flex items-center ${
                    isDeleting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 transform hover:scale-105'
                  }`}
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FiTrash2 className="mr-2" size={16} />
                      Delete Ticket
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllTicketsList;