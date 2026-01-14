import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { api } from '../utils/api';

const GlobalNotificationContext = createContext();

export const useGlobalNotifications = () => {
  const context = useContext(GlobalNotificationContext);
  if (!context) {
    throw new Error('useGlobalNotifications must be used within GlobalNotificationProvider');
  }
  return context;
};

// Event types for different panels
export const NOTIFICATION_EVENTS = {
  // Admin Panel Events
  ADMIN: {
    NEW_USER_REGISTRATION: 'admin_new_user_registration',
    NEW_COMPANY_REGISTRATION: 'admin_new_company_registration',
    NEW_QUOTE_REQUEST: 'admin_new_quote_request',
    USER_ACCEPTS_QUOTE: 'admin_user_accepts_quote',
    QUOTE_STATUS_CHANGED: 'admin_quote_status_changed',
    NEW_MESSAGE: 'admin_new_message',
    MEMBER_ACTIVITY_UPDATE: 'admin_member_activity_update',
    PROFILE_UPDATE: 'admin_profile_update',
    DISPUTE_RAISED: 'admin_dispute_raised',
    SUPPORT_TICKET_RAISED: 'admin_support_ticket_raised',
    TICKET_STATUS_UPDATE: 'admin_ticket_status_update',
    SYSTEM_CRITICAL_ACTION: 'admin_system_critical_action'
  },
  
  // Member Panel Events
  MEMBER: {
    NEW_QUOTE_ASSIGNED: 'member_new_quote_assigned',
    USER_ACCEPTS_QUOTE: 'member_user_accepts_quote',
    USER_REJECTS_QUOTE: 'member_user_rejects_quote',
    QUOTE_STATUS_UPDATE: 'member_quote_status_update',
    NEW_MESSAGE: 'member_new_message',
    DISPUTE_INVOLVING_MEMBER: 'member_dispute_involving',
    SUPPORT_TICKET_INVOLVING: 'member_support_ticket_involving',
    ADMIN_ACTION_IMPACT: 'member_admin_action_impact'
  },
  
  // User Panel Events
  USER: {
    QUOTE_STATUS_APPROVED: 'user_quote_status_approved',
    QUOTE_STATUS_REJECTED: 'user_quote_status_rejected',
    QUOTE_STATUS_RUNNING: 'user_quote_status_running',
    QUOTE_STATUS_CLOSED: 'user_quote_status_closed',
    ADMIN_STATUS_CHANGE: 'user_admin_status_change',
    MEMBER_QUOTE_RESPONSE: 'user_member_quote_response',
    WORK_STARTED: 'user_work_started',
    WORK_COMPLETED: 'user_work_completed',
    NEW_MESSAGE: 'user_new_message',
    DISPUTE_UPDATE: 'user_dispute_update',
    SUPPORT_TICKET_UPDATE: 'user_support_ticket_update'
  }
};

export const GlobalNotificationProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEventId, setLastEventId] = useState(null);
  const [processedEvents, setProcessedEvents] = useState(new Set());
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Get current user info
  const getCurrentUser = useCallback(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      return { user, token };
    } catch (error) {
      console.error('Error getting current user:', error);
      return { user: {}, token: null };
    }
  }, []);

  // Toast configuration for different panels
  const getToastConfig = useCallback((panel) => {
    const baseConfig = {
      position: 'top-right',
      autoClose: 6000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      pauseOnFocusLoss: false
    };

    switch (panel) {
      case 'admin':
        return {
          ...baseConfig,
          className: 'admin-notification-toast',
          bodyClassName: 'admin-notification-body',
          progressClassName: 'admin-progress-bar'
        };
      case 'member':
        return {
          ...baseConfig,
          className: 'member-notification-toast',
          bodyClassName: 'member-notification-body',
          progressClassName: 'member-progress-bar'
        };
      case 'user':
        return {
          ...baseConfig,
          className: 'user-notification-toast',
          bodyClassName: 'user-notification-body',
          progressClassName: 'user-progress-bar'
        };
      default:
        return baseConfig;
    }
  }, []);

  // Show notification toast based on event type and user role
  const showNotificationToast = useCallback((eventData) => {
    const { user } = getCurrentUser();
    if (!user.id || !user.role) return;

    const { type, data, timestamp, id } = eventData;
    
    // Prevent duplicate notifications
    const eventKey = `${type}_${id}_${timestamp}`;
    if (processedEvents.has(eventKey)) {
      return;
    }

    // Add to processed events
    setProcessedEvents(prev => new Set([...prev, eventKey]));

    // Clean up old processed events (keep only last 100)
    setProcessedEvents(prev => {
      const arr = Array.from(prev);
      if (arr.length > 100) {
        return new Set(arr.slice(-100));
      }
      return prev;
    });

    let shouldShow = false;
    let toastContent = null;
    let toastType = 'info';
    let panelType = user.role;

    // Admin Panel Notifications
    if (user.role === 'admin') {
      switch (type) {
        case NOTIFICATION_EVENTS.ADMIN.NEW_USER_REGISTRATION:
          shouldShow = true;
          toastType = 'success';
          toastContent = (
            <div>
              <div className="font-semibold">New User Registered!</div>
              <div className="text-sm mt-1">
                <div><strong>Name:</strong> {data.name}</div>
                <div><strong>Email:</strong> {data.email}</div>
                <div><strong>Role:</strong> {data.role}</div>
              </div>
            </div>
          );
          break;

        case NOTIFICATION_EVENTS.ADMIN.NEW_QUOTE_REQUEST:
          shouldShow = true;
          toastType = 'info';
          toastContent = (
            <div>
              <div className="font-semibold">New Quote Request</div>
              <div className="text-sm mt-1">
                <div><strong>From:</strong> {data.user_name}</div>
                <div><strong>Service:</strong> {data.service_type}</div>
                <div><strong>Location:</strong> {data.pickup_location} → {data.delivery_location}</div>
              </div>
            </div>
          );
          break;

        case NOTIFICATION_EVENTS.ADMIN.DISPUTE_RAISED:
          shouldShow = true;
          toastType = 'warning';
          toastContent = (
            <div>
              <div className="font-semibold">New Dispute Raised</div>
              <div className="text-sm mt-1">
                <div><strong>Quote ID:</strong> {data.quote_id}</div>
                <div><strong>Raised by:</strong> {data.raised_by}</div>
                <div><strong>Reason:</strong> {data.reason}</div>
              </div>
            </div>
          );
          break;

        default:
          break;
      }
    }

    // Member Panel Notifications
    if (user.role === 'company') {
      switch (type) {
        case NOTIFICATION_EVENTS.MEMBER.NEW_QUOTE_ASSIGNED:
          shouldShow = data.company_id === user.id;
          toastType = 'info';
          toastContent = (
            <div>
              <div className="font-semibold">New Quote Available</div>
              <div className="text-sm mt-1">
                <div><strong>Service:</strong> {data.service_type}</div>
                <div><strong>Route:</strong> {data.pickup_location} → {data.delivery_location}</div>
                <div><strong>Budget:</strong> ${data.budget}</div>
              </div>
            </div>
          );
          break;

        case NOTIFICATION_EVENTS.MEMBER.USER_ACCEPTS_QUOTE:
          shouldShow = data.company_id === user.id;
          toastType = 'success';
          toastContent = (
            <div>
              <div className="font-semibold">Quote Accepted!</div>
              <div className="text-sm mt-1">
                <div><strong>Quote ID:</strong> {data.quote_id}</div>
                <div><strong>User:</strong> {data.user_name}</div>
                <div><strong>Amount:</strong> ${data.amount}</div>
              </div>
            </div>
          );
          break;

        case NOTIFICATION_EVENTS.MEMBER.USER_REJECTS_QUOTE:
          shouldShow = data.company_id === user.id;
          toastType = 'error';
          toastContent = (
            <div>
              <div className="font-semibold">Quote Not Selected</div>
              <div className="text-sm mt-1">
                <div><strong>Quote ID:</strong> {data.quote_id}</div>
                <div><strong>User:</strong> {data.user_name}</div>
                <div><strong>Reason:</strong> {data.reason || 'User selected another quote'}</div>
              </div>
            </div>
          );
          break;

        default:
          break;
      }
    }

    // User Panel Notifications
    if (user.role === 'user') {
      switch (type) {
        case NOTIFICATION_EVENTS.USER.QUOTE_STATUS_APPROVED:
          shouldShow = data.user_id === user.id;
          toastType = 'success';
          toastContent = (
            <div>
              <div className="font-semibold">Quote Approved!</div>
              <div className="text-sm mt-1">
                <div><strong>Quote ID:</strong> {data.quote_id}</div>
                <div><strong>Company:</strong> {data.company_name}</div>
                <div><strong>Amount:</strong> ${data.amount}</div>
              </div>
            </div>
          );
          break;

        case NOTIFICATION_EVENTS.USER.QUOTE_STATUS_RUNNING:
          shouldShow = data.user_id === user.id;
          toastType = 'info';
          toastContent = (
            <div>
              <div className="font-semibold">Work Started</div>
              <div className="text-sm mt-1">
                <div><strong>Quote ID:</strong> {data.quote_id}</div>
                <div><strong>Company:</strong> {data.company_name}</div>
                <div>Your shipment is now in progress</div>
              </div>
            </div>
          );
          break;

        case NOTIFICATION_EVENTS.USER.QUOTE_STATUS_CLOSED:
          shouldShow = data.user_id === user.id;
          toastType = 'success';
          toastContent = (
            <div>
              <div className="font-semibold">Work Completed</div>
              <div className="text-sm mt-1">
                <div><strong>Quote ID:</strong> {data.quote_id}</div>
                <div><strong>Company:</strong> {data.company_name}</div>
                <div>Your shipment has been completed</div>
              </div>
            </div>
          );
          break;

        case NOTIFICATION_EVENTS.USER.MEMBER_QUOTE_RESPONSE:
          shouldShow = data.user_id === user.id;
          toastType = 'info';
          toastContent = (
            <div>
              <div className="font-semibold">New Quote Response</div>
              <div className="text-sm mt-1">
                <div><strong>From:</strong> {data.company_name}</div>
                <div><strong>Amount:</strong> ${data.amount}</div>
                <div><strong>Delivery Time:</strong> {data.delivery_time}</div>
              </div>
            </div>
          );
          break;

        default:
          break;
      }
    }

    // Show the toast if conditions are met
    if (shouldShow && toastContent) {
      const config = getToastConfig(panelType);
      const toastId = `${type}_${id}`;

      // Prevent duplicate toasts with same ID
      if (!toast.isActive(toastId)) {
        toast[toastType](toastContent, {
          ...config,
          toastId
        });
      }
    }
  }, [getCurrentUser, getToastConfig, processedEvents]);

  // Connect to Server-Sent Events
  const connectToSSE = useCallback(() => {
    const { token } = getCurrentUser();
    if (!token) {
      return;
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      // Use the correct backend URL for SSE connection
      const API_BASE_URL = '';
      const eventSource = new EventSource(`${API_BASE_URL}/api/notifications/stream?token=${token}&lastEventId=${lastEventId || ''}`);
      
      eventSource.onopen = () => {
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const eventData = JSON.parse(event.data);
          
          // Update last event ID
          if (event.lastEventId) {
            setLastEventId(event.lastEventId);
          }

          // Show notification toast
          showNotificationToast(eventData);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        setIsConnected(false);
        eventSource.close();

        // Implement exponential backoff for reconnection
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000; // 1s, 2s, 4s, 8s, 16s
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connectToSSE();
          }, delay);
        }
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error('Error creating SSE connection:', error);
      setIsConnected(false);
    }
  }, [getCurrentUser, lastEventId, showNotificationToast]);

  // Initialize connection when user is available
  useEffect(() => {
    const { user, token } = getCurrentUser();
    if (user.id && token) {
      connectToSSE();
    }

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectToSSE]);

  // Reconnect when user logs in
  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    connectToSSE();
  }, [connectToSSE]);

  // Manual trigger for testing
  const triggerTestNotification = useCallback(async (eventType, testData) => {
    try {
      await api.post('/api/notifications/test-trigger', {
        eventType,
        data: testData
      });
    } catch (error) {
      console.error('Error triggering test notification:', error);
    }
  }, []);

  const value = {
    isConnected,
    reconnect,
    triggerTestNotification,
    NOTIFICATION_EVENTS
  };

  return (
    <GlobalNotificationContext.Provider value={value}>
      {children}
    </GlobalNotificationContext.Provider>
  );
};

export default GlobalNotificationProvider;