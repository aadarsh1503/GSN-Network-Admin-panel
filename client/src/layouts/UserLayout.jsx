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
  FaTimes
} from 'react-icons/fa';
import { useNotifications } from '../contexts/NotificationContext';

const UserLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount, messageUnreadCount } = useNotifications();

  useEffect(() => {
    // Get user info from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
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
      path: '/user/profile',
      icon: FaUser,
      label: 'Profile'
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
        <div className="flex items-center justify-between h-16 px-6 bg-blue-600">
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
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
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
                    ? 'text-blue-600 bg-blue-50 border-r-2 border-blue-600'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <div className="flex items-center">
                  <Icon className="mr-3" size={18} />
                  {item.label}
                </div>
                {item.label === 'Notifications' && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
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
              className="text-gray-600 hover:text-gray-900 lg:hidden"
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
    </div>
  );
};

export default UserLayout;