import { useState, useEffect } from 'react';
import { 
  FiMessageSquare, FiRefreshCw, FiSearch, FiSend, FiEye, FiUser, 
  FiClock, FiChevronUp, FiChevronDown, FiX, FiCheckCircle, 
  FiAlertTriangle, FiStar, FiMail, FiBriefcase, FiHome
} from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const MyTickets = () => {
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
 

  // Modal states
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [companyResponse, setCompanyResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCompanyTickets();
  }, []);

  const fetchCompanyTickets = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/tickets/company/received');
      setTickets(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to fetch company tickets');
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

      // Update local state
      setTickets(tickets.map(ticket => 
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

  // User type functions
  const getUserTypeIcon = (role) => {
    switch (role) {
      case 'user':
        return <FiUser className="text-black" />;
      case 'business':
        return <FiBriefcase className="text-black" />;
      case 'company':
        return <FiHome className="text-black" />;
      default:
        return <FiUser className="text-black" />;
    }
  };

  const getUserTypeBadge = (role) => {
    const configs = {
      user: { bg: 'bg-white', text: 'text-black', label: 'Regular User' },
      business: { bg: 'bg-white', text: 'text-black', label: 'Business Owner' },
      company: { bg: 'bg-white', text: 'text-black', label: 'Company Member' }
    };
    
    const config = configs[role] || { bg: 'bg-white', text: 'text-black', label: 'Unknown' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-black ${config.bg} ${config.text}`}>
        {getUserTypeIcon(role)}
        <span className="ml-1">{config.label}</span>
      </span>
    );
  };

  // Data processing with enhanced filtering
  const filteredTickets = tickets.filter(ticket => {
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
    <th className="py-1 px-2 text-left font-semibold cursor-pointer hover:bg-black transition-colors duration-200 text-xs" onClick={() => handleSort(sortKey)}>
      <div className="flex items-center text-white">
        {children}
        {sortConfig.key === sortKey ? (
          sortConfig.direction === 'ascending' ? 
            <FiChevronUp className="ml-1 text-white" size={12} /> : 
            <FiChevronDown className="ml-1 text-white" size={12} />
        ) : null}
      </div>
    </th>
  );

  const getStatusBadge = (status) => {
    const statusConfigs = {
      pending: { 
        bg: 'bg-[#bca142]', 
        text: 'text-white', 
        border: 'border-[#bca142]',
        icon: <FiClock className="mr-1" size={12} />
      },
      answered: { 
        bg: 'bg-[#bca142]', 
        text: 'text-white', 
        border: 'border-[#bca142]',
        icon: <FiMessageSquare className="mr-1" size={12} />
      },
      closed: { 
        bg: 'bg-black', 
        text: 'text-white', 
        border: 'border-black',
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
        bg: 'bg-[#bca142]', 
        text: 'text-white', 
        border: 'border-[#bca142]',
        icon: <FiStar className="mr-1" size={12} />
      },
      medium: { 
        bg: 'bg-[#bca142]', 
        text: 'text-white', 
        border: 'border-[#bca142]',
        icon: <FiStar className="mr-1" size={12} />
      },
      high: { 
        bg: 'bg-black', 
        text: 'text-white', 
        border: 'border-black',
        icon: <FiStar className="mr-1" size={12} />
      },
      urgent: { 
        bg: 'bg-black', 
        text: 'text-white', 
        border: 'border-black',
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
    };
  };

  const counts = getFilterCounts();
  const userTypeCounts = getUserTypeCounts();
  const totalPages = Math.ceil(sortedTickets.length / itemsPerPage);
  const startEntry = (currentPage - 1) * itemsPerPage + 1;
  const endEntry = Math.min(startEntry + itemsPerPage - 1, sortedTickets.length);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#bca142] mx-auto"></div>
            <FiMail className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#bca142] animate-pulse" size={20} />
          </div>
          <p className="mt-3 text-base font-medium text-gray-700 animate-pulse">Loading Company Tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <FiAlertTriangle className="mx-auto text-black mb-3" size={40} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Tickets</h3>
          <p className="text-black mb-3 text-sm">{error}</p>
          <button 
            onClick={fetchCompanyTickets}
            className="bg-[#bca142] text-white px-5 py-2 rounded-lg font-semibold hover:bg-black transition-all duration-300 text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-1">
      <div className="max-w-7xl mx-auto">
        {/* Minimal Header */}
        <div className="bg-white border border-gray-200 rounded-md shadow-md p-2 mb-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-[#bca142] rounded-md">
                <FiHome className="text-white" size={16} />
              </div>
              <h1 className="text-lg font-bold text-gray-800">My Tickets</h1>
            </div>
            <button 
              onClick={fetchCompanyTickets}
              className="flex items-center space-x-1 bg-[#bca142] text-white font-medium py-1 px-3 rounded-md hover:bg-black transition-all duration-300 text-xs"
            >
              <FiRefreshCw size={12} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Ultra Compact Stats */}
        <div className="grid grid-cols-4 gap-1 mb-2">
          {[
            { label: 'Total', value: counts.all, icon: FiMail, color: '#bca142' },
            { label: 'Pending', value: counts.pending, icon: FiClock, color: '#bca142' },
            { label: 'Answered', value: counts.answered, icon: FiMessageSquare, color: '#bca142' },
            { label: 'Closed', value: counts.closed, icon: FiCheckCircle, color: 'black' }
          ].map((stat, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-md shadow-sm p-2 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">{stat.label}</p>
                  <p className="text-sm font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-1 rounded-md`} style={{ backgroundColor: stat.color }}>
                  <stat.icon className="text-white" size={12} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Ultra Compact Filters */}
        <div className="bg-white border border-gray-200 rounded-md shadow-md p-2 mb-2">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-1 lg:space-y-0 lg:space-x-2">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-6 pr-2 py-1 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#bca142] focus:border-transparent transition-all duration-300 text-xs"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center space-x-1">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="px-2 py-1 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#bca142] transition-all duration-300 text-xs"
              >
                <option value="all">All ({counts.all})</option>
                <option value="pending">Pending ({counts.pending})</option>
                <option value="answered">Answered ({counts.answered})</option>
                <option value="closed">Closed ({counts.closed})</option>
              </select>

              <select
                value={userTypeFilter}
                onChange={(e) => { setUserTypeFilter(e.target.value); setCurrentPage(1); }}
                className="px-2 py-1 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#bca142] transition-all duration-300 text-xs"
              >
                <option value="all">All Types</option>
                <option value="user">Users</option>
                <option value="business">Business</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
                className="px-2 py-1 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#bca142] transition-all duration-300 text-xs"
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
                className="px-2 py-1 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#bca142] transition-all duration-300 text-xs"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>

              <button
                onClick={resetFilters}
                className="flex items-center space-x-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-all duration-300 text-xs"
              >
                <FiX size={10} />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Ultra Compact Tickets Table */}
        <div className="bg-white border border-gray-200 rounded-md shadow-md overflow-hidden">
          {sortedTickets.length === 0 ? (
            <div className="text-center py-8">
              <div className="p-2 bg-[#bca142] rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <FiMail className="text-white" size={24} />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {searchTerm ? 'No Matching Tickets' : 'No Tickets Found'}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto text-xs">
                {searchTerm 
                  ? `No tickets match "${searchTerm}"`
                  : 'No customers have sent support tickets yet.'
                }
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#bca142]">
                    <tr>
                      <SortableHeader sortKey="ticket_number">Ticket</SortableHeader>
                      <SortableHeader sortKey="user_name">Customer</SortableHeader>
                      <SortableHeader sortKey="priority">Priority</SortableHeader>
                      <SortableHeader sortKey="status">Status</SortableHeader>
                      <SortableHeader sortKey="created_at">Date</SortableHeader>
                      <th className="py-1 px-2 text-left font-semibold text-xs text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedTickets.map((ticket, index) => (
                      <tr key={ticket.id} className="hover:bg-gray-50 transition-all duration-300">
                        <td className="px-2 py-1">
                          <div className="flex items-center space-x-1">
                            <div className="p-1 bg-[#bca142] rounded-md">
                              <FiMail className="text-white" size={10} />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-gray-900">{ticket.ticket_number}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(ticket.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-1">
                          <div className="flex items-center space-x-1">
                            <div className="p-1 bg-white border border-gray-200 rounded-md">
                              {getUserTypeIcon(ticket.user_role)}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-900">{ticket.user_name}</div>
                              <div className="text-xs text-gray-500">{ticket.user_email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-1">
                          {getPriorityBadge(ticket.priority)}
                        </td>
                        <td className="px-2 py-1">
                          {getStatusBadge(ticket.status)}
                        </td>
                        <td className="px-2 py-1">
                          <div className="text-xs font-medium text-gray-900">
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(ticket.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </td>
                        <td className="px-2 py-1">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => openDetailsModal(ticket)}
                              className="p-1 bg-black text-white rounded-md hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 shadow-sm"
                              title="View Details"
                            >
                              <FiEye size={10} />
                            </button>
                            <button
                              onClick={() => openResponseModal(ticket)}
                              className="p-1 bg-[#bca142] text-white rounded-md hover:bg-black transition-all duration-300 transform hover:scale-105 shadow-sm"
                              title="Respond"
                            >
                              <FiMessageSquare size={10} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Ultra Compact Pagination */}
              <div className="bg-[#bca142] px-3 py-2 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-1 sm:space-y-0">
                  <div className="text-xs text-white">
                    Showing <span className="font-bold text-white">{sortedTickets.length > 0 ? startEntry : 0}</span> to{' '}
                    <span className="font-bold text-white">{endEntry}</span> of{' '}
                    <span className="font-bold text-white">{sortedTickets.length}</span> results
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="flex items-center space-x-1 px-2 py-1 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      <span>Prev</span>
                    </button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage <= 2) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 1) {
                          pageNum = totalPages - 2 + i;
                        } else {
                          pageNum = currentPage - 1 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-2 py-1 text-xs font-medium rounded-md transition-all duration-300 ${
                              currentPage === pageNum
                                ? 'bg-black text-white shadow-sm transform scale-105'
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
                      className="flex items-center space-x-1 px-2 py-1 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
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

      {/* Compact Ticket Details Modal */}
      {isDetailsModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-lg rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
            <div className="bg-[#bca142] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FiMail className="text-white" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Ticket Details {selectedTicket.ticket_number}</h2>
                  <p className="text-white text-sm">Customer support request</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-all duration-300"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 p-4 rounded-lg">
                    <label className="block text-xs font-bold text-gray-700 mb-2">Ticket Information</label>
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-gray-900">{selectedTicket.ticket_number}</p>
                      <p className="text-xs text-gray-600">Created: {new Date(selectedTicket.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 p-4 rounded-lg">
                    <label className="block text-xs font-bold text-gray-700 mb-2">Customer Information</label>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white border border-gray-200 rounded-lg">
                        {getUserTypeIcon(selectedTicket.user_role)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{selectedTicket.user_name}</p>
                        <p className="text-xs text-gray-600 mb-1">{selectedTicket.user_email}</p>
                        {getUserTypeBadge(selectedTicket.user_role)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 p-4 rounded-lg">
                    <label className="block text-xs font-bold text-gray-700 mb-2">Subject</label>
                    <p className="text-sm font-semibold text-gray-900">{selectedTicket.subject}</p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white border border-gray-200 p-3 rounded-lg">
                      <label className="block text-xs font-bold text-gray-700 mb-2">Status</label>
                      {getStatusBadge(selectedTicket.status)}
                    </div>
                    
                    <div className="bg-white border border-gray-200 p-3 rounded-lg">
                      <label className="block text-xs font-bold text-gray-700 mb-2">Priority</label>
                      {getPriorityBadge(selectedTicket.priority)}
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 p-4 rounded-lg">
                    <label className="block text-xs font-bold text-gray-700 mb-2">Category</label>
                    <p className="text-sm font-semibold text-gray-900 capitalize bg-gray-50 px-3 py-2 rounded-lg">{selectedTicket.category}</p>
                  </div>
                </div>

                {/* Full Width Description */}
                <div className="lg:col-span-2">
                  <div className="bg-white border border-gray-200 p-4 rounded-lg">
                    <label className="block text-xs font-bold text-gray-700 mb-2">Customer Message</label>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 max-h-32 overflow-y-auto">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">{selectedTicket.description}</p>
                    </div>
                  </div>
                </div>

                {selectedTicket.company_response && (
                  <div className="lg:col-span-2">
                    <div className="bg-white border border-gray-200 p-4 rounded-lg">
                      <label className="block text-xs font-bold text-gray-700 mb-2">Your Response</label>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">{selectedTicket.company_response}</p>
                        {selectedTicket.company_responded_at && (
                          <p className="text-xs text-[#bca142] mt-2 font-medium">
                            Responded on {new Date(selectedTicket.company_responded_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {selectedTicket.admin_response && (
                  <div className="lg:col-span-2">
                    <div className="bg-white border border-gray-200 p-4 rounded-lg">
                      <label className="block text-xs font-bold text-gray-700 mb-2">Admin Response</label>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">{selectedTicket.admin_response}</p>
                        {selectedTicket.responded_at && (
                          <p className="text-xs text-black mt-2 font-medium">
                            Admin responded on {new Date(selectedTicket.responded_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#bca142] px-6 py-4 flex justify-end border-t border-gray-200">
              <button
                onClick={closeModal}
                className="bg-black hover:bg-gray-800 text-white px-5 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg text-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compact Response Modal */}
      {isResponseModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-lg rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl border border-white/20">
            {/* Loading Overlay */}
            {submitting && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#bca142] border-t-transparent mx-auto mb-3"></div>
                  <p className="text-base font-medium text-gray-700 animate-pulse">
                    Submitting response...
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Please wait while we process your response
                  </p>
                </div>
              </div>
            )}
            
            <div className="bg-[#bca142] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FiMessageSquare className="text-white" size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Respond to Ticket {selectedTicket.ticket_number}</h3>
                  <p className="text-white text-sm">Company customer support</p>
                </div>
              </div>
              <button 
                onClick={closeModal}
                disabled={submitting}
                className={`p-2 bg-white/20 rounded-lg text-white transition-all duration-300 ${
                  submitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/30'
                }`}
              >
                <FiX size={18} />
              </button>
            </div>
            
            <div className="p-6">
              {/* Ticket Summary */}
              <div className="bg-white border border-gray-200 p-4 rounded-lg mb-4">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center text-sm">
                  <FiMail className="mr-2 text-[#bca142]" />
                  Customer Request
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-700"><strong>Ticket:</strong> {selectedTicket.ticket_number}</p>
                    <p className="text-gray-700"><strong>Customer:</strong> {selectedTicket.user_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-700"><strong>Category:</strong> {selectedTicket.category}</p>
                    <p className="text-gray-700 flex items-center">
                      <strong>Priority:</strong> 
                      <span className="ml-2">{getPriorityBadge(selectedTicket.priority)}</span>
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-gray-700 text-xs"><strong>Subject:</strong> {selectedTicket.subject}</p>
                </div>
                <div className="mt-3">
                  <strong className="text-gray-700 text-xs">Customer Message:</strong>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs max-h-24 overflow-y-auto">
                    {selectedTicket.description}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    Your Response to Customer *
                  </label>
                  <textarea
                    value={companyResponse}
                    onChange={(e) => setCompanyResponse(e.target.value)}
                    disabled={submitting}
                    className={`w-full p-3 border rounded-lg transition-all duration-300 text-sm ${
                      submitting 
                        ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                        : 'focus:ring-2 focus:ring-[#bca142] focus:border-transparent hover:border-[#bca142] bg-white'
                    }`}
                    rows="6"
                    placeholder="Enter your response to the customer. This will be sent to them and also appear in the Messages system."
                    required
                  />
                </div>
                
                <div className="bg-white border border-gray-200 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <FiMail className="text-[#bca142] mt-1" size={16} />
                    <div>
                      <p className="text-xs text-black font-medium">
                        <strong>Company Response:</strong> Your response will be sent to the customer and logged in the ticket history.
                      </p>
                      <p className="text-xs text-gray-700 mt-1">
                        This will also create a message in the Messages system for better communication tracking.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closeModal}
                  disabled={submitting}
                  className={`px-5 py-2 text-white rounded-lg font-semibold transition-all duration-300 text-sm ${
                    submitting 
                      ? 'bg-gray-400 cursor-not-allowed opacity-60' 
                      : 'bg-black hover:bg-gray-800 transform hover:scale-105 shadow-lg'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompanyResponse}
                  disabled={submitting || !companyResponse.trim()}
                  className={`px-6 py-2 text-white rounded-lg font-semibold transition-all duration-300 flex items-center justify-center min-w-[160px] text-sm ${
                    submitting || !companyResponse.trim()
                      ? 'bg-gray-400 cursor-not-allowed opacity-60' 
                      : 'bg-[#bca142] hover:bg-black transform hover:scale-105 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      <span className="animate-pulse">Submitting...</span>
                    </>
                  ) : (
                    <>
                      <FiSend className="mr-2" size={16} />
                      Send Response
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

export default MyTickets;
