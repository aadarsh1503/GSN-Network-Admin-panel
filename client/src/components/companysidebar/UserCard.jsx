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
    if (isGuest) return 'from-white to-gray-50 border-gray-200';
    switch (planName?.toLowerCase()) {
      case 'basic': return 'from-white to-gray-50 border-gray-200';
      case 'professional': return 'from-white to-gray-50 border-gray-200';
      case 'enterprise': return 'from-white to-gray-50 border-gray-200';
      default: return 'from-white to-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (planName, isGuest) => {
    if (isGuest) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-white bg-[#bca142] rounded-full shadow-sm">
          <div className="w-1.5 h-1.5 bg-white rounded-full mr-1.5 animate-pulse"></div>
          Free
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-white bg-black rounded-full shadow-sm">
        <div className="w-1.5 h-1.5 bg-white rounded-full mr-1.5 animate-pulse"></div>
        Active
      </span>
    );
  };

  const getPlanDisplayName = (planName, isGuest) => {
    if (isGuest) {
      return 'Free Plan';
    }
    return `${planName} Plan`;
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-lg">
        <div className="animate-pulse flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br ${getStatusColor(subscription?.plan_name, subscription?.is_guest)} rounded-xl p-4 border shadow-lg backdrop-blur-sm relative overflow-hidden`}>
      {/* Decorative Elements - Smaller */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-white/20 rounded-full -translate-y-8 translate-x-8"></div>
      <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/10 rounded-full translate-y-6 -translate-x-6"></div>
      
      {/* Compact Layout - Horizontal */}
      <div className="flex items-center space-x-3 relative z-10">
        {/* User Avatar - Smaller */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 bg-[#bca142] rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-black rounded-full border-2 border-white shadow-sm flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* User Info - Compact */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-black text-sm truncate">
              {user?.name || 'Company User'}
            </h3>
            {getStatusBadge(subscription?.plan_name, subscription?.is_guest)}
          </div>
          
          <p className="text-xs text-gray-600 truncate mb-1">
            {user?.email || 'user@company.com'}
          </p>
          
          <p className="text-xs font-medium text-black truncate">
            {getPlanDisplayName(subscription?.plan_name, subscription?.is_guest)}
          </p>
        </div>
      </div>

      {/* Subscription Details - Compact */}
      {subscription && !subscription.is_guest && (
        <div className="mt-3 text-xs text-gray-500 bg-white/50 rounded-lg p-2 backdrop-blur-sm border border-white/30">
          <div className="text-center">
            <span>Valid until: </span>
            <span className="font-semibold text-black">
              {new Date(subscription.end_date).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
      
      {subscription?.is_guest && (
        <div className="mt-3 text-xs text-gray-600 bg-white/50 rounded-lg p-2 backdrop-blur-sm border border-white/30 text-center">
          <a 
            href="/company/subscriptions" 
            className="inline-flex items-center text-[#bca142] hover:text-black font-semibold transition-colors duration-200 hover:underline"
          >
            <span>Upgrade Plan</span>
            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
};

export default UserCard;