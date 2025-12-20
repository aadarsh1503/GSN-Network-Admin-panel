import { useState, useEffect } from 'react';
import { subscriptionAPI } from '../../utils/api';

const UserCard = () => {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
    fetchSubscription();
  }, []);

  const fetchUserData = () => {
    const userDataString = localStorage.getItem('user');
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        setUser(userData);
      } catch (error) {
        console.error("Error parsing user JSON:", error);
      }
    }
  };

  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const data = await subscriptionAPI.getMySubscription();
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (planName, isGuest) => {
    if (isGuest) return 'bg-gray-100 border-gray-300';
    switch (planName?.toLowerCase()) {
      case 'basic': return 'bg-blue-50 border-blue-200';
      case 'professional': return 'bg-purple-50 border-purple-200';
      case 'enterprise': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (planName, isGuest) => {
    if (isGuest) {
      return (
        <span className="inline-block px-2 py-1 text-xs font-bold text-white bg-gray-500 rounded">
          Guest
        </span>
      );
    }
    return (
      <span className="inline-block px-2 py-1 text-xs font-bold text-white bg-green-500 rounded">
        Active
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-3 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg p-4 text-center ${getStatusColor(subscription?.plan_name, subscription?.is_guest)}`}>
      <h3 className="font-semibold text-gray-800">
        {user?.name || 'User'}
      </h3>
      <p className="text-sm my-2">
        {subscription?.plan_name || 'Guest'} Plan
        <span className="ml-2">
          {getStatusBadge(subscription?.plan_name, subscription?.is_guest)}
        </span>
      </p>
      {subscription && !subscription.is_guest && (
        <small className="text-gray-600">
          Valid until: {new Date(subscription.end_date).toLocaleDateString()}
        </small>
      )}
      {subscription?.is_guest && (
        <small className="text-gray-600">
          Limited access - Upgrade for full features
        </small>
      )}
    </div>
  );
};

export default UserCard;