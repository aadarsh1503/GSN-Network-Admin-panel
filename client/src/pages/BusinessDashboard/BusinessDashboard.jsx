import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaQuoteLeft, 
  FaBell, 
  FaComments, 
  FaExclamationTriangle,
  FaChartLine,
  FaEye,
  FaPlus,
  FaArrowUp,
  FaArrowDown,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaRocket,
  FaGlobe
} from 'react-icons/fa';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Users, 
  Package,
  MessageSquare,
  Bell,
  AlertTriangle,
  Calendar,
  MapPin,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  FileText,
  BarChart3,
  CheckCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';
import ProfileCompletionModal from '../../components/Modal/ProfileCompletionModal';
import { useProfileCompletion } from '../../hooks/useProfileCompletion';

// Website color palette
const COLORS = {
  primary: '#bca142',
  secondary: '#bca142', 
  accent: '#bca142',
  success: '#bca142',
  warning: '#bca142'
};

// Enhanced Metric Card Component
const FuturisticMetricCard = ({ 
  title, 
  value, 
  previousValue, 
  icon: Icon, 
  color = 'yellow',
  prefix = '',
  suffix = '',
  animate = true,
  onClick = null,
  subtitle = '',
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
      bg: 'bg-white',
      border: 'border-gray-200',
      icon: 'bg-[#bca142] text-white',
      trend: 'text-[#bca142]',
      glow: 'shadow-gray-200'
    },
    purple: {
      bg: 'bg-white',
      border: 'border-gray-200',
      icon: 'bg-[#bca142] text-white',
      trend: 'text-[#bca142]',
      glow: 'shadow-gray-200'
    },
    green: {
      bg: 'bg-white',
      border: 'border-gray-200',
      icon: 'bg-[#bca142] text-white',
      trend: 'text-[#bca142]',
      glow: 'shadow-gray-200'
    },
    orange: {
      bg: 'bg-white',
      border: 'border-gray-200',
      icon: 'bg-[#bca142] text-white',
      trend: 'text-[#bca142]',
      glow: 'shadow-gray-200'
    },
    red: {
      bg: 'bg-white',
      border: 'border-gray-200',
      icon: 'bg-black text-white',
      trend: 'text-black',
      glow: 'shadow-gray-200'
    },
    cyan: {
      bg: 'bg-white',
      border: 'border-gray-200',
      icon: 'bg-[#bca142] text-white',
      trend: 'text-[#bca142]',
      glow: 'shadow-gray-200'
    }
  };

  const colors = colorClasses[color] || colorClasses.yellow;

  return (
    <div 
      className={`relative overflow-hidden rounded-2xl ${colors.bg} ${colors.border} border p-6 shadow-xl ${colors.glow} hover:shadow-2xl transition-all duration-500 hover:scale-105 group ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Animated Background Elements */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-all duration-500 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-16 w-16 rounded-full bg-gray-50 group-hover:bg-gray-100 transition-all duration-500"></div>
      <div className="absolute inset-0 bg-gray-50 group-hover:bg-gray-100 transition-all duration-500"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className={`p-4 rounded-2xl ${colors.icon} shadow-lg group-hover:shadow-xl transition-all duration-500 group-hover:scale-110`}>
            <Icon className="h-6 w-6" />
          </div>
          
          {trendData && !trendData.isNeutral && (
            <div className={`flex items-center space-x-1 text-sm ${colors.trend} bg-gray-50 px-3 py-1 rounded-full`}>
              {trendData.isPositive ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              <span className="font-semibold">{trendData.percentage}%</span>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-4xl font-bold text-black group-hover:text-gray-800 transition-colors duration-300">
            {prefix}
            <span className="tabular-nums">{displayValue.toLocaleString()}</span>
            {suffix}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 font-medium">
              {subtitle}
            </p>
          )}
          {trendData && (
            <div className="text-xs text-gray-500 flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${trendData.isPositive ? 'bg-[#bca142]' : 'bg-black'} animate-pulse`}></div>
              <span>{trendData.isPositive ? 'Increased' : 'Decreased'} from last period</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gray-100 group-hover:bg-gray-200 transition-all duration-500 opacity-0 group-hover:opacity-20"></div>
    </div>
  );
};

// Enhanced Chart Component
const FuturisticChart = ({ title, data, type = 'bar', color = COLORS.primary }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-black">{title}</h3>
          <p className="text-gray-600">Business performance metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-[#bca142] rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-500">Live Data</span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        {type === 'bar' ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                border: 'none', 
                borderRadius: '16px', 
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(10px)'
              }} 
            />
            <Bar dataKey="value" fill={color} radius={[8, 8, 0, 0]} />
          </BarChart>
        ) : type === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                border: 'none', 
                borderRadius: '16px', 
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(10px)'
              }} 
            />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={{ fill: color, strokeWidth: 2, r: 6 }} />
          </LineChart>
        ) : (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                border: 'none', 
                borderRadius: '16px', 
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(10px)'
              }} 
            />
            <Area type="monotone" dataKey="value" stroke={color} fill={`${color}20`} strokeWidth={2} />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

const BusinessDashboard = () => {
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
  const { shouldShowPrompt, isModalOpen, closeModal, markProfileCompleted, dismissPermanently } = useProfileCompletion('business', user.id);

  // Sample data for charts
  const chartData = [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 },
    { name: 'May', value: 500 },
    { name: 'Jun', value: 900 }
  ];

  const categoryData = [
    { name: 'Electronics', value: 35, fill: COLORS.primary },
    { name: 'Food & Beverages', value: 25, fill: COLORS.secondary },
    { name: 'Textiles', value: 20, fill: COLORS.accent },
    { name: 'Automotive', value: 15, fill: COLORS.success },
    { name: 'Others', value: 5, fill: COLORS.warning }
  ];

  useEffect(() => {
    fetchDashboardData();
    setShowPendingQuote(hasPendingQuote());
  }, []);

  // Utility functions for pending quote functionality
  const hasPendingQuote = () => {
    // Check if there's a pending quote in localStorage or some other storage
    const pendingQuote = localStorage.getItem('pendingBusinessQuote');
    return pendingQuote !== null;
  };

  const submitPendingQuote = async () => {
    // Submit the pending quote - this would integrate with your quote submission API
    try {
      const pendingQuote = localStorage.getItem('pendingBusinessQuote');
      if (pendingQuote) {
        // Here you would call your API to submit the quote
        // const response = await api.post('/business/quotes/submit', JSON.parse(pendingQuote));
        localStorage.removeItem('pendingBusinessQuote');
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error('Error submitting pending quote:', error);
      return { success: false };
    }
  };

  const clearPendingQuote = () => {
    // Clear the pending quote from storage
    localStorage.removeItem('pendingBusinessQuote');
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch company user's dashboard statistics from the new business-quotes API
      const statsResponse = await api.get('/api/business-quotes/dashboard-stats');
      const dashboardStats = statsResponse;

      // Transform the API response to match our component structure
      setStats({
        quotes: {
          total_quotes: dashboardStats.quotes?.total_quotes || 0,
          pending_quotes: dashboardStats.quotes?.pending_quotes || 0,
          running_quotes: dashboardStats.quotes?.running_quotes || 0,
          completed_quotes: dashboardStats.quotes?.completed_quotes || 0
        },
        responses: { 
          total_responses: dashboardStats.responses?.total_responses || 0 
        },
        messages: { 
          unread_messages: dashboardStats.messages?.unread_messages || 0 
        },
        notifications: { 
          unread_notifications: dashboardStats.notifications?.unread_notifications || 0 
        }
      });

      // Fetch recent quotes that the company user has submitted
      const quotesResponse = await api.get('/api/business-quotes/my-quotes');
      const quotesData = Array.isArray(quotesResponse) ? quotesResponse : [];
      setRecentQuotes(quotesData.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      
      // Fallback to empty data on error
      setStats({
        quotes: { total_quotes: 0, pending_quotes: 0, running_quotes: 0, completed_quotes: 0 },
        responses: { total_responses: 0 },
        messages: { unread_messages: 0 },
        notifications: { unread_notifications: 0 }
      });
      setRecentQuotes([]);
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
      case 'pending': return 'text-[#bca142] bg-gray-50';
      case 'running': return 'text-[#bca142] bg-gray-50';
      case 'closed': return 'text-[#bca142] bg-gray-50';
      case 'rejected': return 'text-black bg-gray-50';
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 border-t-[#bca142] mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full h-20 w-20 border-4 border-gray-100 border-t-black animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '3s' }}></div>
          </div>
          <p className="text-2xl font-bold text-black mb-2">Loading Business Hub...</p>
          <p className="text-gray-600">Preparing your analytics dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-8">
      
      {/* Futuristic Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-between mb-6">
          <div></div>
          <div className="text-center">
            <h1 className="text-6xl font-bold text-[#bca142] mb-2">
              Business Panel
            </h1>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-[#bca142] rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-black rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
          <button
            onClick={fetchDashboardData}
            className="flex items-center space-x-2 bg-[#bca142] hover:bg-black text-white px-6 py-3 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            title="Refresh Data"
          >
            <Activity className="h-5 w-5" />
            <span>Refresh</span>
          </button>
        </div>
        <p className="text-gray-600 text-xl mb-4">Advanced business analytics and quote management</p>
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-full">
            <Clock className="h-4 w-4" />
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-[#bca142] rounded-full animate-pulse"></div>
            <span className="text-[#bca142]">Real-time Data</span>
          </div>
        </div>
      </div>

      {/* Pending Quote Alert */}
      {showPendingQuote && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xl">
          <div className="flex items-start">
            <div className="p-3 bg-[#bca142] rounded-2xl mr-4 shadow-lg">
              <FaExclamationTriangle className="text-white" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[#bca142] mb-2">
                Pending Business Quote Request!
              </h3>
              <p className="text-gray-700 mb-4">
                You have a quote request that needs to be submitted. Complete your business quote now!
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleSubmitPendingQuote}
                  disabled={submittingPendingQuote}
                  className="bg-[#bca142] text-white px-6 py-3 rounded-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
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
                  className="bg-black text-white px-6 py-3 rounded-xl hover:bg-[#bca142] font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Primary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FuturisticMetricCard
          title="Total Quotes"
          value={stats.quotes.total_quotes}
          previousValue={Math.max(0, stats.quotes.total_quotes - 2)}
          icon={FileText}
          color="yellow"
          onClick={() => window.location.href = '/business/quotes'}
          subtitle="Business requests"
        />
        <FuturisticMetricCard
          title="Pending Quotes"
          value={stats.quotes.pending_quotes}
          previousValue={Math.max(0, stats.quotes.pending_quotes - 1)}
          icon={Clock}
          color="orange"
          subtitle="Awaiting responses"
        />
        <FuturisticMetricCard
          title="Running Quotes"
          value={stats.quotes.running_quotes}
          previousValue={Math.max(0, stats.quotes.running_quotes - 1)}
          icon={Activity}
          color="cyan"
          subtitle="In progress"
        />
        <FuturisticMetricCard
          title="Completed"
          value={stats.quotes.completed_quotes}
          previousValue={Math.max(0, stats.quotes.completed_quotes - 1)}
          icon={CheckCircle}
          color="green"
          subtitle="Finished quotes"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FuturisticMetricCard
          title="Total Responses"
          value={stats.responses.total_responses}
          previousValue={Math.max(0, stats.responses.total_responses - 12)}
          icon={MessageSquare}
          color="purple"
          subtitle="From logistics companies"
        />
        <FuturisticMetricCard
          title="Unread Messages"
          value={stats.messages.unread_messages}
          previousValue={Math.max(0, stats.messages.unread_messages - 1)}
          icon={Bell}
          color="red"
          onClick={() => window.location.href = '/business/messages'}
          subtitle="New communications"
        />
        <FuturisticMetricCard
          title="Notifications"
          value={stats.notifications.unread_notifications}
          previousValue={Math.max(0, stats.notifications.unread_notifications - 1)}
          icon={Bell}
          color="blue"
          onClick={() => window.location.href = '/business/notifications'}
          subtitle="System updates"
        />
      </div>

      {/* Charts Section */}


      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/quote"
          className="group bg-white hover:bg-gray-50 rounded-2xl p-6 border border-gray-200 transition-all duration-300 hover:shadow-xl transform hover:scale-105"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-[#bca142] rounded-2xl text-white shadow-lg group-hover:shadow-xl transition-all duration-300">
              <FaQuoteLeft className="h-6 w-6" />
            </div>
            <ArrowUpRight className="h-5 w-5 text-[#bca142] group-hover:text-black transition-colors" />
          </div>
          <h3 className="text-lg font-bold text-black mb-2">Request Quote</h3>
          <p className="text-gray-600 text-sm">Get quotes for your business shipments</p>
        </Link>

        <Link
          to="/business/messages"
          className="group bg-white hover:bg-gray-50 rounded-2xl p-6 border border-gray-200 transition-all duration-300 hover:shadow-xl transform hover:scale-105"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-[#bca142] rounded-2xl text-white shadow-lg group-hover:shadow-xl transition-all duration-300">
              <MessageSquare className="h-6 w-6" />
            </div>
            <ArrowUpRight className="h-5 w-5 text-[#bca142] group-hover:text-black transition-colors" />
          </div>
          <h3 className="text-lg font-bold text-black mb-2">Messages</h3>
          <p className="text-gray-600 text-sm">Communicate with logistics partners</p>
        </Link>

        <Link
          to="/business/notifications"
          className="group bg-white hover:bg-gray-50 rounded-2xl p-6 border border-gray-200 transition-all duration-300 hover:shadow-xl transform hover:scale-105"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-[#bca142] rounded-2xl text-white shadow-lg group-hover:shadow-xl transition-all duration-300">
              <Bell className="h-6 w-6" />
            </div>
            <ArrowUpRight className="h-5 w-5 text-[#bca142] group-hover:text-black transition-colors" />
          </div>
          <h3 className="text-lg font-bold text-black mb-2">Notifications</h3>
          <p className="text-gray-600 text-sm">View system updates and alerts</p>
        </Link>
      </div>

      {/* Recent Quotes Table */}
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-500">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-black">Recent Business Quotes</h3>
            <p className="text-gray-600">Your latest quote requests and their status</p>
          </div>
          <Link
            to="/business/quotes"
            className="flex items-center text-[#bca142] hover:text-black font-medium bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl transition-all duration-300"
          >
            View All <ArrowUpRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        {recentQuotes.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <FileText className="text-gray-400 h-16 w-16" />
            </div>
            <p className="text-gray-500 text-lg mb-4">No business quotes yet</p>
            <Link
              to="/quote"
              className="inline-flex items-center px-6 py-3 bg-[#bca142] hover:bg-black text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
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
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responses</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-black flex items-center">
                        <FaGlobe className="mr-2 text-[#bca142]" />
                        {quote.departure_country} → {quote.arrival_country}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-black max-w-xs truncate">
                        {quote.product_description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(quote.status)}`}>
                        {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-black mr-2">{quote.response_count || 0}</span>
                        <div className="w-2 h-2 bg-[#bca142] rounded-full animate-pulse"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
        userRole="business"
        userName={user.name || 'Business User'}
        onComplete={markProfileCompleted}
        onDismissPermanently={dismissPermanently}
      />
    </div>
  );
};

export default BusinessDashboard;