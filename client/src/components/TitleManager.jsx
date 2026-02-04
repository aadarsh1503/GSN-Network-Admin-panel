import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TitleManager = () => {
  const location = useLocation();

  useEffect(() => {
    const updateTitle = () => {
      const path = location.pathname;
      let title = 'GSN Network'; // Default title

      // Get user role from localStorage
      const userString = localStorage.getItem('user');
      const user = userString ? JSON.parse(userString) : null;
      const userRole = user?.role;

      // Determine title based on user role and current path
      if (userRole === 'admin') {
        title = 'GSN Network - Admin Panel';
        
        // Add specific admin page context
        if (path.includes('/dashboard')) {
          title = 'GSN Network - Admin Dashboard';
        } else if (path.includes('/users')) {
          title = 'GSN Network - User Management';
        } else if (path.includes('/quotes')) {
          title = 'GSN Network - Quote Management';
        } else if (path.includes('/notifications')) {
          title = 'GSN Network - Notifications';
        } else if (path.includes('/reports')) {
          title = 'GSN Network - Reports';
        } else if (path.includes('/settings')) {
          title = 'GSN Network - Settings';
        }
        
      } else if (userRole === 'company') {
        title = 'GSN Network - Company Panel';
        
        // Add specific company page context
        if (path.includes('/dashboard')) {
          title = 'GSN Network - Company Dashboard';
        } else if (path.includes('/my-quotes')) {
          title = 'GSN Network - My Quotes';
        } else if (path.includes('/profile')) {
          title = 'GSN Network - Company Profile';
        } else if (path.includes('/members')) {
          title = 'GSN Network - Members Directory';
        } else if (path.includes('/invoices')) {
          title = 'GSN Network - Invoices';
        } else if (path.includes('/messages')) {
          title = 'GSN Network - Messages';
        } else if (path.includes('/notifications')) {
          title = 'GSN Network - Notifications';
        } else if (path.includes('/disputes')) {
          title = 'GSN Network - Disputes';
        } else if (path.includes('/bank-details')) {
          title = 'GSN Network - Bank Details';
        } else if (path.includes('/certificate')) {
          title = 'GSN Network - Certificate';
        }
        
      } else if (userRole === 'business') {
        title = 'GSN Network - Business Panel';
        
        // Add specific business page context
        if (path.includes('/dashboard')) {
          title = 'GSN Network - Business Dashboard';
        } else if (path.includes('/quotes')) {
          title = 'GSN Network - Business Quotes';
        } else if (path.includes('/profile')) {
          title = 'GSN Network - Business Profile';
        } else if (path.includes('/invoices')) {
          title = 'GSN Network - Business Invoices';
        } else if (path.includes('/notifications')) {
          title = 'GSN Network - Business Notifications';
        }
        
      } else if (userRole === 'user') {
        title = 'GSN Network - User Panel';
        
        // Add specific user page context
        if (path.includes('/dashboard')) {
          title = 'GSN Network - User Dashboard';
        } else if (path.includes('/quotes')) {
          title = 'GSN Network - My Quotes';
        } else if (path.includes('/profile')) {
          title = 'GSN Network - User Profile';
        } else if (path.includes('/invoices')) {
          title = 'GSN Network - User Invoices';
        } else if (path.includes('/messages')) {
          title = 'GSN Network - Messages';
        } else if (path.includes('/notifications')) {
          title = 'GSN Network - Notifications';
        } else if (path.includes('/disputes')) {
          title = 'GSN Network - Disputes';
        } else if (path.includes('/help')) {
          title = 'GSN Network - Help';
        }
      }

      // Handle public pages
      if (path === '/' || path === '/home') {
        title = 'GSN Network - Global Logistics Solutions';
      } else if (path.includes('/login')) {
        title = 'GSN Network - Login';
      } else if (path.includes('/register')) {
        title = 'GSN Network - Register';
      } else if (path.includes('/forgot-password')) {
        title = 'GSN Network - Forgot Password';
      } else if (path.includes('/reset-password')) {
        title = 'GSN Network - Reset Password';
      } else if (path.includes('/unauthorized')) {
        title = 'GSN Network - Unauthorized Access';
      }

      // Update the document title
      document.title = title;
    };

    updateTitle();

    // Listen for localStorage changes (when user logs in/out)
    const handleStorageChange = () => {
      updateTitle();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events when localStorage is updated in the same tab
    window.addEventListener('userRoleChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userRoleChanged', handleStorageChange);
    };
  }, [location.pathname]);

  // This component doesn't render anything
  return null;
};

export default TitleManager;