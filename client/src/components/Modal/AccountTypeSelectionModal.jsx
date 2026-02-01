import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, User, Building2, Sparkles, ArrowRight } from 'lucide-react';

const AccountTypeSelectionModal = ({ isOpen, onClose, onSelectUser, onSelectBusiness }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSignInRedirect = () => {
    onClose();
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop with blur effect */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-md mx-auto animate-slideUp">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-[#bca142] rounded-3xl blur-xl opacity-20 animate-pulse" />
        
        {/* Main Modal */}
        <div className="relative bg-white backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#bca142] rounded-2xl mb-4 animate-bounce">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-black mb-2">
              Create Your Account
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              To submit and track your quote, please choose your account type
            </p>
          </div>

          {/* Account Type Options */}
          <div className="px-8 pb-8 space-y-4">
            {/* User Account Option */}
            <button
              onClick={onSelectUser}
              className="group w-full p-6 bg-white hover:bg-gray-50 rounded-2xl border border-gray-200 hover:border-[#bca142] transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#bca142] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-black mb-1">Individual User</h3>
                  <p className="text-sm text-gray-600">
                    For personal quote requests and tracking
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-[#bca142] group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </button>

            {/* Business Account Option */}
            <button
              onClick={onSelectBusiness}
              className="group w-full p-6 bg-white hover:bg-gray-50 rounded-2xl border border-gray-200 hover:border-[#bca142] transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#bca142] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-black mb-1">Business User</h3>
                  <p className="text-sm text-gray-600">
                    For business quote requests and management
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-[#bca142] group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <p className="text-xs text-gray-500">
              Already have an account?{' '}
              <button 
                onClick={handleSignInRedirect}
                className="text-[#bca142] hover:text-black font-medium transition-colors"
              >
                Sign in instead
              </button>
            </p>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-[#bca142]/10 rounded-full -translate-x-16 -translate-y-16" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#bca142]/10 rounded-full translate-x-16 translate-y-16" />
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AccountTypeSelectionModal;