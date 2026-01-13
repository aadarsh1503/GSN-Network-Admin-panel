import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

/**
 * Custom hook for synchronizing quote status between different pages
 * @param {number} quoteId - The quote ID to monitor
 * @param {number} interval - Polling interval in milliseconds (default: 15000)
 * @param {function} onStatusChange - Callback when status changes
 */
export const useQuoteStatusSync = (quoteId, interval = 15000, onStatusChange = null) => {
  const [currentStatus, setCurrentStatus] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef(null);
  const lastKnownStatusRef = useRef(null);

  const fetchQuoteStatus = useCallback(async () => {
    if (!quoteId) return null;

    try {
      // Fetch current quote status
      const response = await api.get(`/api/business-quotes/${quoteId}`);
      const quote = response;
      
      if (quote && quote.status) {
        const newStatus = quote.status;
        const newUpdatedAt = quote.updated_at;

        // Check if status has changed
        if (lastKnownStatusRef.current && lastKnownStatusRef.current !== newStatus) {
          console.log(`Quote ${quoteId} status changed: ${lastKnownStatusRef.current} → ${newStatus}`);
          
          // Show toast notification
          toast.success(
            `Quote #${quoteId} status updated to "${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}"`,
            {
              duration: 4000,
              icon: '📊'
            }
          );

          // Call callback if provided
          if (onStatusChange) {
            onStatusChange({
              quoteId,
              oldStatus: lastKnownStatusRef.current,
              newStatus,
              updatedAt: newUpdatedAt,
              quote
            });
          }
        }

        // Update refs and state
        lastKnownStatusRef.current = newStatus;
        setCurrentStatus(newStatus);
        setLastUpdated(newUpdatedAt);

        return {
          status: newStatus,
          updatedAt: newUpdatedAt,
          quote,
          changed: lastKnownStatusRef.current !== newStatus
        };
      }
    } catch (error) {
      console.error('Error fetching quote status:', error);
      return { error: error.message };
    }

    return null;
  }, [quoteId, onStatusChange]);

  const startPolling = useCallback(() => {
    if (intervalRef.current || !quoteId) return;

    console.log(`Starting quote status polling for quote ${quoteId}`);
    setIsPolling(true);

    // Initial fetch
    fetchQuoteStatus();

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      fetchQuoteStatus();
    }, interval);
  }, [quoteId, interval, fetchQuoteStatus]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      console.log(`Stopping quote status polling for quote ${quoteId}`);
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsPolling(false);
    }
  }, [quoteId]);

  const forceRefresh = useCallback(async () => {
    console.log(`Force refreshing quote status for quote ${quoteId}`);
    return await fetchQuoteStatus();
  }, [fetchQuoteStatus, quoteId]);

  // Auto-start polling when quoteId is available
  useEffect(() => {
    if (quoteId) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [quoteId, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    currentStatus,
    lastUpdated,
    isPolling,
    startPolling,
    stopPolling,
    forceRefresh,
    fetchQuoteStatus
  };
};

export default useQuoteStatusSync;