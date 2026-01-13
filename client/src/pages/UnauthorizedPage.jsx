import React from 'react';
import { Link } from 'react-router-dom';
import { getToken, isTokenExpired, removeToken } from '../utils/api';

const UnauthorizedPage = () => {
    // Check authentication state properly
    const token = getToken();
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;
    
    let homeLink = '/login';
    
    // Only set role-based links if user is properly authenticated
    if (user && token && !isTokenExpired(token)) {
        switch(user.role) {
            case 'admin':
                homeLink = '/admin';
                break;
            case 'company':
                homeLink = '/company';
                break;
            case 'business':
                homeLink = '/business';
                break;
            case 'user':
                homeLink = '/user/dashboard';
                break;
            default:
                homeLink = '/';
        }
    } else {
        // Clear invalid authentication data
        removeToken();
        homeLink = '/login';
    }

    // Since we can't use tailwind.config.js, we inject the necessary CSS
    // for custom fonts and animations directly into the component's render.
    // This makes the component entirely self-sufficient.
    const customStyles = `
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700&family=Roboto:wght@400;500&display=swap');

      @keyframes gradient-bg-animation {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      @keyframes text-glow-animation {
        from {
          text-shadow: 0 0 10px #fff, 0 0 20px #e0e7ff, 0 0 30px #a5b4fc, 0 0 40px #a5b4fc;
        }
        to {
          text-shadow: 0 0 20px #fff, 0 0 30px #818cf8, 0 0 40px #818cf8, 0 0 50px #818cf8;
        }
      }

      /* We create custom classes that our Tailwind JSX can hook into */
      .font-poppins { font-family: 'Poppins', sans-serif; }
      .font-roboto { font-family: 'Roboto', sans-serif; }
      .animate-gradient-bg {
        background-size: 400% 400%;
        animation: gradient-bg-animation 15s ease infinite;
      }
      .animate-text-glow {
        animation: text-glow-animation 2.5s ease-in-out infinite alternate;
      }
    `;

    return (
        <>
            <style>{customStyles}</style>
            
            <main className="
                flex items-center justify-center min-h-screen w-full p-4
                font-roboto animate-gradient-bg
                bg-gradient-to-r from-blue-100 via-purple-100 to-teal-100
            ">
                {/* Glassmorphism Card */}
                <div className="
                    w-full max-w-md text-center
                    bg-white/60 backdrop-blur-xl
                    border border-white/30
                    shadow-2xl shadow-blue-200/50 rounded-3xl
                    p-6 md:p-10
                ">
                    {/* Animated Glowing 403 - We use arbitrary values for the clamp function */}
                    <h1 className="
                        font-poppins font-bold
                        text-[clamp(6rem,20vw,9rem)] leading-none
                        bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent
                        animate-text-glow
                    ">
                        403
                    </h1>

                    {/* Title */}
                    <h2 className="
                        font-poppins font-bold text-3xl md:text-4xl 
                        text-slate-800 mt-2
                    ">
                        Access Forbidden
                    </h2>

                    {/* Message */}
                    <p className="
                        text-slate-600 font-medium 
                        mt-4 mb-8 text-base md:text-lg
                    ">
                        Oops! It seems you've stumbled upon a page protected by cosmic forces.
                    </p>
                    
                    {/* Call-to-Action Button */}
                    <Link 
                        to={homeLink} 
                        className="
                            inline-block py-3 px-8 
                            font-bold text-white text-lg
                            bg-gradient-to-r from-indigo-500 to-blue-500 
                            rounded-full shadow-lg shadow-indigo-300/50
                            transition-all duration-300 ease-in-out
                            hover:scale-105 hover:shadow-xl hover:shadow-indigo-400/50
                            focus:outline-none focus:ring-4 focus:ring-indigo-300
                        "
                    >
                        Return to Safety
                    </Link>
                </div>
            </main>
        </>
    );
};

export default UnauthorizedPage;