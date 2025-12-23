import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  FiMessageSquare, FiRefreshCw, FiSearch, FiSend, FiInbox, FiMail,
  FiUser, FiClock, FiChevronLeft
} from 'react-icons/fi';
import { FaCheck, FaClock } from 'react-icons/fa';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import useMarkAsRead from '../../hooks/useMarkAsRead';

const MessagesPage = () => {
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // Mark message-related notifications as read when this page is visited
  useMarkAsRead('messages');

  useEffect(() => {
    fetchConversations();
    fetchUnreadCount();
  }, []);

  // Handle navigation from other pages (like MyQuotes)
  useEffect(() => {
    if (location.state?.openConversation && conversations.length > 0) {
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
    try {
      const data = await api.get(`/api/messages/conversation/${userId}`);
      setConversationMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      setConversationMessages([]);
      toast.error('Failed to fetch conversation');
    }
  };

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation({
      userId: conversation.other_user_id,
      userName: conversation.other_user_name,
      logo: conversation.other_user_logo
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
    return message.subject && (
      message.subject.includes('Quote Response') ||
      message.subject.includes('Status Update') ||
      message.subject.includes('Quote #')
    );
  };

  const getSystemMessageType = (message) => {
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
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-lg shadow-md overflow-hidden">
      {/* Left Sidebar - Message List */}
      <aside className="w-80 flex-shrink-0 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FiMessageSquare className="text-[#CDA435]" size={24} />
            <h1 className="text-md font-bold text-gray-800">MESSAGES</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchConversations} 
              className="text-[#CDA435] hover:text-yellow-600 p-2 rounded-md hover:bg-gray-100"
              title="Refresh conversations"
            >
              <FiRefreshCw size={18} />
            </button>
          </div>
        </header>

        {/* Single Messages Header */}
        <div className="border-b border-gray-200 py-2 px-4">
          <p className="text-sm text-gray-600">All Conversations</p>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search messages..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-100 rounded-lg py-2 pl-10 pr-4 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#CDA435]"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CDA435] mx-auto mb-2"></div>
              <p className="text-gray-500">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiMessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No conversations found</p>
              {searchTerm && <p className="text-sm">Try adjusting your search</p>}
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedConversation?.userId === conv.other_user_id;
              
              return (
                <div
                  key={conv.other_user_id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    isSelected ? 'bg-yellow-50' : ''
                  } ${conv.unread_count > 0 ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {conv.other_user_logo ? (
                      <img src={conv.other_user_logo} alt={conv.other_user_name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#CDA435] flex items-center justify-center text-white font-bold">
                        {conv.other_user_name?.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className={`font-medium truncate ${conv.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                          {conv.other_user_name}
                        </p>
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
                      {conv.has_system_messages && (
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
            <header className="flex items-center p-4 border-b border-gray-200">
              <button 
                onClick={() => setSelectedConversation(null)}
                className="md:hidden mr-3 text-gray-500"
              >
                <FiChevronLeft size={24} />
              </button>
              {selectedConversation.logo ? (
                <img src={selectedConversation.logo} alt={selectedConversation.userName} className="w-10 h-10 rounded-full object-cover mr-3" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#CDA435] flex items-center justify-center text-white font-bold mr-3">
                  {selectedConversation.userName?.charAt(0)}
                </div>
              )}
              <div>
                <h2 className="font-semibold text-gray-800">{selectedConversation.userName}</h2>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {Array.isArray(conversationMessages) && conversationMessages.map((msg) => {
                const isOwn = msg.sender_id === currentUser.id;
                const isSystem = isSystemMessage(msg);
                const systemType = getSystemMessageType(msg);
                
                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <div className={`max-w-[80%] rounded-lg p-3 shadow-sm border-l-4 ${
                        systemType === 'response' ? 'bg-green-50 border-green-500' :
                        systemType === 'status' ? 'bg-blue-50 border-blue-500' :
                        'bg-yellow-50 border-yellow-500'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {systemType === 'response' && <FaCheck className="text-green-600" />}
                          {systemType === 'status' && <FaClock className="text-blue-600" />}
                          <p className={`text-xs font-medium ${
                            systemType === 'response' ? 'text-green-700' :
                            systemType === 'status' ? 'text-blue-700' :
                            'text-yellow-700'
                          }`}>
                            {msg.subject}
                          </p>
                        </div>
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
                    <div className={`max-w-[70%] ${isOwn ? 'bg-[#CDA435] text-white' : 'bg-white'} rounded-lg p-3 shadow-sm`}>
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${isOwn ? 'text-yellow-100' : 'text-gray-400'}`}>
                        {formatDate(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CDA435]"
                />
                <button
                  type="submit"
                  disabled={sendingMessage || !newMessage.trim()}
                  className="bg-[#CDA435] text-white px-6 py-3 rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
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
