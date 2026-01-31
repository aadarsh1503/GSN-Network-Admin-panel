import { useState, useEffect } from 'react';
import { 
  FaTimes,
  FaTicketAlt,
  FaPlus,
  FaFilter,
  FaSearch
} from 'react-icons/fa';
import { 
  MessageSquare,
  Send,
  CheckCircle,
  User,
  Clock,
  AlertCircle,
  Eye,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';

const BusinessTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    message: '',
    priority: 'medium',
    category: 'general',
    recipient_type: 'admin',
    recipient_id: null
  });
  const [companies, setCompanies] = useState([]);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);

  useEffect(() => {
    fetchTickets();
    fetchCompanies();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/business/help/tickets');
      setTickets(response);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/api/business/companies');
      setCompanies(response);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    
    if (!ticketForm.subject.trim() || !ticketForm.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmittingTicket(true);
      await api.post('/api/business/help/ticket', ticketForm);
      toast.success('Support ticket submitted successfully');
      setShowTicketForm(false);
      setTicketForm({
        subject: '',
        message: '',
        priority: 'medium',
        category: 'general',
        recipient_type: 'admin',
        recipient_id: null
      });
      fetchTickets();
    } catch (error) {
      console.error('Error submitting ticket:', error);
      toast.error('Failed to submit ticket');
    } finally {
      setSubmittingTicket(false);
    }
  };

  const getPriorityColor = (priority) => {
    return 'bg-[#bca142] text-white border-[#bca142]';
  };

  const getStatusColor = (status) => {
    return 'bg-[#bca142] text-white border-[#bca142]';
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getTicketStats = () => {
    const total = tickets.length;
    const pending = tickets.filter(t => t.status === 'pending').length;
    const answered = tickets.filter(t => t.status === 'answered').length;
    const closed = tickets.filter(t => t.status === 'closed').length;
    
    return { total, pending, answered, closed };
  };

  const stats = getTicketStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-200 border-t-[#bca142] mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-slate-700">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
              <FaTicketAlt className="mr-3 text-[#bca142]" />
              Support Tickets
            </h1>
            <p className="text-gray-600">
              Manage your support requests and get help from our team
            </p>
          </div>
          <button
            onClick={() => setShowTicketForm(true)}
            className="flex items-center space-x-2 bg-[#bca142] hover:bg-black text-white px-6 py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <FaPlus className="h-4 w-4" />
            <span>New Ticket</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-[#bca142]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FaTicketAlt className="h-8 w-8 text-[#bca142]" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-[#bca142]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-[#bca142]" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-[#bca142]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Answered</p>
                <p className="text-2xl font-bold text-gray-900">{stats.answered}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-[#bca142]" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-[#bca142]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Closed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.closed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-[#bca142]" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent"
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <FaFilter className="text-gray-400 h-4 w-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="answered">Answered</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            
            {/* Priority Filter */}
            <div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent"
              >
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-lg shadow-md">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12">
            <FaTicketAlt className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg mb-4">
              {tickets.length === 0 ? 'No support tickets yet' : 'No tickets match your filters'}
            </p>
            {tickets.length === 0 && (
              <button
                onClick={() => setShowTicketForm(true)}
                className="inline-flex items-center px-6 py-3 bg-[#bca142] hover:bg-black text-white font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <FaPlus className="mr-2 h-4 w-4" />
                Submit Your First Ticket
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-800">
                        #{ticket.ticket_number || ticket.id} - {ticket.subject}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(ticket.priority)}`}>
                        {getPriorityIcon(ticket.priority)}
                        <span className="ml-1">{ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}</span>
                      </span>
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(ticket.status)}`}>
                        {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                      </span>
                    </div>
                    
                    <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                      {ticket.message}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-slate-500">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>To: {ticket.recipient_name || 'Admin Support'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>Category: {ticket.category}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setShowTicketDetails(true);
                      }}
                      className="flex items-center space-x-1 px-3 py-2 text-sm bg-black hover:bg-gray-800 text-white rounded-lg transition-colors duration-200"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </button>
                  </div>
                </div>
                
                {ticket.admin_response && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-sm font-semibold text-blue-800">Admin Response</span>
                    </div>
                    <p className="text-blue-700 text-sm">{ticket.admin_response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ticket Form Modal */}
      {showTicketForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Submit Support Ticket</h3>
              <button
                onClick={() => setShowTicketForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleTicketSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                  placeholder="Brief description of your issue"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                  >
                    <option value="general">General</option>
                    <option value="quotes">Quote Issues</option>
                    <option value="technical">Technical</option>
                    <option value="account">Account</option>
                    <option value="billing">Billing</option>
                    <option value="feature">Feature Request</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Send Ticket To
                </label>
                <select
                  value={ticketForm.recipient_type}
                  onChange={(e) => {
                    setTicketForm(prev => ({ 
                      ...prev, 
                      recipient_type: e.target.value,
                      recipient_id: e.target.value === 'admin' ? null : prev.recipient_id
                    }));
                  }}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                >
                  <option value="admin">Admin Support</option>
                  <option value="company">Company Member</option>
                </select>
              </div>

              {ticketForm.recipient_type === 'company' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Company
                  </label>
                  <select
                    value={ticketForm.recipient_id || ''}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, recipient_id: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                    required={ticketForm.recipient_type === 'company'}
                  >
                    <option value="">Select a company...</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name} ({company.email}) - {company.quote_responses_count} interactions
                      </option>
                    ))}
                  </select>
                  {companies.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      No companies found. You need to have received quote responses from companies to send them tickets.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  value={ticketForm.message}
                  onChange={(e) => setTicketForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                  placeholder="Describe your issue in detail..."
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowTicketForm(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="flex-1 px-4 py-3 bg-[#bca142] hover:bg-black text-white rounded-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
                >
                  {submittingTicket ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Ticket
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Details Modal */}
      {showTicketDetails && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-3xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                Ticket #{selectedTicket.ticket_number || selectedTicket.id}
              </h3>
              <button
                onClick={() => setShowTicketDetails(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(selectedTicket.status)}`}>
                  {selectedTicket.status.charAt(0).toUpperCase() + selectedTicket.status.slice(1)}
                </span>
                <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full border ${getPriorityColor(selectedTicket.priority)}`}>
                  {getPriorityIcon(selectedTicket.priority)}
                  <span className="ml-1">{selectedTicket.priority.charAt(0).toUpperCase() + selectedTicket.priority.slice(1)}</span>
                </span>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Subject</h4>
                <p className="text-gray-700">{selectedTicket.subject}</p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Message</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">Category</h4>
                  <p className="text-gray-600">{selectedTicket.category}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">Recipient</h4>
                  <p className="text-gray-600">{selectedTicket.recipient_name || 'Admin Support'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">Created</h4>
                  <p className="text-gray-600">{new Date(selectedTicket.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">Last Updated</h4>
                  <p className="text-gray-600">{new Date(selectedTicket.updated_at).toLocaleString()}</p>
                </div>
              </div>

              {selectedTicket.admin_response && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Admin Response</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-700 whitespace-pre-wrap">{selectedTicket.admin_response}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowTicketDetails(false)}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-all duration-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessTickets;