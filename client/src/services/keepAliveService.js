// Keep-alive service to prevent token expiration
import { api, getToken, isTokenExpired } from '../utils/api.js';

class KeepAliveService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.pingInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
    this.maxRetries = 3;
    this.retryCount = 0;
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

    // Send initial ping
    this.sendPing();

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
  }

  // Send a ping to the server
  async sendPing() {
    const token = getToken();
    if (!token || isTokenExpired(token)) {
      this.stop();
      return;
    }

    try {
      const response = await api.get('/api/user/keep-alive');
      
      if (response.success) {
        this.retryCount = 0; // Reset retry count on success
      } else {
        throw new Error('Keep-alive ping failed');
      }
    } catch (error) {
      this.retryCount++;

      // If we've exceeded max retries, stop the service
      if (this.retryCount >= this.maxRetries) {
        this.stop();
        
        // Dispatch custom event to notify the app about connection issues
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('keepAliveFailure', {
            detail: { 
              message: 'Connection to server lost',
              retries: this.retryCount 
            }
          }));
        }
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
      maxRetries: this.maxRetries
    };
  }
}

// Create and export a singleton instance
const keepAliveService = new KeepAliveService();

export default keepAliveService;