// Activity tracker for automatic token refresh
import { getToken, isTokenExpiringSoon, refreshAuthToken } from './api';

class ActivityTracker {
  constructor() {
    this.isActive = false;
    this.lastActivity = Date.now();
    this.refreshTimer = null;
    this.activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    this.checkInterval = 5 * 60 * 1000; // Check every 5 minutes
    this.inactivityThreshold = 30 * 60 * 1000; // 30 minutes of inactivity
  }

  // Start tracking user activity
  startTracking() {
    if (this.isActive) return;
    
    this.isActive = true;
    this.lastActivity = Date.now();
    
    // Add event listeners for user activity
    this.activityEvents.forEach(event => {
      document.addEventListener(event, this.handleActivity.bind(this), true);
    });
    
    // Start periodic token check
    this.startPeriodicCheck();
    
    console.log('🔍 Activity tracking started');
  }

  // Stop tracking user activity
  stopTracking() {
    if (!this.isActive) return;
    
    this.isActive = false;
    
    // Remove event listeners
    this.activityEvents.forEach(event => {
      document.removeEventListener(event, this.handleActivity.bind(this), true);
    });
    
    // Clear timers
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    console.log('🛑 Activity tracking stopped');
  }

  // Handle user activity
  handleActivity() {
    this.lastActivity = Date.now();
  }

  // Check if user is currently active
  isUserActive() {
    const now = Date.now();
    return (now - this.lastActivity) < this.inactivityThreshold;
  }

  // Start periodic token refresh check
  startPeriodicCheck() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    this.refreshTimer = setInterval(async () => {
      await this.checkAndRefreshToken();
    }, this.checkInterval);
  }

  // Check token status and refresh if needed
  async checkAndRefreshToken() {
    const token = getToken();
    
    if (!token) {
      console.log('🚫 No token found, stopping activity tracking');
      this.stopTracking();
      return;
    }

    // Only refresh if user is active and token is expiring soon
    if (this.isUserActive() && isTokenExpiringSoon(token)) {
      try {
        console.log('🔄 User is active and token expiring soon, refreshing...');
        await refreshAuthToken();
        console.log('✅ Token refreshed due to user activity');
        
        // Update last activity to prevent immediate re-refresh
        this.lastActivity = Date.now();
      } catch (error) {
        console.error('❌ Failed to refresh token during activity check:', error);
        this.stopTracking();
      }
    } else if (!this.isUserActive()) {
      console.log('😴 User inactive, skipping token refresh');
    }
  }

  // Manual token refresh (can be called by components)
  async manualRefresh() {
    try {
      await refreshAuthToken();
      this.lastActivity = Date.now();
      return true;
    } catch (error) {
      console.error('❌ Manual token refresh failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const activityTracker = new ActivityTracker();

export default activityTracker;