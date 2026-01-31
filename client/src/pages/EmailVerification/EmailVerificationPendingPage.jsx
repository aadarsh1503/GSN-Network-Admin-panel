import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Clock, 
  RefreshCw, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Home,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';

const EmailVerificationPendingPage = () => {
  const location = useLocation();
  const userEmail = location.state?.email || '';
  const userName = location.state?.name || '';
  
  const [email, setEmail] = useState(userEmail);
  const [isResending, setIsResending] = useState(false);
  const [lastSentTime, setLastSentTime] = useState(null);

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsResending(true);
    try {
      const response = await api.post('/api/user/resend-verification', {
        email: email
      });

      if (response.success) {
        toast.success(response.message);
        setLastSentTime(new Date());
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Resend error:', error);
      toast.error(error.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  const formatLastSentTime = () => {
    if (!lastSentTime) return null;
    return lastSentTime.toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
          >
            <Mail className="w-16 h-16 text-[#bca142] mx-auto mb-4" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-800">Check Your Email</h1>
          <p className="text-gray-600 mt-2">We've sent you a verification link</p>
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
        >
          {/* Success Message */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-blue-500 mr-2" />
              <h2 className="text-xl font-bold text-gray-800">
                Verification Email Sent
              </h2>
            </div>
            
            {userName && (
              <p className="text-gray-600 mb-2">
                Hi <strong>{userName}</strong>!
              </p>
            )}
            
            <p className="text-gray-600">
              We've sent a verification link to:
            </p>
            <p className="text-[#bca142] font-semibold text-lg mt-1">
              {email}
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Next Steps:
            </h3>
            <ol className="text-sm text-blue-700 space-y-1 ml-6">
              <li>1. Check your email inbox (and spam folder)</li>
              <li>2. Click the verification link in the email</li>
              <li>3. Your account will be activated automatically</li>
              <li>4. Return here to login to your business account</li>
            </ol>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-amber-800">
                  <strong>Important:</strong> The verification link will expire in 24 hours. 
                  If you don't see the email, check your spam folder or request a new link below.
                </p>
              </div>
            </div>
          </div>

          {/* Resend Section */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-800 mb-3">
              Didn't receive the email?
            </h3>
            
            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent"
              />
              
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full flex items-center justify-center gap-2 bg-[#bca142] hover:bg-[#B8941F] disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Resend Verification Email
                  </>
                )}
              </button>
              
              {lastSentTime && (
                <p className="text-sm text-green-600 text-center">
                  ✅ Email sent at {formatLastSentTime()}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t">
            <Link
              to="/login"
              className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
            
            <Link
              to="/"
              className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium py-3 px-6 rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Need help? Contact us at{' '}
            <a href="mailto:support@gsnplatform.com" className="text-[#bca142] hover:underline">
              support@gsnplatform.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPendingPage;