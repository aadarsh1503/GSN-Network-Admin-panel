import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  FaTachometerAlt, 
  FaQuoteLeft, 
  FaBell, 
  FaComments, 
  FaUser, 
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaExclamationTriangle,
  FaQuestionCircle,
  FaBuilding,
  FaFileInvoiceDollar,
  FaTicketAlt
} from 'react-icons/fa';
import { useNotifications } from '../contexts/NotificationContext';
import LogoutConfirmationModal from '../components/Modal/LogoutConfirmationModal';
import { useLogoutModal } from '../hooks/useLogoutModal';
import { api } from '../utils/api';

const BusinessLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [businessProfile, setBusinessProfile] = useState(null);
  const location = useLocation();
  const { unreadCount, messageUnreadCount, forceResetUnreadCount } = useNotifications();
  const { isLogoutModalOpen, openLogoutModal, closeLogoutModal } = useLogoutModal();

  useEffect(() => {
    // Get user info from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    // Fetch business profile data including logo
    const fetchBusinessProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await api.get('/api/business/profile');
          setBusinessProfile(response);
        }
      } catch (error) {
        console.error('Error fetching business profile:', error);
      }
    };

    fetchBusinessProfile();
    
    // Listen for profile updates
    const handleProfileUpdate = () => {
      fetchBusinessProfile();
    };
    
    window.addEventListener('businessProfileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('businessProfileUpdated', handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    // Force reset notification count when on notifications page
    if (location.pathname === '/business/notifications') {
      // Force the count to 0 immediately when on notifications page
      forceResetUnreadCount();
    }
  }, [location.pathname, forceResetUnreadCount]);

  const handleLogout = () => {
    openLogoutModal();
  };

  const menuItems = [
    {
      path: '/business/dashboard',
      icon: FaTachometerAlt,
      label: 'Dashboard'
    },
    {
      path: '/business/quotes',
      icon: FaQuoteLeft,
      label: 'My Quotes'
    },
    // {
    //   path: '/business/analytics',
    //   icon: FaChartLine,
    //   label: 'Analytics'
    // },
    // {
    //   path: '/business/products',
    //   icon: FaShoppingCart,
    //   label: 'Products'
    // },
    {
      path: '/business/messages',
      icon: FaComments,
      label: 'Messages'
    },
    {
      path: '/business/notifications',
      icon: FaBell,
      label: 'Notifications'
    },
    {
      path: '/business/invoices',
      icon: FaFileInvoiceDollar,
      label: 'Invoices'
    },
    {
      path: '/business/disputes',
      icon: FaExclamationTriangle,
      label: 'Disputes'
    },
    {
      path: '/business/tickets',
      icon: FaTicketAlt,
      label: 'Tickets'
    },
    {
      path: '/business/profile',
      icon: FaUser,
      label: 'Profile'
    },
    {
      path: '/business/help',
      icon: FaQuestionCircle,
      label: 'Help'
    }
  ];

  const isActiveRoute = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Futuristic Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-all duration-500 ease-in-out lg:translate-x-0 lg:static lg:inset-0 border-r border-slate-700`}>
        
        {/* Logo with Glow Effect */}
        <div className="flex items-center justify-between h-16 px-6 bg-gradient-to-r from-[#CDA435] via-[#B8941F] to-[#CDA435] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-yellow-500/20 to-yellow-400/20 animate-pulse"></div>
          <Link to="/business/dashboard" className="text-white text-xl font-bold relative z-10 flex items-center">
            <FaBuilding className="mr-2 text-yellow-200" />
            <span className="bg-gradient-to-r from-yellow-200 to-yellow-100 bg-clip-text text-transparent">
              Business Hub
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-white lg:hidden relative z-10 hover:text-yellow-200 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* User Info with Futuristic Design */}
        <div className="p-6 border-b border-slate-700 bg-gradient-to-r from-slate-800/50 to-slate-700/50">
          <div className="flex items-center">
            <div className="relative">
              {businessProfile?.logo ? (
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#CDA435] shadow-lg">
                  <img 
                    src={businessProfile.logo} 
                    alt="Business Logo" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="w-12 h-12 bg-gradient-to-br from-[#CDA435] to-[#B8941F] rounded-full flex items-center justify-center text-white font-semibold shadow-lg" style={{display: 'none'}}>
                    {businessProfile?.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'B'}
                  </div>
                </div>
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-[#CDA435] to-[#B8941F] rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                  {businessProfile?.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'B'}
                </div>
              )}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-800 animate-pulse"></div>
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {businessProfile?.name || user?.name || 'Business User'}
              </p>
              <p className="text-xs text-slate-300 truncate" title={businessProfile?.email || user?.email}>
                {businessProfile?.email || user?.email}
              </p>
              <div className="flex items-center mt-1">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                <span className="text-xs text-green-400">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu with Hover Effects */}
        <nav className="mt-6 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-4 py-2 mb-2 text-sm font-medium transition-all duration-300 rounded-xl group relative overflow-hidden ${
                  isActive
                    ? 'text-[#CDA435] bg-gradient-to-r from-yellow-600/30 to-yellow-500/30 border border-yellow-500/50 shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-600/50 hover:border hover:border-slate-600'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                {/* Animated Background */}
                <div className={`absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-yellow-400/10 transform transition-transform duration-300 ${
                  isActive ? 'scale-100' : 'scale-0 group-hover:scale-100'
                }`}></div>
                
                <div className="flex items-center relative z-10">
                  <Icon className={`mr-3 transition-all duration-300 ${
                    isActive ? 'text-[#CDA435] scale-110' : 'text-slate-400 group-hover:text-white group-hover:scale-110'
                  }`} size={18} />
                  <span className="relative">
                    {item.label}
                    {isActive && (
                      <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-[#CDA435] to-[#B8941F] rounded-full"></div>
                    )}
                  </span>
                </div>
                
                {/* Notification Badges */}
                {/* {item.label === 'Notifications' && unreadCount > 0 && (
                  <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-bounce shadow-lg relative z-10">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )} */}
                {item.label === 'Messages' && messageUnreadCount > 0 && (
                  <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-bounce shadow-lg relative z-10">
                    {messageUnreadCount > 99 ? '99+' : messageUnreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button with Futuristic Style */}
        <div className="absolute bottom-0 w-full p-6">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-gradient-to-r hover:from-red-900/20 hover:to-pink-900/20 rounded-xl transition-all duration-300 border border-transparent hover:border-red-500/30 group"
          >
            <FaSignOutAlt className="mr-3 group-hover:scale-110 transition-transform duration-300" size={18} />
            <span>Logout</span>
            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Futuristic Top Header */}
        <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-slate-200/50">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-600 hover:text-[#CDA435] lg:hidden transition-colors duration-300 p-2 rounded-lg hover:bg-yellow-50"
            >
              <FaBars size={20} />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-slate-600">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Welcome back, <span className="font-semibold text-[#CDA435]">{businessProfile?.name || user?.name}</span>!</span>
              </div>
              
              {/* Quick Stats */}
              <div className="hidden lg:flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1 bg-[#CDA435]/10 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-[#CDA435] rounded-full"></div>
                  <span className="text-[#CDA435]">Active</span>
                </div>
                <div className="flex items-center space-x-1 bg-green-50 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-600">Online</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content with Gradient Background */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Sidebar Overlay with Blur Effect */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={closeLogoutModal}
        userRole="business"
        userName={businessProfile?.name || user?.name || 'Business User'}
      />
    </div>
  );
};

export default BusinessLayout;