import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [lastChecked, setLastChecked] = useState(Date.now());

  // Fetch unread notification count
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const data = await api.get('/api/notifications/unread-count');
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Fetch unread message count
  const fetchMessageUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const data = await api.get('/api/messages/unread-count');
      setMessageUnreadCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching message unread count:', error);
    }
  };

  // Fetch recent notifications
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const data = await api.get('/api/notifications/my-notifications');
      const notificationsArray = Array.isArray(data) ? data : [];
      setNotifications(notificationsArray);
      
      // Check for new notifications since last check
      const newNotifications = notificationsArray.filter(notif => {
        const notifTime = new Date(notif.created_at).getTime();
        return notifTime > lastChecked;
      });

      // Show toast for new quote-related notifications
      newNotifications.forEach(notif => {
        if (notif.title.includes('Quote Accepted') || notif.title.includes('Quote Not Selected')) {
          showQuoteNotificationToast(notif);
        }
      });

      setLastChecked(Date.now());
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Show attractive toast notification
  const showQuoteNotificationToast = (notification) => {
    const isAccepted = notification.title.includes('Accepted');
    
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              {isAccepted ? (
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {notification.title}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {notification.message}
              </p>
              {isAccepted && (
                <button
                  onClick={() => {
                    window.location.href = '/company/freight-quotes';
                    toast.dismiss(t.id);
                  }}
                  className="mt-2 text-sm font-medium text-green-600 hover:text-green-500"
                >
                  View Quote Details →
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    ), {
      duration: 8000,
      position: 'top-right',
    });
  };

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) return;

    // Initial fetch
    fetchUnreadCount();
    fetchNotifications();
    fetchMessageUnreadCount();

    // Set up polling for real-time updates
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchNotifications();
      fetchMessageUnreadCount();
    }, 30000); // 30 seconds

    // Also check when window becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchUnreadCount();
        fetchNotifications();
        fetchMessageUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Mark notifications as read
  const markAsRead = async (pageType = 'all') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await api.post('/api/notifications/mark-read', { pageType });
      // Refresh the unread count after marking as read
      await fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const value = {
    unreadCount,
    messageUnreadCount,
    notifications,
    fetchUnreadCount,
    fetchNotifications,
    fetchMessageUnreadCount,
    showQuoteNotificationToast,
    markAsRead
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
