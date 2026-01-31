const InlineLoader = ({ size = "small", message = "Loading..." }) => {
  const sizeClasses = {
    small: "w-6 h-6",
    medium: "w-8 h-8",
    large: "w-12 h-12"
  };

  return (
    <div className="flex items-center justify-center gap-3 p-4">
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Spinning Ring */}
        <div className="absolute inset-0 border-2 border-transparent border-t-[#bca142] border-r-[#bca142] rounded-full animate-spin"></div>
        
        {/* Inner Pulse */}
        <div className="absolute inset-2 bg-[#bca142] rounded-full animate-pulse opacity-60"></div>
        
        {/* Center Dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1 h-1 bg-white rounded-full animate-ping"></div>
        </div>
      </div>
      
      {message && (
        <span className="text-gray-600 font-medium animate-pulse">
          {message}
        </span>
      )}
    </div>
  );
};

export default InlineLoader;