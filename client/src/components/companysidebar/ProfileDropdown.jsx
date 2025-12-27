import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHome, FiUser, FiLock, FiMessageSquare, FiGlobe, FiLogOut } from 'react-icons/fi';
import api from '../../utils/api';

const ProfileDropdown = ({ onClose, onLogout }) => {
  const [user, setUser] = useState(null);
  const [logo, setLogo] = useState(null); // State for logo
  const navigate = useNavigate();

  // 1. Get User from LocalStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // 2. Fetch Logo from API
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const data = await api.get('/api/company/profile');
        if (data && data.logo) {
          setLogo(data.logo);
        }
      } catch (error) {
        console.error("Error fetching logo for dropdown:", error);
      }
    };

    fetchLogo();
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();
    if (onClose) {
      onClose();
    }
    if (onLogout) {
      onLogout();
    }
  };

  const menuItems = [
    { icon: <FiHome />, text: 'Dashboard', link: '/company/dashboard' },
    { icon: <FiUser />, text: 'My profile', link: '/company/my-profile' },
    { icon: <FiLock />, text: 'Change Password', link: '/company/change-password' },
    { icon: <FiMessageSquare />, text: 'Message', link: '/company/messages' },
    // { icon: <FiGlobe />, text: 'Website', href: '/', external: false }
  ];

  const handleClick = () => {
    if (onClose) onClose();
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-72 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50">
      <div className="py-1">

        {/* Profile Info */}
        <div className="flex flex-col items-center px-4 py-3 border-b border-gray-200">
          <div className="h-20 w-20 rounded-full overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
            {logo ? (
              <img 
                className="h-full w-full object-cover" 
                src={logo} 
                alt="Company Logo" 
              />
            ) : (
              // Default Placeholder if no logo exists
              <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
          
          <h3 className="mt-2 text-lg font-semibold text-gray-800">
            {user ? user.name : 'Guest User'}
          </h3>
          <p className="text-sm text-gray-500">
            {user ? user.email : 'user@example.com'}
          </p>
        </div>

        {/* Menu Items */}
        <div className="px-2 py-2">
          {menuItems.map((item, index) => {
            if (item.href) {
              return (
                <a
                  key={index}
                  href={item.href}
                  target={item.external ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  onClick={handleClick}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
                >
                  <span className="text-gray-500">{item.icon}</span>
                  {item.text}
                </a>
              );
            }

            return (
              <Link
                key={index}
                to={item.link}
                onClick={handleClick}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
              >
                <span className="text-gray-500">{item.icon}</span>
                {item.text}
              </Link>
            );
          })}
        </div>

        <div className="border-t border-gray-200"></div>

        {/* Logout */}
        <div className="px-2 py-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 cursor-pointer w-full text-left"
          >
            <FiLogOut className="text-gray-500" />
            Logout
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProfileDropdown;