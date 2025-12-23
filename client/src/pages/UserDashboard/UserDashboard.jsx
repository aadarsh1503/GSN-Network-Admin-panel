import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaQuoteLeft, 
  FaComments, 
  FaBell, 
  FaCheckCircle, 
  FaClock, 
  FaTimesCircle,
  FaShippingFast,
  FaExclamationTriangle
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { hasPendingQuote, submitPendingQuote, clearPendingQuote } from '../../utils/pendingQuote';
import { api } from '../../utils/api';

const UserDashboard = () => {
  const [stats, setStats] = useState({
    quotes: { total_quotes: 0, pending_quotes: 0, running_quotes: 0, completed_quotes: 0 },
    responses: { total_responses: 0 },
    messages: { unread_messages: 0 },
    notifications: { unread_notifications: 0 }
  });
  const [recentQuotes, setRecentQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPendingQuote, setShowPendingQuote] = useState(false);
  const [submittingPendingQuote, setSubmittingPendingQuote] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    setShowPendingQuote(hasPendingQuote());
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard stats
      try {
        const statsData = await api.get('/api/user-quotes/dashboard-stats');
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }

      // Fetch recent quotes
      try {
        const quotesData = await api.get('/api/user-quotes/my-quotes');
        const quotesArray = Array.isArray(quotesData) ? quotesData : [];
        setRecentQuotes(quotesArray.slice(0, 5)); // Show only 5 recent quotes
      } catch (error) {
        console.error('Error fetching quotes:', error);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPendingQuote = async () => {
    setSubmittingPendingQuote(true);
    try {
      const result = await submitPendingQuote();
      if (result.success) {
        setShowPendingQuote(false);
        // Refresh dashboard data
        await fetchDashboardData();
      }
    } catch (error) {
      console.error('Error submitting pending quote:', error);
    } finally {
      setSubmittingPendingQuote(false);
    }
  };

  const handleDismissPendingQuote = () => {
    if (window.confirm('Are you sure you want to dismiss this quote? It will be permanently deleted.')) {
      clearPendingQuote();
      setShowPendingQuote(false);
      toast.success('Pending quote dismissed');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'running': return 'text-[#CDA435] bg-yellow-50';
      case 'closed': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-12 w-12 border-4 border-gray-200 rounded-full animate-spin">
              <div className="h-12 w-12 border-4 border-transparent border-t-[#CDA435] rounded-full animate-spin"></div>
            </div>
          </div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to your quote management dashboard</p>
      </div>

      {/* Pending Quote Alert */}
      {showPendingQuote && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <FaExclamationTriangle className="text-yellow-600 mt-1 mr-3" size={20} />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                You have a pending quote request!
              </h3>
              <p className="text-yellow-700 mb-4">
                You filled out a quote form before logging in. Would you like to submit it now?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleSubmitPendingQuote}
                  disabled={submittingPendingQuote}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {submittingPendingQuote ? (
                    <>
                      <div className="relative mr-2">
                        <div className="h-4 w-4 border-2 border-gray-200 rounded-full animate-spin">
                          <div className="h-4 w-4 border-2 border-transparent border-t-white rounded-full animate-spin"></div>
                        </div>
                      </div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FaQuoteLeft className="mr-2" />
                      Submit Quote
                    </>
                  )}
                </button>
                <button
                  onClick={handleDismissPendingQuote}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Quotes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-50 text-[#CDA435]">
              <FaQuoteLeft size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Quotes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.quotes.total_quotes}</p>
            </div>
          </div>
        </div>

        {/* Pending Quotes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <FaClock size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.quotes.pending_quotes}</p>
            </div>
          </div>
        </div>

        {/* Running Quotes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-50 text-[#CDA435]">
              <FaShippingFast size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Running</p>
              <p className="text-2xl font-bold text-gray-900">{stats.quotes.running_quotes}</p>
            </div>
          </div>
        </div>

        {/* Completed Quotes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <FaCheckCircle size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.quotes.completed_quotes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              to="/quote"
              className="flex items-center p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors duration-200"
            >
              <FaQuoteLeft className="text-[#CDA435] mr-3" />
              <span className="text-yellow-700 font-medium">Request New Quote</span>
            </Link>
            
            <Link
              to="/user/messages"
              className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <FaComments className="text-gray-600 mr-3" />
              <div className="flex-1">
                <span className="text-gray-700 font-medium">Messages</span>
                {stats.messages.unread_messages > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {stats.messages.unread_messages}
                  </span>
                )}
              </div>
            </Link>

            <Link
              to="/user/notifications"
              className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <FaBell className="text-gray-600 mr-3" />
              <div className="flex-1">
                <span className="text-gray-700 font-medium">Notifications</span>
                {stats.notifications.unread_notifications > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {stats.notifications.unread_notifications}
                  </span>
                )}
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Quotes */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Quotes</h3>
            <Link
              to="/user/quotes"
              className="text-[#CDA435] hover:text-yellow-600 text-sm font-medium"
            >
              View All
            </Link>
          </div>

          {recentQuotes.length === 0 ? (
            <div className="text-center py-8">
              <FaQuoteLeft className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">No quotes yet</p>
              <Link
                to="/quote"
                className="inline-block mt-2 bg-[#CDA435] text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors duration-200"
              >
                Request Your First Quote
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {Array.isArray(recentQuotes) && recentQuotes.map((quote) => (
                <div key={quote.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {quote.departure_country} → {quote.arrival_country}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {quote.product_description.substring(0, 60)}...
                      </p>
                      <div className="flex items-center mt-2 space-x-4">
                        <span className="text-xs text-gray-500">
                          Created: {formatDate(quote.created_at)}
                        </span>
                        <span className="text-xs text-gray-500">
                          Responses: {quote.response_count}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(quote.status)}`}>
                        {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;