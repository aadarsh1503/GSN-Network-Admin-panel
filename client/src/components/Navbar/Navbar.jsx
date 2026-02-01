// src/components/Navbar.jsx

import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaUser, FaPlus, FaBars, FaTimes, FaChevronDown, FaSignOutAlt, FaTachometerAlt, FaUserCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import GSN from "./GSN.jpg"
import LogoutConfirmationModal from '../Modal/LogoutConfirmationModal';
import { useLogoutModal } from '../../hooks/useLogoutModal';
const Navbar = () => {
  // State for the mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // State for scroll effects
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // User authentication state
  const [user, setUser] = useState(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { isLogoutModalOpen, openLogoutModal, closeLogoutModal } = useLogoutModal();

  // Effect to check user authentication
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        // Clear user state if no token or userData
        setUser(null);
      }
    };

    checkAuth();
    
    // Listen for storage changes (login/logout in other tabs)
    window.addEventListener('storage', checkAuth);
    
    // Listen for custom logout event (same tab logout)
    const handleLogout = () => {
      setUser(null);
      setIsUserDropdownOpen(false);
      setIsMobileMenuOpen(false);
    };
    
    window.addEventListener('userLogout', handleLogout);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('userLogout', handleLogout);
    };
  }, []);

  // Effect to handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Logic for background change
      if (currentScrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Logic for hide/show navbar
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setShowNavbar(false);
      } else {
        // Scrolling up
        setShowNavbar(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup function
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  // Effect to handle dropdown click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Navigation links data (excluding auth links when logged in)
  const getNavLinks = () => {
    const baseLinks = [
      { name: 'Home', href: '/' },
      { name: 'About Us', href: '#' },
      { name: 'Member', href: '/company-directory' },
      // { name: 'Business', href: '#' },
      { name: 'Subscriptions', href: '/subscriptions' },
      // { name: 'Blacklist', href: '#' },
      { name: 'Contact Us', href: '#', icon: <FaSearch size={14} /> },
    ];

    // Add auth links only if user is not logged in
    if (!user) {
      baseLinks.push(
        { name: 'Login', href: '/login', icon: <FaUser size={14} /> },
        { name: 'Register', href: '/register' }
      );
    }

    return baseLinks;
  };

  // Get role-specific styling
  const getRoleStyle = (role) => {
    switch (role) {
      case 'admin':
        return {
          bgColor: 'bg-[#bca142]',
          textColor: 'text-[#bca142]',
          label: 'Admin'
        };
      case 'company':
        return {
          bgColor: 'bg-[#bca142]',
          textColor: 'text-[#bca142]',
          label: 'Company'
        };
      case 'user':
        return {
          bgColor: 'bg-[#bca142]',
          textColor: 'text-[#bca142]',
          label: 'User'
        };
      default:
        return {
          bgColor: 'bg-gray-500',
          textColor: 'text-gray-600',
          label: 'Member'
        };
    }
  };

  // Get dashboard URL based on role
  const getDashboardUrl = (role) => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'company':
        return '/company/dashboard';
      case 'user':
        return '/user/dashboard';
        case 'business':
        return '/business';
      default:
        return '/';
    }
  };

  // Handle logout
  const handleLogout = () => {
    setIsUserDropdownOpen(false);
    setIsMobileMenuOpen(false);
    openLogoutModal();
  };

  const navClasses = `
    fixed top-0 left-0 w-full z-50 transition-transform duration-300 ease-in-out
    ${isScrolled ? 'bg-white text-black shadow-md' : 'bg-[#111111] text-white'}
    ${showNavbar ? 'translate-y-0' : '-translate-y-full'}
  `;

  return (
    <header className={navClasses}>
      <div className="container max-w-7xl mx-auto flex items-center justify-between px-4">
        {/* Logo */}
        <a href="/" className="flex-shrink-0">
          <img src="https://res.cloudinary.com/ds1dt3qub/image/upload/v1769604932/gulf_star_network_4_znl5cm.png" alt="Logistics Logo" className="h-24" />
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {getNavLinks().map((link) => (
            <a key={link.name} href={link.href} className="flex items-center space-x-2 font-medium hover:text-[#bca142] transition-colors">
              {link.icon}
              <span>{link.name}</span>
            </a>
          ))}
          
          {/* User Dropdown (Desktop) */}
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center space-x-2 font-medium hover:text-[#bca142] transition-colors focus:outline-none"
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full ${getRoleStyle(user.role).bgColor} flex items-center justify-center text-white text-sm font-bold`}>
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-semibold">{user.name}</span>
                    <span className={`text-xs ${getRoleStyle(user.role).textColor} font-medium`}>
                      ({getRoleStyle(user.role).label})
                    </span>
                  </div>
                  <FaChevronDown className={`text-xs transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Dropdown Menu */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[60]">
                  <a
                    href={getDashboardUrl(user.role)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    <FaTachometerAlt className="mr-3 text-gray-400" />
                    Dashboard
                  </a>
                  {/* <a
                    href="#"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    <FaUserCircle className="mr-3 text-gray-400" />
                    Profile
                  </a> */}
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <FaSignOutAlt className="mr-3 text-red-400" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Request Quote Button (Desktop) */}
        <a href="/quote" className="hidden md:flex items-center bg-[#bca142] text-white font-bold py-3 px-5 rounded-md hover:bg-yellow-600 transition-colors">
          <FaPlus className="mr-2" />
          <div className="flex whitespace-nowrap text-left text-sm leading-tight">
            Request Quote
            
          </div>
        </a>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white text-black absolute top-full left-0 w-full shadow-lg">
          <nav className="flex flex-col p-4 space-y-4">
            {/* User Info (Mobile) */}
            {user && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg mb-4">
                <div className={`w-10 h-10 rounded-full ${getRoleStyle(user.role).bgColor} flex items-center justify-center text-white font-bold`}>
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900">{user.name}</span>
                  <span className={`text-sm ${getRoleStyle(user.role).textColor} font-medium`}>
                    {getRoleStyle(user.role).label}
                  </span>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            {getNavLinks().map((link) => (
              <a key={link.name} href={link.href} className="flex items-center space-x-2 font-medium hover:text-[#bca142] transition-colors">
                {link.icon}
                <span>{link.name}</span>
              </a>
            ))}

            {/* User Actions (Mobile) */}
            {user && (
              <>
                <hr className="my-2" />
                <a
                  href={getDashboardUrl(user.role)}
                  className="flex items-center space-x-2 font-medium hover:text-[#bca142] transition-colors"
                >
                  <FaTachometerAlt size={14} />
                  <span>Dashboard</span>
                </a>
                <a
                  href="#"
                  className="flex items-center space-x-2 font-medium hover:text-[#bca142] transition-colors"
                >
                  <FaUserCircle size={14} />
                  <span>Profile</span>
                </a>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 font-medium text-red-600 hover:text-red-700 transition-colors w-full text-left"
                >
                  <FaSignOutAlt size={14} />
                  <span>Logout</span>
                </button>
              </>
            )}

            {/* Request Quote Button */}
            <a href="/quote" className="flex items-center justify-center bg-[#bca142] text-white font-bold py-3 px-5 rounded-md hover:bg-yellow-600 transition-colors">
              <FaPlus className="mr-2" />
              <div className="flex flex-col whitespace-nowrap text-left text-sm leading-tight">
                Request Quote
              </div>
            </a>
          </nav>
        </div>
      )}
      
      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={closeLogoutModal}
        userRole={user?.role || 'user'}
        userName={user?.name || 'User'}
      />
    </header>
  );
};

export default Navbar;