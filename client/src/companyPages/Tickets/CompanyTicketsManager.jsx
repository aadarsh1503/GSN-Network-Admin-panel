import { useState, useEffect } from 'react';
import { 
  FiMessageSquare, FiRefreshCw, FiSearch, FiSend, FiEye, FiUser, 
  FiClock, FiChevronUp, FiChevronDown, FiX, FiCheckCircle, 
  FiAlertTriangle, FiStar, FiMail, FiBriefcase, FiHome, FiInbox,
  FiEdit, FiPlus
} from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const CompanyTicketsManager = () => {
  const [activeTab, setActiveTab] = useState('received'); // 'received' or 'created'
  const [receivedTickets, setReceivedTickets] = useState([]);
  const [createdTickets, setCreatedTickets] = useState([]);
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

  // Modal states
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [companyResponse, setCompanyResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAllTickets();
  }, []);

  const fetchAllTickets = async () => {
    try {
      setLoading(true);
      
      // Fetch tickets sent TO the company
      const receivedData = await api.get('/api/tickets/company/received');
      setReceivedTickets(receivedData);
      
      // Fetch tickets created BY the company
      const createdData = await api.get('/api/tickets/my-tickets');
      setCreatedTickets(createdData);
      
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyResponse = async () => {
    if (!selectedTicket || !companyResponse.trim()) return;

    try {
      setSubmitting(true);
      await api.put(`/api/tickets/company/${selectedTicket.id}/respond`, { 
        response: companyResponse
      });

      // Update local state for received tickets
      setReceivedTickets(receivedTickets.map(ticket => 
        ticket.id === selectedTicket.id 
          ? { ...ticket, status: 'answered', company_response: companyResponse, company_responded_at: new Date().toISOString() }
          : ticket
      ));

      setIsResponseModalOpen(false);
      setSelectedTicket(null);
      setCompanyResponse('');
      toast.success('Response submitted successfully!');
    } catch (err) {
      toast.error('Error submitting response: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openDetailsModal = (ticket) => {
    setSelectedTicket(ticket);
    setIsDetailsModalOpen(true);
  };

  const openResponseModal = (ticket) => {
    setSelectedTicket(ticket);
    setCompanyResponse(ticket.company_response || '');
    setIsResponseModalOpen(true);
  };

  const closeModal = () => {
    setIsDetailsModalOpen(false);
    setIsResponseModalOpen(false);
    setSelectedTicket(null);
    setCompanyResponse('');
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setUserTypeFilter('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Get current tickets based on active tab
  const getCurrentTickets = () => {
    return activeTab === 'received' ? receivedTickets : createdTickets;
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
        return <FiStar className="text-red-500" />;
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

  // Data processing with enhanced filtering
  const currentTickets = getCurrentTickets();
  const filteredTickets = currentTickets.filter(ticket => {
    if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) return false;
    if (userTypeFilter !== 'all' && ticket.user_role !== userTypeFilter) return false;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        ticket.ticket_number?.toLowerCase().includes(searchLower) ||
        ticket.user_name?.toLowerCase().includes(searchLower) ||
        ticket.user_email?.toLowerCase().includes(searchLower) ||
        ticket.subject?.toLowerCase().includes(searchLower) ||
        ticket.description?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (sortConfig.key) {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
    }
    return 0;
  });

  const paginatedTickets = sortedTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const SortableHeader = ({ children, sortKey }) => (
    <th className="py-4 px-6 text-left font-semibold cursor-pointer hover:bg-yellow-100 transition-colors duration-200" onClick={() => handleSort(sortKey)}>
      <div className="flex items-center">
        {children}
        {sortConfig.key === sortKey ? (
          sortConfig.direction === 'ascending' ? 
            <FiChevronUp className="ml-1 text-yellow-600" /> : 
            <FiChevronDown className="ml-1 text-yellow-600" />
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
        icon: <FiStar className="mr-1" size={12} />
      },
      medium: { 
        bg: 'bg-gradient-to-r from-yellow-100 to-orange-100', 
        text: 'text-yellow-800', 
        border: 'border-yellow-200',
        icon: <FiStar className="mr-1" size={12} />
      },
      high: { 
        bg: 'bg-gradient-to-r from-orange-100 to-red-100', 
        text: 'text-orange-800', 
        border: 'border-orange-200',
        icon: <FiStar className="mr-1" size={12} />
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

  // Get filter counts for current tab
  const getFilterCounts = () => {
    const tickets = getCurrentTickets();
    return {
      all: tickets.length,
      pending: tickets.filter(t => t.status === 'pending').length,
      answered: tickets.filter(t => t.status === 'answered').length,
      closed: tickets.filter(t => t.status === 'closed').length,
    };
  };

  const counts = getFilterCounts();
  const totalPages = Math.ceil(sortedTickets.length / itemsPerPage);
  const startEntry = (currentPage - 1) * itemsPerPage + 1;
  const endEntry = Math.min(startEntry + itemsPerPage - 1, sortedTickets.length);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-200 border-t-yellow-600 mx-auto"></div>
            <FiMail className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-yellow-600 animate-pulse" size={24} />
          </div>
          <p className="mt-4 text-lg font-medium text-gray-700 animate-pulse">Loading Tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50">
        <div className="text-center">
          <FiAlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Tickets</h3>
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={fetchAllTickets}
            className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-yellow-600 hover:to-amber-700 transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Futuristic Header */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-xl">
                <FiHome className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Company Ticket Manager
                </h1>
                <p className="text-gray-600 mt-1">Manage all your company tickets in one place</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={fetchAllTickets}
                className="flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-yellow-600 hover:to-amber-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <FiRefreshCw size={20} />
                <span>Refresh</span>
              </button>
              <button 
                onClick={() => window.location.href = '/company/create-Ticket'}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <FiPlus size={20} />
                <span>Create Ticket</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 mb-8 overflow-hidden">
          <div className="flex">
            <button
              onClick={() => {
                setActiveTab('received');
                setCurrentPage(1);
                resetFilters();
              }}
              className={`flex-1 flex items-center justify-center space-x-3 px-6 py-4 font-medium text-sm transition-all duration-300 ${
                activeTab === 'received'
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-yellow-50'
              }`}
            >
              <FiInbox size={18} />
              <span>Customer Tickets</span>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                activeTab === 'received' ? 'bg-white/20 text-white' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {receivedTickets.length}
              </span>
            </button>
            <button
              onClick={() => {
                setActiveTab('created');
                setCurrentPage(1);
                resetFilters();
              }}
              className={`flex-1 flex items-center justify-center space-x-3 px-6 py-4 font-medium text-sm transition-all duration-300 ${
                activeTab === 'created'
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-yellow-50'
              }`}
            >
              <FiEdit size={18} />
              <span>My Tickets</span>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                activeTab === 'created' ? 'bg-white/20 text-white' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {createdTickets.length}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content Description */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${
              activeTab === 'received' 
                ? 'bg-gradient-to-r from-blue-100 to-cyan-100' 
                : 'bg-gradient-to-r from-green-100 to-emerald-100'
            }`}>
              {activeTab === 'received' ? (
                <FiInbox className="text-blue-600" size={24} />
              ) : (
                <FiEdit className="text-green-600" size={24} />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {activeTab === 'received' ? 'Customer Support Tickets' : 'My Support Requests'}
              </h3>
              <p className="text-gray-600">
                {activeTab === 'received' 
                  ? 'Tickets sent to your company by customers - respond and provide support'
                  : 'Tickets you created and sent to admin - track your support requests'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Tickets', value: counts.all, icon: FiMail, color: 'from-yellow-500 to-amber-500' },
            { label: 'Pending', value: counts.pending, icon: FiClock, color: 'from-orange-500 to-red-500' },
            { label: 'Answered', value: counts.answered, icon: FiMessageSquare, color: 'from-blue-500 to-cyan-500' },
            { label: 'Closed', value: counts.closed, icon: FiCheckCircle, color: 'from-green-500 to-emerald-500' }
          ].map((stat, index) => (
            <div key={index} className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 bg-gradient-to-r ${stat.color} rounded-lg`}>
                  <stat.icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Advanced Filters */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0 lg:space-x-6">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search tickets, users, subjects..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="px-4 py-2 bg-white/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300"
              >
                <option value="all">All Status ({counts.all})</option>
                <option value="pending">Pending ({counts.pending})</option>
                <option value="answered">Answered ({counts.answered})</option>
                <option value="closed">Closed ({counts.closed})</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
                className="px-4 py-2 bg-white/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300"
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
                className="px-4 py-2 bg-white/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300"
              >
                <option value="5">5 per page</option>
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
              </select>

              <button
                onClick={resetFilters}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-300"
              >
                <FiX size={16} />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {sortedTickets.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 bg-gradient-to-r from-yellow-100 to-amber-200 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <FiMail className="text-yellow-600" size={48} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No Matching Tickets' : `No ${activeTab === 'received' ? 'Customer' : 'Created'} Tickets Found`}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchTerm 
                  ? `No tickets match your search criteria "${searchTerm}"`
                  : activeTab === 'received'
                    ? 'No customers have sent support tickets to your company yet.'
                    : 'You haven\'t created any support tickets yet.'
                }
              </p>
              {activeTab === 'created' && (
                <button 
                  onClick={() => window.location.href = '/company/create-Ticket'}
                  className="mt-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-yellow-600 hover:to-amber-700 transition-all duration-300"
                >
                  Create Your First Ticket
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-yellow-50 to-amber-50">
                    <tr>
                      <SortableHeader sortKey="ticket_number">Ticket Info</SortableHeader>
                      <SortableHeader sortKey={activeTab === 'received' ? 'user_name' : 'subject'}>
                        {activeTab === 'received' ? 'Customer' : 'Subject'}
                      </SortableHeader>
                      <SortableHeader sortKey="subject">
                        {activeTab === 'received' ? 'Subject & Category' : 'Category'}
                      </SortableHeader>
                      <SortableHeader sortKey="priority">Priority</SortableHeader>
                      <SortableHeader sortKey="status">Status</SortableHeader>
                      <SortableHeader sortKey="created_at">Created</SortableHeader>
                      <th className="py-4 px-6 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedTickets.map((ticket, index) => (
                      <tr key={ticket.id} className="hover:bg-gradient-to-r hover:from-yellow-50/50 hover:to-amber-50/50 transition-all duration-300">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-to-r from-yellow-100 to-amber-100 rounded-lg">
                              <FiMail className="text-yellow-600" size={16} />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900">{ticket.ticket_number}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(ticket.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {activeTab === 'received' ? (
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg">
                                {getUserTypeIcon(ticket.user_role)}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{ticket.user_name}</div>
                                <div className="text-xs text-gray-500 mb-1">{ticket.user_email}</div>
                                {getUserTypeBadge(ticket.user_role)}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm font-medium text-gray-900 max-w-xs truncate" title={ticket.subject}>
                              {ticket.subject}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {activeTab === 'received' ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900 max-w-xs truncate" title={ticket.subject}>
                                {ticket.subject}
                              </div>
                              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg mt-1 inline-block capitalize">
                                {ticket.category}
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg inline-block capitalize">
                              {ticket.category}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {getPriorityBadge(ticket.priority)}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(ticket.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(ticket.created_at).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openDetailsModal(ticket)}
                              className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                              title="View Details"
                            >
                              <FiEye size={16} />
                            </button>
                            {activeTab === 'received' && (
                              <button
                                onClick={() => openResponseModal(ticket)}
                                className="p-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-lg hover:from-yellow-600 hover:to-amber-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                                title="Respond to Ticket"
                              >
                                <FiMessageSquare size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Enhanced Pagination */}
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 px-6 py-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-bold text-yellow-600">{sortedTickets.length > 0 ? startEntry : 0}</span> to{' '}
                    <span className="font-bold text-yellow-600">{endEntry}</span> of{' '}
                    <span className="font-bold text-yellow-600">{sortedTickets.length}</span> results
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
                                ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg transform scale-105'
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

      {/* Ticket Details Modal */}
      {isDetailsModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold">Ticket Details</h3>
                  <p className="text-yellow-100 mt-1">{selectedTicket.ticket_number}</p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
                >
                  <FiX size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Ticket Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Subject</label>
                    <p className="text-lg font-medium text-gray-900 mt-1">{selectedTicket.subject}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Category</label>
                    <p className="text-gray-900 mt-1 capitalize bg-gray-100 px-3 py-1 rounded-lg inline-block">
                      {selectedTicket.category}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Priority</label>
                    <div className="mt-1">{getPriorityBadge(selectedTicket.priority)}</div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {activeTab === 'received' && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Customer</label>
                      <div className="mt-1 flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg">
                          {getUserTypeIcon(selectedTicket.user_role)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{selectedTicket.user_name}</p>
                          <p className="text-sm text-gray-500">{selectedTicket.user_email}</p>
                          {getUserTypeBadge(selectedTicket.user_role)}
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Created</label>
                    <p className="text-gray-900 mt-1">
                      {new Date(selectedTicket.created_at).toLocaleDateString()} at{' '}
                      {new Date(selectedTicket.created_at).toLocaleTimeString()}
                    </p>
                  </div>

                  {selectedTicket.responded_at && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Last Response</label>
                      <p className="text-gray-900 mt-1">
                        {new Date(selectedTicket.responded_at).toLocaleDateString()} at{' '}
                        {new Date(selectedTicket.responded_at).toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Description</label>
                <div className="mt-2 p-4 bg-gray-50 rounded-xl border">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
              </div>

              {/* Admin Response */}
              {selectedTicket.admin_response && (
                <div>
                  <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Admin Response</label>
                  <div className="mt-2 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedTicket.admin_response}</p>
                    {selectedTicket.admin_name && (
                      <p className="text-sm text-blue-600 mt-2 font-medium">- {selectedTicket.admin_name}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Company Response (for received tickets) */}
              {activeTab === 'received' && selectedTicket.company_response && (
                <div>
                  <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Your Response</label>
                  <div className="mt-2 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedTicket.company_response}</p>
                    <p className="text-sm text-yellow-600 mt-2 font-medium">
                      Responded on {new Date(selectedTicket.company_responded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                Close
              </button>
              {activeTab === 'received' && (
                <button
                  onClick={() => {
                    closeModal();
                    openResponseModal(selectedTicket);
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-lg hover:from-yellow-600 hover:to-amber-700 transition-all duration-200"
                >
                  Respond to Ticket
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Company Response Modal */}
      {isResponseModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold">Respond to Ticket</h3>
                  <p className="text-yellow-100 mt-1">{selectedTicket.ticket_number} - {selectedTicket.subject}</p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
                >
                  <FiX size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Customer Info */}
              <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg">
                    {getUserTypeIcon(selectedTicket.user_role)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedTicket.user_name}</p>
                    <p className="text-sm text-gray-500">{selectedTicket.user_email}</p>
                    {getUserTypeBadge(selectedTicket.user_role)}
                  </div>
                </div>
              </div>

              {/* Original Description */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Customer's Request</label>
                <div className="mt-2 p-4 bg-gray-50 rounded-xl border">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
              </div>

              {/* Response Input */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Your Response</label>
                <textarea
                  value={companyResponse}
                  onChange={(e) => setCompanyResponse(e.target.value)}
                  placeholder="Type your response to the customer..."
                  rows={6}
                  className="mt-2 w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                />
                <p className="text-sm text-gray-500 mt-2">
                  This response will be sent to the customer and synced to your messages.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleCompanyResponse}
                disabled={!companyResponse.trim() || submitting}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-lg hover:from-yellow-600 hover:to-amber-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <FiSend size={16} />
                    <span>Send Response</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyTicketsManager;