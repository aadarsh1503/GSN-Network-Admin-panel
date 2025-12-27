// Utility for consistent admin toast notifications
import { toast } from 'react-toastify';

const defaultToastConfig = {
  autoClose: 5000,
  className: 'admin-toast',
  bodyClassName: 'admin-toast-body',
  progressClassName: 'admin-toast-progress',
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: false,
  draggable: true,
  position: 'top-right',
  pauseOnFocusLoss: false
};

// Helper function to ensure toasts auto-close
const createToastWithForceClose = (toastFunction, message, options = {}) => {
  const config = {
    ...defaultToastConfig,
    ...options,
    autoClose: options.autoClose !== undefined ? options.autoClose : 5000
  };
  
  const toastId = toastFunction(message, config);
  
  // Force close after the specified time as a fallback
  const closeTime = config.autoClose || 5000;
  setTimeout(() => {
    toast.dismiss(toastId);
  }, closeTime + 100); // Add small buffer
  
  return toastId;
};

export const adminToast = {
  success: (message, options = {}) => {
    return createToastWithForceClose(toast.success, message, options);
  },
  
  error: (message, options = {}) => {
    return createToastWithForceClose(toast.error, message, options);
  },
  
  info: (message, options = {}) => {
    return createToastWithForceClose(toast.info, message, options);
  },
  
  warning: (message, options = {}) => {
    return createToastWithForceClose(toast.warning, message, options);
  },
  
  // Method to dismiss all toasts
  dismissAll: () => {
    toast.dismiss();
  },
  
  // Custom method for admin notifications with enhanced styling
  notify: (message, type = 'info', options = {}) => {
    const config = {
      ...defaultToastConfig,
      ...options,
      autoClose: options.autoClose !== undefined ? options.autoClose : 5000
    };
    
    switch (type) {
      case 'success':
        return createToastWithForceClose(toast.success, message, config);
      case 'error':
        return createToastWithForceClose(toast.error, message, config);
      case 'warning':
        return createToastWithForceClose(toast.warning, message, config);
      default:
        return createToastWithForceClose(toast.info, message, config);
    }
  }
};

export default adminToast;