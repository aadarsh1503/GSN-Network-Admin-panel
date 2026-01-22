import { useState, useEffect, useMemo } from 'react';
import { 
  FiEye, FiEdit, FiChevronUp, FiChevronDown, FiMessageSquare, 
  FiSearch, FiFilter, FiRefreshCw, FiUsers, FiBriefcase, 
  FiHome, FiShield, FiZap, FiTrendingUp, FiX, FiClock,
  FiCheckCircle, FiAlertTriangle, FiStar, FiMail, FiTrash2, FiUser
} from 'react-icons/fi';
import api from '../../utils/api';

const PendingTickets = () => {
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
      // Filter only pending tickets
      const pendingTickets = data.filter(ticket => ticket.status === 'pending');
      setTickets(pendingTickets);
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
      user: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'User' },
      business: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Biz' },
      company: { bg: 'bg-green-100', text: 'text-green-800', label: 'Co' },
      admin: { bg: 'bg-red-100', text: 'text-red-800', label: 'Admin' }
    };
    
    const config = configs[role] || { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Unknown' };
    
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {getUserTypeIcon(role)}
        <span className="ml-1">{config.label}</span>
      </span>
    );
  };

  const getRecipientBadge = (recipientType) => {
    const configs = {
      admin: { bg: 'bg-red-100', text: 'text-red-800', label: 'Admin', icon: <FiShield className="mr-1" size={12} /> },
      company: { bg: 'bg-green-100', text: 'text-green-800', label: 'Company', icon: <FiHome className="mr-1" size={12} /> }
    };
    
    const config = configs[recipientType] || configs.admin;
    
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
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
    <th className="py-4 px-4 text-left font-semibold cursor-pointer hover:bg-yellow-100 transition-colors duration-200" onClick={() => handleSort(sortKey)}>
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

  const totalPages = Math.ceil(sortedTickets.length / itemsPerPage);
  const startEntry = (currentPage - 1) * itemsPerPage + 1;
  const endEntry = Math.min(startEntry + itemsPerPage - 1, sortedTickets.length);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-200 border-t-yellow-600 mx-auto"></div>
            <FiClock className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-yellow-600 animate-pulse" size={24} />
          </div>
          <p className="mt-4 text-lg font-medium text-gray-700 animate-pulse">Loading Pending Tickets...</p>
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
            onClick={fetchTickets}
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
      <div className="max-w-6xl mx-auto">
        {/* Futuristic Header */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-xl">
                <FiClock className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Pending Tickets
                </h1>
                <p className="text-gray-600 mt-1">Tickets awaiting admin response</p>
              </div>
            </div>
            <button 
              onClick={fetchTickets}
              className="flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-yellow-600 hover:to-amber-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <FiRefreshCw size={20} />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 p-6 mb-8 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pending Tickets</p>
              <p className="text-3xl font-bold text-gray-900">{tickets.length}</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-lg">
              <FiClock className="text-white" size={24} />
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0 lg:space-x-6">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search pending tickets..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center space-x-4">
              <select
                value={userTypeFilter}
                onChange={(e) => { setUserTypeFilter(e.target.value); setCurrentPage(1); }}
                className="px-4 py-2 bg-white/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300"
              >
                <option value="all">All User Types</option>
                <option value="user">Regular Users</option>
                <option value="business">Business Owners</option>
                <option value="company">Company Members</option>
                <option value="admin">Admins</option>
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

        {/* Futuristic Tickets Table */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {sortedTickets.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 bg-gradient-to-r from-yellow-100 to-amber-200 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <FiClock className="text-yellow-600" size={48} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Tickets</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchTerm 
                  ? `No pending tickets match your search criteria "${searchTerm}"`
                  : 'All tickets have been processed. Great work!'
                }
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gradient-to-r from-yellow-50 to-amber-50">
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
                      <tr key={ticket.id} className={`hover:bg-gradient-to-r hover:from-yellow-50/50 hover:to-amber-50/50 transition-all duration-300 ${
                        ticket.user_role === 'admin' ? 'bg-red-50/30' : ''
                      }`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <div className="p-1 bg-gradient-to-r from-yellow-100 to-amber-100 rounded-lg flex-shrink-0">
                              <FiMail className="text-yellow-600" size={12} />
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
                              {getUserTypeBadge(ticket.user_role)}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <div className="p-1 bg-gradient-to-r from-yellow-100 to-amber-100 rounded-lg flex-shrink-0">
                              {ticket.recipient_type === 'company' ? <FiHome className="text-green-600" size={12} /> : <FiShield className="text-red-600" size={12} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-gray-900 truncate" title={ticket.recipient_type === 'company' && ticket.company_name ? ticket.company_name : ticket.recipient_name}>
                                {ticket.recipient_type === 'company' && ticket.company_name 
                                  ? ticket.company_name 
                                  : ticket.recipient_name
                                }
                              </div>
                              {getRecipientBadge(ticket.recipient_type)}
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
                            <button
                              onClick={() => openResponseModal(ticket)}
                              className="p-1.5 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-lg hover:from-yellow-600 hover:to-amber-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex-shrink-0"
                              title="Respond"
                            >
                              <FiMessageSquare size={12} />
                            </button>
                            <button
                              onClick={() => {
                                setTicketToDelete(ticket);
                                setShowDeleteModal(true);
                              }}
                              className="p-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg flex-shrink-0"
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
    </div>
  );
};

export default PendingTickets;