import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { submitPendingQuote, hasPendingQuote } from '../../utils/pendingQuote';
import toast from 'react-hot-toast';
import { api, isTokenExpired } from '../../utils/api';
import activityTracker from '../../utils/activityTracker';
import { Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(''); // State for error messages
    const [isCheckingAuth, setIsCheckingAuth] = useState(true); // Loading state for auth check
    const navigate = useNavigate();
    const location = useLocation();

    // Get redirect path from location state
    const from = location.state?.from || null;
    const registrationMessage = location.state?.message;
    const prefilledEmail = location.state?.email;

    // Check if user is already logged in
    useEffect(() => {
        // Only run auth check if we're actually on the login page AND the component is mounted
        if (location.pathname !== '/login') {
            setIsCheckingAuth(false);
            return;
        }

        // Don't run if we're in the middle of a login process
        const isLoggingIn = sessionStorage.getItem('isLoggingIn');
        if (isLoggingIn) {
            setIsCheckingAuth(false);
            return;
        }

        const checkAuthStatus = () => {
            // Don't redirect if we just came from a failed login attempt
            const justLoggedIn = sessionStorage.getItem('justLoggedIn');
            
            if (justLoggedIn) {
                sessionStorage.removeItem('justLoggedIn');
                setIsCheckingAuth(false);
                return;
            }

            const token = localStorage.getItem('token');
            const user = localStorage.getItem('user');
            
            if (token && user) {
                try {
                    const userData = JSON.parse(user);
                    const tokenExpired = isTokenExpired(token);
                    
                    if (!tokenExpired) {
                        // Set a flag to prevent multiple redirects
                        sessionStorage.setItem('isLoggingIn', 'true');
                        
                        // Redirect based on user role
                        if (userData.role === 'admin') {
                            navigate('/admin', { replace: true });
                        } else if (userData.role === 'company') {
                            navigate('/company', { replace: true });
                        } else if (userData.role === 'business') {
                            navigate('/business', { replace: true });
                        } else if (userData.role === 'user') {
                            navigate('/user/dashboard', { replace: true });
                        } else {
                            // If role is unknown, clear storage and allow login
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            sessionStorage.removeItem('isLoggingIn');
                            setIsCheckingAuth(false);
                        }
                    } else {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setIsCheckingAuth(false);
                    }
                } catch (error) {
                    // Clear invalid data and allow login
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setIsCheckingAuth(false);
                }
            } else {
                setIsCheckingAuth(false);
            }
        };

        checkAuthStatus();
    }, [navigate, location.pathname]);

    // Pre-fill email if coming from registration
    useEffect(() => {
        if (prefilledEmail) {
            setEmail(prefilledEmail);
        }
    }, [prefilledEmail]);

    // Show loading spinner while checking authentication
    if (isCheckingAuth) {
        return (
            <div className="bg-stone-100 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#CDA435] mx-auto mb-4"></div>
                    <p className="text-xl text-gray-600">Checking authentication...</p>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors

        try {
            const data = await api.post('/api/user/login', { email, password });

            // --- SUCCESSFUL LOGIN ---
            
            // Optional: Store the token for future authenticated requests
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Start activity tracking after successful login
            activityTracker.startTracking();
            console.log('🚀 Activity tracker started after login');

            // Force a small delay to ensure localStorage is updated
            await new Promise(resolve => setTimeout(resolve, 100));

            // Verify the data was actually stored
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');
            
            if (!storedToken || !storedUser) {
                setError('Authentication storage failed. Please try again.');
                return;
            }

            // Set flags to prevent redirect loops and multiple auth checks
            sessionStorage.setItem('justLoggedIn', 'true');
            sessionStorage.setItem('isLoggingIn', 'true');

            // Check if there's a pending quote to submit
            if (hasPendingQuote()) {
                const quoteResult = await submitPendingQuote();
                if (quoteResult.success) {
                    toast.success('Your quote request has been submitted!');
                }
            }

            // Redirect based on role with proper authorization check
            const userRole = data.user.role;
            let redirectPath = '/';

            // Determine the correct dashboard for the user's role
            if (userRole === 'admin') {
                redirectPath = '/admin';
            } else if (userRole === 'company') {
                redirectPath = '/company';
            } else if (userRole === 'business') {
                redirectPath = '/business';
            } else if (userRole === 'user') {
                redirectPath = '/user/dashboard';
            }

            // Check if the user has permission to access the intended destination
            if (from) {
                const fromPath = from.pathname || from;
                let hasPermission = false;

                // Check if the user has permission for the intended route
                if (userRole === 'admin' && fromPath.startsWith('/admin')) {
                    hasPermission = true;
                } else if (userRole === 'company' && fromPath.startsWith('/company')) {
                    hasPermission = true;
                } else if (userRole === 'business' && fromPath.startsWith('/business')) {
                    hasPermission = true;
                } else if (userRole === 'user' && fromPath.startsWith('/user')) {
                    hasPermission = true;
                }

                // Redirect to intended destination only if user has permission
                if (hasPermission) {
                    navigate(from, { replace: true });
                } else {
                    // User doesn't have permission, redirect to their appropriate dashboard
                    navigate(redirectPath, { replace: true });
                }
            } else {
                // No intended destination, redirect to appropriate dashboard
                navigate(redirectPath, { replace: true });
            }

        } catch (err) {
            // Display error message to the user
            setError(err.message);
        }
    };

    return (
        <div className="bg-stone-100 min-h-screen mt-20 font-sans">
            <header
                className="h-60 bg-cover bg-center relative"
                style={{ backgroundImage: `url('/Login.jpg')` }}
            >
                <div className="container mx-auto h-full flex flex-col justify-center items-center text-white relative z-10">
                    <h1 className="text-5xl font-bold">Login</h1>
                    <p className="mt-2 text-base">
                        <span>Home</span>
                        <span className="mx-2">&gt;</span>
                        <span>Login</span>
                    </p>
                </div>
            </header>

            <main className="container mx-auto mt-32 px-4 py-16">
                <div className="bg-white p-8 md:p-12 rounded-lg shadow-md max-w-lg mx-auto -mt-40 relative z-20">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back!</h2>
                    <div className="w-16 h-1 bg-[#CDA435] mb-8"></div>
                    
                    {/* Display registration success message if it exists */}
                    {registrationMessage && (
                        <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4">
                            {registrationMessage}
                        </div>
                    )}
                    
                    {/* Display error message if it exists */}
                    {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label htmlFor="email" className="block text-gray-700 text-sm mb-2">Email *</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter Your Email"
                                required
                                className="w-full px-4 py-3 bg-stone-100 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CDA435]"
                            />
                        </div>
                        
                        <div className="mb-6">
                            <label htmlFor="password" className="block text-gray-700 text-sm mb-2">Password *</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter Your Password"
                                    required
                                    className="w-full px-4 py-3 pr-12 bg-stone-100 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CDA435]"
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
                        </div>

                        <div className="flex items-center justify-between mb-6">
                            <div className="text-sm">
                                <Link to="/forgot-password" className="font-medium text-gray-600 hover:text-[#CDA435]">
                                    Forgot Password?
                                </Link>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center cursor-pointer py-3 px-4 rounded-md shadow-sm text-base font-medium text-white bg-[#CDA435] hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#CDA435] transition-colors"
                            >
                                Submit
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center text-sm text-gray-600 space-y-2">
                        <p>
                            Don't have account?{' '}
                            <Link to="/register" className="font-semibold text-gray-800 underline hover:text-[#CDA435]">
                                Signup as Company/Business
                            </Link>
                        </p>
                        <p>
                            Need to request quotes?{' '}
                            <Link 
                                to="/user-register" 
                                state={{ from }}
                                className="font-semibold text-[#CDA435] underline hover:text-[#CDA435]"
                            >
                                Create User Account
                            </Link>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LoginPage;