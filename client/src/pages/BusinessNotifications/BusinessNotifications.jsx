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
  FaTimes
} from 'react-icons/fa';
import { FiClock, FiPackage, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';
import { useNotifications } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

const BusinessNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // all, quote_responses, status_updates, general
  const [imageModal, setImageModal] = useState({ isOpen: false, imageUrl: '', title: '' });
  const { 
    fetchUnreadCount: refreshGlobalUnreadCount, 
    markAsRead: contextMarkAsRead,
    forceResetUnreadCount
  } = useNotifications();
  const navigate = useNavigate();

  const handleImageClick = (e, imageUrl, title) => {
    e.stopPropagation(); // Prevent notification card click
    setImageModal({
      isOpen: true,
      imageUrl: imageUrl,
      title: title || 'Notification Image'
    });
  };

  const closeImageModal = () => {
    setImageModal({ isOpen: false, imageUrl: '', title: '' });
  };

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

  // Handle Escape key for closing modal
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && imageModal.isOpen) {
        closeImageModal();
      }
    };

    if (imageModal.isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset'; // Restore scrolling
    };
  }, [imageModal.isOpen]);

  const fetchNotifications = async () => {
    try {
      // Use the correct endpoint based on user role
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const endpoint = user.role === 'business' ? '/api/user-notifications' : '/api/notifications/my-notifications';
      
      const data = await api.get(endpoint);
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
      // Use the correct endpoint based on user role
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const endpoint = user.role === 'business' ? '/api/user-notifications/unread-count' : '/api/notifications/unread-count';
      
      const data = await api.get(endpoint);
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
      
      // If we have a quote ID, navigate directly to that quote using the correct route parameter
      if (notification.data?.quote_id) {
        return { 
          path: `/business/quotes/${notification.data.quote_id}`, 
          message: `Redirecting to quote #${notification.data.quote_id}...` 
        };
      } else {
        // Fallback to general quotes page if no specific ID
        return { path: '/business/quotes', message: 'Redirecting to quotes page...' };
      }
    } else if (notification.title?.toLowerCase().includes('dispute')) {
      return { path: '/business/disputes', message: 'Redirecting to disputes page...' };
    } else if (notification.title?.toLowerCase().includes('message')) {
      return { path: '/business/messages', message: 'Redirecting to messages page...' };
    } else if (notification.title?.toLowerCase().includes('profile') || 
               notification.title?.toLowerCase().includes('account')) {
      return { path: '/business/profile', message: 'Redirecting to profile page...' };
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

  const getNotificationTypeColor = (notification) => {
    if (notification.type === 'quote_response') {
      return 'bg-green-50 border-green-200';
    } else if (notification.title?.toLowerCase().includes('status')) {
      return 'bg-blue-50 border-blue-200';
    } else if (notification.title?.toLowerCase().includes('accepted')) {
      return 'bg-green-50 border-green-200';
    } else if (notification.title?.toLowerCase().includes('rejected')) {
      return 'bg-red-50 border-red-200';
    } else if (notification.title?.toLowerCase().includes('dispute')) {
      return 'bg-orange-50 border-orange-200';
    }
    return 'bg-gray-50 border-gray-200';
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
                  <h1 className="text-xl font-bold">Business Notifications</h1>
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
                            {/* Company Logo - Smaller with Click Handler */}
                            {(notification.image || (notification.data && notification.data.company_logo)) && (
                              <img 
                                src={notification.image || notification.data.company_logo} 
                                alt={notification.title || 'Company'} 
                                className="h-8 w-10 object-contain border rounded bg-white p-0.5 cursor-pointer hover:shadow-md transition-all duration-300" 
                                onClick={(e) => handleImageClick(e, notification.image || notification.data.company_logo, notification.title || 'Company Logo')}
                                title="Click to view full image"
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

                        {/* Action Button - Compact */}
                        <div className="flex items-center justify-between">
                          <div className="bg-gradient-to-r from-[#bca142] to-[#D9B95B] bg-opacity-10 rounded-md px-2 py-1 border border-[#bca142] border-opacity-30">
                            <p className="text-xs text-[#ffffff] font-medium flex items-center gap-1">
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

      {/* Image Modal */}
      {imageModal.isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeImageModal} // Click outside to close
        >
          <div 
            className="relative max-w-4xl max-h-full bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#bca142] to-[#D9B95B] px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{imageModal.title}</h3>
              <button
                onClick={closeImageModal}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-300"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              <div className="flex items-center justify-center">
                <img
                  src={imageModal.imageUrl}
                  alt={imageModal.title}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                  onError={(e) => {
                    e.target.src = '/placeholder-image.png'; // Fallback image
                    e.target.alt = 'Image not available';
                  }}
                />
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={closeImageModal}
                className="bg-gradient-to-r from-[#bca142] to-[#D9B95B] text-white px-6 py-2 rounded-lg hover:shadow-md transition-all duration-300 font-medium"
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

export default BusinessNotifications;