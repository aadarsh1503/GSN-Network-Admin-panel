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
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric', 
      hour: 'numeric', minute: 'numeric', hour12: true 
    });
  };

  const getNotificationIcon = (notification) => {
    if (notification.type === 'quote_response') {
      return <FaDollarSign className="text-green-600" />;
    } else if (notification.title?.toLowerCase().includes('status')) {
      return <FaInfoCircle className="text-blue-600" />;
    } else if (notification.title?.toLowerCase().includes('accepted')) {
      return <FaCheckCircle className="text-green-600" />;
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CDA435]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-[#CDA435] to-[#D9B95B] rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <FaBell className="text-2xl" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">User Notifications</h1>
                  <p className="text-white text-opacity-90">Stay updated with your quote activities</p>
                </div>
              </div>
              {unreadCount > 0 ? (
                <div className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                  {unreadCount} unread
                </div>
              ) : (
                <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                  All viewed
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-sm p-2 inline-flex">
            {[
              { key: 'all', label: 'All Notifications', icon: FaBell },
              { key: 'quote_responses', label: 'Quote Responses', icon: FaDollarSign },
              { key: 'status_updates', label: 'Status Updates', icon: FaInfoCircle },
              { key: 'general', label: 'General', icon: FaBuilding }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  filter === key
                    ? 'bg-gradient-to-r from-[#CDA435] to-[#D9B95B] text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="text-sm" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        {!Array.isArray(filteredNotifications) || filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaBell className="text-3xl text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No notifications found</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? "You don't have any notifications yet." 
                : `No ${filter.replace('_', ' ')} notifications found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => {
              if (!notification || !notification.id) {
                return null;
              }
              
              return (
                <div 
                  key={notification.id} 
                  onClick={() => handleNotificationClick(notification)}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 cursor-pointer border-gray-200 hover:border-[#CDA435]"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100">
                        {getNotificationIcon(notification)}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                              {notification.title || notification.subject || 'Notification'}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <FiClock />
                                <span>{notification.created_at ? formatDate(notification.created_at) : 'No Date'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Company Logo */}
                          {(notification.image || (notification.data && notification.data.company_logo)) && (
                            <img 
                              src={notification.image || notification.data.company_logo} 
                              alt={notification.title || 'Company'} 
                              className="h-16 w-20 object-contain border rounded-lg bg-white p-1" 
                            />
                          )}
                        </div>

                        {/* Message */}
                        <p className="text-gray-700 mb-4 leading-relaxed">
                          {notification.message || 'No message content'}
                        </p>

                        {/* Quote Details (if available) */}
                        {notification.data && notification.data.quote_id && (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4 border border-blue-200">
                            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                              <FiPackage />
                              Quote Details
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                <FaTruck className="text-blue-600" />
                                <span className="text-blue-700">Quote ID: #{notification.data.quote_id}</span>
                              </div>
                              {notification.data.price && (
                                <div className="flex items-center gap-2">
                                  <FaDollarSign className="text-green-600" />
                                  <span className="text-blue-700">Price: ${notification.data.price}</span>
                                </div>
                              )}
                              {notification.data.company_name && (
                                <div className="flex items-center gap-2">
                                  <FiUser className="text-blue-600" />
                                  <span className="text-blue-700">Company: {notification.data.company_name}</span>
                                </div>
                              )}
                              {notification.data.transit_time && (
                                <div className="flex items-center gap-2">
                                  <FaCalendarAlt className="text-blue-600" />
                                  <span className="text-blue-700">Transit: {notification.data.transit_time}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                          {notification.type === 'quote_response' && !notification.user_response ? (
                            <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleQuoteResponse(notification.id, notification.data.quote_response_id, 'accept')}
                                disabled={processingResponse === notification.id}
                                className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-all duration-300 transform hover:scale-105"
                              >
                                {processingResponse === notification.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                  <FaCheck />
                                )}
                                Accept Quote
                              </button>
                              <button
                                onClick={() => handleQuoteResponse(notification.id, notification.data.quote_response_id, 'reject')}
                                disabled={processingResponse === notification.id}
                                className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-all duration-300 transform hover:scale-105"
                              >
                                <FaTimes />
                                Reject Quote
                              </button>
                            </div>
                          ) : notification.user_response ? (
                            <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium ${
                              notification.user_response === 'accepted' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {notification.user_response === 'accepted' ? (
                                <FaCheck className="mr-2" />
                              ) : (
                                <FaTimes className="mr-2" />
                              )}
                              {notification.user_response === 'accepted' ? 'Quote Accepted' : 'Quote Rejected'}
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent card click
                                handleNotificationClick(notification);
                              }}
                              className="bg-gradient-to-r from-[#CDA435] to-[#D9B95B] text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-medium flex items-center gap-2"
                            >
                              <FaEye />
                              {(() => {
                                const destination = getNotificationDestination(notification);
                                if (destination.path) {
                                  if (notification.data?.quote_id) {
                                    return `View Quote #${notification.data.quote_id}`;
                                  } else {
                                    const pageName = destination.path.split('/').pop();
                                    return `View in ${pageName.charAt(0).toUpperCase() + pageName.slice(1)} Quote`;
                                  }
                                } else {
                                  return 'View Details';
                                }
                              })()}
                            </button>
                          )}
                        </div>
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