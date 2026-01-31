import React from 'react';

const FuturisticLoader = ({ message = "Loading...", size = "medium" }) => {
  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-24 h-24", 
    large: "w-32 h-32"
  };

  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 p-8">
        {/* Professional Spinner with Website Colors */}
        <div className="relative">
          <div className={`${sizeClasses[size]} border-4 border-gray-200 rounded-full animate-spin`}>
            <div className={`${sizeClasses[size]} border-4 border-transparent border-t-[#bca142] border-r-[#bca142] rounded-full animate-spin`}></div>
          </div>
          
          {/* Inner rotating ring */}
          <div className="absolute inset-2">
            <div className="w-full h-full border-2 border-gray-100 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}>
              <div className="w-full h-full border-2 border-transparent border-b-[#bca142] rounded-full"></div>
            </div>
          </div>
          
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-[#bca142] rounded-full animate-pulse"></div>
          </div>
        </div>
        
        {/* Loading Text */}
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-800 mb-2">{message}</p>
          <div className="flex items-center justify-center gap-1">
            <div className="w-2 h-2 bg-[#bca142] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-[#bca142] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-[#bca142] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-64 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#bca142] to-yellow-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default FuturisticLoader;