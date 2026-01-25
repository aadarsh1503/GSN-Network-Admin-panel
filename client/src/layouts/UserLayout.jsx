import { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
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

const UserLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
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
    
    // Fetch fresh user data to get the latest logo
    fetchUserProfile();

    // CHECK ACCOUNT STATUS ON PAGE LOAD/REFRESH
    checkAndShowAccountStatus();

    // Set up account status monitoring and event handling
    startAccountStatusMonitoring(2); // Check every 2 minutes

    // Listen for account deactivation events (from API calls)
    const handleAccountDeactivated = (event) => {
      setModalConfig({
        type: 'deactivated',
        message: event.detail.message
      });
      setShowStatusModal(true);
    };

    // Listen for account blacklisted events (from API calls)
    const handleAccountBlacklisted = (event) => {
      setModalConfig({
        type: 'blacklisted',
        message: event.detail.message
      });
      setShowStatusModal(true);
    };

    // Listen for custom account status modal event
    const handleShowAccountStatusModal = (event) => {
      console.log('🚨 Account status modal event received:', event.detail);
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

  // Reset notification count when navigating to notifications page
  useEffect(() => {
    if (location.pathname === '/user/notifications') {
      forceResetUnreadCount();
    }
  }, [location.pathname, forceResetUnreadCount]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const data = await api.get('/api/user/me');
        setUser(data.user);
        // Update localStorage with fresh data
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleLogout = () => {
    openLogoutModal();
  };

  const handleModalClose = () => {
    setShowStatusModal(false);
    clearAccountStatus();
  };

  const handleModalLogout = () => {
    setShowStatusModal(false);
    forceLogout('Account status changed');
  };

  const menuItems = [
    {
      path: '/user/dashboard',
      icon: FaTachometerAlt,
      label: 'Dashboard'
    },
    {
      path: '/user/quotes',
      icon: FaQuoteLeft,
      label: 'My Quotes'
    },
    {
      path: '/user/messages',
      icon: FaComments,
      label: 'Messages'
    },
    {
      path: '/user/notifications',
      icon: FaBell,
      label: 'Notifications'
    },
    {
      path: '/user/invoices',
      icon: FaFileInvoiceDollar,
      label: 'Invoices'
    },
    {
      path: '/user/disputes',
      icon: FaExclamationTriangle,
      label: 'Disputes'
    },
    {
      path: '/user/tickets',
      icon: FaTicketAlt,
      label: 'Tickets'
    },
    {
      path: '/user/profile',
      icon: FaUser,
      label: 'Profile'
    },
    {
      path: '/user/help',
      icon: FaQuestionCircle,
      label: 'Help'
    }
  ];

  const isActiveRoute = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 bg-[#CDA435]">
          <Link to="/user/dashboard" className="text-white text-xl font-bold">
            GSN User Panel
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-white lg:hidden"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* User Info */}
        <div className="p-6 border-b">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-[#CDA435] rounded-full flex items-center justify-center text-white font-semibold overflow-hidden">
              {user?.logo ? (
                <img 
                  src={user.logo} 
                  alt="User Logo" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`w-full h-full bg-[#CDA435] flex items-center justify-center text-white font-semibold ${user?.logo ? 'hidden' : ''}`}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-6 py-3 text-sm font-medium transition-colors duration-200 ${
                  isActiveRoute(item.path)
                    ? 'text-yellow-600 bg-yellow-50 border-r-2 border-yellow-600'
                    : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <div className="flex items-center">
                  <Icon className="mr-3" size={18} />
                  {item.label}
                </div>
                {/* {item.label === 'Notifications' && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )} */}
                {item.label === 'Messages' && messageUnreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
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
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors duration-200"
          >
            <FaSignOutAlt className="mr-3" size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 hover:text-yellow-600 lg:hidden"
            >
              <FaBars size={20} />
            </button>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome back, {user?.name}!</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Outlet />
        </main>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={closeLogoutModal}
        userRole="user"
        userName={user?.name || 'User'}
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

export default UserLayout;