import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Verify token on component mount
  useEffect(() => {
    if (!token) {
      toast.error('Invalid reset link');
      navigate('/login');
      return;
    }

    verifyToken();
  }, [token, navigate]);

  const verifyToken = async () => {
    try {
      setIsVerifying(true);
      const response = await api.get(`/api/user/verify-reset-token/${token}`);
      setTokenValid(true);
      setUserInfo(response.user);
    } catch (error) {
      console.error('Token verification error:', error);
      setTokenValid(false);
      toast.error('Invalid or expired reset link');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 6) {
      errors.push('At least 6 characters');
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { newPassword, confirmPassword } = formData;

    // Validation
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      toast.error(`Password must have: ${passwordErrors.join(', ')}`);
      return;
    }

    try {
      setIsLoading(true);
      
      await api.post('/api/user/reset-password', {
        token,
        newPassword
      });

      setIsSuccess(true);
      toast.success('Password reset successful!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Password reset successful! Please login with your new password.' 
          }
        });
      }, 3000);

    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while verifying token
  if (isVerifying) {
    return (
      <div className="bg-stone-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-200 border-t-[#bca142] mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!tokenValid) {
    return (
      <div className="bg-stone-100 min-h-screen mt-20 font-sans">
        <header
          className="h-60 bg-cover bg-center relative"
          style={{ backgroundImage: `url('/Login.jpg')` }}
        >
          <div className="container mx-auto h-full flex flex-col justify-center items-center text-white relative z-10">
            <h1 className="text-5xl font-bold">Invalid Link</h1>
            <p className="mt-2 text-base">
              <span>Home</span>
              <span className="mx-2">&gt;</span>
              <span>Reset Password</span>
            </p>
          </div>
        </header>

        <main className="container mx-auto mt-32 px-4 py-16">
          <div className="bg-white p-8 md:p-12 rounded-lg shadow-md max-w-lg mx-auto -mt-40 relative z-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Invalid or Expired Link</h2>
              <div className="w-16 h-1 bg-[#bca142] mb-6 mx-auto"></div>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                This password reset link is invalid or has expired. Reset links are only valid for 1 hour for security reasons.
              </p>
              
              <div className="space-y-4">
                <Link
                  to="/forgot-password"
                  className="w-full flex justify-center py-3 px-4 bg-[#bca142] hover:bg-opacity-90 text-white rounded-md transition-colors font-medium"
                >
                  Request New Reset Link
                </Link>
                
                <Link
                  to="/login"
                  className="w-full flex justify-center py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors font-medium"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="bg-stone-100 min-h-screen mt-20 font-sans">
        <header
          className="h-60 bg-cover bg-center relative"
          style={{ backgroundImage: `url('/Login.jpg')` }}
        >
          <div className="container mx-auto h-full flex flex-col justify-center items-center text-white relative z-10">
            <h1 className="text-5xl font-bold">Success!</h1>
            <p className="mt-2 text-base">
              <span>Home</span>
              <span className="mx-2">&gt;</span>
              <span>Password Reset</span>
            </p>
          </div>
        </header>

        <main className="container mx-auto mt-32 px-4 py-16">
          <div className="bg-white p-8 md:p-12 rounded-lg shadow-md max-w-lg mx-auto -mt-40 relative z-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Password Reset Successful!</h2>
              <div className="w-16 h-1 bg-[#bca142] mb-6 mx-auto"></div>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Your password has been successfully reset. You can now login with your new password.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-700">
                  Redirecting to login page in a few seconds...
                </p>
              </div>
              
              <Link
                to="/login"
                className="w-full flex justify-center py-3 px-4 bg-[#bca142] hover:bg-opacity-90 text-white rounded-md transition-colors font-medium"
              >
                Go to Login Now
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const passwordErrors = validatePassword(formData.newPassword);

  return (
    <div className="bg-stone-100 min-h-screen mt-20 font-sans">
      <header
        className="h-60 bg-cover bg-center relative"
        style={{ backgroundImage: `url('/Login.jpg')` }}
      >
        <div className="container mx-auto h-full flex flex-col justify-center items-center text-white relative z-10">
          <h1 className="text-5xl font-bold">Reset Password</h1>
          <p className="mt-2 text-base">
            <span>Home</span>
            <span className="mx-2">&gt;</span>
            <span>Reset Password</span>
          </p>
        </div>
      </header>

      <main className="container mx-auto mt-32 px-4 py-16">
        <div className="bg-white p-8 md:p-12 rounded-lg shadow-md max-w-lg mx-auto -mt-40 relative z-20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Create New Password</h2>
            <div className="w-16 h-1 bg-[#bca142] mb-4 mx-auto"></div>
            
            {userInfo && (
              <p className="text-gray-600 leading-relaxed">
                Hello <strong>{userInfo.name}</strong>, create a new password for your account.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="newPassword" className="block text-gray-700 text-sm font-medium mb-2">
                New Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder="Enter your new password"
                  required
                  className="w-full pl-12 pr-12 py-3 bg-stone-100 rounded-md focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:bg-white transition-colors"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password length indicator */}
              {formData.newPassword && (
                <div className="mt-2">
                  <div className="text-xs text-gray-600 mb-1">Password requirement:</div>
                  <div className="space-y-1">
                    <div className={`text-xs flex items-center ${formData.newPassword.length >= 6 ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${formData.newPassword.length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      At least 6 characters
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-medium mb-2">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your new password"
                  required
                  className="w-full pl-12 pr-12 py-3 bg-stone-100 rounded-md focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:bg-white transition-colors"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password match indicator */}
              {formData.confirmPassword && (
                <div className="mt-2">
                  <div className={`text-xs flex items-center ${
                    formData.newPassword === formData.confirmPassword ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      formData.newPassword === formData.confirmPassword ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    {formData.newPassword === formData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <button
                type="submit"
                disabled={isLoading || passwordErrors.length > 0 || formData.newPassword !== formData.confirmPassword}
                className="w-full flex justify-center items-center py-3 px-4 rounded-md shadow-sm text-base font-medium text-white bg-[#bca142] hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#bca142] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Resetting Password...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Reset Password
                  </>
                )}
              </button>

              <Link
                to="/login"
                className="w-full flex justify-center py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors font-medium"
              >
                Back to Login
              </Link>
            </div>
          </form>

          <div className="mt-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Security Tips</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Use a password that's at least 6 characters long</li>
                <li>• Choose something memorable but secure</li>
                <li>• Don't share your password with anyone</li>
                <li>• Log out from shared devices</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;