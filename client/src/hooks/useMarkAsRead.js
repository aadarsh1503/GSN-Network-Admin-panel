// Custom hook to mark notifications as read when visiting pages
import { useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

export const useMarkAsRead = (pageType) => {
  const { markAsRead } = useNotifications();

  useEffect(() => {
    // Mark notifications as read when component mounts
    const markNotificationsAsRead = async () => {
      try {
        await markAsRead(pageType);
      } catch (error) {
        console.error('Error marking notifications as read:', error);
      }
    };

    // Add a small delay to ensure the page has loaded
    const timer = setTimeout(markNotificationsAsRead, 1000);

    return () => clearTimeout(timer);
  }, [pageType, markAsRead]);
};

export default useMarkAsRead;