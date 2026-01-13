import React from 'react';
import { FiAlertTriangle, FiX, FiTrash2 } from 'react-icons/fi';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Deletion", 
  message = "Are you sure you want to delete this item?", 
  confirmText = "Delete", 
  cancelText = "Cancel",
  type = "danger", // danger, warning, info
  isLoading = false 
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          gradient: 'from-red-500 to-pink-600',
          icon: 'text-red-500',
          confirmBtn: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
          accent: 'border-red-200 bg-red-50'
        };
      case 'warning':
        return {
          gradient: 'from-yellow-500 to-orange-600',
          icon: 'text-yellow-500',
          confirmBtn: 'from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700',
          accent: 'border-yellow-200 bg-yellow-50'
        };
      default:
        return {
          gradient: 'from-blue-500 to-indigo-600',
          icon: 'text-blue-500',
          confirmBtn: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
          accent: 'border-blue-200 bg-blue-50'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all duration-300 scale-100 animate-pulse-once">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-2xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-red-500 mx-auto mb-4"></div>
              <p className="text-lg font-medium text-gray-700 animate-pulse">
                Processing...
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className={`bg-gradient-to-r ${styles.gradient} px-6 py-4 rounded-t-2xl flex items-center justify-between`}>
          <div className="flex items-center">
            <div className="bg-white bg-opacity-20 p-2 rounded-full mr-3">
              <FiAlertTriangle className="text-white text-xl" />
            </div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white hover:bg-opacity-20 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className={`${styles.accent} p-4 rounded-xl mb-6 border-2`}>
            <div className="flex items-start">
              <FiAlertTriangle className={`${styles.icon} text-2xl mr-3 mt-1 flex-shrink-0`} />
              <div>
                <p className="text-gray-800 font-medium leading-relaxed">
                  {message}
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className={`flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                isLoading ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''
              }`}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-3 text-white bg-gradient-to-r ${styles.confirmBtn} rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center ${
                isLoading ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <FiTrash2 className="mr-2" size={18} />
                  {confirmText}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-30"></div>
      </div>
    </div>
  );
};

export default ConfirmationModal;