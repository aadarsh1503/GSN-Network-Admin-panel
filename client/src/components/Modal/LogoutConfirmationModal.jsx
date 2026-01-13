import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  FiLogOut, FiX, FiShield, FiZap, FiUser, FiHome, 
  FiCheck, FiAlertTriangle 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { performLogout } from '../../utils/logout';

const LogoutConfirmationModal = ({ 
  isOpen, 
  onClose, 
  userRole = 'user', 
  userName = 'User',
  onConfirm = null 
}) => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Auto-close countdown (optional feature)
  useEffect(() => {
    let timer;
    if (isOpen && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [isOpen, countdown]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      // Custom logout handler if provided
      if (onConfirm) {
        await onConfirm();
      } else {
        // Use the utility function for consistent logout
        performLogout({
          clearPendingQuote: true,
          redirectTo: '/login',
          dispatchEvent: true,
          navigate: navigate
        });
        
        // Small delay for better UX before redirect
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
      onClose();
    }
  };

  const getRoleConfig = () => {
    switch (userRole) {
      case 'admin':
        return {
          color: 'red',
          icon: <FiShield className="w-8 h-8" />,
          title: 'Admin Logout',
          description: 'You are about to logout from the admin panel',
          gradient: 'from-red-500 to-pink-600',
          glowColor: 'red-500/20'
        };
      case 'company':
        return {
          color: 'blue',
          icon: <FiZap className="w-8 h-8" />,
          title: 'Member Logout',
          description: 'You are about to logout from the member panel',
          gradient: 'from-blue-500 to-cyan-600',
          glowColor: 'blue-500/20'
        };
      case 'business':
        return {
          color: 'purple',
          icon: <FiZap className="w-8 h-8" />,
          title: 'Business Logout',
          description: 'You are about to logout from the business panel',
          gradient: 'from-purple-500 to-indigo-600',
          glowColor: 'purple-500/20'
        };
      default:
        return {
          color: 'green',
          icon: <FiUser className="w-8 h-8" />,
          title: 'User Logout',
          description: 'You are about to logout from your account',
          gradient: 'from-green-500 to-emerald-600',
          glowColor: 'green-500/20'
        };
    }
  };

  const config = getRoleConfig();
  
  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      >
        {/* Backdrop blur effect */}
        <div className="absolute inset-0 backdrop-blur-sm" onClick={onClose} />
        
        {/* Modal */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.7, opacity: 0, y: 50 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-md mx-auto"
        >
          {/* Glow effect */}
          <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient} rounded-3xl blur-xl opacity-20 animate-pulse`} />
          
          {/* Main modal */}
          <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-transparent to-gray-900" />
              <div className="absolute top-0 left-0 w-full h-full">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-gray-400 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      opacity: [0.2, 0.8, 0.2],
                      scale: [1, 1.5, 1],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Header */}
            <div className="relative p-8 text-center">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                <FiX className="w-5 h-5" />
              </button>

              {/* Icon with glow */}
              <div className="relative inline-block mb-6">
                <div className={`absolute inset-0 bg-${config.color}-500 rounded-full blur-lg opacity-30 animate-pulse`} />
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className={`relative p-4 bg-gradient-to-r ${config.gradient} rounded-full text-white shadow-lg`}
                >
                  {config.icon}
                </motion.div>
              </div>

              {/* Title */}
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-gray-800 mb-2"
              >
                {config.title}
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 mb-2"
              >
                {config.description}
              </motion.p>

              {/* User info */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 mb-6"
              >
                <FiUser className="w-4 h-4 mr-2" />
                Logged in as: <span className="font-semibold ml-1">{userName}</span>
              </motion.div>

              {/* Warning */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center p-3 bg-amber-50 border border-amber-200 rounded-xl mb-6"
              >
                <FiAlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
                <span className="text-sm text-amber-700">
                  Any unsaved changes will be lost
                </span>
              </motion.div>
            </div>

            {/* Actions */}
            <div className="relative p-6 pt-0">
              <div className="flex space-x-3">
                {/* Cancel Button */}
                <motion.button
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  onClick={onClose}
                  disabled={isLoggingOut}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center">
                    <FiHome className="w-4 h-4 mr-2" />
                    Stay Logged In
                  </div>
                </motion.button>

                {/* Logout Button */}
                <motion.button
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className={`flex-1 px-6 py-3 bg-gradient-to-r ${config.gradient} hover:shadow-lg text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105`}
                >
                  <div className="flex items-center justify-center">
                    {isLoggingOut ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                        Logging Out...
                      </>
                    ) : (
                      <>
                        <FiLogOut className="w-4 h-4 mr-2" />
                        Confirm Logout
                      </>
                    )}
                  </div>
                </motion.button>
              </div>

              {/* Loading state overlay */}
              {isLoggingOut && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center"
                >
                  <div className="text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className={`w-8 h-8 border-3 border-${config.color}-200 border-t-${config.color}-500 rounded-full mx-auto mb-2`}
                    />
                    <p className="text-sm text-gray-600">Securing your session...</p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="relative px-6 pb-6">
              <div className="text-center">
                <p className="text-xs text-gray-400">
                  You can always log back in anytime
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  // Render modal using portal to document.body to avoid parent container clipping
  return createPortal(modalContent, document.body);
};

export default LogoutConfirmationModal;