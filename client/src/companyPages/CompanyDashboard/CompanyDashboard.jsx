import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  BarChart3, Clipboard, Package, DollarSign, Users, Package2, 
  Copy, Facebook, Twitter, Linkedin, Youtube, Instagram, Phone,
  Clock, ChevronUp, ChevronDown, Star, MessageSquare, Activity,
  TrendingUp, ArrowUpRight, ArrowDownRight, Eye, Zap, Target, Award, Bell
} from 'lucide-react';
import { 
  FiBarChart2, FiClipboard, FiBox, FiDollarSign, FiUsers, FiPackage, 
  FiCopy, FiFacebook, FiTwitter, FiLinkedin, FiYoutube, FiInstagram, FiPhone,
  FiClock, FiChevronUp, FiChevronDown, FiStar, FiMessageSquare
} from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useNotifications } from '../../contexts/NotificationContext';
import TransactionSummary from '../TransactionSummary/TransactionSummary';
import ProfileCompletionModal from '../../components/Modal/ProfileCompletionModal';
import { useProfileCompletion } from '../../hooks/useProfileCompletion';

// Persistent logging function for company dashboard
const persistentLog = (message, type = 'info') => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] COMPANY_DASHBOARD: ${message}`;
    
    try {
        const logs = JSON.parse(localStorage.getItem('auth_debug_logs') || '[]');
        logs.unshift(logEntry);
        if (logs.length > 50) logs.splice(50);
        localStorage.setItem('auth_debug_logs', JSON.stringify(logs));
    } catch (e) {
        console.error('Failed to store debug log:', e);
    }
    
    console.log(logEntry);
};

// Website color palette matching the Admin Dashboard
const COLORS = {
  primary: '#CDA435', // signature yellow
  secondary: '#B8941F', // darker yellow
  success: '#10b981', // emerald-500
  warning: '#CDA435', // signature yellow
  danger: '#ef4444', // red-500
  info: '#06b6d4', // cyan-500
  gradient: ['#CDA435', '#B8941F', '#06b6d4', '#10b981', '#ef4444', '#8b5cf6']
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
  onClick = null
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

  const trend = calculateTrend();
  
  const colorClasses = {
    yellow: {
      bg: 'bg-white border-l-4 border-[#CDA435]',
      icon: 'bg-yellow-50 text-[#CDA435]',
      trend: 'text-[#CDA435]'
    },
    green: {
      bg: 'bg-white border-l-4 border-green-500',
      icon: 'bg-green-100 text-green-600',
      trend: 'text-green-600'
    },
    blue: {
      bg: 'bg-white border-l-4 border-blue-500',
      icon: 'bg-blue-100 text-blue-600',
      trend: 'text-blue-600'
    },
    orange: {
      bg: 'bg-white border-l-4 border-orange-500',
      icon: 'bg-orange-100 text-orange-600',
      trend: 'text-orange-600'
    },
    red: {
      bg: 'bg-white border-l-4 border-red-500',
      icon: 'bg-red-100 text-red-600',
      trend: 'text-red-600'
    },
    purple: {
      bg: 'bg-white border-l-4 border-purple-500',
      icon: 'bg-purple-100 text-purple-600',
      trend: 'text-purple-600'
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
          <div className={`p-3 rounded-xl ${colors.icon} bg-opacity-20 backdrop-blur-sm group-hover:bg-opacity-30 transition-all duration-300`}>
            <Icon className="h-6 w-6" />
          </div>
          
          {trend && !trend.isNeutral && (
            <div className={`flex items-center space-x-1 text-sm ${colors.trend}`}>
              {trend.isPositive ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              <span>{trend.percentage}%</span>
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
          {trend && (
            <p className="text-xs text-gray-500">
              {trend.isPositive ? 'Increased' : 'Decreased'} from last period
            </p>
          )}
        </div>
      </div>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-white bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-300"></div>
    </div>
  );
};

const ReferralCard = ({ subscription, userProfile }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  // Use the permanent referral code from database, fallback to generated one if not available
  const referralCode = userProfile?.referral_code || `GSN${user.id}${String(user.id).padStart(4, '0')}`;

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success('Referral code copied!');
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 h-fit flex flex-col">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">Referral & Social</h3>
          <Copy className="h-5 w-5 text-gray-400" />
        </div>
        
        <div 
          className="flex items-center p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl cursor-pointer hover:from-yellow-100 hover:to-yellow-200 transition-all duration-200 border border-[#CDA435] hover:border-[#B8941F] group mb-6"
          onClick={copyReferralCode}
        >
          <div className="p-2 bg-yellow-100 rounded-lg mr-4 group-hover:bg-yellow-200 transition-colors">
            <Copy className="text-[#CDA435] h-5 w-5" />
          </div>
          <div>
            <span className="text-[#CDA435] font-semibold block">Your Referral Code</span>
            <span className="text-[#B8941F] text-sm">{referralCode}</span>
          </div>
        </div>
        
        <div className="text-center mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-2">Follow Us</h4>
          <p className="text-sm text-gray-500 mb-4">
            Connect with us on social media for updates and support
          </p>
         <div className="grid grid-cols-4 gap-3 justify-items-center">
            <a 
              href={userProfile?.facebook && userProfile.facebook !== '#' ? userProfile.facebook : "#"} 
              className={`p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 ${(!userProfile?.facebook || userProfile.facebook === '#') ? 'opacity-50 cursor-not-allowed' : ''}`}
              target={userProfile?.facebook && userProfile.facebook !== '#' ? "_blank" : "_self"}
              rel="noopener noreferrer"
            >
              <Facebook className="h-5 w-5 text-blue-600" />
            </a>
            <a 
              href={userProfile?.twitter && userProfile.twitter !== '#' ? userProfile.twitter : "#"} 
              className={`p-3 rounded-xl border border-gray-200 hover:border-sky-300 hover:bg-sky-50 transition-all duration-200 ${(!userProfile?.twitter || userProfile.twitter === '#') ? 'opacity-50 cursor-not-allowed' : ''}`}
              target={userProfile?.twitter && userProfile.twitter !== '#' ? "_blank" : "_self"}
              rel="noopener noreferrer"
            >
              <Twitter className="h-5 w-5 text-sky-500" />
            </a>
            <a 
              href={userProfile?.linkedin && userProfile.linkedin !== '#' ? userProfile.linkedin : "#"} 
              className={`p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 ${(!userProfile?.linkedin || userProfile.linkedin === '#') ? 'opacity-50 cursor-not-allowed' : ''}`}
              target={userProfile?.linkedin && userProfile.linkedin !== '#' ? "_blank" : "_self"}
              rel="noopener noreferrer"
            >
              <Linkedin className="h-5 w-5 text-blue-700" />
            </a>

            <a 
              href={userProfile?.instagram && userProfile.instagram !== '#' ? userProfile.instagram : "#"} 
              className={`p-3 rounded-xl border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all duration-200 ${(!userProfile?.instagram || userProfile.instagram === '#') ? 'opacity-50 cursor-not-allowed' : ''}`}
              target={userProfile?.instagram && userProfile.instagram !== '#' ? "_blank" : "_self"}
              rel="noopener noreferrer"
            >
              <Instagram className="h-5 w-5 text-pink-500" />
            </a>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <a 
          href="/company/create-Ticket" 
          className="w-full flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-md hover:shadow-lg"
        >
          <Phone className="mr-2 h-4 w-4" />
          Contact Support
        </a>
      </div>
    </div>
  );
};

const NotificationTable = () => {
  const [notifications, setNotifications] = useState([]);
  const [entries, setEntries] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/api/notifications/my-notifications');
        setNotifications(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error("Error loading notifications", error);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric', 
      hour: 'numeric', minute: 'numeric', hour12: true 
    });
  };

  const filteredData = notifications.filter(item => 
    (item.title && item.title.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (item.message && item.message.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const displayData = filteredData.slice(0, entries);

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 h-fit">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Recent Notifications</h3>
          <p className="text-gray-600">Stay updated with the latest activities</p>
        </div>
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-500">{notifications.length} total</span>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center text-sm text-gray-600">
          <span>Show</span>
          <select 
            value={entries} 
            onChange={(e) => setEntries(Number(e.target.value))}
            className="mx-2 border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-[#CDA435]"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
          </select>
          <span>entries</span>
        </div>
        <div className="flex items-center text-sm text-gray-600 w-full md:w-auto">
          <label htmlFor="search" className="mr-2">Search:</label>
          <input 
            id="search" 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-[#CDA435] w-full md:w-64" 
            placeholder="Search notifications..."
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-h-[400px]">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-l-lg">Sr.No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-r-lg">Message</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="p-8 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-yellow-200 border-t-[#CDA435]"></div>
                    <span className="ml-3 text-gray-500">Loading notifications...</span>
                  </div>
                </td>
              </tr>
            ) : displayData.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center">
                  <div className="flex flex-col items-center">
                    <Bell className="h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-gray-500 text-lg">No notifications found</p>
                    <p className="text-gray-400 text-sm">Check back later for updates</p>
                  </div>
                </td>
              </tr>
            ) : (
              displayData.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="h-10 w-10 object-cover rounded-lg border border-gray-200" 
                      />
                    ) : (
                      <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Bell className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">{item.title}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="mr-2 h-4 w-4" />
                      {formatDate(item.created_at)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-600 max-w-full truncate">{item.message}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6 text-sm text-gray-600">
        <div>
          Showing {Math.min(entries, filteredData.length)} of {filteredData.length} entries
        </div>
        <div className="flex space-x-2">
          <button 
            disabled 
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button className="px-3 py-2 border border-[#CDA435] bg-[#CDA435] text-white rounded-lg">
            1
          </button>
          <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [transactionAmount, setTransactionAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { notifications, fetchNotifications } = useNotifications();

  // Profile completion logic
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { shouldShowPrompt, isModalOpen, closeModal, markProfileCompleted, dismissPermanently } = useProfileCompletion('company', user.id);

  useEffect(() => {
    persistentLog('🎯 CompanyDashboard useEffect triggered', 'info');
    persistentLog('👤 Current user from localStorage: ' + JSON.stringify(user), 'info');
    
    fetchDashboardData();
    checkForNewNotifications();
  }, []);

  const checkForNewNotifications = async () => {
    try {
      persistentLog('🔔 Checking for new notifications', 'info');
      await fetchNotifications();
      
      // Check for recent quote notifications (last 30 minutes)
      const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
      const recentQuoteNotifications = notifications.filter(notif => {
        const notifTime = new Date(notif.created_at).getTime();
        return notifTime > thirtyMinutesAgo && 
               (notif.title.includes('Quote Accepted') || notif.title.includes('Quote Not Selected'));
      });

      persistentLog(`🔔 Found ${recentQuoteNotifications.length} recent notifications`, 'info');

      // Show toast for recent notifications with a delay to avoid overwhelming
      recentQuoteNotifications.forEach((notif, index) => {
        setTimeout(() => {
          showQuoteNotificationToast(notif);
        }, index * 2000); // 2 second delay between each notification
      });
    } catch (error) {
      persistentLog(`❌ Error checking notifications: ${error.message}`, 'error');
      console.error('Error checking notifications:', error);
    }
  };

  const showQuoteNotificationToast = (notification) => {
    const isAccepted = notification.title.includes('Accepted');
    
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              {isAccepted ? (
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {notification.title}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {notification.message}
              </p>
              {isAccepted && (
                <button
                  onClick={() => {
                    window.location.href = '/company/freight-quotes';
                    toast.dismiss(t.id);
                  }}
                  className="mt-2 text-sm font-medium text-green-600 hover:text-green-500"
                >
                  View Quote Details →
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
      position: 'top-right',
    });
  };

  const fetchDashboardData = async () => {
    persistentLog('🚀 Starting fetchDashboardData', 'info');
    
    try {
      persistentLog('📡 Making parallel API calls for dashboard data', 'info');
      
      const [statsData, subData, profileData] = await Promise.all([
        api.get('/api/dashboard/company-stats').then(data => {
          persistentLog('✅ /api/dashboard/company-stats success', 'success');
          return data;
        }).catch(error => {
          persistentLog(`❌ /api/dashboard/company-stats failed: ${error.message}`, 'error');
          throw error;
        }),
        api.get('/api/subscriptions/my-subscription').then(data => {
          persistentLog('✅ /api/subscriptions/my-subscription success', 'success');
          return data;
        }).catch(error => {
          persistentLog(`❌ /api/subscriptions/my-subscription failed: ${error.message}`, 'error');
          throw error;
        }),
        api.get('/api/company/profile').then(data => {
          persistentLog('✅ /api/company/profile success', 'success');
          return data;
        }).catch(error => {
          persistentLog(`❌ /api/company/profile failed: ${error.message}`, 'error');
          throw error;
        })
      ]);
      
      persistentLog('📊 Setting dashboard data', 'info');
      setStats(statsData);
      setSubscription(subData);
      setUserProfile(profileData);
      
      // Fetch transaction amount from payment verifications
      persistentLog('💰 Fetching transaction amount', 'info');
      await fetchTransactionAmount();
      
      persistentLog('✅ fetchDashboardData completed successfully', 'success');
    } catch (error) {
      persistentLog(`❌ fetchDashboardData failed: ${error.message}`, 'error');
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      persistentLog('🏁 fetchDashboardData finished (loading set to false)', 'info');
    }
  };

  const fetchTransactionAmount = async () => {
    try {
      persistentLog('💰 Starting fetchTransactionAmount', 'info');
      console.log('Fetching transaction amount...');
      let totalAmount = 0;
      
      // Try to get data from the enhanced quotes API
      try {
        persistentLog('📡 Trying enhanced quotes API', 'info');
        const data = await api.get('/api/enhanced-quotes/company-responses-with-payments');
        persistentLog('✅ Enhanced quotes API success', 'success');
        console.log('Enhanced quotes data received:', data);
        
        if (Array.isArray(data) && data.length > 0) {
          // Filter for payments that have been verified by this company
          const verifiedPayments = data.filter(item => {
            const isVerified = item.payment_status === 'verified';
            console.log(`Item ${item.quote_id || item.id}: payment_status=${item.payment_status}, price=${item.price}, isVerified=${isVerified}`);
            return isVerified;
          });
          
          console.log('Verified payments found:', verifiedPayments.length);
          
          totalAmount = verifiedPayments.reduce((sum, item) => {
            const price = parseFloat(item.price) || 0;
            console.log(`Adding price: ${price} to sum: ${sum}`);
            return sum + price;
          }, 0);
          
          persistentLog(`💰 Total from enhanced quotes: ${totalAmount}`, 'info');
          console.log('Total from enhanced quotes:', totalAmount);
        }
      } catch (enhancedError) {
        persistentLog(`❌ Enhanced quotes API failed: ${enhancedError.message}`, 'error');
        console.log('Enhanced quotes API failed, trying alternative...', enhancedError);
      }
      
      // If no amount found, try the company quotes API as fallback
      if (totalAmount === 0) {
        try {
          persistentLog('📡 Trying company quotes transactions API', 'info');
          const companyData = await api.get('/api/company-quotes/transactions');
          persistentLog('✅ Company quotes transactions API success', 'success');
          console.log('Company quotes data received:', companyData);
          
          if (Array.isArray(companyData) && companyData.length > 0) {
            const paidTransactions = companyData.filter(item => 
              item.payment_status === 'paid' || item.payment_status === 'verified'
            );
            
            totalAmount = paidTransactions.reduce((sum, item) => {
              const amount = parseFloat(item.amount_paid || item.price || item.amount) || 0;
              return sum + amount;
            }, 0);
            
            persistentLog(`💰 Total from company quotes: ${totalAmount}`, 'info');
            console.log('Total from company quotes:', totalAmount);
          }
        } catch (companyError) {
          persistentLog(`❌ Company quotes transactions API failed: ${companyError.message}`, 'error');
          console.log('Company quotes API also failed:', companyError);
        }
      }
      
      // If still no amount, try to get from my quote responses
      if (totalAmount === 0) {
        try {
          persistentLog('📡 Trying my quote responses API', 'info');
          const myQuotesData = await api.get('/api/company-quotes/my-responses');
          persistentLog('✅ My quote responses API success', 'success');
          console.log('My quote responses data received:', myQuotesData);
          
          if (Array.isArray(myQuotesData) && myQuotesData.length > 0) {
            const acceptedQuotes = myQuotesData.filter(item => 
              item.status === 'accepted' && (item.payment_status === 'verified' || item.payment_status === 'paid')
            );
            
            totalAmount = acceptedQuotes.reduce((sum, item) => {
              const price = parseFloat(item.price || item.amount) || 0;
              return sum + price;
            }, 0);
            
            persistentLog(`💰 Total from my quote responses: ${totalAmount}`, 'info');
            console.log('Total from my quote responses:', totalAmount);
          }
        } catch (myQuotesError) {
          persistentLog(`❌ My quote responses API failed: ${myQuotesError.message}`, 'error');
          console.log('My quote responses API also failed:', myQuotesError);
        }
      }
      
      persistentLog(`💰 Final transaction amount: ${totalAmount}`, 'success');
      console.log('Final transaction amount calculated:', totalAmount);
      
      setTransactionAmount(totalAmount);
    } catch (error) {
      console.error('Error fetching transaction amount:', error);
      setTransactionAmount(0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-yellow-200 border-t-[#CDA435] mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full h-20 w-20 border-4 border-yellow-100 border-t-[#B8941F] animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '3s' }}></div>
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
              Company Dashboard
            </h1>
            <button
              onClick={() => {
                fetchDashboardData();
                fetchTransactionAmount();
              }}
              className="flex items-center space-x-2 bg-[#CDA435] hover:bg-[#B8941F] text-white px-4 py-2 rounded-lg transition-colors"
              title="Refresh Data"
            >
              <Activity className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
          <p className="text-gray-600 text-xl">Manage your business operations and track performance</p>
          <div className="flex items-center justify-center mt-4 space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span>Live Data</span>
          </div>
        </div>

        {/* Enhanced Stats Cards with Admin Dashboard Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* <MetricCard
            title="Unread Messages"
            value={stats?.messages?.unread_messages || 0}
            previousValue={Math.max(0, (stats?.messages?.unread_messages || 0) - 1)}
            icon={MessageSquare}
            color="yellow"
            onClick={() => window.location.href = '/company/messages'}
          /> */}
          <MetricCard
            title="Quote Responses"
            value={stats?.responses?.total_responses || 0}
            previousValue={Math.max(0, (stats?.responses?.total_responses || 0) - 1)}
            icon={Clipboard}
            color="green"
          />
          <MetricCard
            title="Accepted Quotes"
            value={stats?.responses?.accepted_responses || 0}
            previousValue={Math.max(0, (stats?.responses?.accepted_responses || 0) - 1)}
            icon={DollarSign}
            color="blue"
          />
          <MetricCard
            title="Transaction Amount"
            value={transactionAmount}
            previousValue={Math.max(0, transactionAmount - 100)}
            icon={TrendingUp}
            color="green"
            prefix="$"
            onClick={() => window.location.href = '/company/transaction-History-Company'}
          />
          <MetricCard
            title="Active Plan"
            value={subscription?.plan_name || 'Guest'}
            icon={Package}
            color="orange"
            animate={false}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* <MetricCard
            title="Total Reviews"
            value={stats?.reviews?.total_reviews || 0}
            previousValue={Math.max(0, (stats?.reviews?.total_reviews || 0) - 1)}
            icon={Star}
            color="purple"
          /> */}
          <MetricCard
            title="Available Quotes"
            value={stats?.availableQuotes || 0}
            previousValue={Math.max(0, (stats?.availableQuotes || 0) - 1)}
            icon={Package2}
            color="blue"
          />
          <MetricCard
            title="Branches"
            value={stats?.branches || 0}
            previousValue={Math.max(0, (stats?.branches || 0) - 1)}
            icon={Users}
            color="green"
          />
          <MetricCard
            title="Team Members"
            value={stats?.members || 0}
            previousValue={Math.max(0, (stats?.members || 0) - 1)}
            icon={BarChart3}
            color="red"
          />
          {/* <MetricCard
            title="Avg Rating"
            value={stats?.reviews?.average_rating || 'N/A'}
            icon={Award}
            color="yellow"
            animate={false}
          /> */}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <NotificationTable />
          </div>

          <div className="xl:col-span-1 space-y-8">
            <TransactionSummary />
            <ReferralCard subscription={subscription} userProfile={userProfile} />
          </div>
        </div>
      </div>

      {/* Profile Completion Modal */}
      <ProfileCompletionModal
        isOpen={isModalOpen}
        onClose={closeModal}
        userRole="company"
        userName={user.name || 'Company User'}
        onComplete={markProfileCompleted}
        onDismissPermanently={dismissPermanently}
      />
    </div>
  );
};

export default Dashboard;
