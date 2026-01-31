import React from 'react';

const FuturisticLoader = ({ size = 'medium', message = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
    xlarge: 'w-24 h-24'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Main Loader */}
      <div className="relative">
        {/* Outer Ring */}
        <div className={`${sizeClasses[size]} rounded-full border-4 border-gray-200 animate-spin`}>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#bca142] animate-spin"></div>
        </div>
        
        {/* Inner Ring */}
        <div className={`absolute inset-2 rounded-full border-2 border-gray-100 animate-spin`} style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-r-[#B8941F] animate-spin" style={{ animationDirection: 'reverse' }}></div>
        </div>
        
        {/* Center Dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-gradient-to-r from-[#bca142] to-[#B8941F] rounded-full animate-pulse"></div>
        </div>
        
        {/* Orbiting Dots */}
        <div className={`absolute inset-0 ${sizeClasses[size]} animate-spin`} style={{ animationDuration: '2s' }}>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#bca142] rounded-full"></div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-[#B8941F] rounded-full"></div>
        </div>
      </div>
      
      {/* Loading Text */}
      <div className="text-center">
        <p className="text-gray-600 font-medium animate-pulse">{message}</p>
        <div className="flex justify-center space-x-1 mt-2">
          <div className="w-2 h-2 bg-[#bca142] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-[#B8941F] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-[#bca142] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default FuturisticLoader;