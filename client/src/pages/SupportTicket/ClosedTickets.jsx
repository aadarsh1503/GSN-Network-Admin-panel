import { useState, useEffect, useMemo } from 'react';
import { 
  FiEye, FiEdit, FiChevronUp, FiChevronDown, FiMessageSquare, 
  FiSearch, FiFilter, FiRefreshCw, FiUsers, FiBriefcase, 
  FiHome, FiShield, FiZap, FiTrendingUp, FiX, FiClock,
  FiCheckCircle, FiAlertTriangle, FiStar, FiMail, FiTrash2, FiUser
} from 'react-icons/fi';
import api from '../../utils/api';

const ClosedTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Enhanced filtering and search
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'descending' });
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [recipientFilter, setRecipientFilter] = useState('all');

  // Modal state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/tickets/admin/all');
      // Filter only closed tickets
      const closedTickets = data.filter(ticket => ticket.status === 'closed');
      setTickets(closedTickets);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openDetailsModal = (ticket) => {
    setSelectedTicket(ticket);
    setIsDetailsModalOpen(true);
  };

  const closeModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedTicket(null);
  };

  const resetFilters = () => {
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
  }, [tickets, priorityFilter, userTypeFilter, categoryFilter, recipientFilter, searchTerm]);

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
    <th className="py-4 px-4 text-left font-semibold cursor-pointer hover:bg-gray-100 transition-colors duration-200" onClick={() => handleSort(sortKey)}>
      <div className="flex items-center">
        {children}
        {sortConfig.key === sortKey ? (
          sortConfig.direction === 'ascending' ? 
            <FiChevronUp className="ml-1 text-gray-600" /> : 
            <FiChevronDown className="ml-1 text-gray-600" />
        ) : null}
      </div>
    </th>
  );

  const totalPages = Math.ceil(sortedTickets.length / itemsPerPage);
  const startEntry = (currentPage - 1) * itemsPerPage + 1;
  const endEntry = Math.min(startEntry + itemsPerPage - 1, sortedTickets.length);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-gray-600 mx-auto"></div>
            <FiCheckCircle className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-600 animate-pulse" size={24} />
          </div>
          <p className="mt-4 text-lg font-medium text-gray-700 animate-pulse">Loading Closed Tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
        <div className="text-center">
          <FiAlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Tickets</h3>
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={fetchTickets}
            className="bg-gradient-to-r from-gray-500 to-slate-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-gray-600 hover:to-slate-700 transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Futuristic Header */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <div className="p-3 bg-gradient-to-r from-gray-500 to-slate-600 rounded-xl">
                <FiCheckCircle className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Closed Tickets
                </h1>
                <p className="text-gray-600 mt-1">Resolved support tickets & completed cases</p>
              </div>
            </div>
            <button 
              onClick={fetchTickets}
              className="flex items-center space-x-2 bg-gradient-to-r from-gray-500 to-slate-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-gray-600 hover:to-slate-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <FiRefreshCw size={20} />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Closed', value: tickets.length, icon: FiCheckCircle, color: 'from-gray-500 to-slate-500' },
            { label: 'User Tickets', value: tickets.filter(t => t.user_role === 'user').length, icon: FiUser, color: 'from-blue-500 to-cyan-500' },
            { label: 'Business Tickets', value: tickets.filter(t => t.user_role === 'business').length, icon: FiBriefcase, color: 'from-purple-500 to-pink-500' },
            { label: 'Company Tickets', value: tickets.filter(t => t.user_role === 'company').length, icon: FiHome, color: 'from-green-500 to-emerald-500' }
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
                placeholder="Search closed tickets..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-300"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center space-x-4">
              <select
                value={userTypeFilter}
                onChange={(e) => { setUserTypeFilter(e.target.value); setCurrentPage(1); }}
                className="px-4 py-2 bg-white/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300"
              >
                <option value="all">All User Types</option>
                <option value="user">Regular Users</option>
                <option value="business">Business Owners</option>
                <option value="company">Company Members</option>
                <option value="admin">Admins</option>
              </select>

              <select
                value={recipientFilter}
                onChange={(e) => { setRecipientFilter(e.target.value); setCurrentPage(1); }}
                className="px-4 py-2 bg-white/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300"
              >
                <option value="all">All Recipients</option>
                <option value="admin">To Admin</option>
                <option value="company">To Companies</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
                className="px-4 py-2 bg-white/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300"
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
                className="px-4 py-2 bg-white/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300"
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

        {/* Futuristic Tickets Table */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {sortedTickets.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 bg-gradient-to-r from-gray-100 to-slate-200 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <FiCheckCircle className="text-gray-600" size={48} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No Matching Closed Tickets' : 'No Closed Tickets Found'}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchTerm 
                  ? `No closed tickets match your search criteria "${searchTerm}"`
                  : 'There are no closed tickets at the moment. All resolved cases will appear here.'
                }
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gradient-to-r from-gray-50 to-slate-50">
                    <tr>
                      <SortableHeader sortKey="ticket_number">Ticket</SortableHeader>
                      <SortableHeader sortKey="user_name">User</SortableHeader>
                      <SortableHeader sortKey="recipient_type">Recipient</SortableHeader>
                      <SortableHeader sortKey="subject">Subject</SortableHeader>
                      <SortableHeader sortKey="priority">Priority</SortableHeader>
                      <SortableHeader sortKey="created_at">Date</SortableHeader>
                      <th className="py-4 px-4 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedTickets.map((ticket, index) => (
                      <tr key={ticket.id} className={`hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-slate-50/50 transition-all duration-300 ${
                        ticket.user_role === 'admin' ? 'bg-red-50/30' : ''
                      }`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <div className="p-1 bg-gradient-to-r from-gray-100 to-slate-100 rounded-lg flex-shrink-0">
                              <FiCheckCircle className="text-gray-600" size={12} />
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
                        <td className="px-4 py-3">
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
                                 ticket.user_role === 'business' ? 'Biz' :
                                 ticket.user_role === 'company' ? 'Co' : 'Admin'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <div className="p-1 bg-gradient-to-r from-gray-100 to-slate-100 rounded-lg flex-shrink-0">
                              {ticket.recipient_type === 'company' ? <FiHome className="text-green-600" size={12} /> : <FiShield className="text-red-600" size={12} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-gray-900 truncate" title={ticket.recipient_type === 'company' && ticket.company_name ? ticket.company_name : ticket.recipient_name}>
                                {ticket.recipient_type === 'company' && ticket.company_name 
                                  ? ticket.company_name 
                                  : ticket.recipient_name
                                }
                              </div>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                ticket.recipient_type === 'company' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {ticket.recipient_type === 'company' ? 'Company' : 'Admin'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-gray-900 truncate mb-1" title={ticket.subject}>
                              {ticket.subject}
                            </div>
                            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg inline-block capitalize truncate max-w-full">
                              {ticket.category}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-bold rounded-full ${
                            ticket.priority === 'low' ? 'bg-green-100 text-green-800' :
                            ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {ticket.priority?.charAt(0).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-medium text-gray-900 truncate">
                            {new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {new Date(ticket.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => openDetailsModal(ticket)}
                              className="p-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg flex-shrink-0"
                              title="View Details"
                            >
                              <FiEye size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Enhanced Pagination */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-bold text-gray-600">{sortedTickets.length > 0 ? startEntry : 0}</span> to{' '}
                    <span className="font-bold text-gray-600">{endEntry}</span> of{' '}
                    <span className="font-bold text-gray-600">{sortedTickets.length}</span> results
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
                                ? 'bg-gradient-to-r from-gray-500 to-slate-600 text-white shadow-lg transform scale-105'
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
            <div className="bg-gradient-to-r from-gray-500 via-slate-600 to-gray-500 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <FiCheckCircle className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Closed Ticket {selectedTicket.ticket_number}</h2>
                  <p className="text-gray-100">Resolved ticket details & history</p>
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
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-xl border border-gray-200">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Ticket Information</label>
                    <div className="space-y-2">
                      <p className="text-lg font-semibold text-gray-900">{selectedTicket.ticket_number}</p>
                      <p className="text-sm text-gray-600">Created: {new Date(selectedTicket.created_at).toLocaleString()}</p>
                      <div className="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-800">
                        <FiCheckCircle className="mr-1" size={12} />
                        Closed
                      </div>
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
                      <div className="p-3 bg-gradient-to-r from-gray-100 to-slate-100 rounded-xl">
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
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-200">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Priority</label>
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full ${
                        selectedTicket.priority === 'low' ? 'bg-green-100 text-green-800' :
                        selectedTicket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        selectedTicket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedTicket.priority?.charAt(0).toUpperCase() + selectedTicket.priority?.slice(1)}
                      </span>
                    </div>
                    
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-200">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                      <p className="text-sm font-semibold text-gray-900 capitalize bg-white px-3 py-1 rounded-lg">{selectedTicket.category}</p>
                    </div>
                  </div>

                  {/* Special Admin Alert */}
                  {selectedTicket.user_role === 'admin' && (
                    <div className="bg-gradient-to-r from-red-100 to-pink-100 p-6 rounded-xl border-2 border-red-300">
                      <div className="flex items-center space-x-3">
                        <FiShield className="text-red-600" size={24} />
                        <div>
                          <p className="font-bold text-red-800">⚠️ ADMIN TICKET</p>
                          <p className="text-sm text-red-700">This ticket was created by an admin user</p>
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
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                      <label className="block text-sm font-bold text-gray-700 mb-3">Admin Response</label>
                      <div className="bg-white p-4 rounded-lg border border-green-300">
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedTicket.admin_response}</p>
                        {selectedTicket.responded_at && (
                          <p className="text-sm text-green-600 mt-3 font-medium">
                            Responded on {new Date(selectedTicket.responded_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-8 py-6 flex justify-end border-t border-gray-200">
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
    </div>
  );
};

export default ClosedTickets;