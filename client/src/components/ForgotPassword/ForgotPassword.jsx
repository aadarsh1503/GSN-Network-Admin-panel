import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await api.post('/api/user/forgot-password', { email });
      
      setIsSubmitted(true);
      toast.success('Password reset instructions sent!');
      
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-stone-100 min-h-screen mt-20 font-sans">
        <header
          className="h-60 bg-cover bg-center relative"
          style={{ backgroundImage: `url('/Login.jpg')` }}
        >
          <div className="container mx-auto h-full flex flex-col justify-center items-center text-white relative z-10">
            <h1 className="text-5xl font-bold">Password Reset</h1>
            <p className="mt-2 text-base">
              <span>Home</span>
              <span className="mx-2">&gt;</span>
              <span>Forgot Password</span>
            </p>
          </div>
        </header>

        <main className="container mx-auto mt-32 px-4 py-16">
          <div className="bg-white p-8 md:p-12 rounded-lg shadow-md max-w-lg mx-auto -mt-40 relative z-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Check Your Email</h2>
              <div className="w-16 h-1 bg-[#CDA435] mb-6 mx-auto"></div>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                We've sent password reset instructions to <strong>{email}</strong>
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-800 mb-2">What's next?</h3>
                <ul className="text-sm text-blue-700 text-left space-y-1">
                  <li>• Check your email inbox (and spam folder)</li>
                  <li>• Click the reset link in the email</li>
                  <li>• Create your new password</li>
                  <li>• The link expires in 1 hour for security</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail('');
                  }}
                  className="w-full py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors font-medium"
                >
                  Send to Different Email
                </button>
                
                <Link
                  to="/login"
                  className="w-full flex justify-center items-center py-3 px-4 bg-[#CDA435] hover:bg-opacity-90 text-white rounded-md transition-colors font-medium"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-stone-100 min-h-screen mt-20 font-sans">
      <header
        className="h-60 bg-cover bg-center relative"
        style={{ backgroundImage: `url('/Login.jpg')` }}
      >
        <div className="container mx-auto h-full flex flex-col justify-center items-center text-white relative z-10">
          <h1 className="text-5xl font-bold">Forgot Password</h1>
          <p className="mt-2 text-base">
            <span>Home</span>
            <span className="mx-2">&gt;</span>
            <span>Forgot Password</span>
          </p>
        </div>
      </header>

      <main className="container mx-auto mt-32 px-4 py-16">
        <div className="bg-white p-8 md:p-12 rounded-lg shadow-md max-w-lg mx-auto -mt-40 relative z-20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Reset Your Password</h2>
            <div className="w-16 h-1 bg-[#CDA435] mb-4 mx-auto"></div>
            
            <p className="text-gray-600 leading-relaxed">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-stone-100 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:bg-white transition-colors"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 rounded-md shadow-sm text-base font-medium text-white bg-[#CDA435] hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#CDA435] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Sending Reset Link...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Reset Link
                  </>
                )}
              </button>

              <Link
                to="/login"
                className="w-full flex justify-center items-center py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Link>
            </div>
          </form>

          {/* <div className="mt-8 text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Security Note</h3>
              <p className="text-sm text-yellow-700">
                For security reasons, we'll send reset instructions even if the email doesn't exist in our system.
              </p>
            </div>
          </div> */}
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;