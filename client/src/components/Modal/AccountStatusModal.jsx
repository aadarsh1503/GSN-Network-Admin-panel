// Live modal for account status changes (deactivation/blacklisting)
import { useState, useEffect } from 'react';
import { X, AlertTriangle, Shield, Ban } from 'lucide-react';

const AccountStatusModal = ({ isOpen, onClose, type, message, onLogout }) => {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (isOpen && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      // Auto logout after countdown
      onLogout();
    }
  }, [isOpen, countdown, onLogout]);

  // Reset countdown when modal opens
  useEffect(() => {
    if (isOpen) {
      setCountdown(10);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getModalConfig = () => {
    switch (type) {
      case 'deactivated':
        return {
          icon: Shield,
          title: 'Account Deactivated',
          bgColor: 'bg-red-500',
          borderColor: 'border-red-500',
          iconColor: 'text-red-500',
          gradientFrom: 'from-red-500',
          gradientTo: 'to-red-600'
        };
      case 'blacklisted':
        return {
          icon: Ban,
          title: 'Account Blacklisted',
          bgColor: 'bg-gray-800',
          borderColor: 'border-gray-800',
          iconColor: 'text-gray-800',
          gradientFrom: 'from-gray-800',
          gradientTo: 'to-gray-900'
        };
      default:
        return {
          icon: AlertTriangle,
          title: 'Account Issue',
          bgColor: 'bg-orange-500',
          borderColor: 'border-orange-500',
          iconColor: 'text-orange-500',
          gradientFrom: 'from-orange-500',
          gradientTo: 'to-orange-600'
        };
    }
  };

  const config = getModalConfig();
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop with blur effect */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300" />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-300">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} rounded-t-2xl p-6 text-white relative overflow-hidden`}>
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 animate-pulse" />
          </div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-full">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold">{config.title}</h2>
            </div>
            
            {/* Countdown badge */}
            <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
              {countdown}s
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning icon */}
          <div className="flex justify-center mb-4">
            <div className={`p-4 ${config.iconColor} bg-gray-50 rounded-full`}>
              <Icon className="h-12 w-12" />
            </div>
          </div>

          {/* Message */}
          <div className="text-center mb-6">
            <p className="text-gray-800 text-lg font-medium mb-2">
              {message || `Your account has been ${type}.`}
            </p>
            <p className="text-gray-600 text-sm">
              You will be automatically logged out in <span className="font-semibold text-red-600">{countdown} seconds</span>.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onLogout}
              className={`flex-1 bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} hover:opacity-90 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105`}
            >
              Logout Now
            </button>
            <button
              onClick={() => setCountdown(0)} // Force immediate logout
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-300"
            >
              OK
            </button>
          </div>

          {/* Contact support */}
          <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-blue-800 text-sm text-center">
              <strong>Need help?</strong> Contact support for assistance with your account.
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-6 pb-6">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} transition-all duration-1000 ease-linear`}
              style={{ width: `${((10 - countdown) / 10) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountStatusModal;