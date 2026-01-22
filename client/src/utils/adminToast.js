// Utility for consistent admin toast notifications
import { toast } from 'react-toastify';

// Simple configuration without complex styling that might interfere
const defaultToastConfig = {
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  position: 'top-right',
  pauseOnFocusLoss: false,
  containerId: 'admin-toasts'
};

export const adminToast = {
  success: (message, options = {}) => {
    const config = { ...defaultToastConfig, ...options };
    return toast.success(message, config);
  },
  
  error: (message, options = {}) => {
    const config = { ...defaultToastConfig, ...options };
    return toast.error(message, config);
  },
  
  info: (message, options = {}) => {
    const config = { ...defaultToastConfig, ...options };
    return toast.info(message, config);
  },
  
  warning: (message, options = {}) => {
    const config = { ...defaultToastConfig, ...options };
    return toast.warning(message, config);
  },
  
  // Method to dismiss all toasts
  dismissAll: () => {
    toast.dismiss();
  },
  
  // Method to dismiss a specific toast by ID
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },
  
  // Custom method for admin notifications
  notify: (message, type = 'info', options = {}) => {
    const config = { ...defaultToastConfig, ...options };
    
    switch (type) {
      case 'success':
        return toast.success(message, config);
      case 'error':
        return toast.error(message, config);
      case 'warning':
        return toast.warning(message, config);
      default:
        return toast.info(message, config);
    }
  }
};

export default adminToast;