// Connection monitoring service to detect network issues
import keepAliveService from './keepAliveService.js';

class ConnectionMonitor {
  constructor() {
    this.isOnline = navigator.onLine;
    this.connectionQuality = 'good';
    this.lastSuccessfulRequest = Date.now();
    this.failureCount = 0;
    this.listeners = [];
  }

  // Initialize the connection monitor
  initialize() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Listen for keep-alive failures
    window.addEventListener('keepAliveFailure', this.handleKeepAliveFailure.bind(this));
    
    // Periodically check connection quality
    this.startConnectionQualityCheck();
    
    console.log('🌐 Connection monitor initialized');
  }

  // Handle online event
  handleOnline() {
    console.log('🌐 Connection restored');
    this.isOnline = true;
    this.connectionQuality = 'good';
    this.failureCount = 0;
    
    // Reset keep-alive service failures
    keepAliveService.resetFailures();
    
    // Restart keep-alive service if it was stopped
    if (!keepAliveService.isActive()) {
      keepAliveService.start();
    }
    
    this.notifyListeners('online');
  }

  // Handle offline event
  handleOffline() {
    console.log('🌐 Connection lost');
    this.isOnline = false;
    this.connectionQuality = 'offline';
    
    this.notifyListeners('offline');
  }

  // Handle keep-alive failures
  handleKeepAliveFailure(event) {
    console.log('🌐 Keep-alive failure detected:', event.detail);
    this.failureCount++;
    
    if (this.failureCount >= 3) {
      this.connectionQuality = 'poor';
    } else if (this.failureCount >= 5) {
      this.connectionQuality = 'very-poor';
    }
    
    this.notifyListeners('quality-degraded', {
      quality: this.connectionQuality,
      failures: this.failureCount
    });
  }

  // Start periodic connection quality checks
  startConnectionQualityCheck() {
    setInterval(() => {
      this.checkConnectionQuality();
    }, 2 * 60 * 1000); // Check every 2 minutes
  }

  // Check connection quality by making a lightweight request
  async checkConnectionQuality() {
    if (!this.isOnline) return;

    try {
      const startTime = Date.now();
      
      // Make a lightweight request to check connection
      const response = await fetch('/api/test-public', {
        method: 'GET',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (response.ok) {
        this.lastSuccessfulRequest = Date.now();
        this.failureCount = Math.max(0, this.failureCount - 1); // Gradually reduce failure count
        
        // Determine connection quality based on response time
        if (responseTime < 1000) {
          this.connectionQuality = 'good';
        } else if (responseTime < 3000) {
          this.connectionQuality = 'fair';
        } else {
          this.connectionQuality = 'poor';
        }
        
        console.log(`🌐 Connection check: ${this.connectionQuality} (${responseTime}ms)`);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.warn('🌐 Connection quality check failed:', error.message);
      this.failureCount++;
      
      if (this.failureCount >= 3) {
        this.connectionQuality = 'poor';
      }
    }
  }

  // Add event listener
  addEventListener(callback) {
    this.listeners.push(callback);
  }

  // Remove event listener
  removeEventListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners
  notifyListeners(event, data = {}) {
    this.listeners.forEach(callback => {
      try {
        callback({
          type: event,
          isOnline: this.isOnline,
          connectionQuality: this.connectionQuality,
          failureCount: this.failureCount,
          lastSuccessfulRequest: this.lastSuccessfulRequest,
          ...data
        });
      } catch (error) {
        console.error('Connection monitor listener error:', error);
      }
    });
  }

  // Get current connection status
  getStatus() {
    return {
      isOnline: this.isOnline,
      connectionQuality: this.connectionQuality,
      failureCount: this.failureCount,
      lastSuccessfulRequest: this.lastSuccessfulRequest,
      timeSinceLastSuccess: Date.now() - this.lastSuccessfulRequest
    };
  }

  // Check if connection is stable enough for critical operations
  isConnectionStable() {
    return this.isOnline && 
           this.connectionQuality !== 'very-poor' && 
           this.failureCount < 5 &&
           (Date.now() - this.lastSuccessfulRequest) < 10 * 60 * 1000; // Within last 10 minutes
  }

  // Cleanup
  destroy() {
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    window.removeEventListener('keepAliveFailure', this.handleKeepAliveFailure.bind(this));
    this.listeners = [];
  }
}

// Create and export a singleton instance
const connectionMonitor = new ConnectionMonitor();

export default connectionMonitor;