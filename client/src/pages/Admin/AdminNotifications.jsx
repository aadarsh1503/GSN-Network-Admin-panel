import { useState, useEffect } from 'react';
import { 
  FaBell, 
  FaCheck, 
  FaTimes, 
  FaEye,
  FaClock,
  FaQuoteLeft,
  FaUser,
  FaTicketAlt,
  FaChevronRight,
  FaInfoCircle,
  FaExternalLinkAlt
} from 'react-icons/fa';
import { FiClock, FiEye, FiCheckCircle, FiAlertCircle, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await api.get('/api/admin/pending-notifications');
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
      toast.error('Failed to fetch notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await api.get('/api/admin/unread-notifications-count');
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/api/admin/notifications/${notificationId}/read`);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      for (const notification of unreadNotifications) {
        await markAsRead(notification.id);
      }
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleViewDetails = (notification) => {
    setSelectedNotification(notification);
    setShowDetails(true);
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  const formatMessagePreview = (message) => {
    // Extract the first line (before the first double newline) as the preview
    const lines = message.split('\n\n');
    const firstLine = lines[0] || message;
    
    // If the first line contains emojis or is very short, try to get a meaningful preview
    if (firstLine.includes('📋') || firstLine.includes('🔄') || firstLine.length < 20) {
      // Look for the actual preview line in the message
      const messageLines = message.split('\n').filter(line => line.trim());
      for (const line of messageLines) {
        if (line.includes('has updated') && !line.includes('📋') && !line.includes('🔄')) {
          return line.trim();
        }
      }
      // Fallback to first meaningful line
      return messageLines.find(line => line.length > 20 && !line.includes('📋') && !line.includes('🔄')) || firstLine;
    }
    
    return firstLine.trim();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric', 
      hour: 'numeric', minute: 'numeric', hour12: true 
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'quote':
        return <FaQuoteLeft className="text-[#CDA435]" size={18} />;
      case 'registration':
        return <FaUser className="text-emerald-500" size={18} />;
      case 'ticket':
        return <FaTicketAlt className="text-orange-500" size={18} />;
      default:
        return <FaBell className="text-gray-500" size={18} />;
    }
  };

  const getNotificationGradient = (type, isRead) => {
    const baseOpacity = isRead ? '0.3' : '0.8';
    switch (type) {
      case 'quote':
        return `bg-gradient-to-r from-[#CDA435]/10 via-[#D9B95B]/5 to-transparent border-l-[#CDA435]`;
      case 'registration':
        return `bg-gradient-to-r from-emerald-500/10 via-emerald-400/5 to-transparent border-l-emerald-500`;
      case 'ticket':
        return `bg-gradient-to-r from-orange-500/10 via-orange-400/5 to-transparent border-l-orange-500`;
      default:
        return `bg-gradient-to-r from-gray-500/10 via-gray-400/5 to-transparent border-l-gray-500`;
    }
  };

  const FuturisticLoader = () => (
    <div className="flex items-center justify-center h-64">
      <div className="relative">
        {/* Outer rotating ring */}
        <div className="w-16 h-16 border-4 border-[#CDA435]/20 rounded-full animate-spin">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-[#CDA435] rounded-full animate-spin"></div>
          <div className="absolute top-2 left-2 w-12 h-12 border-4 border-transparent border-t-[#D9B95B] rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
        </div>
        {/* Inner pulsing core */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-6 h-6 bg-gradient-to-r from-[#CDA435] to-[#D9B95B] rounded-full animate-pulse shadow-lg"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full animate-ping"></div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6">
        <FuturisticLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Futuristic Header */}
        <div className="mb-8">
          <div className="relative overflow-hidden bg-gradient-to-r from-[#CDA435] to-[#D9B95B] rounded-2xl p-8 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-[#CDA435]/95 to-[#D9B95B]/95 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
                    <FiZap className="text-white" size={32} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">
                      Admin Notifications
                    </h1>
                    <p className="text-white/90 text-lg">
                      Real-time platform activity monitoring
                    </p>
                  </div>
                </div>
                
                {unreadCount > 0 && (
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
                      <div className="flex items-center gap-2 text-white">
                        <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                        <span className="font-bold text-lg">{unreadCount}</span>
                        <span className="text-sm opacity-90">unread</span>
                      </div>
                    </div>
                    <button
                      onClick={markAllAsRead}
                      className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all duration-300 flex items-center gap-2 border border-white/30 shadow-lg hover:shadow-xl"
                    >
                      <FiCheckCircle size={18} />
                      <span className="font-semibold">Mark All Read</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Floating particles */}
            <div className="absolute top-4 right-4 w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
            <div className="absolute top-8 right-16 w-1 h-1 bg-white/60 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
            <div className="absolute bottom-4 left-8 w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
          </div>
        </div>

        {/* Notifications Grid */}
        <div className="space-y-4">
          {!Array.isArray(notifications) || notifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-32 h-32 bg-gradient-to-r from-[#CDA435] to-[#D9B95B] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#CDA435]/90 to-[#D9B95B]/90 backdrop-blur-sm"></div>
                <FaBell size={64} className="text-white relative z-10" />
              </div>
              <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                All Clear!
              </h3>
              <p className="text-gray-500 text-lg leading-relaxed max-w-md mx-auto">
                No notifications to display. You're all caught up with platform activities.
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`group relative overflow-hidden rounded-2xl border-l-4 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] cursor-pointer backdrop-blur-sm ${
                  getNotificationGradient(notification.type, notification.is_read)
                } ${notification.is_read ? 'opacity-75' : 'shadow-lg'}`}
                onClick={() => handleViewDetails(notification)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Icon with glow effect */}
                      <div className="relative">
                        <div className="w-12 h-12 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                          {getNotificationIcon(notification.type)}
                        </div>
                        {!notification.is_read && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-lg"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`text-lg font-bold transition-colors duration-300 ${
                            notification.is_read ? 'text-gray-700' : 'text-gray-900'
                          } group-hover:text-[#CDA435]`}>
                            {notification.title}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                            notification.type === 'quote' ? 'bg-[#CDA435]/20 text-[#CDA435]' :
                            notification.type === 'registration' ? 'bg-emerald-500/20 text-emerald-700' :
                            notification.type === 'ticket' ? 'bg-orange-500/20 text-orange-700' :
                            'bg-gray-500/20 text-gray-700'
                          }`}>
                            {notification.type}
                          </span>
                          {notification.is_read && (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full flex items-center gap-1">
                              <FiCheckCircle size={12} />
                              Read
                            </span>
                          )}
                        </div>
                        
                        <p className={`text-base leading-relaxed mb-4 ${
                          notification.is_read ? 'text-gray-500' : 'text-gray-700'
                        }`}>
                          {formatMessagePreview(notification.message)}
                        </p>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-400">
                          <div className="flex items-center gap-2">
                            <FiClock className="text-[#CDA435]" />
                            <span className="font-medium">{formatDate(notification.created_at)}</span>
                          </div>
                          {notification.user_name && (
                            <div className="flex items-center gap-2">
                              <FaUser className="text-[#D9B95B]" />
                              <span className="font-medium">User: {notification.user_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Futuristic Action Buttons */}
                    <div className="flex items-center space-x-3 ml-4">
                      {/* Eye Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(notification);
                        }}
                        className="group/btn relative w-12 h-12 bg-gradient-to-r from-[#CDA435] to-[#D9B95B] rounded-xl flex items-center justify-center shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-110 overflow-hidden"
                        title="View Details"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#CDA435]/90 to-[#D9B95B]/90 backdrop-blur-sm"></div>
                        <FiEye className="text-white relative z-10 group-hover/btn:scale-110 transition-transform duration-300" size={18} />
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                      </button>
                      
                      {/* Read Status */}
                      {notification.is_read ? (
                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl">
                          <FiCheckCircle size={16} />
                          <span className="text-sm font-semibold">Read</span>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="flex items-center gap-2 text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl transition-all duration-300 hover:shadow-md"
                          title="Mark as read"
                        >
                          <FaCheck size={14} />
                          <span className="text-sm font-semibold">Mark Read</span>
                        </button>
                      )}
                      
                      {/* Arrow indicator */}
                      <FaChevronRight className="text-gray-400 group-hover:text-[#CDA435] transition-colors duration-300" size={16} />
                    </div>
                  </div>
                </div>
                
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#CDA435]/5 to-[#D9B95B]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </div>
            ))
          )}
        </div>

        {/* Futuristic Details Modal */}
        {showDetails && selectedNotification && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              {/* Fixed Header */}
              <div className="bg-gradient-to-r from-[#CDA435] to-[#D9B95B] p-6 relative overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-[#CDA435]/95 to-[#D9B95B]/95 backdrop-blur-sm"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      {getNotificationIcon(selectedNotification.type)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Notification Details</h2>
                      <p className="text-white/80">Complete information view</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300"
                  >
                    <FaTimes size={18} />
                  </button>
                </div>
              </div>
              
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide block">Title</label>
                      <p className="text-lg font-bold text-gray-900">{selectedNotification.title}</p>
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide block">Type</label>
                      <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide ${
                        selectedNotification.type === 'quote' ? 'bg-[#CDA435]/20 text-[#CDA435]' :
                        selectedNotification.type === 'registration' ? 'bg-emerald-500/20 text-emerald-700' :
                        selectedNotification.type === 'ticket' ? 'bg-orange-500/20 text-orange-700' :
                        'bg-gray-500/20 text-gray-700'
                      }`}>
                        {selectedNotification.type}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide block">Message</label>
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200 max-h-96 overflow-y-auto">
                      <pre className="text-gray-700 leading-relaxed text-base whitespace-pre-wrap font-sans">
                        {selectedNotification.message}
                      </pre>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide block">Created</label>
                      <p className="text-gray-700 font-medium">{formatDate(selectedNotification.created_at)}</p>
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide block">Status</label>
                      <div className="flex items-center gap-3">
                        {selectedNotification.is_read ? (
                          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-lg">
                            <FiCheckCircle className="text-emerald-500" size={16} />
                            <span className="text-emerald-600 font-semibold">Read</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                            <FiAlertCircle className="text-blue-500" size={16} />
                            <span className="text-blue-600 font-semibold">Unread</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {selectedNotification.user_name && (
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide block">Related User</label>
                      <div className="flex items-center gap-3 bg-gradient-to-r from-[#CDA435]/10 to-[#D9B95B]/10 p-4 rounded-xl border border-[#CDA435]/20">
                        <FaUser className="text-[#CDA435]" size={16} />
                        <p className="text-gray-700 font-semibold">{selectedNotification.user_name}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Extra padding at bottom for better scrolling */}
                  <div className="h-4"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;