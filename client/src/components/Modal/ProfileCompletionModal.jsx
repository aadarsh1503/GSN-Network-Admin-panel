import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  FiUser, FiX, FiAlertTriangle, FiCheckCircle, FiArrowRight,
  FiEdit3, FiImage, FiMapPin, FiPhone, FiMail
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const ProfileCompletionModal = ({ 
  isOpen, 
  onClose, 
  userRole = 'user', 
  userName = 'User',
  onComplete = null,
  onDismissPermanently = null
}) => {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);

  // Get role-specific configuration
  const getRoleConfig = () => {
    switch (userRole) {
      case 'company':
        return {
          title: 'Complete Your Company Profile',
          description: 'Complete your profile to receive more quote requests and build trust with potential clients.',
          profileUrl: '/company/edit-Profile',
          benefits: [
            'Receive more quote requests from users',
            'Build credibility with complete information',
            'Improve visibility in member directory'
          ],
          requiredFields: [
            'Company logo and images',
            'Complete business address',
            'Contact information',
            'Business description and services'
          ],
          icon: <FiUser className="w-8 h-8" />
        };
      case 'business':
        return {
          title: 'Complete Your Business Profile',
          description: 'Complete your profile to request bulk quotes more effectively and get better responses from companies.',
          profileUrl: '/business/profile',
          benefits: [
            'Get better responses for bulk quote requests',
            'Build trust with logistics companies',
            'Faster quote processing for large orders'
          ],
          requiredFields: [
            'Business logo and photos',
            'Complete business address',
            'Contact details and hours',
            'Business type and requirements'
          ],
          icon: <FiUser className="w-8 h-8" />
        };
      case 'user':
        return {
          title: 'Complete Your User Profile',
          description: 'Complete your profile to help companies understand your needs and provide accurate quotes.',
          profileUrl: '/user/profile',
          benefits: [
            'Get better quote responses from companies',
            'Build trust with service providers',
            'Faster quote processing'
          ],
          requiredFields: [
            'Profile photo',
            'Complete contact information',
            'Location details',
            'Preferences and requirements'
          ],
          icon: <FiUser className="w-8 h-8" />
        };
      default:
        return {
          title: 'Complete Your Profile',
          description: 'Please complete your profile to get the best experience.',
          profileUrl: '/profile',
          benefits: ['Better user experience'],
          requiredFields: ['Basic information'],
          icon: <FiUser className="w-8 h-8" />
        };
    }
  };

  const config = getRoleConfig();

  const handleCompleteProfile = async () => {
    setIsNavigating(true);
    
    try {
      // Mark as shown so it doesn't appear again
      localStorage.setItem(`profilePromptShown_${userRole}`, 'true');
      
      if (onComplete) {
        await onComplete();
      }
      
      // Navigate to profile edit page
      navigate(config.profileUrl);
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error navigating to profile:', error);
    } finally {
      setIsNavigating(false);
    }
  };

  const handleSkipForNow = () => {
    // Mark as shown but don't set permanent flag
    localStorage.setItem(`profilePromptShown_${userRole}`, 'true');
    localStorage.setItem(`profilePromptLastShown_${userRole}`, Date.now().toString());
    onClose();
  };

  const handleDontShowAgain = () => {
    // Permanently dismiss the prompt
    localStorage.setItem(`profilePromptDismissed_${userRole}`, 'true');
    localStorage.setItem(`profilePromptShown_${userRole}`, 'true');
    localStorage.setItem(`profilePromptLastShown_${userRole}`, Date.now().toString());
    
    if (onDismissPermanently) {
      onDismissPermanently();
    }
    
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 backdrop-blur-sm" />
        
        {/* Modal */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-lg mx-auto"
        >
          {/* Main modal */}
          <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            
            {/* Header */}
            <div className="relative p-6 text-center bg-white">
              {/* Close button */}
              <button
                onClick={handleSkipForNow}
                className="absolute top-3 right-3 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                <FiX className="w-4 h-4" />
              </button>

              {/* Icon */}
              <div className="relative inline-block mb-4">
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="p-3 bg-[#bca142] rounded-full text-white shadow-lg"
                >
                  <FiUser className="w-6 h-6" />
                </motion.div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-black mb-2">
                {config.title}
              </h2>

              {/* Description */}
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                {config.description}
              </p>

              {/* Welcome message */}
              <div className="inline-flex items-center px-3 py-1 bg-[#bca142] bg-opacity-10 border border-[#bca142] border-opacity-30 rounded-full text-xs text-black mb-4">
                <FiCheckCircle className="w-3 h-3 mr-1 text-[#bca142]" />
                Welcome, <span className="font-semibold ml-1">{userName}!</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Warning */}
              <div className="flex items-start p-3 bg-white border border-[#bca142] border-opacity-30 rounded-lg mb-4">
                <FiAlertTriangle className="w-4 h-4 text-[#bca142] mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-black">
                  <p className="font-semibold mb-1">Important:</p>
                  <p>
                    {userRole === 'company' && "Complete your profile so users can accept your quote responses and build trust."}
                    {userRole === 'business' && "Complete your profile to get better responses when requesting bulk quotes from companies."}
                    {userRole === 'user' && "Complete your profile to help companies provide better and more accurate quotes."}
                  </p>
                </div>
              </div>

              {/* Benefits - Compact */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-black mb-2 flex items-center">
                  <FiCheckCircle className="w-4 h-4 text-[#bca142] mr-1" />
                  Key Benefits
                </h3>
                <div className="grid grid-cols-1 gap-1">
                  {config.benefits.slice(0, 3).map((benefit, index) => (
                    <div key={index} className="flex items-center text-xs text-gray-600">
                      <div className="w-1.5 h-1.5 bg-[#bca142] rounded-full mr-2"></div>
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                {/* Complete Profile Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCompleteProfile}
                  disabled={isNavigating}
                  className="w-full px-4 py-3 bg-[#bca142] hover:bg-black hover:shadow-lg text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center">
                    {isNavigating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                        Taking you to profile...
                      </>
                    ) : (
                      <>
                        <FiEdit3 className="w-4 h-4 mr-2" />
                        Complete Profile Now
                        <FiArrowRight className="w-3 h-3 ml-2" />
                      </>
                    )}
                  </div>
                </motion.button>

                {/* Skip Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSkipForNow}
                  disabled={isNavigating}
                  className="w-full px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-black font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Remind Me Later (7 days)
                </motion.button>

                {/* Don't Show Again Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDontShowAgain}
                  disabled={isNavigating}
                  className="w-full px-4 py-1.5 text-gray-500 hover:text-black font-medium text-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed underline"
                >
                  Don't show this again
                </motion.button>
              </div>

              {/* Footer note */}
              <p className="text-xs text-gray-400 text-center mt-3">
                You can complete your profile anytime from your dashboard
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  // Render modal using portal to document.body
  return createPortal(modalContent, document.body);
};

export default ProfileCompletionModal;