// Keep-alive service to prevent token expiration with improved error handling
import { api, getToken, isTokenExpired } from '../utils/api.js';

class KeepAliveService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.pingInterval = 10 * 60 * 1000; // 10 minutes in milliseconds (increased from 5)
    this.maxRetries = 5; // Increased from 3
    this.retryCount = 0;
    this.backoffMultiplier = 1.5;
    this.maxBackoffDelay = 5 * 60 * 1000; // 5 minutes max backoff
    this.consecutiveFailures = 0;
  }

  // Start the keep-alive service
  start() {
    if (this.isRunning) {
      return;
    }

    const token = getToken();
    if (!token || isTokenExpired(token)) {
      return;
    }

    this.isRunning = true;
    this.retryCount = 0;
    this.consecutiveFailures = 0;

    // Send initial ping after a short delay to avoid startup conflicts
    setTimeout(() => {
      this.sendPing();
    }, 5000); // 5 second delay

    // Set up periodic pings
    this.intervalId = setInterval(() => {
      this.sendPing();
    }, this.pingInterval);
  }

  // Stop the keep-alive service
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.retryCount = 0;
    this.consecutiveFailures = 0;
  }

  // Send a ping to the server with improved error handling
  async sendPing() {
    const pingId = Math.random().toString(36).substring(7);
    const token = getToken();
    
    if (!token || isTokenExpired(token)) {
      this.stop();
      return;
    }

    try {
      const startTime = Date.now();
      
      const response = await api.get('/api/user/keep-alive');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (response.success) {
        this.retryCount = 0; // Reset retry count on success
        this.consecutiveFailures = 0; // Reset consecutive failures
      } else {
        throw new Error('Keep-alive ping failed: Invalid response');
      }
    } catch (error) {
      this.retryCount++;
      this.consecutiveFailures++;
      
      const errorTime = Date.now();
      
      // ECONNRESET TRACKING for keep-alive
      if (error.message.includes('ECONNRESET')) {
        // Log to localStorage for debugging
        try {
          const keepAliveLogs = JSON.parse(localStorage.getItem('keepalive_econnreset_logs') || '[]');
          keepAliveLogs.unshift({
            timestamp: new Date().toISOString(),
            pingId,
            error: error.message,
            stack: error.stack,
            consecutiveFailures: this.consecutiveFailures,
            retryCount: this.retryCount,
            userAgent: navigator.userAgent,
            currentPath: window.location.pathname
          });
          if (keepAliveLogs.length > 15) keepAliveLogs.splice(15);
          localStorage.setItem('keepalive_econnreset_logs', JSON.stringify(keepAliveLogs));
        } catch (e) {
          // Silent fail for logging
        }
      }

      // Calculate backoff delay
      const backoffDelay = Math.min(
        1000 * Math.pow(this.backoffMultiplier, this.consecutiveFailures - 1),
        this.maxBackoffDelay
      );

      // If we've exceeded max retries, implement progressive backoff
      if (this.retryCount >= this.maxRetries) {
        // Don't stop the service immediately, but increase the ping interval temporarily
        if (this.consecutiveFailures >= 3) {
          // Temporarily increase ping interval
          if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = setInterval(() => {
              this.sendPing();
            }, this.pingInterval * 2); // Double the interval temporarily
          }
          
          // Reset retry count but keep tracking consecutive failures
          this.retryCount = 0;
          
          // Only stop service after many consecutive failures
          if (this.consecutiveFailures >= 10) {
            this.stop();
            
            // Dispatch custom event to notify the app about persistent connection issues
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('keepAliveFailure', {
                detail: { 
                  message: 'Persistent connection issues detected',
                  retries: this.consecutiveFailures,
                  action: 'service_stopped',
                  pingId
                }
              }));
            }
          }
        } else {
          // For fewer failures, just retry with backoff
          setTimeout(() => {
            this.sendPing();
          }, backoffDelay);
          
          this.retryCount = 0; // Reset for next attempt
        }
      } else {
        // Retry with exponential backoff
        setTimeout(() => {
          this.sendPing();
        }, backoffDelay);
      }
    }
  }

  // Check if the service is running
  isActive() {
    return this.isRunning;
  }

  // Update ping interval (in minutes)
  setPingInterval(minutes) {
    if (minutes < 1) {
      return;
    }

    this.pingInterval = minutes * 60 * 1000;

    // Restart service with new interval if it's currently running
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  // Get current status
  getStatus() {
    return {
      isRunning: this.isRunning,
      pingInterval: this.pingInterval / 60000, // Convert to minutes
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
      consecutiveFailures: this.consecutiveFailures
    };
  }

  // Reset failure counters (useful when connection is restored)
  resetFailures() {
    this.retryCount = 0;
    this.consecutiveFailures = 0;
    
    // Restore normal ping interval if it was increased due to failures
    if (this.isRunning && this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = setInterval(() => {
        this.sendPing();
      }, this.pingInterval);
    }
  }
}

// Create and export a singleton instance
const keepAliveService = new KeepAliveService();

export default keepAliveService;