import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import adminNotificationService from '../services/adminNotificationService';

const AdminNotificationContext = createContext();

export const useAdminNotifications = () => {
  const context = useContext(AdminNotificationContext);
  if (!context) {
    throw new Error('useAdminNotifications must be used within AdminNotificationProvider');
  }
  return context;
};

export const AdminNotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Check for new registrations on login/mount
  const checkNewRegistrations = React.useCallback(async () => {
    if (isLoading) return; // Prevent multiple simultaneous calls
    
    setIsLoading(true);
    try {
      const newRegistrations = await adminNotificationService.getNewRegistrations();
      
      if (newRegistrations && newRegistrations.length > 0) {
        // Update last checked timestamp FIRST to prevent showing same notifications again
        adminNotificationService.updateLastChecked();
        
        // Then show toast notifications for each new registration
        newRegistrations.forEach((registration, index) => {
          setTimeout(() => {
            showRegistrationToast(registration);
          }, index * 500); // Stagger notifications by 500ms
        });
      }
    } catch (error) {
      console.error('Error checking new registrations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Check for new registrations only once per session
  const checkNewRegistrationsOnMount = React.useCallback(async () => {
    // Check if we've already shown notifications in this browser session
    if (adminNotificationService.hasCheckedThisSession()) {
      console.log('🔕 Already checked notifications in this session, skipping...');
      return;
    }
    
    console.log('🔔 First check in this session, checking for new registrations...');
    await checkNewRegistrations();
  }, [checkNewRegistrations]);

  // Show toast notification for new registration
  const showRegistrationToast = React.useCallback((registration) => {
    const { name, email, role, created_at } = registration;
    const roleText = role === 'company' ? 'Company Owner' : 'Business Owner';
    
    toast.info(
      <div className="flex flex-col">
        <div className="font-semibold text-black mb-1">
          New {roleText} Registered!
        </div>
        <div className="text-sm text-gray-800">
          <div><strong>Name:</strong> {name}</div>
          <div><strong>Email:</strong> {email}</div>
          <div className="text-xs text-gray-700 mt-1">
            {new Date(created_at).toLocaleString()}
          </div>
        </div>
      </div>,
      {
        position: "top-right",
        autoClose: 8000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        className: "admin-notification-toast",
        bodyClassName: "admin-notification-body",
        progressClassName: "admin-notification-progress",
        toastId: `registration-${registration.id}` // Prevent duplicate toasts
      }
    );
  }, []);

  // Load pending notifications
  const loadPendingNotifications = React.useCallback(async () => {
    try {
      const pending = await adminNotificationService.getPendingNotifications();
      setNotifications(pending);
    } catch (error) {
      console.error('Error loading pending notifications:', error);
    }
  }, []);

  // Mark notification as read
  const markAsRead = React.useCallback(async (notificationId) => {
    try {
      await adminNotificationService.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Periodic check for new registrations (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      // Only check periodically if we haven't checked in this session yet
      if (!adminNotificationService.hasCheckedThisSession()) {
        checkNewRegistrations();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [checkNewRegistrations]);

  // Add a function to reset session check for testing
  const resetSessionCheck = React.useCallback(() => {
    adminNotificationService.resetLastChecked();
    console.log('Session check reset - notifications will show on next check');
  }, []);

  // Make reset function available globally for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.resetAdminNotifications = resetSessionCheck;
      console.log('Admin notification reset function available: window.resetAdminNotifications()');
    }
  }, [resetSessionCheck]);

  const value = {
    notifications,
    isLoading,
    checkNewRegistrations,
    checkNewRegistrationsOnMount,
    loadPendingNotifications,
    markAsRead,
    showRegistrationToast,
    resetSessionCheck
  };

  return (
    <AdminNotificationContext.Provider value={value}>
      {children}
    </AdminNotificationContext.Provider>
  );
};