import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import adminNotificationService from '../services/adminNotificationService';

// Make toast available globally for debugging
if (typeof window !== 'undefined') {
  window.toast = toast;
}

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
        console.log(`🔔 Found ${newRegistrations.length} new unseen registrations`);
        
        // Show toast notifications for each new registration
        newRegistrations.forEach((registration, index) => {
          setTimeout(() => {
            showRegistrationToast(registration);
          }, index * 500); // Stagger notifications by 500ms
        });

        // Mark these registrations as seen by admin
        const userIds = newRegistrations.map(reg => reg.id);
        await adminNotificationService.markRegistrationsAsSeen(userIds);
        
        // Update last checked timestamp
        adminNotificationService.updateLastChecked();
      } else {
        console.log('🔕 No new unseen registrations found');
        // Still update session check to prevent repeated calls
        adminNotificationService.markCheckedThisSession();
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
    
    console.log(`🔍 Registration data received:`, { name, email, role, created_at });
    
    // Enhanced role text mapping for all user types
    const getRoleInfo = (role) => {
      console.log(`🔍 Mapping role: "${role}" (type: ${typeof role})`);
      
      switch (role) {
        case 'company':
          return { text: 'Company Owner', icon: '🏢', color: 'text-blue-600' };
        case 'business':
          return { text: 'Business Owner', icon: '💼', color: 'text-green-600' };
        case 'user':
          return { text: 'Regular User', icon: '👤', color: 'text-purple-600' };
        default:
          console.warn(`⚠️ Unknown role: "${role}", defaulting to User`);
          return { text: `User (${role})`, icon: '👥', color: 'text-gray-600' };
      }
    };
    
    const roleInfo = getRoleInfo(role);
    const toastId = `registration-${registration.id}-${Date.now()}`;
    
    console.log(`🔔 Showing toast for ${roleInfo.text}: ${name} (${email})`);
    
    // Clear any existing toasts first to prevent stacking issues
    toast.dismiss();
    
    // Use the global ToastContainer with simplified configuration
    const toastResult = toast.success(
      <div className="flex flex-col">
        <div className="font-semibold text-gray-800 mb-1">
          🎉 New {roleInfo.text} Registered!
        </div>
        <div className="text-sm text-gray-600">
          <div className="flex items-center mb-1">
            <span className="mr-2">{roleInfo.icon}</span>
            <span className={`font-medium ${roleInfo.color}`}>{roleInfo.text}</span>
          </div>
          <div><strong>Name:</strong> {name}</div>
          <div><strong>Email:</strong> {email}</div>
          <div className="text-xs text-gray-500 mt-1">
            {new Date(created_at).toLocaleString()}
          </div>
        </div>
      </div>,
      {
        position: "top-right",
        autoClose: 4000, // Reduced to 4 seconds
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false, // Disable pause on hover to ensure it closes
        draggable: true,
        pauseOnFocusLoss: false,
        toastId: toastId,
        onClose: () => {
          console.log(`✅ Toast closed for registration: ${name}`);
        }
      }
    );
    
    // Multiple fallback mechanisms to ensure toast closes
    const timeouts = [];
    
    // Fallback 1: Force dismiss after 5 seconds
    timeouts.push(setTimeout(() => {
      try {
        toast.dismiss(toastId);
        console.log(`🔄 Fallback 1: Force dismissed toast for: ${name}`);
      } catch (error) {
        console.log(`⚠️ Fallback 1 failed: ${error.message}`);
      }
    }, 5000));
    
    // Fallback 2: Dismiss all toasts after 6 seconds
    timeouts.push(setTimeout(() => {
      try {
        toast.dismiss();
        console.log(`🔄 Fallback 2: Dismissed all toasts`);
      } catch (error) {
        console.log(`⚠️ Fallback 2 failed: ${error.message}`);
      }
    }, 6000));
    
    // Fallback 3: Manual DOM removal after 7 seconds
    timeouts.push(setTimeout(() => {
      try {
        const toastElements = document.querySelectorAll('[class*="Toastify__toast"]');
        toastElements.forEach(element => {
          if (element && element.parentNode) {
            element.style.opacity = '0';
            element.style.transform = 'translateX(100%)';
            setTimeout(() => {
              if (element.parentNode) {
                element.parentNode.removeChild(element);
              }
            }, 300);
          }
        });
        console.log(`🔄 Fallback 3: Manual DOM cleanup completed`);
      } catch (error) {
        console.log(`⚠️ Fallback 3 failed: ${error.message}`);
      }
    }, 7000));
    
    if (toastResult) {
      console.log(`✅ Toast successfully created for ${roleInfo.text}: ${name} (ID: ${toastId})`);
    } else {
      console.error(`❌ Failed to create toast for ${roleInfo.text}: ${name}`);
    }
  }, []);

  // Real-time notification listener
  useEffect(() => {
    // Listen for real-time new user registration events
    const handleNewUserRegistration = (event) => {
      console.log('🔔 Real-time new user registration received:', event.detail);
      const userData = event.detail;
      
      // Show toast for ALL user types (user, business, company)
      if (userData.role === 'user' || userData.role === 'business' || userData.role === 'company') {
        showRegistrationToast(userData);
        
        // Mark as seen immediately since we're showing the toast
        adminNotificationService.markRegistrationsAsSeen([userData.id]);
      }
    };

    // Add event listener for real-time notifications
    window.addEventListener('admin_new_user_registration', handleNewUserRegistration);
    
    console.log('🔔 Real-time notification listener added for admin (all user types)');

    // Cleanup
    return () => {
      window.removeEventListener('admin_new_user_registration', handleNewUserRegistration);
      console.log('🔕 Real-time notification listener removed');
    };
  }, [showRegistrationToast]);

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

  // Periodic check for new registrations (every 5 minutes) - as backup
  useEffect(() => {
    const interval = setInterval(() => {
      // Check periodically for new registrations (this will only show truly new ones)
      checkNewRegistrations();
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
      
      // Add test function to manually trigger toast
      window.testAdminToast = () => {
        const testRegistration = {
          id: Date.now(),
          name: 'Test User',
          email: 'test@example.com',
          role: 'company',
          created_at: new Date().toISOString()
        };
        showRegistrationToast(testRegistration);
        console.log('🧪 Test toast triggered manually');
      };
      
      // Add simple toast test function
      window.testSimpleToast = () => {
        try {
          const result = toast.success('🧪 Simple test toast!', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true
          });
          console.log('✅ Simple toast created:', result);
          return result;
        } catch (error) {
          console.error('❌ Simple toast error:', error);
          return null;
        }
      };
      
      // Add toast container check function
      window.checkToastSetup = () => {
        console.log('🔍 Checking toast setup...');
        console.log('Toast function available:', typeof toast);
        console.log('Toast containers in DOM:', document.querySelectorAll('[class*="Toastify"]'));
        console.log('Global toast available:', typeof window.toast);
        
        // Try to create a basic toast
        try {
          toast.info('🔍 Toast setup check', { autoClose: 2000 });
          console.log('✅ Basic toast creation successful');
        } catch (error) {
          console.error('❌ Basic toast creation failed:', error);
        }
      };
      
      // Add manual dismiss function for stuck toasts
      window.dismissAllToasts = () => {
        try {
          console.log('🧹 Manually dismissing all toasts...');
          
          // Method 1: Use toast.dismiss()
          toast.dismiss();
          
          // Method 2: Manual DOM cleanup
          setTimeout(() => {
            const toastElements = document.querySelectorAll('[class*="Toastify__toast"]');
            console.log(`🔍 Found ${toastElements.length} toast elements in DOM`);
            
            toastElements.forEach((element, index) => {
              if (element && element.parentNode) {
                console.log(`🗑️ Removing toast element ${index + 1}`);
                element.style.opacity = '0';
                element.style.transform = 'translateX(100%)';
                setTimeout(() => {
                  if (element.parentNode) {
                    element.parentNode.removeChild(element);
                  }
                }, 300);
              }
            });
            
            console.log('✅ Manual toast cleanup completed');
          }, 100);
          
        } catch (error) {
          console.error('❌ Error dismissing toasts:', error);
        }
      };
      
      console.log('Admin notification functions available:');
      console.log('- window.resetAdminNotifications() - Reset notification check');
      console.log('- window.testAdminToast() - Show test registration toast');
      console.log('- window.testSimpleToast() - Show simple test toast');
      console.log('- window.checkToastSetup() - Check toast configuration');
      console.log('- window.dismissAllToasts() - Force dismiss all stuck toasts');
    }
  }, [resetSessionCheck, showRegistrationToast]);

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