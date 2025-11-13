// src/components/Sidebar/SidebarContent.jsx

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, FiBox, FiBriefcase, FiUsers, FiMapPin, FiFileText, FiEdit, 
  FiMail, FiImage, FiAnchor, FiShield, FiChevronDown, FiBell, FiSettings
} from 'react-icons/fi';

const SidebarContent = () => {
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState(null);

  const menuItems = [
    { name: 'Dashboard', icon: <FiHome />, path: '' },
    { name: 'Logistics Category', icon: <FiBox />, path: 'logistics-categories' },
    { name: 'Business Category', icon: <FiBriefcase />, path: 'business-categories' },
    { 
      name: 'Users', 
      icon: <FiUsers />,
      subItems: [
        { name: 'User', path: 'users' },
        { name: 'Business Owners', path: 'business-Owners' },
        { name: 'Company Owners', path: 'company-Owners' },
      ]
    },
    { 
      name: 'Quotes', 
      icon: <FiMapPin />,
      subItems: [
        { name: 'All Quotes', path: 'quote-List' },
        { name: 'Approved Quotes', path: 'approved-Quotes' },
        { name: 'Rejected Quotes', path: 'rejected-Quotes' },
        { name: 'Running Quotes', path: 'running-Quotes' },
        { name: 'Closed Quotes', path: 'closed-Quotes' },
      ]
    },
    { 
      name: 'Company Quotes', 
      icon: <FiBriefcase />,
      subItems: [
        { name: 'All Quotes', path: 'all-company-Quotes' },
        { name: 'Approved Quotes', path: 'all-approved-Quotes' },
        { name: 'Rejected Quotes', path: 'all-rejected-Quotes' },
        { name: 'Running Quotes', path: 'all-running-Quotes' },
        { name: 'Closed Quotes', path: 'all-closed-Quotes' },
      ]
    },
    { 
      name: 'Subscription', 
      icon: <FiFileText />,
      subItems: [
        { name: 'Create Subscription', path: 'create-Subscription' },
        { name: 'Manage Subscription', path: 'manage-subscription' },
      ]
    },
    { 
      name: 'Deposits', 
      icon: <FiEdit />,
      subItems: [
        { name: 'Transaction History', path: 'transaction-History' },
       
      ]
    },
    { 
      name: 'Support Ticket', 
      icon: <FiMail />,
      subItems: [
        { name: 'All Ticket', path: 'all-Ticket' },
        { name: 'Pending Ticket', path: 'pending-Ticket' },
        { name: 'Closed Ticket', path: 'closed-Ticket' },
        { name: 'Answered Ticket', path: 'answered-Ticket' },
      ]
    },
    { 
      name: 'Pages', 
      icon: <FiImage />,
      subItems: [
        { name: 'Privacy Policy', path: 'policy' },
        { name: 'Terms And Conditions', path: 'terms' },
        { name: 'Disclaimer', path: 'disclaimer' },
        { name: 'Due Diligence', path: 'dueDiligenceEditor' },
        { name: 'Suggestions', path: 'suggestion' },
      ]
    },
    { 
      name: 'Review', 
      icon: <FiAnchor />,
      subItems: [
        { name: 'Review Reason', path: 'review-Reason' },
        { name: 'All Review', path: 'all-reviews' },
      ]
    },
    { 
      name: 'Dispute', 
      icon: <FiShield />,
      subItems: [
        { name: 'Dispute Reason', path: 'dispute-Reason' },
        { name: 'Dispute', path: 'disputes' },
      ]
    },
    { name: 'Subscribers', icon: <FiUsers />, path: 'subscribers' },
    { name: 'Contact Requests', icon: <FiMail />, path: 'contactList' },
    { name: 'Bank Detail', icon: <FiBriefcase />, path: 'BankDetail' },
    {
      name: 'Notification',
      icon: <FiBell />,
      subItems: [
        { name: 'Send Notifications', path: 'send-notifications' },
        { name: 'Send Emails', path: 'send-emails' },
      ]
    },
    { name: 'General Settings', icon: <FiSettings />, path: 'general-settings' },
  ];

  const handleDropdownClick = (itemName) => {
    setOpenDropdown(openDropdown === itemName ? null : itemName);
  };

  const currentPathSegment = location.pathname.split('/').pop();

  return (
    <nav className="p-3 overscroll-contain h-[calc(100vh-70px)] overflow-y-auto">
      <ul>
        {menuItems.map((item, index) => {
          const isParentActive = item.subItems?.some(sub => currentPathSegment === sub.path);
          const isActive = currentPathSegment === item.path || isParentActive;

          if (item.subItems) {
            return (
              <li key={index} className="mb-1">
                <button
                  onClick={() => handleDropdownClick(item.name)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-gray-600 hover:bg-yellow-50 hover:text-yellow-600 transition-colors duration-200 ${
                    isActive ? 'bg-yellow-50 text-yellow-600 font-semibold' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <span className="mr-3 text-lg">{item.icon}</span>
                    <span>{item.name}</span>
                  </div>
                  <FiChevronDown 
                    className={`text-xs transition-transform duration-300 ${openDropdown === item.name ? 'rotate-180' : ''}`} 
                  />
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${openDropdown === item.name ? 'max-h-96' : 'max-h-0'}`}
                >
                  <ul className="pl-6 pt-2">
                    {item.subItems.map((subItem, subIndex) => (
                      <li key={subIndex} className="mb-1">
                        <Link
                          to={subItem.path}
                          className={`flex items-center p-2 rounded-lg text-sm text-gray-600 hover:bg-yellow-50 hover:text-yellow-600 ${
                            currentPathSegment === subItem.path ? 'bg-yellow-50 text-yellow-600 font-semibold' : ''
                          }`}
                        >
                          {subItem.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          }

          return (
            <li key={index} className="mb-1">
              <Link
                to={item.path}
                className={`flex items-center justify-between p-3 rounded-lg text-gray-600 hover:bg-yellow-50 hover:text-yellow-600 transition-colors duration-200 ${
                  isActive ? 'bg-yellow-50 text-yellow-600 font-semibold' : ''
                }`}
              >
                <div className="flex items-center">
                  <span className="mr-3 text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </div>
                {item.dropdown && <FiChevronDown className="text-xs" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default SidebarContent;