import React from 'react';

// Professional inline spinner for buttons and small spaces
export const InlineLoader = ({ text = 'Loading...', size = 'sm', color = 'white' }) => {
  const sizeClasses = {
    xs: 'h-3 w-3 border-2',
    sm: 'h-4 w-4 border-2', 
    md: 'h-5 w-5 border-2',
    lg: 'h-6 w-6 border-3'
  };

  const colorClasses = {
    white: 'border-gray-200 border-t-white',
    primary: 'border-gray-200 border-t-[#bca142]',
    blue: 'border-gray-200 border-t-blue-600',
    gray: 'border-gray-300 border-t-gray-600'
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-spin`}></div>
      </div>
      {text && <span className="text-xs font-medium">{text}</span>}
    </div>
  );
};

// Professional page loader
export const PageLoader = ({ text = 'Loading...', size = 'lg' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8 border-3',
    md: 'h-10 w-10 border-3',
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-4'
  };

  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className={`${sizeClasses[size]} border-gray-200 rounded-full animate-spin`}>
            <div className={`${sizeClasses[size]} border-transparent border-t-[#bca142] rounded-full animate-spin`}></div>
          </div>
        </div>
        <p className="text-gray-600 font-medium">{text}</p>
      </div>
    </div>
  );
};

// Professional table loader
export const TableLoader = ({ text = 'Loading data...', rows = 5 }) => {
  return (
    <div className="text-center py-8">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="h-8 w-8 border-3 border-gray-200 rounded-full animate-spin">
            <div className="h-8 w-8 border-3 border-transparent border-t-[#bca142] rounded-full animate-spin"></div>
          </div>
        </div>
        <p className="text-gray-600 font-medium">{text}</p>
      </div>
    </div>
  );
};

// Professional card loader with skeleton
export const CardLoader = ({ text = 'Loading...', showSkeleton = false }) => {
  if (showSkeleton) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="h-8 w-8 border-3 border-gray-200 rounded-full animate-spin">
            <div className="h-8 w-8 border-3 border-transparent border-t-[#bca142] rounded-full animate-spin"></div>
          </div>
        </div>
        <p className="text-gray-600 font-medium text-sm">{text}</p>
      </div>
    </div>
  );
};

export default {
  InlineLoader,
  PageLoader,
  TableLoader,
  CardLoader
};