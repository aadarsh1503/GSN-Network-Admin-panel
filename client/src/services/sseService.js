// SSE (Server-Sent Events) service for real-time notifications
import { getToken } from '../utils/api';

class SSEService {
  constructor() {
    this.eventSource = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.listeners = new Map();
    this.isConnected = false;
  }

  // Connect to SSE stream
  connect() {
    const token = getToken();
    if (!token) {
      console.warn('🔒 No token available for SSE connection');
      return false;
    }

    if (this.eventSource) {
      console.log('🔄 SSE already connected, closing existing connection');
      this.disconnect();
    }

    try {
      const sseUrl = `/api/notifications/stream?token=${encodeURIComponent(token)}`;
      console.log('🔌 Connecting to SSE:', sseUrl);
      
      this.eventSource = new EventSource(sseUrl);
      
      this.eventSource.onopen = (event) => {
        console.log('✅ SSE connection opened');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 SSE message received:', data);
          
          // Handle different message types
          if (data.type === 'connection') {
            console.log('🔗 SSE connection confirmed:', data.message);
          } else if (data.type === 'heartbeat') {
            // console.log('💓 SSE heartbeat received');
          } else {
            // Dispatch custom event for notification listeners
            this.dispatchNotification(data.type, data.data);
          }
        } catch (error) {
          console.error('❌ Error parsing SSE message:', error);
        }
      };

      this.eventSource.onerror = (event) => {
        console.error('❌ SSE connection error:', event);
        this.isConnected = false;
        
        if (this.eventSource.readyState === EventSource.CLOSED) {
          console.log('🔄 SSE connection closed, attempting to reconnect...');
          this.attemptReconnect();
        }
      };

      return true;
    } catch (error) {
      console.error('❌ Failed to create SSE connection:', error);
      return false;
    }
  }

  // Disconnect from SSE stream
  disconnect() {
    if (this.eventSource) {
      console.log('🔌 Disconnecting SSE');
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
    }
  }

  // Attempt to reconnect with exponential backoff
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max SSE reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 SSE reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (!this.isConnected) {
        this.connect();
      }
    }, delay);
  }

  // Dispatch notification as custom event
  dispatchNotification(eventType, data) {
    console.log(`📢 Dispatching notification: ${eventType}`, data);
    
    // Dispatch as custom window event
    const customEvent = new CustomEvent(eventType, {
      detail: data
    });
    window.dispatchEvent(customEvent);

    // Also call any registered listeners
    if (this.listeners.has(eventType)) {
      const callbacks = this.listeners.get(eventType);
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in SSE listener for ${eventType}:`, error);
        }
      });
    }
  }

  // Add event listener
  addEventListener(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
    console.log(`👂 SSE listener added for: ${eventType}`);
  }

  // Remove event listener
  removeEventListener(eventType, callback) {
    if (this.listeners.has(eventType)) {
      const callbacks = this.listeners.get(eventType);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
        console.log(`👂 SSE listener removed for: ${eventType}`);
      }
    }
  }

  // Get connection status
  getStatus() {
    return {
      isConnected: this.isConnected,
      readyState: this.eventSource?.readyState,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  // Test connection
  async testConnection() {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('/api/notifications/connections', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🔍 SSE connection test result:', data);
      return data;
    } catch (error) {
      console.error('❌ SSE connection test failed:', error);
      throw error;
    }
  }
}

// Create singleton instance
const sseService = new SSEService();

export default sseService;