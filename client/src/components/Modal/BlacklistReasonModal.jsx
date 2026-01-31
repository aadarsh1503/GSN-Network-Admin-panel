import React, { useState } from 'react';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';

const BlacklistReasonModal = ({ isOpen, onClose, onConfirm, userName }) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    await onConfirm(reason);
    setIsSubmitting(false);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#bca142] rounded-full">
                <FaExclamationTriangle className="text-white text-2xl" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Blacklist Company</h3>
                <p className="text-sm text-gray-600 mt-1">Provide a reason for blacklisting</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isSubmitting}
            >
              <FaTimes size={24} />
            </button>
          </div>

          {/* Warning Message */}
          <div className="bg-gray-50 border-l-4 border-[#bca142] p-4 mb-6 rounded-r-lg">
            <div className="flex items-start">
              <FaExclamationTriangle className="text-[#bca142] mt-1 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-black font-semibold mb-1">Important Notice</h4>
                <p className="text-gray-700 text-sm">
                  You are about to blacklist <span className="font-bold">{userName}</span>. 
                  This action will restrict their access and activities on the platform. 
                  Please provide a clear and detailed reason for this action.
                </p>
              </div>
            </div>
          </div>

          {/* Company Name */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Company Name
            </label>
            <div className="p-3 bg-gray-100 rounded-lg border border-gray-300">
              <p className="text-gray-900 font-medium">{userName}</p>
            </div>
          </div>

          {/* Reason Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reason for Blacklisting <span className="text-[#bca142]">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a detailed reason for blacklisting this company. This will be visible to the company and other administrators."
              className="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-[#bca142] resize-none transition-all"
              rows="6"
              disabled={isSubmitting}
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              Minimum 10 characters required. Be specific and professional.
            </p>
            {reason.trim() && reason.trim().length < 10 && (
              <p className="text-sm text-[#bca142] mt-1">
                Reason must be at least 10 characters long
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#bca142] to-black text-white font-semibold rounded-lg hover:from-black hover:to-[#bca142] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              disabled={isSubmitting || !reason.trim() || reason.trim().length < 10}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                'Confirm Blacklist'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlacklistReasonModal;
