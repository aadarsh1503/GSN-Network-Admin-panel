import { api } from '../utils/api';

class AdminNotificationService {
  constructor() {
    // Initialize with a timestamp from 1 hour ago to avoid showing old notifications on first load
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    this.lastChecked = localStorage.getItem('adminLastChecked') || oneHourAgo;
    
    // Track if we've already checked in this browser session
    this.sessionKey = 'adminCheckedThisSession';
  }

  // Check if we've already shown notifications in this session
  hasCheckedThisSession() {
    return sessionStorage.getItem(this.sessionKey) === 'true';
  }

  // Mark that we've checked in this session
  markCheckedThisSession() {
    sessionStorage.setItem(this.sessionKey, 'true');
  }

  // Get new registrations since last check
  async getNewRegistrations() {
    try {
      console.log('🔍 Checking for new registrations since:', this.lastChecked);
      const response = await api.get(`/api/admin/new-registrations?since=${this.lastChecked}`);
      console.log('📊 New registrations found:', response.length);
      return response;
    } catch (error) {
      console.error('❌ Error fetching new registrations:', error);
      return [];
    }
  }

  // Update last checked timestamp
  updateLastChecked() {
    const now = new Date().toISOString();
    console.log('⏰ Updating lastChecked from', this.lastChecked, 'to', now);
    this.lastChecked = now;
    localStorage.setItem('adminLastChecked', now);
    // Also mark that we've checked in this session
    this.markCheckedThisSession();
    console.log('✅ Session marked as checked');
  }

  // Reset last checked (for testing purposes)
  resetLastChecked() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    this.lastChecked = oneHourAgo;
    localStorage.setItem('adminLastChecked', oneHourAgo);
    sessionStorage.removeItem(this.sessionKey);
    console.log('🔄 Admin notifications reset - will show on next check');
  }

  // Get all pending notifications
  async getPendingNotifications() {
    try {
      const response = await api.get('/api/admin/pending-notifications');
      return response;
    } catch (error) {
      console.error('Error fetching pending notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId) {
    try {
      await api.put(`/api/admin/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }
}

export default new AdminNotificationService();