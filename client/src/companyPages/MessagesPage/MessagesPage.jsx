import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  FiMessageSquare, FiRefreshCw, FiSearch, FiSend, FiInbox, FiMail,
  FiUser, FiClock, FiChevronLeft
} from 'react-icons/fi';
import { FaCheck, FaClock } from 'react-icons/fa';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import useMarkAsRead from '../../hooks/useMarkAsRead';
import { useNotifications } from '../../contexts/NotificationContext';
import RoleBadge from '../../components/RoleBadge/RoleBadge';
import UserAvatar from '../../components/UserAvatar/UserAvatar';
import { getConversationHeaderInfo, getMessageSenderInfo } from '../../utils/userRoleUtils';

const MessagesPage = () => {
  const { fetchMessageUnreadCount } = useNotifications();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [conversationLoading, setConversationLoading] = useState(false); // New loading state for conversations
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // Mark message-related notifications as read when this page is visited
  useMarkAsRead('messages');

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  useEffect(() => {
    // Opening the Messages page clears the unread badge for this panel
    api.put('/api/messages/read-all')
      .then(() => {
        fetchMessageUnreadCount();
        fetchUnreadCount();
      })
      .catch((error) => console.error('Error clearing unread messages:', error));

    fetchConversations();
  }, []);

  // Handle navigation from other pages (like MyQuotes) and URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const recipientId = urlParams.get('recipient');
    const recipientName = urlParams.get('name');
    
    if (recipientId && recipientName && conversations.length > 0) {
      // Try to find existing conversation
      const existingConversation = conversations.find(conv => conv.other_user_id === parseInt(recipientId));
      
      if (existingConversation) {
        // Open existing conversation
        handleSelectConversation(existingConversation);
      } else {
        // Create new conversation object
        setSelectedConversation({
          userId: parseInt(recipientId),
          userName: decodeURIComponent(recipientName),
          logo: null
        });
        
        // Try to fetch conversation (might be empty for new conversation)
        fetchConversation(parseInt(recipientId));
        
        toast.success(`Opening conversation with ${decodeURIComponent(recipientName)}`);
      }
      
      // Clear the URL parameters to prevent re-triggering
      window.history.replaceState({}, document.title, location.pathname);
    } else if (location.state?.openConversation && conversations.length > 0) {
      const { userId, userName, userEmail } = location.state.openConversation;
      
      // Try to find existing conversation
      const existingConversation = conversations.find(conv => conv.other_user_id === userId);
      
      if (existingConversation) {
        // Open existing conversation
        handleSelectConversation(existingConversation);
      } else {
        // Create new conversation object
        setSelectedConversation({
          userId: userId,
          userName: userName || 'Customer',
          logo: null
        });
        
        // Try to fetch conversation (might be empty for new conversation)
        fetchConversation(userId);
        
        toast.success(`Opening conversation with ${userName || 'Customer'}`);
      }
      
      // Clear the navigation state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [conversations, location.state]);

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

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation({
      userId: conversation.other_user_id,
      userName: conversation.other_user_name,
      logo: conversation.other_user_logo,
      userRole: conversation.other_user_role || 'user'
    });
    
    await fetchConversation(conversation.other_user_id);

    // Mark unread messages as read
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
        subject: null, // No subject for direct messages
        message: newMessage,
        quoteId: null // No quote ID for direct messages
      });

      setNewMessage('');
      await fetchConversation(selectedConversation.userId);
      toast.success('Message sent!');
      
      // Auto-scroll to bottom after sending message
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredConversations = Array.isArray(conversations) ? conversations.filter(conv => {
    return conv.other_user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           conv.last_message?.toLowerCase().includes(searchTerm.toLowerCase());
  }) : [];

  const isSystemMessage = (message) => {
    return (message.subject && (
      message.subject.includes('Quote Response') ||
      message.subject.includes('Status Update') ||
      message.subject.includes('Quote #') ||
      message.subject.includes('Ticket Response') ||
      message.subject.includes('Company Ticket Response')
    )) || message.ticket_id;
  };

  const getSystemMessageType = (message) => {
    if (message.ticket_id || message.subject?.includes('Ticket Response') || message.subject?.includes('Company Ticket Response')) return 'ticket';
    if (message.subject?.includes('Quote Response')) return 'response';
    if (message.subject?.includes('Status Update')) return 'status';
    return 'system';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 86400000) { // Less than 24 hours
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diff < 604800000) { // Less than 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-2xl ring-1 ring-gray-100 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.35)] overflow-hidden">
      {/* Left Sidebar - Message List */}
      <aside className="w-80 flex-shrink-0 border-r border-gray-200/80 flex flex-col bg-gradient-to-b from-white to-[#fbfaf6]">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-200/80 bg-gradient-to-r from-white via-white to-[#fbf7ea]">
          <div className="flex items-center gap-2">
            <FiMessageSquare className="text-[#bca142]" size={24} />
            <h1 className="text-md font-bold text-gray-800">MESSAGES</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchConversations} 
              className="text-[#bca142] hover:text-yellow-600 p-2 rounded-md hover:bg-gray-100"
              title="Refresh conversations"
            >
              <FiRefreshCw size={18} />
            </button>
          </div>
        </header>

        {/* Single Messages Header */}
        <div className="border-b border-gray-200/80 py-2 px-4">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">All Conversations</p>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search messages..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-100 rounded-full py-2 pl-10 pr-4 border border-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#bca142]/40 transition-all duration-300"
            />
          </div>
        </div>

        {/* Conversation List - Independent Scrolling */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#bca142] mx-auto mb-2"></div>
              <p className="text-gray-500">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FiMessageSquare size={22} className="text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600">No conversations found</p>
              {searchTerm && <p className="text-xs text-gray-400 mt-1">Try adjusting your search</p>}
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedConversation?.userId === conv.other_user_id;
              
              return (
                <div
                  key={conv.other_user_id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`p-2.5 rounded-xl cursor-pointer transition-all duration-300 border ${
                    isSelected ? 'bg-[#bca142]/10 border-[#bca142]/40 shadow-lg' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  } ${conv.unread_count > 0 ? 'ring-2 ring-[#bca142]/20' : ''}`}
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
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <p className={`font-medium truncate ${conv.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                            {conv.other_user_name}
                          </p>
                          <RoleBadge 
                            role={conv.other_user_role || 'user'}
                            size="sm"
                            showIcon={true}
                            className="flex-shrink-0"
                          />
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className="text-xs text-gray-400">
                            {formatDate(conv.last_message_time)}
                          </span>
                          {conv.unread_count > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{conv.last_message}</p>
                      {!!conv.has_system_messages && (
                        <div className="flex items-center gap-1 mt-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-600">System Updates</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <header className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-white shadow-[0_6px_22px_-20px_rgba(15,23,42,0.6)] relative z-10">
              <button 
                onClick={() => setSelectedConversation(null)}
                className="md:hidden text-gray-400 hover:text-[#bca142] transition-colors"
              >
                <FiChevronLeft size={24} />
              </button>
              <UserAvatar 
                user={{
                  name: selectedConversation.userName,
                  logo: selectedConversation.logo,
                  role: selectedConversation.userRole || 'user'
                }}
                size="md"
                showRoleIndicator={true}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="font-bold text-gray-900 text-[15px] truncate">{selectedConversation.userName}</h2>
                  <RoleBadge 
                    role={selectedConversation.userRole || 'user'}
                    size="sm"
                    showIcon={true}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {selectedConversation.userRole === 'admin' ? 'Platform Administrator' :
                   selectedConversation.userRole === 'business' ? 'Business Owner' :
                   selectedConversation.userRole === 'company' ? 'Logistics Company' :
                   'Platform Member'}
                </p>
              </div>
            </header>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#faf7ef]"
              style={{
                backgroundImage: 'radial-gradient(rgba(188,161,66,0.10) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
            >
              {conversationLoading ? (
                // Futuristic Loader
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="relative mb-8">
                      {/* Outer rotating ring */}
                      <div className="w-20 h-20 border-4 border-[#bca142]/20 rounded-full animate-spin mx-auto relative">
                        <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-[#bca142] rounded-full animate-spin"></div>
                        <div className="absolute top-2 left-2 w-16 h-16 border-4 border-transparent border-t-[#D9B95B] rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                      </div>
                      {/* Inner pulsing core */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-8 h-8 bg-gradient-to-r from-[#bca142] to-[#D9B95B] rounded-full animate-pulse shadow-lg"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full animate-ping"></div>
                      </div>
                      {/* Floating particles */}
                      <div className="absolute -top-2 -left-2 w-2 h-2 bg-[#bca142] rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                      <div className="absolute -top-2 -right-2 w-2 h-2 bg-[#D9B95B] rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
                      <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-[#bca142] rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
                      <div className="absolute -bottom-2 -right-2 w-2 h-2 bg-[#D9B95B] rounded-full animate-bounce" style={{animationDelay: '1.5s'}}></div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold bg-gradient-to-r from-[#bca142] to-[#D9B95B] bg-clip-text text-transparent">
                        Loading Conversation
                      </h3>
                      <p className="text-gray-600 font-medium">Fetching messages...</p>
                      {/* Loading dots */}
                      <div className="flex justify-center space-x-2">
                        <div className="w-2 h-2 bg-[#bca142] rounded-full animate-pulse" style={{animationDelay: '0s'}}></div>
                        <div className="w-2 h-2 bg-[#D9B95B] rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-[#bca142] rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
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
                      <div className={`max-w-[80%] rounded-lg p-3 shadow-sm border-l-4 ${
                        systemType === 'ticket' ? 'bg-yellow-50 border-yellow-500' :
                        systemType === 'response' ? 'bg-green-50 border-green-500' :
                        systemType === 'status' ? 'bg-blue-50 border-blue-500' :
                        'bg-yellow-50 border-yellow-500'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {systemType === 'ticket' && <FiMessageSquare className="text-yellow-600" />}
                          {systemType === 'response' && <FaCheck className="text-green-600" />}
                          {systemType === 'status' && <FaClock className="text-blue-600" />}
                          <p className={`text-xs font-medium ${
                            systemType === 'ticket' ? 'text-yellow-700' :
                            systemType === 'response' ? 'text-green-700' :
                            systemType === 'status' ? 'text-blue-700' :
                            'text-yellow-700'
                          }`}>
                            {msg.subject || `Ticket ${msg.ticket_number || 'Response'}`}
                          </p>
                          {msg.ticket_number && (
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-medium">
                              {msg.ticket_number}
                            </span>
                          )}
                        </div>
                        {msg.ticket_subject && (
                          <div className="mb-2 p-2 bg-white/70 rounded border border-yellow-200">
                            <p className="text-xs text-yellow-700 font-medium">Ticket Subject:</p>
                            <p className="text-sm text-gray-700">{msg.ticket_subject}</p>
                          </div>
                        )}
                        <p className="text-sm text-gray-700 whitespace-pre-line">{msg.message}</p>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          {formatDate(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`relative max-w-[72%] px-4 py-2.5 transition-all duration-300 rounded-2xl ${
                      isOwn
                        ? 'bg-gradient-to-br from-[#c9ad55] to-[#a88c2f] text-white rounded-br-md shadow-[0_12px_26px_-12px_rgba(150,124,45,0.9)]'
                        : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md shadow-[0_10px_24px_-18px_rgba(15,23,42,0.6)]'
                    }`}>
                      <span className={`absolute -bottom-[5px] w-3 h-3 rotate-45 rounded-[2px] ${
                        isOwn ? 'right-4 bg-[#a88c2f]' : 'left-4 bg-white'
                      }`}></span>
                      {!isOwn && (
                        <div className="flex items-center gap-2 mb-1.5">
                          <UserAvatar 
                            user={{
                              name: msg.sender_display_name || msg.sender_name || 'User',
                              role: msg.sender_role || 'user'
                            }}
                            size="xs"
                            showRoleIndicator={false}
                          />
                          <span className="text-xs font-semibold text-[#a88c2f]">
                            {msg.sender_role === 'admin' ? 'Admin' : (msg.sender_display_name || msg.sender_name || 'User')}
                          </span>
                          <RoleBadge 
                            role={msg.sender_role || 'user'}
                            size="sm"
                            showIcon={true}
                            className="ml-0.5"
                          />
                        </div>
                      )}
                      {isOwn && (
                        <div className="flex items-center gap-2 mb-1.5">
                          <UserAvatar 
                            user={{
                              name: currentUser.name,
                              role: currentUser.role || 'company'
                            }}
                            size="xs"
                            showRoleIndicator={false}
                          />
                          <span className="text-xs font-semibold text-yellow-100">
                            You
                          </span>
                          <RoleBadge 
                            role={currentUser.role || 'company'}
                            size="sm"
                            showIcon={true}
                            className="ml-0.5 bg-yellow-200/20! text-yellow-100!"
                          />
                        </div>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-line">{msg.message}</p>
                      <p className={`text-[10px] mt-1 font-medium ${isOwn ? 'text-yellow-100/80' : 'text-gray-400'}`}>
                        {formatDate(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              }) 
              )}
              {/* Auto-scroll anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-2 bg-[#fbfaf6] border border-gray-100 rounded-full pl-4 pr-1.5 py-1.5 shadow-[0_10px_28px_-20px_rgba(15,23,42,0.6)] focus-within:ring-2 focus-within:ring-[#bca142]/30 focus-within:border-[#bca142]/30 transition-all duration-300">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={sendingMessage || !newMessage.trim()}
                  className="shrink-0 w-10 h-10 flex items-center justify-center bg-gradient-to-br from-[#c9ad55] to-[#a88c2f] text-white rounded-full shadow-[0_8px_20px_-6px_rgba(188,161,66,0.8)] transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <FiSend />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <FiMessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MessagesPage;
