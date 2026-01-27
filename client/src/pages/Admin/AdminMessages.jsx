import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  FiMessageSquare, FiRefreshCw, FiSearch, FiSend,
  FiUser, FiClock, FiChevronLeft, FiShield, FiUsers, FiBriefcase
} from 'react-icons/fi';
import { FaCheck, FaClock, FaCrown } from 'react-icons/fa';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import RoleBadge from '../../components/RoleBadge/RoleBadge';
import UserAvatar from '../../components/UserAvatar/UserAvatar';
import { getConversationHeaderInfo, getMessageSenderInfo } from '../../utils/userRoleUtils';

const AdminMessages = () => {
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [conversationLoading, setConversationLoading] = useState(false); // New loading state for conversations
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('all');
  const [userFilter, setUserFilter] = useState('all');

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  useEffect(() => {
    fetchAllUsers();
    fetchConversations();
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [allUsers, searchTerm, userFilter]);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const recipientId = urlParams.get('recipient');
    const recipientName = urlParams.get('name');
    
    if (recipientId && recipientName) {
      startConversationWithUser(parseInt(recipientId), decodeURIComponent(recipientName));
    }
  }, [location.search]);

  const fetchAllUsers = async () => {
    try {
      const data = await api.get('/api/admin/all-users-for-messaging');
      console.log('Fetched users for messaging:', data);
      console.log('Total users:', data.length);
      console.log('Active subscribers:', data.filter(u => u.subscription_status === 'active').length);
      console.log('Sample user with subscription:', data.find(u => u.subscription_status === 'active'));
      setAllUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      try {
        const fallbackData = await api.get('/api/user/all');
        setAllUsers(Array.isArray(fallbackData) ? fallbackData : []);
      } catch (fallbackError) {
        console.error('Error fetching fallback users:', fallbackError);
        toast.error('Failed to load users');
        setAllUsers([]);
      }
    }
  };

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/messages/conversations');
      setConversations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to fetch conversations');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await api.get('/api/messages/unread-count');
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchConversation = async (userId) => {
    setConversationLoading(true); // Start loading
    try {
      const data = await api.get(`/api/messages/conversation/${userId}`);
      setConversationMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      setConversationMessages([]);
      toast.error('Failed to fetch conversation');
    } finally {
      setConversationLoading(false); // End loading
    }
  };

  const filterUsers = () => {
    let filtered = allUsers;
    console.log('Filtering users. Total:', allUsers.length);

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    switch (userFilter) {
      case 'active':
        filtered = filtered.filter(user => user.status === 1);
        break;
      case 'subscribers':
        // More comprehensive check for active subscribers
        filtered = filtered.filter(user => {
          const hasActiveSubscription = user.subscription_status === 'active';
          const hasValidPlan = user.plan_name && user.plan_name !== null;
          const hasValidExpiry = user.subscription_expires && new Date(user.subscription_expires) > new Date();
          
          console.log(`User ${user.name}: subscription_status=${user.subscription_status}, plan_name=${user.plan_name}, expires=${user.subscription_expires}`);
          
          return hasActiveSubscription || (hasValidPlan && hasValidExpiry);
        });
        console.log('Filtered subscribers:', filtered.length);
        break;
      case 'companies':
        filtered = filtered.filter(user => user.role === 'company');
        break;
      case 'business':
        filtered = filtered.filter(user => user.role === 'business');
        break;
      case 'users':
        filtered = filtered.filter(user => user.role === 'user');
        break;
      default:
        break;
    }

    console.log('Final filtered count:', filtered.length);
    setFilteredUsers(filtered);
  };

  const startConversationWithUser = async (userId, userName, userLogo = null, userRole = 'user') => {
    setSelectedConversation({
      userId: userId,
      userName: userName,
      logo: userLogo,
      userRole: userRole
    });
    
    await fetchConversation(userId);
    setActiveTab('conversations');
    toast.success(`Started conversation with ${userName}`);
    
    // Auto-scroll to bottom after starting conversation
    setTimeout(scrollToBottom, 100);
  };

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation({
      userId: conversation.other_user_id,
      userName: conversation.other_user_name,
      logo: conversation.other_user_logo,
      userRole: conversation.other_user_role || 'user'
    });
    
    await fetchConversation(conversation.other_user_id);

    if (conversation.unread_count > 0) {
      try {
        await api.put(`/api/messages/conversation/${conversation.other_user_id}/read`);
        fetchUnreadCount();
        fetchConversations();
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }

    // Auto-scroll to bottom after selecting conversation
    setTimeout(scrollToBottom, 100);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSendingMessage(true);
    try {
      await api.post('/api/messages/send', {
        receiverId: selectedConversation.userId,
        subject: null,
        message: newMessage,
        quoteId: null
      });

      setNewMessage('');
      await fetchConversation(selectedConversation.userId);
      await fetchConversations();
      toast.success('Message sent!');
      
      // Auto-scroll to bottom after sending message
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const getUserTypeIcon = (user) => {
    switch (user.role) {
      case 'company':
        return <FiBriefcase className="text-blue-500" size={16} />;
      case 'admin':
        return <FaCrown className="text-yellow-500" size={16} />;
      default:
        return <FiUser className="text-gray-500" size={16} />;
    }
  };

  const getUserStatusBadge = (user) => {
    // Removed active and premium status badges
    return null;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 86400000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diff < 604800000) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const isSystemMessage = (message) => {
    return (message.subject && (
      message.subject.includes('Quote Response') ||
      message.subject.includes('Status Update') ||
      (message.subject.includes('Quote #') && !message.subject.includes('Accepted')) || // Exclude "Quote #X Accepted" messages
      message.subject.includes('Dispute #') ||
      message.subject.includes('Ticket Response') ||
      message.subject.includes('Company Ticket Response')
    )) || message.ticket_id;
  };

  const getSystemMessageType = (message) => {
    if (message.ticket_id || message.subject?.includes('Ticket Response') || message.subject?.includes('Company Ticket Response')) return 'ticket';
    if (message.subject?.includes('Quote Response')) return 'response';
    if (message.subject?.includes('Status Update')) return 'status';
    if (message.subject?.includes('Dispute #')) return 'dispute';
    return 'system';
  };

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const filteredConversations = conversations.filter(conv => {
    return conv.other_user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           conv.last_message?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="p-2">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 overflow-hidden">
            <div className="flex h-[calc(100vh-80px)]">
              <aside className="w-80 flex-shrink-0 border-r border-gray-200/50 flex flex-col bg-gradient-to-b from-white/80 to-gray-50/50 backdrop-blur-sm">
                <header className="flex items-center justify-between p-3 border-b border-gray-200/50 bg-gradient-to-r from-[#CDA435] to-[#D9B95B] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#CDA435]/90 to-[#D9B95B]/90 backdrop-blur-sm"></div>
                  <div className="flex items-center gap-2 relative z-10">
                    <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <FiMessageSquare className="text-white" size={14} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">Messages</h2>
                      {unreadCount > 0 && (
                        <span className="bg-white/90 text-[#CDA435] text-xs px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      fetchAllUsers();
                      fetchConversations();
                      fetchUnreadCount();
                    }}
                    className="text-white/90 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all duration-200 backdrop-blur-sm relative z-10"
                    title="Refresh"
                  >
                    <FiRefreshCw size={18} />
                  </button>
                </header>

                <div className="border-b border-gray-200/50 bg-white/50 backdrop-blur-sm">
                  <nav className="flex">
                    {[
                      { key: 'all', label: 'All Users', icon: FiUsers },
                      { key: 'conversations', label: 'Chats', icon: FiMessageSquare }
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-sm font-medium border-b-2 transition-all duration-300 ${
                          activeTab === tab.key
                            ? 'border-[#CDA435] text-[#CDA435] bg-gradient-to-t from-[#CDA435]/5 to-transparent shadow-sm'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-white/50'
                        }`}
                      >
                        <tab.icon size={14} />
                        {tab.label}
                        {tab.key === 'conversations' && conversations.length > 0 && (
                          <span className="bg-gradient-to-r from-[#CDA435] to-[#D9B95B] text-white text-xs px-1.5 py-0.5 rounded-full font-medium shadow-sm">
                            {conversations.length}
                          </span>
                        )}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="p-3 border-b border-gray-200/50 bg-gradient-to-r from-white/80 to-gray-50/50 backdrop-blur-sm">
                  <div className="relative mb-2">
                    <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                    <input 
                      type="text" 
                      placeholder={activeTab === 'all' ? "Search users..." : "Search conversations..."} 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white/80 backdrop-blur-sm rounded-lg py-2 pl-8 pr-3 border border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-[#CDA435]/50 focus:border-[#CDA435]/50 shadow-sm transition-all duration-200 placeholder-gray-400 text-sm"
                    />
                  </div>
                  
                  {activeTab === 'all' && (
                    <div className="flex gap-2">
                      <select
                        value={userFilter}
                        onChange={(e) => setUserFilter(e.target.value)}
                        className="flex-1 bg-white/80 backdrop-blur-sm rounded-lg py-2 px-2.5 text-sm border border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-[#CDA435]/50 focus:border-[#CDA435]/50 shadow-sm transition-all duration-200"
                      >
                        <option value="all">All Users ({allUsers.length})</option>
                        <option value="active">Active Users</option>
                        <option value="subscribers">Premium Subscribers</option>
                        <option value="companies">Logistics Companies</option>
                        <option value="business">Business Users</option>
                        <option value="users">Regular Members</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto">
                  {activeTab === 'all' ? (
                    <div className="p-3">
                      <div className="px-3 py-2 mb-3 bg-gradient-to-r from-[#CDA435]/10 via-[#D9B95B]/10 to-[#CDA435]/10 rounded-lg border border-[#CDA435]/20 backdrop-blur-sm">
                        <p className="text-xs text-gray-700 font-medium">
                          Showing <span className="font-bold text-[#CDA435]">{filteredUsers.length}</span> users
                          {userFilter !== 'all' && <span className="text-[#D9B95B]"> ({userFilter})</span>}
                          {searchTerm && <span className="text-gray-600"> matching "{searchTerm}"</span>}
                        </p>
                      </div>
                      
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="relative">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#CDA435]/20 border-t-[#CDA435] mx-auto mb-3"></div>
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#CDA435]/10 to-[#D9B95B]/10 blur-xl"></div>
                          </div>
                          <p className="text-gray-500 font-medium text-sm">Loading users...</p>
                        </div>
                      ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <div className="w-12 h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <FiUsers size={24} className="text-gray-400" />
                          </div>
                          <p className="text-base font-medium text-gray-600 mb-1">No users found</p>
                          {searchTerm && <p className="text-xs text-gray-400">Try adjusting your search criteria</p>}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {filteredUsers.map((user) => (
                            <div
                              key={user.id}
                              onClick={() => startConversationWithUser(user.id, user.name, user.logo, user.role)}
                              className="p-3 rounded-lg cursor-pointer bg-white/60 backdrop-blur-sm border border-gray-200/50 hover:bg-gradient-to-r hover:from-[#CDA435]/5 hover:to-[#D9B95B]/5 hover:border-[#CDA435]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#CDA435]/10 group"
                            >
                              <div className="flex items-start gap-3">
                                <UserAvatar 
                                  user={user}
                                  size="md"
                                  showRoleIndicator={true}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-[#CDA435] transition-colors duration-300 text-sm">
                                      {user.name}
                                    </h3>
                                    <RoleBadge 
                                      role={user.role}
                                      user={user}
                                      size="sm"
                                      showIcon={true}
                                      showPremium={true}
                                    />
                                  </div>
                                  <p className="text-xs text-gray-500 truncate mb-2">{user.email}</p>
                                  
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      {getUserStatusBadge(user)}
                                      {user.subscription_status === 'active' && user.plan_name && (
                                        <span className="bg-gradient-to-r from-[#CDA435] to-[#D9B95B] text-white text-xs px-2 py-0.5 rounded-full font-medium shadow-sm">
                                          {user.plan_name}
                                        </span>
                                      )}
                                    </div>
                                    <button className="text-[#CDA435] hover:text-[#D9B95B] p-1.5 rounded-lg hover:bg-[#CDA435]/10 transition-all duration-300 group-hover:shadow-sm">
                                      <FiMessageSquare size={16} />
                                    </button>
                                  </div>
                                  
                                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                    <FiClock size={10} />
                                    Joined {new Date(user.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3">
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="relative">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#CDA435]/20 border-t-[#CDA435] mx-auto mb-3"></div>
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#CDA435]/10 to-[#D9B95B]/10 blur-xl"></div>
                          </div>
                          <p className="text-gray-500 font-medium text-sm">Loading conversations...</p>
                        </div>
                      ) : filteredConversations.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <div className="w-12 h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <FiMessageSquare size={24} className="text-gray-400" />
                          </div>
                          <p className="text-base font-medium text-gray-600 mb-1">No conversations found</p>
                          {searchTerm && <p className="text-xs text-gray-400">Try adjusting your search criteria</p>}
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {filteredConversations.map((conv) => {
                            const isSelected = selectedConversation?.userId === conv.other_user_id;
                            
                            return (
                              <div
                                key={conv.other_user_id}
                                onClick={() => handleSelectConversation(conv)}
                                className={`p-3 rounded-lg cursor-pointer transition-all duration-300 border ${
                                  isSelected 
                                    ? 'bg-gradient-to-r from-[#CDA435]/10 to-[#D9B95B]/10 border-[#CDA435]/40 shadow-lg shadow-[#CDA435]/10' 
                                    : 'bg-white/60 backdrop-blur-sm border-gray-200/50 hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-white/80 hover:border-gray-300/50'
                                } ${conv.unread_count > 0 ? 'ring-2 ring-blue-200/50 bg-blue-50/30' : ''}`}
                              >
                                <div className="flex items-start gap-3">
                                  <UserAvatar 
                                    user={{
                                      name: conv.other_user_name,
                                      logo: conv.other_user_logo,
                                      role: conv.other_user_role || 'user'
                                    }}
                                    size="sm"
                                    showRoleIndicator={true}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                      <div className="flex items-center gap-1.5">
                                        <p className={`font-semibold truncate transition-colors duration-300 text-sm ${
                                          conv.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'
                                        } ${isSelected ? 'text-[#CDA435]' : ''}`}>
                                          {conv.other_user_name}
                                        </p>
                                        <RoleBadge 
                                          role={conv.other_user_role || 'user'}
                                          size="xs"
                                          showIcon={true}
                                        />
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                        <span className="text-xs text-gray-400 font-medium">
                                          {formatDate(conv.last_message_time)}
                                        </span>
                                        {conv.unread_count > 0 && (
                                          <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center font-bold shadow-sm">
                                            {conv.unread_count}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate mb-1">{conv.last_message}</p>
                                    {conv.has_system_messages && (
                                      <div className="flex items-center gap-1.5 mt-1">
                                        <div className="w-1.5 h-1.5 bg-gradient-to-r from-[#CDA435] to-[#D9B95B] rounded-full shadow-sm"></div>
                                        <span className="text-xs text-[#CDA435] font-medium">System Updates</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </aside>

              <main className="flex-1 flex flex-col bg-white/50 backdrop-blur-sm">
                {selectedConversation ? (
                  <>
                    <header className="flex items-center p-3 border-b border-gray-200/50 bg-gradient-to-r from-[#CDA435] to-[#D9B95B] relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#CDA435]/95 to-[#D9B95B]/95 backdrop-blur-sm"></div>
                      <button 
                        onClick={() => setSelectedConversation(null)}
                        className="md:hidden mr-2 text-white/90 hover:text-white transition-colors duration-200 relative z-10"
                      >
                        <FiChevronLeft size={20} />
                      </button>
                      <UserAvatar 
                        user={{
                          name: selectedConversation.userName,
                          logo: selectedConversation.logo,
                          role: selectedConversation.userRole || 'user'
                        }}
                        size="sm"
                        showRoleIndicator={true}
                        className="mr-3 relative z-10"
                      />
                      <div className="relative z-10 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h2 className="font-bold text-white text-base">{selectedConversation.userName}</h2>
                          <RoleBadge 
                            role={selectedConversation.userRole || 'user'}
                            size="xs"
                            showIcon={true}
                            className="bg-white/20 text-white border-white/30"
                          />
                        </div>
                        <p className="text-xs text-white/80">
                          {selectedConversation.userRole === 'admin' ? 'Platform Administrator' :
                           selectedConversation.userRole === 'business' ? 'Business Owner' :
                           selectedConversation.userRole === 'company' ? 'Logistics Company' :
                           'Platform Member'}
                        </p>
                      </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50/50 to-white/80 backdrop-blur-sm">
                      {conversationLoading ? (
                        // Futuristic Loader
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <div className="relative mb-6">
                              {/* Outer rotating ring */}
                              <div className="w-16 h-16 border-4 border-[#CDA435]/20 rounded-full animate-spin mx-auto relative">
                                <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-[#CDA435] rounded-full animate-spin"></div>
                                <div className="absolute top-2 left-2 w-12 h-12 border-4 border-transparent border-t-[#D9B95B] rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                              </div>
                              {/* Inner pulsing core */}
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                <div className="w-6 h-6 bg-gradient-to-r from-[#CDA435] to-[#D9B95B] rounded-full animate-pulse shadow-lg"></div>
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full animate-ping"></div>
                              </div>
                              {/* Floating particles */}
                              <div className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-[#CDA435] rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                              <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#D9B95B] rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
                              <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-[#CDA435] rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
                              <div className="absolute -bottom-1 -right-1 w-1.5 h-1.5 bg-[#D9B95B] rounded-full animate-bounce" style={{animationDelay: '1.5s'}}></div>
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-lg font-bold bg-gradient-to-r from-[#CDA435] to-[#D9B95B] bg-clip-text text-transparent">
                                Loading Conversation
                              </h3>
                              <p className="text-gray-600 font-medium text-sm">Fetching messages...</p>
                              {/* Loading dots */}
                              <div className="flex justify-center space-x-1.5">
                                <div className="w-1.5 h-1.5 bg-[#CDA435] rounded-full animate-pulse" style={{animationDelay: '0s'}}></div>
                                <div className="w-1.5 h-1.5 bg-[#D9B95B] rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                                <div className="w-1.5 h-1.5 bg-[#CDA435] rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        Array.isArray(conversationMessages) && conversationMessages.map((msg) => {
                        const isOwn = msg.sender_id === currentUser.id;
                        const isSystem = isSystemMessage(msg);
                        const systemType = getSystemMessageType(msg);
                        
                        if (isSystem) {
                          return (
                            <div key={msg.id} className="flex justify-center">
                              <div className={`max-w-[80%] rounded-lg p-3 shadow-sm border-l-4 backdrop-blur-sm ${
                                systemType === 'ticket' ? 'bg-yellow-50/80 border-yellow-500' :
                                systemType === 'response' ? 'bg-green-50/80 border-green-500' :
                                systemType === 'status' ? 'bg-blue-50/80 border-blue-500' :
                                systemType === 'dispute' ? 'bg-red-50/80 border-red-500' :
                                'bg-gradient-to-r from-[#CDA435]/10 to-[#D9B95B]/10 border-[#CDA435]'
                              }`}>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  {systemType === 'ticket' && <FiMessageSquare className="text-yellow-600" size={14} />}
                                  {systemType === 'response' && <FaCheck className="text-green-600" size={14} />}
                                  {systemType === 'status' && <FaClock className="text-blue-600" size={14} />}
                                  {systemType === 'dispute' && <FiShield className="text-red-600" size={14} />}
                                  <p className={`text-xs font-semibold ${
                                    systemType === 'ticket' ? 'text-yellow-700' :
                                    systemType === 'response' ? 'text-green-700' :
                                    systemType === 'status' ? 'text-blue-700' :
                                    systemType === 'dispute' ? 'text-red-700' :
                                    'text-[#CDA435]'
                                  }`}>
                                    {msg.subject || `Ticket ${msg.ticket_number || 'Response'}`}
                                  </p>
                                  {msg.ticket_number && (
                                    <span className="bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0.5 rounded-full font-medium">
                                      {msg.ticket_number}
                                    </span>
                                  )}
                                </div>
                                {msg.ticket_subject && (
                                  <div className="mb-1.5 p-2 bg-white/50 rounded-lg border border-yellow-200">
                                    <p className="text-xs text-yellow-700 font-medium">Ticket Subject:</p>
                                    <p className="text-sm text-gray-700">{msg.ticket_subject}</p>
                                  </div>
                                )}
                                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{msg.message}</p>
                                <p className="text-xs text-gray-500 mt-2 text-center font-medium">
                                  {formatDate(msg.created_at)}
                                </p>
                              </div>
                            </div>
                          );
                        }
                        
                        return (
                          <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] ${
                              isOwn 
                                ? 'bg-gradient-to-r from-[#CDA435] to-[#D9B95B] text-white shadow-lg' 
                                : 'bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm'
                            } rounded-xl p-3 transition-all duration-300 hover:shadow-lg`}>
                              {!isOwn && (
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <UserAvatar 
                                    user={{
                                      name: msg.sender_display_name || msg.sender_name || 'User',
                                      role: msg.sender_role || 'user'
                                    }}
                                    size="xs"
                                    showRoleIndicator={false}
                                    className="w-3 h-3"
                                  />
                                  <span className="text-xs font-semibold text-gray-600">
                                    {msg.sender_display_name || msg.sender_name || 'User'}
                                  </span>
                                  <RoleBadge 
                                    role={msg.sender_role || 'user'}
                                    size="xs"
                                    showIcon={true}
                                    className="ml-0.5"
                                  />
                                </div>
                              )}
                              {isOwn && (
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <div className="w-3 h-3 bg-white/20 rounded-md flex items-center justify-center">
                                    <FiShield size={8} />
                                  </div>
                                  <span className="text-xs font-semibold opacity-90">Admin Support</span>
                                  <RoleBadge 
                                    role="admin"
                                    size="xs"
                                    showIcon={true}
                                    className="ml-0.5 bg-white/20 text-white"
                                  />
                                </div>
                              )}
                              <p className="text-sm leading-relaxed">{msg.message}</p>
                              <p className={`text-xs mt-1.5 ${isOwn ? 'text-white/70' : 'text-gray-400'} font-medium`}>
                                {formatDate(msg.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      }))}
                      {/* Auto-scroll anchor */}
                      <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200/50 bg-white/80 backdrop-blur-sm shadow-lg">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Type a message as admin..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="flex-1 p-3 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CDA435]/50 focus:border-[#CDA435]/50 transition-all duration-300 shadow-sm bg-white/80 backdrop-blur-sm placeholder-gray-400 text-sm"
                        />
                        <button
                          type="submit"
                          disabled={sendingMessage || !newMessage.trim()}
                          className="bg-gradient-to-r from-[#CDA435] to-[#D9B95B] text-white px-4 py-3 rounded-lg hover:from-[#D9B95B] hover:to-[#CDA435] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl disabled:hover:shadow-lg font-medium"
                        >
                          {sendingMessage ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                          ) : (
                            <FiSend size={16} />
                          )}
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-gray-50/50 to-white/80 backdrop-blur-sm">
                    <div className="text-center text-gray-500 max-w-md">
                      <div className="w-20 h-20 bg-gradient-to-r from-[#CDA435] to-[#D9B95B] rounded-xl flex items-center justify-center mx-auto mb-6 shadow-xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#CDA435]/90 to-[#D9B95B]/90 backdrop-blur-sm"></div>
                        <FiShield size={40} className="text-white relative z-10" />
                      </div>
                      <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        Admin Message Center
                      </h2>
                      <p className="text-gray-500 mb-6 leading-relaxed text-sm">
                        Select a user to start messaging or view existing conversations. 
                        Manage all platform communications from this central hub.
                      </p>
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={() => setActiveTab('all')}
                          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl text-sm ${
                            activeTab === 'all' 
                              ? 'bg-gradient-to-r from-[#CDA435] to-[#D9B95B] text-white shadow-[#CDA435]/20' 
                              : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white border border-gray-200/50'
                          }`}
                        >
                          <FiUsers className="inline mr-1.5" size={16} />
                          Browse Users
                        </button>
                        <button
                          onClick={() => setActiveTab('conversations')}
                          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl text-sm ${
                            activeTab === 'conversations' 
                              ? 'bg-gradient-to-r from-[#CDA435] to-[#D9B95B] text-white shadow-[#CDA435]/20' 
                              : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white border border-gray-200/50'
                          }`}
                        >
                          <FiMessageSquare className="inline mr-1.5" size={16} />
                          View Chats
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;