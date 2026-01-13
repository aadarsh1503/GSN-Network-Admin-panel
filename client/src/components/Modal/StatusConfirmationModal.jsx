import React from 'react';
import { FaTimes, FaExclamationTriangle, FaCheck, FaBan } from 'react-icons/fa';

const StatusConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "status" // "status" or "blacklist"
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'activate':
        return <FaCheck className="text-green-500 text-4xl" />;
      case 'deactivate':
        return <FaBan className="text-red-500 text-4xl" />;
      case 'blacklist':
        return <FaExclamationTriangle className="text-yellow-500 text-4xl" />;
      case 'unblacklist':
        return <FaCheck className="text-green-500 text-4xl" />;
      default:
        return <FaExclamationTriangle className="text-blue-500 text-4xl" />;
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'activate':
        return 'bg-green-600 hover:bg-green-700';
      case 'deactivate':
        return 'bg-red-600 hover:bg-red-700';
      case 'blacklist':
        return 'bg-yellow-600 hover:bg-yellow-700';
      case 'unblacklist':
        return 'bg-green-600 hover:bg-green-700';
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="flex-1">
              <p className="text-gray-700 text-base leading-relaxed">{message}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium border border-gray-300"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-6 py-2.5 text-white rounded-lg transition-colors duration-200 font-medium shadow-lg ${getButtonColor()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusConfirmationModal;