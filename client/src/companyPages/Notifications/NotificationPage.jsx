import { useState, useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import useMarkAsRead from '../../hooks/useMarkAsRead';
import { FiBell, FiCheck, FiClock } from 'react-icons/fi';

const NotificationPage = () => {
  const { notifications, fetchNotifications } = useNotifications();
  const [loading, setLoading] = useState(true);

  // Mark all notifications as read when this page is visited
  useMarkAsRead('all');

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        await fetchNotifications();
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [fetchNotifications]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getNotificationIcon = (title) => {
    if (title.includes('Quote Accepted')) {
      return <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
        <FiCheck className="w-5 h-5 text-green-600" />
      </div>;
    } else if (title.includes('Quote Not Selected')) {
      return <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center">
        <FiClock className="w-5 h-5 text-[#bca142]" />
      </div>;
    } else {
      return <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
        <FiBell className="w-5 h-5 text-blue-600" />
      </div>;
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full">
        <div className="text-center py-8">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
        Notifications
      </h2>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiBell className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg">No notifications yet</p>
          <p className="text-gray-400 mt-2">You'll see notifications here when there are updates</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border transition-colors ${
                notification.is_read 
                  ? 'bg-gray-50 border-gray-200' 
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start space-x-4">
                {getNotificationIcon(notification.title)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {notification.title}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {formatDate(notification.created_at)}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 leading-relaxed">
                    {notification.message}
                  </p>
                  
                  {notification.title.includes('Quote') && (
                    <div className="mt-3 flex space-x-2">
                      {notification.title.includes('Accepted') ? (
                        <a
                          href="/company/my-quotes"
                          className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full hover:bg-green-200 transition-colors"
                        >
                          View My Quotes →
                        </a>
                      ) : (
                        <a
                          href="/company/freight-quotes"
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full hover:bg-blue-200 transition-colors"
                        >
                          View Available Quotes →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationPage;