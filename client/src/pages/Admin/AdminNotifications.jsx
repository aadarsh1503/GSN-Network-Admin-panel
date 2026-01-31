import { useState, useEffect } from 'react';
import { 
  FaBell, 
  FaCheck, 
  FaTimes,
  FaQuoteLeft,
  FaUser,
  FaTicketAlt,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaCreditCard
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
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

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

  const formatDateShort = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', minute: 'numeric', hour12: true 
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric' 
      });
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="text-gray-400" size={12} />;
    return sortDirection === 'asc' ? 
      <FaSortUp className="text-[#bca142]" size={12} /> : 
      <FaSortDown className="text-[#bca142]" size={12} />;
  };

  const filteredAndSortedNotifications = () => {
    let filtered = notifications.filter(notification => {
      const typeMatch = filterType === 'all' || notification.type === filterType;
      const statusMatch = filterStatus === 'all' || 
        (filterStatus === 'read' && notification.is_read) ||
        (filterStatus === 'unread' && !notification.is_read);
      return typeMatch && statusMatch;
    });

    return filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (sortField === 'created_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const getNotificationIcon = (type, isRead) => {
    const iconColor = isRead ? 'text-[#bca142]' : 'text-white';
    switch (type) {
      case 'quote':
        return <FaQuoteLeft className={iconColor} size={18} />;
      case 'registration':
        return <FaUser className={iconColor} size={18} />;
      case 'ticket':
        return <FaTicketAlt className={iconColor} size={18} />;
      case 'subscription':
        return <FaCreditCard className={iconColor} size={18} />;
      default:
        return <FaBell className={iconColor} size={18} />;
    }
  };

  const getNotificationGradient = (type, isRead) => {
    // Only unread notifications get #bca142 background, read ones stay white
    return !isRead ? 'bg-[#bca142]' : 'bg-white';
  };

  const FuturisticLoader = () => (
    <div className="flex items-center justify-center h-64">
      <div className="relative">
        {/* Outer rotating ring */}
        <div className="w-16 h-16 border-4 border-[#bca142] rounded-full animate-spin">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-[#bca142] rounded-full animate-spin"></div>
          <div className="absolute top-2 left-2 w-12 h-12 border-4 border-transparent border-t-[#bca142] rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
        </div>
        {/* Inner pulsing core */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-6 h-6 bg-[#bca142] rounded-full animate-pulse shadow-lg"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full animate-ping"></div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <FuturisticLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-2">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="relative overflow-hidden bg-[#bca142] rounded-2xl p-4 shadow-2xl">
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-lg">
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
                    <div className="bg-white/20 rounded-xl px-4 py-2 border border-white/30">
                      <div className="flex items-center gap-2 text-white">
                        <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                        <span className="font-bold text-lg">{unreadCount}</span>
                        <span className="text-sm opacity-90">unread</span>
                      </div>
                    </div>
                    <button
                      onClick={markAllAsRead}
                      className="bg-white/20 text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all duration-300 flex items-center gap-2 border border-white/30 shadow-lg hover:shadow-xl"
                    >
                      <FiCheckCircle size={18} />
                      <span className="font-semibold">Mark All Read</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:border-[#bca142] focus:ring-1 focus:ring-[#bca142] text-sm"
              >
                <option value="all">All Types</option>
                <option value="quote">Quote</option>
                <option value="registration">Registration</option>
                <option value="ticket">Ticket</option>
                <option value="subscription">Subscription</option>
              </select>
              
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:border-[#bca142] focus:ring-1 focus:ring-[#bca142] text-sm"
              >
                <option value="all">All Status</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="bg-[#bca142] text-white px-4 py-2 rounded-lg hover:bg-black transition-all duration-300 flex items-center gap-2 text-sm font-medium"
              >
                <FiCheckCircle size={16} />
                Mark All Read ({unreadCount})
              </button>
            )}
          </div>
        </div>

        {/* Notifications Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {!Array.isArray(notifications) || notifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-[#bca142] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <FaBell size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-black">All Clear!</h3>
              <p className="text-gray-500">No notifications to display. You're all caught up with platform activities.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <button 
                        onClick={() => handleSort('type')}
                        className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-[#bca142] transition-colors"
                      >
                        Type {getSortIcon('type')}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button 
                        onClick={() => handleSort('title')}
                        className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-[#bca142] transition-colors"
                      >
                        Title {getSortIcon('title')}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Message</span>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button 
                        onClick={() => handleSort('user_name')}
                        className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-[#bca142] transition-colors"
                      >
                        User {getSortIcon('user_name')}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button 
                        onClick={() => handleSort('created_at')}
                        className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-[#bca142] transition-colors"
                      >
                        Date {getSortIcon('created_at')}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</span>
                    </th>
                    <th className="px-4 py-3 text-center">
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAndSortedNotifications().map((notification) => (
                    <tr
                      key={notification.id}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notification.is_read ? 'bg-[#bca142]' : 'bg-white'
                      }`}
                      onClick={() => handleViewDetails(notification)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${
                            !notification.is_read ? 'bg-white' : 'bg-gray-100'
                          }`}>
                            {getNotificationIcon(notification.type, notification.is_read)}
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${
                            !notification.is_read ? 'bg-white text-[#bca142]' : 'bg-[#bca142] text-white'
                          }`}>
                            {notification.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold text-sm ${
                            !notification.is_read ? 'text-white' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </span>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className={`text-sm max-w-xs truncate ${
                          !notification.is_read ? 'text-white' : 'text-gray-700'
                        }`}>
                          {formatMessagePreview(notification.message)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {notification.user_name ? (
                          <div className="flex items-center gap-2">
                            <FaUser className={!notification.is_read ? 'text-white' : 'text-[#bca142]'} size={12} />
                            <span className={`text-sm font-medium ${
                              !notification.is_read ? 'text-white' : 'text-gray-700'
                            }`}>{notification.user_name}</span>
                          </div>
                        ) : (
                          <span className={`text-sm ${
                            !notification.is_read ? 'text-white' : 'text-gray-400'
                          }`}>-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FiClock className={!notification.is_read ? 'text-white' : 'text-[#bca142]'} size={12} />
                          <span className={`text-sm ${
                            !notification.is_read ? 'text-white' : 'text-gray-600'
                          }`}>{formatDateShort(notification.created_at)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {notification.is_read ? (
                          <div className="flex items-center gap-1 text-[#bca142]">
                            <FiCheckCircle size={14} />
                            <span className="text-xs font-semibold">Read</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-white">
                            <FiAlertCircle size={14} />
                            <span className="text-xs font-semibold">Unread</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(notification);
                            }}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                              !notification.is_read 
                                ? 'bg-white text-[#bca142] hover:bg-gray-100' 
                                : 'bg-[#bca142] text-white hover:bg-black'
                            }`}
                            title="View Details"
                          >
                            <FiEye size={14} />
                          </button>
                          {!notification.is_read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                              title="Mark as read"
                            >
                              <FaCheck size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Futuristic Details Modal */}
        {showDetails && selectedNotification && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              {/* Fixed Header */}
              <div className="bg-[#bca142] p-6 relative overflow-hidden flex-shrink-0">
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      {getNotificationIcon(selectedNotification.type, selectedNotification.is_read)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Notification Details</h2>
                      <p className="text-white/80">Complete information view</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300"
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
                      <p className="text-lg font-bold text-black">{selectedNotification.title}</p>
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide block">Type</label>
                      <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide ${
                        selectedNotification.type === 'quote' ? 'bg-[#bca142] text-white' :
                        selectedNotification.type === 'registration' ? 'bg-[#bca142] text-white' :
                        selectedNotification.type === 'ticket' ? 'bg-black text-white' :
                        selectedNotification.type === 'subscription' ? 'bg-[#bca142] text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {selectedNotification.type}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide block">Message</label>
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 max-h-96 overflow-y-auto">
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
                          <div className="flex items-center gap-2 bg-[#bca142] px-3 py-2 rounded-lg">
                            <FiCheckCircle className="text-white" size={16} />
                            <span className="text-white font-semibold">Read</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-black px-3 py-2 rounded-lg">
                            <FiAlertCircle className="text-white" size={16} />
                            <span className="text-white font-semibold">Unread</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {selectedNotification.user_name && (
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide block">Related User</label>
                      <div className="flex items-center gap-3 bg-[#bca142] p-4 rounded-xl border border-[#bca142]">
                        <FaUser className="text-white" size={16} />
                        <p className="text-white font-semibold">{selectedNotification.user_name}</p>
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