import { useState, useEffect } from 'react';
import { 
  FiBarChart2, FiClipboard, FiBox, FiDollarSign, FiUsers, FiPackage, 
  FiCopy, FiFacebook, FiTwitter, FiLinkedin, FiYoutube, FiInstagram, FiPhone,
  FiClock, FiChevronUp, FiChevronDown, FiStar, FiMessageSquare
} from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useNotifications } from '../../contexts/NotificationContext';

const StatCard = ({ title, value, icon, iconBgColor }) => (
  <div className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
    <div>
      <p className="text-xs text-gray-500 uppercase">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
    <div className={`text-white p-3 rounded-full ${iconBgColor}`}>
      {icon}
    </div>
  </div>
);

const ReferralCard = ({ subscription }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const referralCode = `GSN${user.id}${Date.now().toString().slice(-4)}`;

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success('Referral code copied!');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col justify-between">
      <div>
        <div 
          className="flex items-center text-gray-700 mb-6 cursor-pointer hover:text-[#CDA435]"
          onClick={copyReferralCode}
        >
          <FiCopy className="mr-3" size={20} />
          <span className="font-semibold">Your Referral Code: {referralCode}</span>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-800">Follow Us</h3>
          <p className="text-sm text-gray-500 my-3">
            Reach Out, We're Here for You: Connect, Inquire, Share – Your Feedback Matters!
          </p>
          <div className="flex justify-center space-x-4 my-4 text-gray-600">
            <a href="#" className="hover:text-blue-600"><FiFacebook size={20}/></a>
            <a href="#" className="hover:text-sky-500"><FiTwitter size={20}/></a>
            <a href="#" className="hover:text-blue-700"><FiLinkedin size={20}/></a>
            <a href="#" className="hover:text-red-600"><FiYoutube size={20}/></a>
            <a href="#" className="hover:text-pink-500"><FiInstagram size={20}/></a>
          </div>
        </div>
      </div>
      <a href="/company/create-Ticket" className="w-full flex items-center justify-center bg-green-500 text-white font-bold py-2 px-4 rounded-md hover:bg-green-600 transition-colors">
        <FiPhone className="mr-2" />
        Contact Us
      </a>
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
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Notifications</h2>
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <div className="flex items-center text-sm text-gray-600">
          <span>Show</span>
          <select 
            value={entries} 
            onChange={(e) => setEntries(Number(e.target.value))}
            className="mx-2 border border-gray-300 rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-[#DDC277]"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
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
            className="border border-gray-300 rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-[#DDC277] w-full md:w-64" 
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#DDC277]">
            <tr>
              <th className="p-3 text-left text-sm font-semibold text-gray-600">Sr.No</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-600">Image</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-600">Title</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-600">Date</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-600">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="p-6 text-center text-gray-500">Loading notifications...</td>
              </tr>
            ) : displayData.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-6 text-center text-gray-500">No notifications found.</td>
              </tr>
            ) : (
              displayData.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3 align-top">{index + 1}</td>
                  <td className="p-3 align-top">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="h-12 w-auto object-contain border rounded-md p-1 bg-white" />
                    ) : (
                      <span className="text-xs text-gray-400 italic">No Img</span>
                    )}
                  </td>
                  <td className="p-3 align-top font-medium text-gray-700">{item.title}</td>
                  <td className="p-3 align-top whitespace-nowrap">
                    <div className="flex items-center text-gray-500">
                      <FiClock className="mr-2"/>
                      {formatDate(item.created_at)}
                    </div>
                  </td>
                  <td className="p-3 align-top text-gray-600">{item.message}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
        <div>Showing 1 to {Math.min(entries, filteredData.length)} of {filteredData.length} entries</div>
        <div className="flex space-x-1">
          <button disabled className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50">Previous</button>
          <button className="px-3 py-1 border rounded bg-[#DDC277] text-white">1</button>
          <button className="px-3 py-1 border rounded hover:bg-gray-100">Next</button>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const { notifications, fetchNotifications } = useNotifications();

  useEffect(() => {
    fetchDashboardData();
    checkForNewNotifications();
  }, []);

  const checkForNewNotifications = async () => {
    try {
      await fetchNotifications();
      
      // Check for recent quote notifications (last 30 minutes)
      const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
      const recentQuoteNotifications = notifications.filter(notif => {
        const notifTime = new Date(notif.created_at).getTime();
        return notifTime > thirtyMinutesAgo && 
               (notif.title.includes('Quote Accepted') || notif.title.includes('Quote Not Selected'));
      });

      // Show toast for recent notifications with a delay to avoid overwhelming
      recentQuoteNotifications.forEach((notif, index) => {
        setTimeout(() => {
          showQuoteNotificationToast(notif);
        }, index * 2000); // 2 second delay between each notification
      });
    } catch (error) {
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
    try {
      const [statsData, subData] = await Promise.all([
        api.get('/api/dashboard/company-stats'),
        api.get('/api/subscriptions/my-subscription')
      ]);
      setStats(statsData);
      setSubscription(subData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <StatCard 
              title="Unread Messages" 
              value={stats?.messages?.unread_messages || 0} 
              icon={<FiMessageSquare size={20}/>} 
              iconBgColor="bg-[#DDC277]" 
            />
            <StatCard 
              title="Quote Responses" 
              value={stats?.responses?.total_responses || 0} 
              icon={<FiClipboard size={20}/>} 
              iconBgColor="bg-green-500" 
            />
            <StatCard 
              title="Accepted Quotes" 
              value={stats?.responses?.accepted_responses || 0} 
              icon={<FiDollarSign size={20}/>} 
              iconBgColor="bg-pink-500" 
            />
            <StatCard 
              title="Your Active Plan" 
              value={subscription?.plan_name || 'Guest'} 
              icon={<FiBox size={20}/>} 
              iconBgColor="bg-orange-500" 
            />
            <StatCard 
              title="Total Reviews" 
              value={stats?.reviews?.total_reviews || 0} 
              icon={<FiStar size={20}/>} 
              iconBgColor="bg-cyan-500" 
            />
            <StatCard 
              title="Available Quotes" 
              value={stats?.availableQuotes || 0} 
              icon={<FiPackage size={20}/>} 
              iconBgColor="bg-purple-500" 
            />
            <StatCard 
              title="Branches" 
              value={stats?.branches || 0} 
              icon={<FiUsers size={20}/>} 
              iconBgColor="bg-blue-500" 
            />
            <StatCard 
              title="Team Members" 
              value={stats?.members || 0} 
              icon={<FiBarChart2 size={20}/>} 
              iconBgColor="bg-indigo-500" 
            />
            <StatCard 
              title="Avg Rating" 
              value={stats?.reviews?.average_rating || 'N/A'} 
              icon={<FiStar size={20}/>} 
              iconBgColor="bg-yellow-500" 
            />
          </div>

          <div className="lg:col-span-1">
            <ReferralCard subscription={subscription} />
          </div>
        </div>

        <NotificationTable />
      </div>
    </div>
  );
};

export default Dashboard;
