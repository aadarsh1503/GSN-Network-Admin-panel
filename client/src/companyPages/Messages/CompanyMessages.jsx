import { useState, useEffect } from 'react';
import { 
  FaInbox, 
  FaPaperPlane, 
  FaUser, 
  FaEnvelope,
  FaSearch,
  FaReply,
  FaCheck,
  FaClock
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';
import RoleBadge from '../../components/RoleBadge/RoleBadge';
import UserAvatar from '../../components/UserAvatar/UserAvatar';
import { getConversationHeaderInfo, getMessageSenderInfo } from '../../utils/userRoleUtils';

const CompanyMessages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchConversations();
    fetchUnreadCount();
    
    // Check for URL parameters to auto-select a conversation
    const urlParams = new URLSearchParams(window.location.search);
    const recipientId = urlParams.get('recipient');
    const recipientName = urlParams.get('name');
    
    if (recipientId && recipientName) {
      // Auto-select this conversation
      setTimeout(() => {
        handleSelectConversation({
          other_user_id: parseInt(recipientId),
          other_user_name: decodeURIComponent(recipientName),
          other_user_logo: null,
          unread_count: 0
        });
      }, 1000);
    }
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/messages/conversations');
      setConversations(data || []);
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
      logo: conversation.other_user_logo,
      userRole: conversation.other_user_role || (conversation.other_user_name === 'Platform Admin' ? 'admin' : 'user')
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
        subject: null,
        message: newMessage,
        quoteId: null
      });

      setNewMessage('');
      await fetchConversation(selectedConversation.userId);
      toast.success('Message sent!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    return conv.other_user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           conv.last_message?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const isSystemMessage = (message) => {
    return message.subject && (
      message.subject.includes('Quote Response') ||
      message.subject.includes('Status Update') ||
      message.subject.includes('Quote #') ||
      message.subject.includes('Dispute #')
    );
  };

  const getSystemMessageType = (message) => {
    if (message.subject?.includes('Quote Response')) return 'response';
    if (message.subject?.includes('Status Update')) return 'status';
    if (message.subject?.includes('Dispute #')) return 'dispute';
    return 'system';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-12 w-12 border-4 border-gray-200 rounded-full animate-spin">
              <div className="h-12 w-12 border-4 border-transparent border-t-[#bca142] rounded-full animate-spin"></div>
            </div>
          </div>
          <p className="text-gray-600 font-medium">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Company Messages</h1>
            <p className="text-gray-600">Communicate with users and platform admin</p>
          </div>
          {unreadCount > 0 && (
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">
              {unreadCount} unread
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
        <div className="flex h-full">
          {/* Conversations List */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="border-b border-gray-200 py-3 px-4">
              <p className="text-sm font-medium text-gray-700">All Conversations</p>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <FaEnvelope className="mx-auto mb-2" size={24} />
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
                        isSelected ? 'bg-yellow-50 border-yellow-200' : ''
                      } ${conv.unread_count > 0 ? 'bg-yellow-25' : ''}`}
                    >
                      <div className="flex items-start">
                        <UserAvatar 
                          user={{
                            name: conv.other_user_name,
                            logo: conv.other_user_logo,
                            role: conv.other_user_role || (conv.other_user_name === 'Platform Admin' ? 'admin' : 'user')
                          }}
                          size="sm"
                          showRoleIndicator={true}
                          className="mr-3"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <p className={`text-sm font-medium text-gray-900 truncate ${conv.unread_count > 0 ? 'font-bold' : ''}`}>
                                {conv.other_user_name}
                              </p>
                              <RoleBadge 
                                role={conv.other_user_role || (conv.other_user_name === 'Platform Admin' ? 'admin' : 'user')}
                                size="sm"
                                showIcon={true}
                                className="flex-shrink-0"
                              />
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              <span className="text-xs text-gray-500">
                                {formatDate(conv.last_message_time)}
                              </span>
                              {conv.unread_count > 0 && (
                                <span className="bg-[#bca142] text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                  {conv.unread_count}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {conv.last_message}
                          </p>
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
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center">
                    <UserAvatar 
                      user={{
                        name: selectedConversation.userName,
                        logo: selectedConversation.logo,
                        role: selectedConversation.userRole || (selectedConversation.userName === 'Platform Admin' ? 'admin' : 'user')
                      }}
                      size="md"
                      showRoleIndicator={true}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="font-semibold text-gray-800">{selectedConversation.userName}</h2>
                        <RoleBadge 
                          role={selectedConversation.userRole || (selectedConversation.userName === 'Platform Admin' ? 'admin' : 'user')}
                          size="sm"
                          showIcon={true}
                        />
                      </div>
                      <p className="text-sm text-gray-500">
                        {selectedConversation.userName === 'Platform Admin' ? 'Platform Administrator' :
                         selectedConversation.userRole === 'business' ? 'Business Owner' :
                         selectedConversation.userRole === 'company' ? 'Logistics Company' :
                         'Platform Member'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {Array.isArray(conversationMessages) && conversationMessages.length > 0 ? conversationMessages.map((msg) => {
                    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                    const isOwn = msg.sender_id === currentUser.id;
                    const isSystem = isSystemMessage(msg);
                    const systemType = getSystemMessageType(msg);
                    
                    if (isSystem) {
                      return (
                        <div key={msg.id} className="flex justify-center">
                          <div className={`max-w-[80%] rounded-lg p-3 shadow-sm border-l-4 ${
                            systemType === 'response' ? 'bg-green-50 border-green-500' :
                            systemType === 'status' ? 'bg-yellow-50 border-yellow-500' :
                            systemType === 'dispute' ? 'bg-red-50 border-red-500' :
                            'bg-yellow-50 border-yellow-500'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              {systemType === 'response' && <FaCheck className="text-green-600" />}
                              {systemType === 'status' && <FaClock className="text-[#bca142]" />}
                              {systemType === 'dispute' && <FaReply className="text-red-600" />}
                              <p className={`text-xs font-medium ${
                                systemType === 'response' ? 'text-green-700' :
                                systemType === 'status' ? 'text-yellow-700' :
                                systemType === 'dispute' ? 'text-red-700' :
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
                        <div className={`max-w-[70%] ${isOwn ? 'bg-[#bca142] text-white' : 'bg-white'} rounded-lg p-3 shadow-sm`}>
                          {!isOwn && (
                            <div className="flex items-center gap-2 mb-2">
                              <UserAvatar 
                                user={{
                                  name: msg.sender_display_name || msg.sender_name || 'User',
                                  role: msg.sender_role || 'user'
                                }}
                                size="sm"
                                showRoleIndicator={false}
                                className="w-4 h-4"
                              />
                              <span className="text-xs font-semibold text-gray-600">
                                {msg.sender_role === 'admin' ? 'Admin' : (msg.sender_display_name || msg.sender_name || 'User')}
                              </span>
                              <RoleBadge 
                                role={msg.sender_role || 'user'}
                                size="sm"
                                showIcon={true}
                                className="ml-1"
                              />
                            </div>
                          )}
                          {isOwn && (
                            <div className="flex items-center gap-2 mb-2">
                              <UserAvatar 
                                user={{
                                  name: currentUser.name,
                                  role: currentUser.role || 'company'
                                }}
                                size="sm"
                                showRoleIndicator={false}
                                className="w-4 h-4"
                              />
                              <span className="text-xs font-semibold text-yellow-100">
                                You
                              </span>
                              <RoleBadge 
                                role={currentUser.role || 'company'}
                                size="sm"
                                showIcon={true}
                                className="ml-1 bg-yellow-200/20 text-yellow-100"
                              />
                            </div>
                          )}
                          <p className="text-sm">{msg.message}</p>
                          <p className={`text-xs mt-1 ${isOwn ? 'text-yellow-100' : 'text-gray-400'}`}>
                            {formatDate(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No messages yet</p>
                      <p className="text-sm">Start a conversation below</p>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={sendingMessage || !newMessage.trim()}
                      className="bg-[#bca142] text-white px-6 py-3 rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingMessage ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <FaPaperPlane />
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <FaEnvelope className="mx-auto mb-4" size={48} />
                  <p>Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyMessages;