// Hook for real-time account status monitoring via WebSocket
import { useState, useEffect, useRef } from 'react';
import { getToken, removeToken } from '../utils/api';

export const useAccountStatusWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [accountStatus, setAccountStatus] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    const token = getToken();
    if (!token) {
      return;
    }

    try {
      // Create WebSocket connection
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/account-status`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        reconnectAttempts.current = 0;

        // Authenticate the connection
        wsRef.current.send(JSON.stringify({
          type: 'authenticate',
          token: token
        }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'authenticated':
              break;

            case 'account_deactivated':
              setAccountStatus({
                type: 'deactivated',
                message: data.message,
                timestamp: data.timestamp
              });
              break;

            case 'account_blacklisted':
              setAccountStatus({
                type: 'blacklisted',
                message: data.message,
                timestamp: data.timestamp
              });
              break;

            case 'account_reactivated':
              setAccountStatus({
                type: 'reactivated',
                message: data.message,
                timestamp: data.timestamp
              });
              break;

            case 'auth_error':
              disconnect();
              break;

            case 'error':
              break;

            default:
              break;
          }
        } catch (error) {
          // Error parsing WebSocket message
        }
      };

      wsRef.current.onclose = (event) => {
        setIsConnected(false);

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000); // Exponential backoff, max 30s
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        // WebSocket error occurred
      };

    } catch (error) {
      // Error creating WebSocket connection
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setIsConnected(false);
    reconnectAttempts.current = 0;
  };

  const clearAccountStatus = () => {
    setAccountStatus(null);
  };

  const handleLogout = () => {
    // Clear account status
    clearAccountStatus();
    
    // Disconnect WebSocket
    disconnect();
    
    // Clear authentication data
    removeToken();
    
    // Redirect to login
    window.location.href = '/login';
  };

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    const token = getToken();
    if (token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, []);

  // Reconnect when token changes
  useEffect(() => {
    const token = getToken();
    if (token && !isConnected && !wsRef.current) {
      connect();
    } else if (!token && wsRef.current) {
      disconnect();
    }
  }, [isConnected]);

  return {
    isConnected,
    accountStatus,
    clearAccountStatus,
    handleLogout,
    reconnect: connect,
    disconnect
  };
};