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
import toast from 'react-hot-toast';
import { useNotifications } from '../contexts/NotificationContext';
import LogoutConfirmationModal from '../components/Modal/LogoutConfirmationModal';
import { useLogoutModal } from '../hooks/useLogoutModal';
import { api, startAccountStatusMonitoring, stopAccountStatusMonitoring } from '../utils/api';
import { useAccountStatusWebSocket } from '../hooks/useAccountStatusWebSocket';
import AccountStatusModal from '../components/Modal/AccountStatusModal';
import { checkAndShowAccountStatus, forceLogout } from '../utils/accountStatusChecker';

const BusinessLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [businessProfile, setBusinessProfile] = useState(null);
  const location = useLocation();
  const { unreadCount, messageUnreadCount, forceResetUnreadCount } = useNotifications();
  const { isLogoutModalOpen, openLogoutModal, closeLogoutModal } = useLogoutModal();
  
  // WebSocket connection for real-time account status
  const { isConnected, accountStatus, clearAccountStatus, handleLogout: wsHandleLogout } = useAccountStatusWebSocket();
  
  // State for modal visibility
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({ type: '', message: '' });

  // Handle real-time account status changes
  useEffect(() => {
    if (accountStatus) {
      console.log('🚨 Account status change detected:', accountStatus);
      
      if (accountStatus.type === 'deactivated' || accountStatus.type === 'blacklisted') {
        setModalConfig({
          type: accountStatus.type,
          message: accountStatus.message
        });
        setShowStatusModal(true);
      } else if (accountStatus.type === 'reactivated') {
        // Show success message for reactivation
        toast.success(accountStatus.message || 'Your account has been reactivated!', {
          duration: 5000,
          position: 'top-center',
        });
        clearAccountStatus();
      }
    }
  }, [accountStatus, clearAccountStatus]);

  useEffect(() => {
    // Get user info from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // CHECK ACCOUNT STATUS ON PAGE LOAD/REFRESH
    checkAndShowAccountStatus();

    // Set up account status monitoring and deactivation handling
    startAccountStatusMonitoring(2); // Check every 2 minutes

    // Listen for account deactivation events
    const handleAccountDeactivated = (event) => {
      setModalConfig({
        type: 'deactivated',
        message: event.detail.message
      });
      setShowStatusModal(true);
    };

    // Listen for account blacklisted events
    const handleAccountBlacklisted = (event) => {
      setModalConfig({
        type: 'blacklisted',
        message: event.detail.message
      });
      setShowStatusModal(true);
    };

    // Listen for custom account status modal event
    const handleShowAccountStatusModal = (event) => {
      console.log('🚨 Business account status modal event received:', event.detail);
      setModalConfig({
        type: event.detail.type,
        message: event.detail.message
      });
      setShowStatusModal(true);
    };

    window.addEventListener('accountDeactivated', handleAccountDeactivated);
    window.addEventListener('accountBlacklisted', handleAccountBlacklisted);
    window.addEventListener('showAccountStatusModal', handleShowAccountStatusModal);

    // Cleanup on unmount
    return () => {
      stopAccountStatusMonitoring();
      window.removeEventListener('accountDeactivated', handleAccountDeactivated);
      window.removeEventListener('accountBlacklisted', handleAccountBlacklisted);
      window.removeEventListener('showAccountStatusModal', handleShowAccountStatusModal);
    };
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

  const handleModalClose = () => {
    setShowStatusModal(false);
    clearAccountStatus();
  };

  const handleModalLogout = () => {
    setShowStatusModal(false);
    forceLogout('Business account status changed');
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
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-all duration-500 ease-in-out lg:translate-x-0 lg:static lg:inset-0 border-r border-gray-200`}>
        
        {/* Logo Header */}
        <div className="flex items-center justify-between h-16 px-6 bg-[#bca142] relative overflow-hidden">
          <Link to="/business/dashboard" className="text-white text-xl font-bold relative z-10 flex items-center">
            <FaBuilding className="mr-2 text-white" />
            <span className="text-white">
              Business Hub
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-white lg:hidden relative z-10 hover:text-gray-200 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center">
            <div className="relative">
              {businessProfile?.logo ? (
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#bca142] shadow-lg">
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
                  <div className="w-12 h-12 bg-[#bca142] rounded-full flex items-center justify-center text-white font-semibold shadow-lg" style={{display: 'none'}}>
                    {businessProfile?.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'B'}
                  </div>
                </div>
              ) : (
                <div className="w-12 h-12 bg-[#bca142] rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                  {businessProfile?.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'B'}
                </div>
              )}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-black rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <p className="text-sm font-medium text-black truncate">
                {businessProfile?.name || user?.name || 'Business User'}
              </p>
              <p className="text-xs text-gray-600 truncate" title={businessProfile?.email || user?.email}>
                {businessProfile?.email || user?.email}
              </p>
              <div className="flex items-center mt-1">
                <div className="w-2 h-2 bg-black rounded-full mr-2 animate-pulse"></div>
                <span className="text-xs text-black">Online</span>
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
                    ? 'text-black bg-[#bca142]/10 border border-[#bca142]/30 shadow-lg'
                    : 'text-black hover:text-black hover:bg-gray-50 hover:border hover:border-gray-200'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <div className="flex items-center relative z-10">
                  <Icon className={`mr-3 transition-all duration-300 ${
                    isActive ? 'text-[#bca142] scale-110' : 'text-gray-600 group-hover:text-[#bca142] group-hover:scale-110'
                  }`} size={18} />
                  <span className="relative">
                    {item.label}
                    {isActive && (
                      <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#bca142] rounded-full"></div>
                    )}
                  </span>
                </div>
                
                {/* Notification Badges */}
                {item.label === 'Messages' && messageUnreadCount > 0 && (
                  <span className="bg-[#bca142] text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-bounce shadow-lg relative z-10">
                    {messageUnreadCount > 99 ? '99+' : messageUnreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 w-full p-6">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-black hover:text-white hover:bg-black rounded-xl transition-all duration-300 border border-gray-200 hover:border-black group"
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
              className="text-black hover:text-[#bca142] lg:hidden transition-colors duration-300 p-2 rounded-lg hover:bg-gray-50"
            >
              <FaBars size={20} />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-slate-600">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Welcome back, <span className="font-semibold text-[#bca142]">{businessProfile?.name || user?.name}</span>!</span>
              </div>
              
              {/* Quick Stats */}
              <div className="hidden lg:flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1 bg-[#bca142]/10 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-[#bca142] rounded-full"></div>
                  <span className="text-[#bca142]">Active</span>
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
      
      {/* Account Status Modal */}
      <AccountStatusModal
        isOpen={showStatusModal}
        onClose={handleModalClose}
        type={modalConfig.type}
        message={modalConfig.message}
        onLogout={handleModalLogout}
      />
    </div>
  );
};

export default BusinessLayout;