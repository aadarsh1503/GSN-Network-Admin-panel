import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  FileText, MessageSquare, Bell, CheckCircle, Clock, 
  TrendingUp, ArrowUpRight, ArrowDownRight, Activity,
  Package, Zap, Target, Award, Eye, Calendar
} from 'lucide-react';
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
import ProfileCompletionModal from '../../components/Modal/ProfileCompletionModal';
import { useProfileCompletion } from '../../hooks/useProfileCompletion';

// Website color palette - consistent theme
const COLORS = {
  primary: '#bca142',
  secondary: '#bca142',
  success: '#bca142',
  warning: '#bca142',
  danger: '#000000',
  info: '#bca142',
  gradient: ['#bca142']
};

// Enhanced Metric Card Component matching Admin Dashboard design
const MetricCard = ({ 
  title, 
  value, 
  previousValue, 
  icon: Icon, 
  color = 'yellow',
  prefix = '',
  suffix = '',
  animate = true,
  onClick = null,
  trend = null
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    if (!animate) {
      setDisplayValue(value);
      return;
    }
    
    let startTime;
    const duration = 2000;
    const startValue = 0;
    
    const animateValue = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(easeOutQuart * (value - startValue) + startValue));
      
      if (progress < 1) {
        requestAnimationFrame(animateValue);
      }
    };
    
    requestAnimationFrame(animateValue);
  }, [value, animate]);

  const calculateTrend = () => {
    if (!previousValue || previousValue === 0) return null;
    const change = ((value - previousValue) / previousValue) * 100;
    return {
      percentage: Math.abs(change).toFixed(1),
      isPositive: change > 0,
      isNeutral: change === 0
    };
  };

  const trendData = trend || calculateTrend();
  
  const colorClasses = {
    yellow: {
      bg: 'bg-white border-l-4 border-[#bca142]',
      icon: 'bg-[#bca142] text-white',
      trend: 'text-[#bca142]'
    },
    green: {
      bg: 'bg-white border-l-4 border-[#bca142]',
      icon: 'bg-[#bca142] text-white',
      trend: 'text-[#bca142]'
    },
    blue: {
      bg: 'bg-white border-l-4 border-[#bca142]',
      icon: 'bg-[#bca142] text-white',
      trend: 'text-[#bca142]'
    },
    orange: {
      bg: 'bg-white border-l-4 border-[#bca142]',
      icon: 'bg-[#bca142] text-white',
      trend: 'text-[#bca142]'
    },
    red: {
      bg: 'bg-white border-l-4 border-black',
      icon: 'bg-black text-white',
      trend: 'text-black'
    },
    purple: {
      bg: 'bg-white border-l-4 border-[#bca142]',
      icon: 'bg-[#bca142] text-white',
      trend: 'text-[#bca142]'
    }
  };

  const colors = colorClasses[color] || colorClasses.yellow;

  return (
    <div 
      className={`relative overflow-hidden rounded-xl ${colors.bg} p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Background decorations */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-300"></div>
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-16 w-16 rounded-full bg-white bg-opacity-5 group-hover:bg-opacity-10 transition-all duration-300"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${colors.icon} transition-all duration-300`}>
            <Icon className="h-6 w-6" />
          </div>
          
          {trendData && !trendData.isNeutral && (
            <div className={`flex items-center space-x-1 text-sm ${colors.trend}`}>
              {trendData.isPositive ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              <span>{trendData.percentage}%</span>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-800">
            {prefix}
            {displayValue.toLocaleString()}
            {suffix}
          </p>
          {trendData && (
            <p className="text-xs text-gray-500">
              {trendData.isPositive ? 'Increased' : 'Decreased'} from last period
            </p>
          )}
        </div>
      </div>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-white bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-300"></div>
    </div>
  );
};

// Enhanced Recent Activity Component
const RecentQuotesChart = ({ quotes }) => {
  if (!quotes || quotes.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Quote Activity</h3>
        <div className="text-center py-8">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500 mb-4">No quotes yet</p>
          <Link
            to="/quote"
            className="inline-flex items-center px-4 py-2 bg-[#bca142] hover:bg-black text-white font-medium rounded-lg transition-colors"
          >
            <FileText className="mr-2 h-4 w-4" />
            Request Your First Quote
          </Link>
        </div>
      </div>
    );
  }

  // Process data for chart
  const chartData = quotes.slice(0, 7).map((quote, index) => ({
    name: `Quote ${index + 1}`,
    responses: quote.response_count || 0,
    status: quote.status
  }));

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Quote Activity</h3>
          <p className="text-gray-600">Recent quote responses</p>
        </div>
        <Link
          to="/user/quotes"
          className="text-[#bca142] hover:text-black font-medium text-sm flex items-center"
        >
          View All <ArrowUpRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
      
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" stroke="#666" />
          <YAxis stroke="#666" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: 'none', 
              borderRadius: '12px', 
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)' 
            }} 
          />
          <Bar dataKey="responses" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

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

  // Profile completion logic
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { shouldShowPrompt, isModalOpen, closeModal, markProfileCompleted, dismissPermanently } = useProfileCompletion('user', user.id);

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
      case 'pending': return 'text-[#bca142] bg-white border border-[#bca142]';
      case 'running': return 'text-[#bca142] bg-white border border-[#bca142]';
      case 'closed': return 'text-[#bca142] bg-white border border-[#bca142]';
      case 'rejected': return 'text-black bg-white border border-black';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 border-t-[#bca142] mx-auto mb-4"></div>
          </div>
          <p className="text-2xl font-bold text-gray-800 mb-2">Loading Dashboard...</p>
          <p className="text-gray-600">Preparing your analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-between mb-4">
            <div></div>
            <h1 className="text-5xl relative left-10 font-bold text-gray-800">
              User Dashboard
            </h1>
            <button
              onClick={fetchDashboardData}
              className="flex items-center space-x-2 bg-[#bca142] hover:bg-black text-white px-4 py-2 rounded-lg transition-colors"
              title="Refresh Data"
            >
              <Activity className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
          <p className="text-gray-600 text-xl">Manage your quotes and track responses</p>
          <div className="flex items-center justify-center mt-4 space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span>Live Data</span>
          </div>
        </div>

        {/* Pending Quote Alert */}
        {showPendingQuote && (
          <div className="bg-white border border-[#bca142] rounded-xl p-6 shadow-lg">
            <div className="flex items-start">
              <div className="p-2 bg-[#bca142] rounded-lg mr-4">
                <FaExclamationTriangle className="text-white" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-black mb-2">
                  You have a pending quote request!
                </h3>
                <p className="text-gray-700 mb-4">
                  You filled out a quote form before logging in. Would you like to submit it now?
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleSubmitPendingQuote}
                    disabled={submittingPendingQuote}
                    className="bg-[#bca142] text-white px-6 py-3 rounded-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    {submittingPendingQuote ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
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
                    className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 font-medium shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Stats Cards with Admin Dashboard Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Quotes"
            value={stats.quotes.total_quotes}
            previousValue={Math.max(0, stats.quotes.total_quotes - 1)}
            icon={FileText}
            color="yellow"
            onClick={() => window.location.href = '/user/quotes'}
          />
          <MetricCard
            title="Pending Quotes"
            value={stats.quotes.pending_quotes}
            previousValue={Math.max(0, stats.quotes.pending_quotes - 1)}
            icon={Clock}
            color="orange"
          />
          <MetricCard
            title="Running Quotes"
            value={stats.quotes.running_quotes}
            previousValue={Math.max(0, stats.quotes.running_quotes - 1)}
            icon={Activity}
            color="blue"
          />
          <MetricCard
            title="Completed"
            value={stats.quotes.completed_quotes}
            previousValue={Math.max(0, stats.quotes.completed_quotes - 1)}
            icon={CheckCircle}
            color="green"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Total Responses"
            value={stats.responses.total_responses}
            previousValue={Math.max(0, stats.responses.total_responses - 1)}
            icon={MessageSquare}
            color="purple"
          />
          <MetricCard
            title="Unread Messages"
            value={stats.messages.unread_messages}
            previousValue={Math.max(0, stats.messages.unread_messages - 1)}
            icon={Bell}
            color="red"
            onClick={() => window.location.href = '/user/messages'}
          />
          <MetricCard
            title="Notifications"
            value={stats.notifications.unread_notifications}
            previousValue={Math.max(0, stats.notifications.unread_notifications - 1)}
            icon={Bell}
            color="blue"
            onClick={() => window.location.href = '/user/notifications'}
          />
        </div>

        {/* Charts and Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quote Activity Chart */}
          <div className="lg:col-span-2">
            <RecentQuotesChart quotes={recentQuotes} />
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Quick Actions</h3>
              <Zap className="h-5 w-5 text-[#bca142]" />
            </div>
            
            <div className="space-y-4">
              <Link
                to="/quote"
                className="flex items-center p-4 bg-white hover:bg-gray-50 rounded-xl transition-all duration-200 border border-[#bca142] hover:border-black group"
              >
                <div className="p-2 bg-[#bca142] rounded-lg mr-4 group-hover:bg-black transition-colors">
                  <FileText className="text-white h-5 w-5" />
                </div>
                <div>
                  <span className="text-black font-semibold block">Request New Quote</span>
                  <span className="text-gray-600 text-sm">Get quotes from logistics companies</span>
                </div>
              </Link>
              
              <Link
                to="/user/messages"
                className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 border border-gray-200 hover:border-gray-300 group"
              >
                <div className="p-2 bg-gray-100 rounded-lg mr-4 group-hover:bg-gray-200 transition-colors">
                  <MessageSquare className="text-gray-600 h-5 w-5" />
                </div>
                <div className="flex-1">
                  <span className="text-gray-700 font-semibold block">Messages</span>
                  <span className="text-gray-600 text-sm">View conversations</span>
                  {stats.messages.unread_messages > 0 && (
                    <span className="ml-2 bg-black text-white text-xs px-2 py-1 rounded-full">
                      {stats.messages.unread_messages}
                    </span>
                  )}
                </div>
              </Link>

              <Link
                to="/user/notifications"
                className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 border border-gray-200 hover:border-gray-300 group"
              >
                <div className="p-2 bg-gray-100 rounded-lg mr-4 group-hover:bg-gray-200 transition-colors">
                  <Bell className="text-gray-600 h-5 w-5" />
                </div>
                <div className="flex-1">
                  <span className="text-gray-700 font-semibold block">Notifications</span>
                  <span className="text-gray-600 text-sm">Check updates</span>
                  {stats.notifications.unread_notifications > 0 && (
                    <span className="ml-2 bg-black text-white text-xs px-2 py-1 rounded-full">
                      {stats.notifications.unread_notifications}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Quotes Table */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Recent Quotes</h3>
              <p className="text-gray-600">Your latest quote requests and their status</p>
            </div>
            <Link
              to="/user/quotes"
              className="flex items-center text-[#bca142] hover:text-black font-medium"
            >
              View All <ArrowUpRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {recentQuotes.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <FileText className="text-gray-400 h-12 w-12" />
              </div>
              <p className="text-gray-500 text-lg mb-4">No quotes yet</p>
              <Link
                to="/quote"
                className="inline-flex items-center px-6 py-3 bg-[#bca142] hover:bg-black text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                <FileText className="mr-2 h-4 w-4" />
                Request Your First Quote
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responses</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentQuotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {quote.departure_country} → {quote.arrival_country}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {quote.product_description}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quote.status)}`}>
                          {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {quote.response_count || 0}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(quote.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Profile Completion Modal */}
        <ProfileCompletionModal
          isOpen={isModalOpen}
          onClose={closeModal}
          userRole="user"
          userName={user.name || 'User'}
          onComplete={markProfileCompleted}
          onDismissPermanently={dismissPermanently}
        />
      </div>
    </div>
  );
};

export default UserDashboard;