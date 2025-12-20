import { createContext, useContext, useState, useEffect } from 'react';

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's current subscription
  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/subscriptions/my-subscription', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  // Fetch available plans
  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscriptions/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  // Activate subscription
  const activateSubscription = async (planId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/subscriptions/activate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ planId })
      });

      if (response.ok) {
        await fetchSubscription(); // Refresh subscription data
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.message };
      }
    } catch (error) {
      console.error('Error activating subscription:', error);
      return { success: false, error: 'Network error' };
    }
  };

  // Poll for subscription updates every 60 seconds
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) return;

    // Initial fetch
    fetchSubscription();
    fetchPlans();

    // Set up polling for subscription updates
    const interval = setInterval(() => {
      fetchSubscription();
      fetchPlans();
    }, 60000); // 60 seconds

    // Also check when window becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchSubscription();
        fetchPlans();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const value = {
    subscription,
    plans,
    loading,
    fetchSubscription,
    fetchPlans,
    activateSubscription
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};