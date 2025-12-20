// src/components/CompanyHeader.js

import React, { useState, useEffect, useRef } from 'react';
import { FiMenu, FiBell, FiMail } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import ProfileDropdown from './ProfileDropdown';
import { useNotifications } from '../../contexts/NotificationContext';
import CompanyQuoteRestrictionModal from '../Modal/CompanyQuoteRestrictionModal';
// We use raw fetch here to ensure it works without path issues to your utils folder
// but we follow the same logic as your api wrapper

const CompanyHeader = ({ onMenuClick }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { unreadCount, messageUnreadCount } = useNotifications();

  // State for user and logo
  const [user, setUser] = useState(null);
  const [companyLogo, setCompanyLogo] = useState(null);

  // 1. Fetch User from LocalStorage
  useEffect(() => {
    const userDataString = localStorage.getItem('user');
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        setUser(userData);
      } catch (error) {
        console.error("❌ Error parsing user JSON:", error);
      }
    }
  }, []);

  // 2. Fetch Company Logo from API
  useEffect(() => {
    const fetchCompanyLogo = async () => {
      try {
        const token = localStorage.getItem('token'); // Ensure you have the token saved
        
        // Using the same endpoint as your EditCompanyDetails code
        const response = await fetch('/api/company/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            // Check if logo exists in the response
            if (data && data.logo) {
                setCompanyLogo(data.logo);
            }
        }
      } catch (error) {
        console.error("Error fetching company logo:", error);
      }
    };

    fetchCompanyLogo();
  }, []);

  // Dropdown click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  const handleQuoteRequestClick = (e) => {
    e.preventDefault();
    setShowRestrictionModal(true);
  };

  const handleModalClose = () => {
    setShowRestrictionModal(false);
  };

  return (
    <header className="sticky top-0 h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 z-20">
      
      {/* Left Section */}
      <div className="header-left flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Toggle sidebar"
        >
          <FiMenu size={24} />
        </button>

        {/* LOGO LOGIC HERE */}
        <div className="hidden sm:block">
            {companyLogo ? (
                <img 
                    src={companyLogo} 
                    alt="Company Logo" 
                    className="h-12 w-auto object-contain" 
                />
            ) : (
                <span className="text-xl font-bold text-gray-800 tracking-wider">
                    LOGO
                </span>
            )}
        </div>
      </div>

      {/* Center */}
      <div className="header-center hidden lg:flex items-center gap-4">
        <a href="/company/member-directory" className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">Member Directory</a>
        <a href="/company/freight-quotes" className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">Quotes</a>
        <button 
          onClick={handleQuoteRequestClick}
          className="px-5 py-2 text-sm font-medium text-white bg-amber-500 border border-amber-500 rounded-lg hover:bg-amber-600 transition-colors"
        >
          Request Quote
        </button>
      </div>

      {/* Right Section */}
      <div className="header-right flex items-center gap-4 sm:gap-6">
        {/* Messages Button */}
        <button 
          onClick={() => navigate('/company/messages')}
          className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <FiMail size={20} />
          {messageUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
              {messageUnreadCount > 99 ? '99+' : messageUnreadCount}
            </span>
          )}
        </button>

        {/* Notifications Button */}
        <button 
          onClick={() => navigate('/company/notification-company')}
          className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <FiBell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100"
            aria-haspopup="true"
            aria-expanded={isDropdownOpen}
          >
            <span className="text-2xl">👤</span>

            <div className="hidden md:flex items-center gap-2">
              <span className="font-medium text-gray-800">
                {user ? user.name : 'User'}
              </span>
              <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
          </button>

          {isDropdownOpen && <ProfileDropdown onClose={closeDropdown} />}
        </div>
      </div>

      {/* Company Restriction Modal */}
      <CompanyQuoteRestrictionModal
        isOpen={showRestrictionModal}
        onClose={handleModalClose}
      />
    </header>
  );
};

export default CompanyHeader;