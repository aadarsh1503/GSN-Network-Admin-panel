import { useState, useEffect } from 'react';
import { 
  FaBell, 
  FaEye,
  FaBuilding,
  FaDollarSign,
  FaTruck,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaCheck,
  FaTimes
} from 'react-icons/fa';
import { FiClock, FiPackage, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';
import { useNotifications } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

const UserNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // all, quote_responses, status_updates, general
  const [processingResponse, setProcessingResponse] = useState(null);
  const { 
    fetchUnreadCount: refreshGlobalUnreadCount, 
    markAsRead: contextMarkAsRead,
    forceResetUnreadCount
  } = useNotifications();
  const navigate = useNavigate();

  const markAllNotificationsAsRead = async () => {
    try {
      // FORCE the global unread count to 0 immediately
      forceResetUnreadCount();
      
      // Update local state to mark all notifications as read
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({
          ...notification,
          is_read: true
        }))
      );
      
      // Reset local unread count to 0
      setUnreadCount(0);
      
      // Try to mark notifications as read on the server (but don't wait for it)
      Promise.all([
        contextMarkAsRead('notifications').catch(e => console.error('Context mark as read failed:', e)),
        ...notifications.filter(n => !n.is_read).map(notification => 
          api.put(`/api/user-notifications/${notification.id}/read`).catch(e => 
            console.error(`Failed to mark notification ${notification.id} as read:`, e)
          )
        )
      ]).then(() => {
        // After server operations, refresh the count to ensure consistency
        setTimeout(() => {
          refreshGlobalUnreadCount();
        }, 1000);
      });
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error in markAllNotificationsAsRead:', error);
      // Even if there's an error, force the count to 0 for better UX
      forceResetUnreadCount();
      setUnreadCount(0);
      toast.success('Notifications cleared');
    }
  };

  useEffect(() => {
    const initializePage = async () => {
      // IMMEDIATELY force the notification count to 0 when page opens
      forceResetUnreadCount();
      setUnreadCount(0);
      
      await fetchNotifications();
      // Automatically mark all notifications as read when page opens
      await markAllNotificationsAsRead();
      
      // Additional refresh after a short delay to ensure the sidebar updates
      setTimeout(() => {
        forceResetUnreadCount();
        refreshGlobalUnreadCount();
      }, 1000);
      
      // Another refresh after 2 seconds to be absolutely sure
      setTimeout(() => {
        forceResetUnreadCount();
        refreshGlobalUnreadCount();
      }, 2000);
    };
    
    initializePage();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await api.get('/api/user-notifications');
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (error.message?.includes('token') || error.message?.includes('authorized')) {
        toast.error('Please log in to view notifications');
      } else {
        toast.error('Failed to fetch notifications. Please try again.');
      }
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await api.get('/api/user-notifications/unread-count');
      setUnreadCount(data.unreadCount || data.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      // Don't show error toast for unread count as it's secondary
    }
  };

  const getNotificationDestination = (notification) => {
    // Determine where to navigate based on notification type and content
    if (notification.type === 'quote_response' || 
        notification.data?.quote_id || 
        notification.title?.toLowerCase().includes('quote')) {
      
      // Try to extract quote ID from different possible locations
      let quoteId = null;
      
      // Check notification.data.quote_id first
      if (notification.data?.quote_id) {
        quoteId = notification.data.quote_id;
      }
      // Check if quote_id is in the message or title
      else if (notification.message) {
        const quoteIdMatch = notification.message.match(/quote\s*#?(\d+)/i);
        if (quoteIdMatch) {
          quoteId = quoteIdMatch[1];
        }
      }
      // Check title for quote ID
      else if (notification.title) {
        const quoteIdMatch = notification.title.match(/quote\s*#?(\d+)/i);
        if (quoteIdMatch) {
          quoteId = quoteIdMatch[1];
        }
      }
      
      // If we have a quote ID, navigate directly to that quote
      if (quoteId) {
        return { 
          path: `/user/quotes/${quoteId}`, 
          message: `Redirecting to quote #${quoteId}...` 
        };
      } else {
        // Fallback to general quotes page if no specific ID
        return { path: '/user/quotes', message: 'Redirecting to quotes page...' };
      }
    } else if (notification.title?.toLowerCase().includes('dispute')) {
      return { path: '/user/disputes', message: 'Redirecting to disputes page...' };
    } else if (notification.title?.toLowerCase().includes('message')) {
      return { path: '/user/messages', message: 'Redirecting to messages page...' };
    } else if (notification.title?.toLowerCase().includes('profile') || 
               notification.title?.toLowerCase().includes('account')) {
      return { path: '/user/profile', message: 'Redirecting to profile page...' };
    } else {
      // General notifications - just mark as read, no navigation
      return { path: null, message: 'Notification viewed' };
    }
  };

  const handleNotificationClick = async (notification) => {
    const destination = getNotificationDestination(notification);
    
    if (destination.path) {
      // Navigate to appropriate page
      navigate(destination.path);
      toast.success(destination.message);
    } else {
      // For general notifications, just show a message
      toast.info(destination.message);
    }
  };

  const handleQuoteResponse = async (notificationId, quoteResponseId, action) => {
    if (processingResponse === notificationId) return;
    
    setProcessingResponse(notificationId);
    try {
      const notification = notifications.find(n => n.id === notificationId);
      const endpoint = action === 'accept' ? '/api/user-quotes/accept-response' : '/api/user-quotes/reject-response';
      
      // Get company_id from the notification data
      const companyId = notification.data.company_id;
      
      await api.post(endpoint, {
        quoteId: notification.data.quote_id,
        quoteResponseId: quoteResponseId,
        companyId: companyId
      });

      toast.success(`Quote response ${action}ed successfully!`);
      
      // Update the notification status locally
      setNotifications(notifications.map(n => 
        n.id === notificationId 
          ? { ...n, is_read: true, user_response: action === 'accept' ? 'accepted' : 'rejected' }
          : n
      ));
      
      fetchUnreadCount();
      refreshGlobalUnreadCount();
    } catch (error) {
      console.error(`Error ${action}ing quote response:`, error);
      toast.error(error.message || `Failed to ${action} quote response. Please try again.`);
    } finally {
      setProcessingResponse(null);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/api/user-notifications/${notificationId}/read`);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      fetchUnreadCount();
      refreshGlobalUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No Date';
    
    try {
      // MySQL TIMESTAMP is returned as 'YYYY-MM-DD HH:MM:SS' in UTC
      // We need to parse it correctly and convert to local time
      let date;
      
      // Check if the date string contains 'T' (ISO format) or space (MySQL format)
      if (dateString.includes('T')) {
        // ISO format: 2024-01-15T10:30:00.000Z
        date = new Date(dateString);
      } else {
        // MySQL format: 2024-01-15 10:30:00
        // Append 'Z' to indicate it's UTC time
        date = new Date(dateString.replace(' ', 'T') + 'Z');
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return 'Invalid Date';
      }
      
      // Format to local timezone
      return date.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric', 
        hour: 'numeric', 
        minute: 'numeric', 
        hour12: true,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone // Use user's timezone
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Invalid Date';
    }
  };

  const getNotificationIcon = (notification) => {
    if (notification.type === 'quote_response') {
      return <FaDollarSign className="text-white" />;
    } else if (notification.title?.toLowerCase().includes('status')) {
      return <FaInfoCircle className="text-white" />;
    } else if (notification.title?.toLowerCase().includes('accepted')) {
      return <FaCheckCircle className="text-white" />;
    } else if (notification.title?.toLowerCase().includes('rejected')) {
      return <FaTimesCircle className="text-red-600" />;
    } else if (notification.title?.toLowerCase().includes('dispute')) {
      return <FaExclamationTriangle className="text-orange-600" />;
    }
    return <FaBell className="text-gray-600" />;
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'quote_responses') return notification.type === 'quote_response' || notification.title?.toLowerCase().includes('quote');
    if (filter === 'status_updates') return notification.title?.toLowerCase().includes('status') || notification.title?.toLowerCase().includes('accepted') || notification.title?.toLowerCase().includes('rejected');
    if (filter === 'general') return !notification.type || notification.type === 'notification';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bca142]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Compact Header */}
        <div className="mb-4">
          <div className="bg-gradient-to-r from-[#bca142] to-[#D9B95B] rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <FaBell className="text-lg" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">User Notifications</h1>
                  <p className="text-white text-opacity-90 text-sm">Stay updated with your quote activities</p>
                </div>
              </div>
              {unreadCount > 0 ? (
                <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  {unreadCount} unread
                </div>
              ) : (
                <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  All viewed
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Compact Filter Tabs */}
        <div className="mb-4">
          <div className="bg-white rounded-lg shadow-sm p-1 inline-flex">
            {[
              { key: 'all', label: 'All', icon: FaBell },
              { key: 'quote_responses', label: 'Quotes', icon: FaDollarSign },
              { key: 'status_updates', label: 'Status', icon: FaInfoCircle },
              { key: 'general', label: 'General', icon: FaBuilding }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex items-center gap-1 px-3 py-2 rounded-md font-medium transition-all duration-300 text-sm ${
                  filter === key
                    ? 'bg-gradient-to-r from-[#bca142] to-[#D9B95B] text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="text-xs" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Compact Notifications */}
        {!Array.isArray(filteredNotifications) || filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FaBell className="text-2xl text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications found</h3>
            <p className="text-gray-600 text-sm">
              {filter === 'all' 
                ? "You don't have any notifications yet." 
                : `No ${filter.replace('_', ' ')} notifications found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((notification) => {
              if (!notification || !notification.id) {
                return null;
              }
              
              return (
                <div 
                  key={notification.id} 
                  onClick={() => handleNotificationClick(notification)}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 hover:border-[#bca142] cursor-pointer"
                >
                  <div className="p-3">
                    <div className="flex items-center gap-3">
                      {/* Compact Icon */}
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 flex-shrink-0">
                        {getNotificationIcon(notification)}
                      </div>

                      {/* Main Content - Horizontal Layout */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate pr-2">
                            {notification.title || notification.subject || 'Notification'}
                          </h3>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Company Logo - Smaller */}
                            {(notification.image || (notification.data && notification.data.company_logo)) && (
                              <img 
                                src={notification.image || notification.data.company_logo} 
                                alt={notification.title || 'Company'} 
                                className="h-8 w-10 object-contain border rounded bg-white p-0.5" 
                              />
                            )}
                            {/* Date */}
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <FiClock className="text-xs" />
                              <span>{notification.created_at ? formatDate(notification.created_at) : 'No Date'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Message - Single Line with Truncation */}
                        <p className="text-xs text-gray-600 mb-2 truncate">
                          {notification.message || 'No message content'}
                        </p>

                        {/* Quote Details - Compact Horizontal Layout */}
                        {notification.data && notification.data.quote_id && (
                          <div className="bg-[#bca142] rounded-md p-2 mb-2 border border-blue-200">
                            <div className="flex items-center gap-4 text-xs">
                              <div className="flex items-center gap-1">
                                <FiPackage className="text-white" />
                                <span className="text-white font-medium">Quote #{notification.data.quote_id}</span>
                              </div>
                              {notification.data.price && (
                                <div className="flex items-center gap-1">
                                  <FaDollarSign className="text-white" />
                                  <span className="text-white">${notification.data.price}</span>
                                </div>
                              )}
                              {notification.data.company_name && (
                                <div className="flex items-center gap-1">
                                  <FiUser className="text-white" />
                                  <span className="text-white truncate max-w-24">{notification.data.company_name}</span>
                                </div>
                              )}
                              {notification.data.transit_time && (
                                <div className="flex items-center gap-1">
                                  <FaCalendarAlt className="text-white" />
                                  <span className="text-white">{notification.data.transit_time}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Actions - Compact */}
                        {/* <div className="flex items-center justify-between">
                          {notification.type === 'quote_response' && !notification.user_response ? (
                            <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleQuoteResponse(notification.id, notification.data.quote_response_id, 'accept')}
                                disabled={processingResponse === notification.id}
                                className="bg-[#bca142] text-white px-2 py-1 rounded-md hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 font-medium transition-all duration-300 text-xs"
                              >
                                {processingResponse === notification.id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                ) : (
                                  <FaCheck className="text-xs" />
                                )}
                                Accept
                              </button>
                              <button
                                onClick={() => handleQuoteResponse(notification.id, notification.data.quote_response_id, 'reject')}
                                disabled={processingResponse === notification.id}
                                className="bg-black text-white px-2 py-1 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 font-medium transition-all duration-300 text-xs"
                              >
                                <FaTimes className="text-xs" />
                                Reject
                              </button>
                            </div>
                          ) : notification.user_response ? (
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                              notification.user_response === 'accepted' 
                                ? 'bg-[#bca142] text-white' 
                                : 'bg-black text-white'
                            }`}>
                              {notification.user_response === 'accepted' ? (
                                <FaCheck className="mr-1 text-xs" />
                              ) : (
                                <FaTimes className="mr-1 text-xs" />
                              )}
                              {notification.user_response === 'accepted' ? 'Accepted' : 'Rejected'}
                            </span>
                          ) : (
                            <div className="bg-gradient-to-r from-[#bca142] to-[#D9B95B] bg-opacity-10 rounded-md px-2 py-1 border border-[#bca142] border-opacity-30">
                              <p className="text-xs text-[#bca142] font-medium flex items-center gap-1">
                                <FaEye className="text-xs" />
                                {(() => {
                                  const destination = getNotificationDestination(notification);
                                  if (destination.path) {
                                    if (notification.data?.quote_id) {
                                      return `Quote #${notification.data.quote_id}`;
                                    } else {
                                      const pageName = destination.path.split('/').pop();
                                      return `View ${pageName}`;
                                    }
                                  } else {
                                    return 'View details';
                                  }
                                })()}
                              </p>
                            </div>
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(notification);
                            }}
                            className="bg-gradient-to-r from-[#bca142] to-[#D9B95B] text-white px-3 py-1 rounded-md hover:shadow-md transition-all duration-300 text-xs font-medium flex items-center gap-1"
                          >
                            <FaEye className="text-xs" />
                            View
                          </button>
                        </div> */}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserNotifications;