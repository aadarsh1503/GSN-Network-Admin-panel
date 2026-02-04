import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useDynamicTitle = (userRole) => {
  const location = useLocation();

  useEffect(() => {
    const updateTitle = () => {
      const path = location.pathname;
      let title = 'GSN Network'; // Default title

      // Determine title based on user role and current path
      if (userRole === 'admin') {
        title = 'GSN Network - Admin Panel';
      } else if (userRole === 'company') {
        title = 'GSN Network - Company Panel';
      } else if (userRole === 'business') {
        title = 'GSN Network - Business Panel';
      } else if (userRole === 'user') {
        title = 'GSN Network - User Panel';
      }

      // Add specific page context if needed
      if (path.includes('/dashboard')) {
        const roleLabel = getRoleLabel(userRole);
        title = `GSN Network - ${roleLabel} Dashboard`;
      } else if (path.includes('/profile')) {
        title = `GSN Network - Profile`;
      } else if (path.includes('/quotes')) {
        title = `GSN Network - Quotes`;
      } else if (path.includes('/notifications')) {
        title = `GSN Network - Notifications`;
      } else if (path.includes('/invoices')) {
        title = `GSN Network - Invoices`;
      } else if (path.includes('/messages')) {
        title = `GSN Network - Messages`;
      } else if (path.includes('/disputes')) {
        title = `GSN Network - Disputes`;
      } else if (path.includes('/subscriptions')) {
        title = `GSN Network - Subscriptions`;
      }

      // Update the document title
      document.title = title;
    };

    updateTitle();
  }, [userRole, location.pathname]);

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'company':
        return 'Company';
      case 'business':
        return 'Business';
      case 'user':
        return 'User';
      default:
        return '';
    }
  };
};

// Utility function to set title manually if needed
export const setPageTitle = (title) => {
  document.title = title ? `GSN Network - ${title}` : 'GSN Network';
};