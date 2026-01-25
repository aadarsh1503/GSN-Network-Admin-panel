// Simple account status checker for page refresh/navigation
import { api } from './api';

// Check account status on page load/refresh
export const checkAccountStatusOnLoad = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }

    // Call API to check current user status
    const response = await api.get('/api/user/me');
    const user = response.user;

    // Check if user is blacklisted or deactivated
    if (user.status === 'blacklisted') {
      return {
        type: 'blacklisted',
        message: 'Your account has been blacklisted by an administrator. You will be logged out shortly.',
        user: user
      };
    }

    if (user.status === 'deactivated' || user.is_active === false) {
      return {
        type: 'deactivated', 
        message: 'Your account has been deactivated by an administrator. You will be logged out shortly.',
        user: user
      };
    }

    // Account is active
    return null;

  } catch (error) {
    // If API call fails with 401, user might be blacklisted/deactivated
    if (error.response?.status === 401) {
      return {
        type: 'deactivated',
        message: 'Your account access has been revoked. Please contact support.',
        user: null
      };
    }
    
    return null;
  }
};

// Force logout function
export const forceLogout = (reason = 'Account status changed') => {
  // Clear all local storage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('refreshToken');
  
  // Redirect to login
  window.location.href = '/login';
};

// Show account status modal
export const showAccountStatusModal = (statusInfo) => {
  // Dispatch custom event that layouts can listen to
  const event = new CustomEvent('showAccountStatusModal', {
    detail: statusInfo
  });
  window.dispatchEvent(event);
};

// Check status and show modal if needed
export const checkAndShowAccountStatus = async () => {
  const statusInfo = await checkAccountStatusOnLoad();
  
  if (statusInfo) {
    console.log('🚨 Account status issue detected:', statusInfo);
    showAccountStatusModal(statusInfo);
    return true; // Status issue found
  }
  
  return false; // No issues
};