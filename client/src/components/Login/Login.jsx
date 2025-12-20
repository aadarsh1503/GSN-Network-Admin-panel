import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { submitPendingQuote, hasPendingQuote } from '../../utils/pendingQuote';
import toast from 'react-hot-toast';

// EyeIcon component remains the same...
const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.432 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(''); // State for error messages
    const navigate = useNavigate();
    const location = useLocation();

    // Get redirect path from location state
    const from = location.state?.from || null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors

        try {
            const response = await fetch('/api/user/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                // If response is not 2xx, throw an error to be caught by the catch block
                throw new Error(data.message || 'Login failed');
            }

            // --- SUCCESSFUL LOGIN ---
            console.log('Login successful:', data);

            // Optional: Store the token for future authenticated requests
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Check if there's a pending quote to submit
            if (hasPendingQuote()) {
                const quoteResult = await submitPendingQuote();
                if (quoteResult.success) {
                    toast.success('Your quote request has been submitted!');
                }
            }

            // Redirect based on role or intended destination
            if (from) {
                navigate(from, { replace: true });
            } else if (data.user.role === 'admin') {
                navigate('/admin');
            } else if (data.user.role === 'company') {
                navigate('/company');
            } else if (data.user.role === 'user') {
                navigate('/user/dashboard');
            } else {
                // Fallback in case of an unexpected role
                navigate('/');
            }

        } catch (err) {
            // Display error message to the user
            console.error('Login error:', err.message);
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
                                    className="w-full px-4 py-3 bg-stone-100 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CDA435]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    aria-label="Toggle password visibility"
                                >
                                    <EyeIcon />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-6">
                            <div className="text-sm">
                                <a href="#" className="font-medium text-gray-600 hover:text-[#CDA435]">Forgot Password?</a>
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
                            Need to track quotes?{' '}
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