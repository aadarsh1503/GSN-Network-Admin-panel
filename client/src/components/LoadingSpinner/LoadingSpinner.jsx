import React from 'react';

const LoadingSpinner = ({ 
  size = 'md', 
  text = 'Loading...', 
  fullScreen = false,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50'
    : 'flex flex-col items-center justify-center py-8';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="flex flex-col items-center gap-3">
        {/* Professional Spinner */}
        <div className="relative">
          <div className={`${sizeClasses[size]} border-4 border-gray-200 rounded-full animate-spin`}>
            <div className={`${sizeClasses[size]} border-4 border-transparent border-t-[#CDA435] rounded-full animate-spin`}></div>
          </div>
          {/* Inner dot for extra professional look */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-[#CDA435] rounded-full animate-pulse"></div>
          </div>
        </div>
        
        {/* Loading Text */}
        {text && (
          <p className={`${textSizeClasses[size]} text-gray-600 font-medium animate-pulse`}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
};

// Inline spinner for small spaces
export const InlineSpinner = ({ text = 'Loading...', className = '' }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className="h-4 w-4 border-2 border-gray-200 rounded-full animate-spin">
          <div className="h-4 w-4 border-2 border-transparent border-t-[#CDA435] rounded-full animate-spin"></div>
        </div>
      </div>
      <span className="text-xs text-gray-600 font-medium">{text}</span>
    </div>
  );
};

export default LoadingSpinner;