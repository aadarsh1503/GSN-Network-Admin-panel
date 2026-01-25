import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Mail, 
  Loader2, 
  RefreshCw,
  ArrowRight,
  Home
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';

const EmailVerificationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [verificationState, setVerificationState] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setVerificationState('error');
      setMessage('Invalid verification link');
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      setVerificationState('verifying');
      
      const response = await fetch(`/api/user/verify-email/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setVerificationState('success');
        setMessage(data.message);
        setUser(data.user);
        toast.success('Email verified successfully!');
      } else {
        setVerificationState('error');
        setMessage(data.message);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationState('error');
      setMessage('Failed to verify email. Please try again.');
    }
  };

  const handleResendVerification = async () => {
    if (!resendEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setIsResending(true);
    try {
      const response = await api.post('/api/user/resend-verification', {
        email: resendEmail
      });

      if (response.success) {
        toast.success(response.message);
        setResendEmail('');
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

  const handleLoginRedirect = () => {
    navigate('/login', {
      state: {
        email: user?.email,
        message: 'Your account has been verified! Please login to continue.'
      }
    });
  };

  const renderVerifyingState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center"
    >
      <div className="mb-6">
        <Loader2 className="w-16 h-16 text-[#CDA435] animate-spin mx-auto" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Verifying Your Email
      </h2>
      <p className="text-gray-600">
        Please wait while we verify your email address...
      </p>
    </motion.div>
  );

  const renderSuccessState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <div className="mb-6">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Email Verified Successfully!
      </h2>
      <p className="text-gray-600 mb-6">
        {message}
      </p>
      
      {user && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-800">
            <strong>Welcome, {user.name}!</strong><br />
            Your business account is now active and ready to use.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={handleLoginRedirect}
          className="w-full flex items-center justify-center gap-2 bg-[#CDA435] hover:bg-[#B8941F] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Continue to Login
          <ArrowRight className="w-4 h-4" />
        </button>
        
        <Link
          to="/"
          className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </motion.div>
  );

  const renderErrorState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center"
    >
      <div className="mb-6">
        <XCircle className="w-16 h-16 text-red-500 mx-auto" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Verification Failed
      </h2>
      <p className="text-gray-600 mb-6">
        {message}
      </p>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-red-800 mb-4">
          <strong>Need a new verification link?</strong><br />
          Enter your email address below to receive a new verification email.
        </p>
        
        <div className="space-y-3">
          <input
            type="email"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            placeholder="Enter your email address"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
          />
          
          <button
            onClick={handleResendVerification}
            disabled={isResending}
            className="w-full flex items-center justify-center gap-2 bg-[#CDA435] hover:bg-[#B8941F] disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
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
        </div>
      </div>

      <div className="space-y-3">
        <Link
          to="/login"
          className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Back to Login
        </Link>
        
        <Link
          to="/"
          className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium py-2 px-4 rounded-lg transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Mail className="w-12 h-12 text-[#CDA435] mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800">Email Verification</h1>
          <p className="text-gray-600 mt-2">GSN Platform Business Account</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {verificationState === 'verifying' && renderVerifyingState()}
          {verificationState === 'success' && renderSuccessState()}
          {verificationState === 'error' && renderErrorState()}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Need help? Contact us at{' '}
            <a href="mailto:support@gsnplatform.com" className="text-[#CDA435] hover:underline">
              support@gsnplatform.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;