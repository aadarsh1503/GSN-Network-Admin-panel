import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

// A simple SVG icon component for the 'eye' icon in the password field
const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.432 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate(); // Initialize useNavigate hook

    // Function to handle form submission
    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent default form submission behavior (page reload)
        // For now, redirect without checking credentials
        navigate('/admin');
    };

    return (
        <div className="bg-stone-100 min-h-screen mt-20 font-sans">
            {/* Header Section with Background Image */}
            <header
                className="h-60 bg-cover bg-center relative"
                style={{ backgroundImage: `url('/Login.jpg')` }}
            >
                {/* Dark Overlay (commented out as per your previous edit) */}
                {/* <div className="absolute inset-0 bg-black bg-opacity-0"></div> */}
                
                <div className="container mx-auto h-full flex flex-col justify-center items-center text-white relative z-10">
                    <h1 className="text-5xl font-bold">Login</h1>
                    <p className="mt-2 text-base">
                        <span>Home</span>
                        <span className="mx-2">&gt;</span>
                        <span>Login</span>
                    </p>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="container mx-auto mt-32 px-4 py-16">
                 {/* Login Form Card */}
                <div className="bg-white p-8 md:p-12 rounded-lg shadow-md max-w-lg mx-auto -mt-40 relative z-20">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back!</h2>
                    <div className="w-16 h-1 bg-[#CDA435] mb-8"></div>
                    
                    <form onSubmit={handleSubmit}> {/* Attach the handleSubmit function here */}
                        {/* Email Input */}
                        <div className="mb-6">
                            <label htmlFor="email" className="block text-gray-700 text-sm mb-2">Email *</label>
                            <input
                                type="email"
                                id="email"
                                placeholder="Enter Your Email"
                                className="w-full px-4 py-3 bg-stone-100 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CDA435]"
                            />
                        </div>
                        
                        {/* Password Input */}
                        <div className="mb-6">
                            <label htmlFor="password" className="block text-gray-700 text-sm mb-2">Password *</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    placeholder="Enter Your Password"
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

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between mb-6">
                            {/* <div className="flex items-center">
                                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 rounded border-gray-300 accent-[#CDA435] focus:ring-[#CDA435]" />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">Remember Me</label>
                            </div> */}
                            <div className="text-sm">
                                <a href="#" className="font-medium text-gray-600 hover:text-[#CDA435]">Forgot Password?</a>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center cursor-pointer py-3 px-4 rounded-md shadow-sm text-base font-medium text-white bg-[#CDA435] hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#CDA435] transition-colors"
                            >
                                Submit
                            </button>
                        </div>
                    </form>

                    {/* Sign Up Link */}
                    <p className="mt-8 text-center text-sm text-gray-600">
                        Don't have account?{' '}
                        <a href="#" className="font-semibold text-gray-800 underline hover:text-[#CDA435]">
                            Signup
                        </a>
                    </p>
                </div>
            </main>
        </div>
    );
};

export default LoginPage;