import './FuturisticLoader.css';

const FuturisticLoader = ({ message = "Loading...", size = "medium" }) => {
  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-24 h-24", 
    large: "w-32 h-32"
  };

  return (
    <div className="futuristic-loader-container">
      <div className="futuristic-loader-backdrop">
        <div className="futuristic-loader-content">
          {/* Main Loader Animation */}
          <div className={`futuristic-loader ${sizeClasses[size]}`}>
            {/* Outer Ring */}
            <div className="loader-ring loader-ring-1">
              <div className="ring-segment"></div>
              <div className="ring-segment"></div>
              <div className="ring-segment"></div>
              <div className="ring-segment"></div>
            </div>
            
            {/* Middle Ring */}
            <div className="loader-ring loader-ring-2">
              <div className="ring-segment"></div>
              <div className="ring-segment"></div>
              <div className="ring-segment"></div>
            </div>
            
            {/* Inner Core */}
            <div className="loader-core">
              <div className="core-pulse"></div>
              <div className="core-glow"></div>
            </div>
            
            {/* Floating Particles */}
            <div className="particle particle-1"></div>
            <div className="particle particle-2"></div>
            <div className="particle particle-3"></div>
            <div className="particle particle-4"></div>
            <div className="particle particle-5"></div>
            <div className="particle particle-6"></div>
          </div>
          
          {/* Loading Text */}
          <div className="loader-text">
            <span className="text-glow">{message}</span>
            <div className="text-dots">
              <span className="dot dot-1">.</span>
              <span className="dot dot-2">.</span>
              <span className="dot dot-3">.</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="progress-container">
            <div className="progress-bar">
              <div className="progress-fill"></div>
              <div className="progress-glow"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuturisticLoader;