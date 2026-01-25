// Utility function for consistent logout handling across the app
import activityTracker from './activityTracker';
import keepAliveService from '../services/keepAliveService';

export const performLogout = (options = {}) => {
  const {
    clearPendingQuote = true,
    redirectTo = '/login',
    dispatchEvent = true,
    navigate = null
  } = options;

  try {
    // Stop activity tracking
    activityTracker.stopTracking();
    console.log('🛑 Activity tracker stopped on logout');
    
    // Stop keep-alive service
    keepAliveService.stop();
    console.log('🛑 Keep-alive service stopped on logout');
    
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear pending quote if requested
    if (clearPendingQuote) {
      localStorage.removeItem('pendingQuote');
    }
    
    // Dispatch custom event to notify components (navbar, etc.)
    if (dispatchEvent) {
      window.dispatchEvent(new CustomEvent('userLogout'));
    }
    
    // Handle navigation
    if (navigate && redirectTo) {
      navigate(redirectTo);
    } else if (redirectTo && !navigate) {
      // Fallback to window.location if navigate function not provided
      window.location.href = redirectTo;
    }
    
    return true;
  } catch (error) {
    console.error('Error during logout:', error);
    return false;
  }
};

// Utility to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return !!(token && user);
};

// Utility to get current user data
export const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// Utility to handle session expiry
export const handleSessionExpiry = (message = 'Session expired. Please login again.') => {
  // Show error message if toast is available
  if (window.toast) {
    window.toast.error(message);
  } else {
    console.warn(message);
  }
  
  // Perform logout without navigation (will be handled by redirect)
  performLogout({ 
    redirectTo: '/login',
    dispatchEvent: true,
    navigate: null 
  });
};