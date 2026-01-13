import React, { useState, useEffect, useRef } from 'react';
import { 
  FiMessageSquare, 
  FiSend, 
  FiX, 
  FiMinimize2, 
  FiMaximize2,
  FiUser,
  FiClock,
  FiCheck
} from 'react-icons/fi';
import { api } from '../../utils/api';
import { toast } from 'react-hot-toast';

const ChatBox = ({ 
  isOpen, 
  onClose, 
  recipientId = null, 
  recipientName = '', 
  recipientType = 'user', // 'user', 'company', 'admin'
  title = 'Chat'
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && recipientId) {
      fetchMessages();
    }
  }, [isOpen, recipientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!recipientId) return;
    
    setLoading(true);
    try {
      const data = await api.get(`/api/messages/conversation/${recipientId}`);
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !recipientId) return;

    setSending(true);
    try {
      await api.post('/api/messages/send', {
        receiverId: recipientId,
        message: newMessage,
        subject: null
      });

      setNewMessage('');
      await fetchMessages();
      toast.success('Message sent!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getCurrentUser = () => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  };

  const getRecipientTypeIcon = () => {
    switch (recipientType) {
      case 'admin':
        return '👑';
      case 'company':
        return '🏢';
      default:
        return '👤';
    }
  };

  if (!isOpen) return null;

  const currentUser = getCurrentUser();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`bg-white rounded-lg shadow-2xl border border-gray-200 transition-all duration-300 ${
        isMinimized ? 'w-80 h-12' : 'w-96 h-[500px]'
      }`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getRecipientTypeIcon()}</span>
            <div>
              <h3 className="font-semibold text-sm">{title}</h3>
              {recipientName && (
                <p className="text-xs opacity-90">{recipientName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              {isMinimized ? <FiMaximize2 size={16} /> : <FiMinimize2 size={16} />}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <FiX size={16} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50 h-[380px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <FiMessageSquare className="mx-auto mb-2" size={24} />
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs">Start the conversation!</p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => {
                    const isOwn = message.sender_id === currentUser.id;
                    const showDate = index === 0 || 
                      formatDate(messages[index - 1].created_at) !== formatDate(message.created_at);
                    
                    return (
                      <div key={message.id}>
                        {showDate && (
                          <div className="text-center my-2">
                            <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                              {formatDate(message.created_at)}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-lg p-2 ${
                            isOwn 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-white border border-gray-200'
                          }`}>
                            {!isOwn && (
                              <div className="flex items-center space-x-1 mb-1">
                                <FiUser size={12} />
                                <span className="text-xs font-medium text-gray-600">
                                  {message.sender_name || recipientName}
                                </span>
                              </div>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                            <div className={`flex items-center justify-end space-x-1 mt-1 ${
                              isOwn ? 'text-blue-100' : 'text-gray-400'
                            }`}>
                              <FiClock size={10} />
                              <span className="text-xs">{formatTime(message.created_at)}</span>
                              {isOwn && message.is_read && <FiCheck size={10} />}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 bg-white rounded-b-lg">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <FiSend size={16} />
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatBox;