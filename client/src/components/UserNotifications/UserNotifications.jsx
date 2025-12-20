import { useState, useEffect } from 'react';
import { 
  FaBell, 
  FaCheck, 
  FaTimes, 
  FaEye,
  FaClock,
  FaBuilding,
  FaShippingFast
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';
import { useNotifications } from '../../contexts/NotificationContext';

const UserNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [processingResponse, setProcessingResponse] = useState(null);
  const { fetchUnreadCount: refreshGlobalUnreadCount } = useNotifications();

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    
    // Mark notifications as read when user views the page
    const markNotificationsAsRead = async () => {
      try {
        // Mark all notifications as read after a short delay
        setTimeout(async () => {
          const unreadNotifications = notifications.filter(n => !n.is_read && n.type === 'notification');
          for (const notification of unreadNotifications) {
            await markAsRead(notification.id);
          }
          await fetchUnreadCount();
          await refreshGlobalUnreadCount();
        }, 2000);
      } catch (error) {
        console.error('Error marking notifications as read:', error);
      }
    };

    if (notifications.length > 0) {
      markNotificationsAsRead();
    }
  }, [notifications.length]);

  const fetchNotifications = async () => {
    try {
      const data = await api.get('/user-notifications');
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
      const data = await api.get('/user-notifications/unread-count');
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      // Don't show error toast for unread count as it's secondary
    }
  };

  const handleQuoteResponse = async (notificationId, quoteResponseId, action) => {
    if (processingResponse === notificationId) return;
    
    setProcessingResponse(notificationId);
    try {
      const notification = notifications.find(n => n.id === notificationId);
      const endpoint = action === 'accept' ? '/user-quotes/accept-response' : '/user-quotes/reject-response';
      
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
      await api.put(`/user-notifications/${notificationId}/read`);
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
    const now = new Date();
    const diff = now - date;
    
    if (diff < 3600000) { // Less than 1 hour
      return `${Math.floor(diff / 60000)} minutes ago`;
    } else if (diff < 86400000) { // Less than 24 hours
      return `${Math.floor(diff / 3600000)} hours ago`;
    } else if (diff < 604800000) { // Less than 7 days
      return `${Math.floor(diff / 86400000)} days ago`;
    }
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Notifications</h1>
            <p className="text-gray-600">Stay updated with quote responses and system updates</p>
          </div>
          {unreadCount > 0 && (
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              {unreadCount} unread
            </div>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
        {notifications.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <FaBell className="mx-auto mb-4" size={48} />
              <p>No notifications yet</p>
              <p className="text-sm">You'll see quote responses and updates here</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  !notification.is_read && notification.priority === 'high' ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                {notification.type === 'quote_response' ? (
                  <div className="flex items-start space-x-4">
                    {/* Company Logo */}
                    <div className="flex-shrink-0">
                      {notification.data.company_logo ? (
                        <img 
                          src={notification.data.company_logo} 
                          alt={notification.data.company_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                          <FaBuilding className="text-white" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>

                      <div className="mt-2 space-y-2">
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <FaShippingFast className="mr-1" />
                            {notification.data.departure_country} → {notification.data.arrival_country}
                          </span>
                          <span>{notification.data.product_description}</span>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Price:</span>
                              <span className="ml-2 text-green-600 font-semibold">
                                {notification.data.price}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Transit Time:</span>
                              <span className="ml-2 text-blue-600">
                                {notification.data.transit_time}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {!notification.user_response ? (
                          <div className="flex space-x-3 mt-4">
                            <button
                              onClick={() => handleQuoteResponse(notification.id, notification.data.quote_response_id, 'accept')}
                              disabled={processingResponse === notification.id}
                              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                              {processingResponse === notification.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              ) : (
                                <FaCheck className="mr-2" />
                              )}
                              Accept
                            </button>
                            <button
                              onClick={() => handleQuoteResponse(notification.id, notification.data.quote_response_id, 'reject')}
                              disabled={processingResponse === notification.id}
                              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                              <FaTimes className="mr-2" />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="mt-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              notification.user_response === 'accepted' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {notification.user_response === 'accepted' ? (
                                <FaCheck className="mr-1" />
                              ) : (
                                <FaTimes className="mr-1" />
                              )}
                              {notification.user_response === 'accepted' ? 'Accepted' : 'Rejected'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Regular notification
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gray-500 flex items-center justify-center">
                        <FaBell className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>
                      <p className="mt-2 text-gray-600">{notification.message}</p>
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center"
                        >
                          <FaEye className="mr-1" />
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserNotifications;