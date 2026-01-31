import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FiGrid, FiUsers, FiFileText, FiUser, FiEdit, FiGitBranch,
  FiUserPlus, FiAward, FiRepeat, FiFile,
  FiHeart, FiMail, FiBell, FiChevronDown, FiCreditCard, FiSearch, FiShield, FiHelpCircle, FiDollarSign
} from 'react-icons/fi';
import UserCard from './UserCard';
import { useNotifications } from '../../contexts/NotificationContext';
import CompanyQuoteRestrictionModal from '../Modal/CompanyQuoteRestrictionModal';

// Reorganized menu items by priority with sections
const menuSections = [
  {
    title: 'Core Operations',
    priority: 1,
    items: [
      { name: 'Dashboard', icon: <FiGrid />, path: '/company/dashboard', priority: 1 },
      { name: 'Available Quotes', icon: <FiSearch />, path: '/company/available-quotes', priority: 2 },
      { name: 'My Quotes', icon: <FiFileText />, path: '/company/my-Quotes', priority: 3 },
      { name: 'Messages', icon: <FiMail />, path: '/company/messages', priority: 4 },
      { name: 'Notifications', icon: <FiBell />, path: '/company/notification-company', priority: 5 },
    ]
  },
  {
    title: 'Financial Management',
    priority: 2,
    items: [
      { name: 'Subscriptions', icon: <FiCreditCard />, path: '/company/subscriptions', priority: 1 },
      {
        name: 'Payment Management',
        icon: <FiDollarSign />,
        priority: 2,
        subItems: [
          { name: 'Bank Details', path: '/company/bank-details' },
          { name: 'Payment Verification', path: '/company/payment-management' },
        ],
      },
      { name: 'Invoices', icon: <FiFile />, path: '/company/invoices', priority: 3 },
      { name: 'Transaction History', icon: <FiRepeat />, path: '/company/transaction-History-Company', priority: 4 },
    ]
  },
  {
    title: 'Company Management',
    priority: 3,
    items: [
      { name: 'Member Directory', icon: <FiUsers />, path: '/company/member-directory', priority: 1 },
      {
        name: 'Company Members',
        icon: <FiUserPlus />,
        priority: 2,
        subItems: [
          { name: 'Add Member', path: '/company/add-member' },
          { name: 'Manage Members', path: '/company/manage-member' },
        ],
      },
      {
        name: 'Company Branch',
        icon: <FiGitBranch />,
        priority: 3,
        subItems: [
          { name: 'Add Branch', path: '/company/add-Branch' },
          { name: 'Manage Branch', path: '/company/manage-Branch' },
        ],
      },
    ]
  },
  {
    title: 'Profile & Settings',
    priority: 4,
    items: [
      { name: 'My Profile', icon: <FiUser />, path: '/company/my-profile', priority: 1 },
      { name: 'Edit Company Details', icon: <FiEdit />, path: '/company/edit-Profile', priority: 2 },
      { name: 'My Certificate', icon: <FiAward />, path: '/company/profile-certificate', priority: 3 },
    ]
  },
  {
    title: 'Support & Tools',
    priority: 5,
    items: [
      {
        name: 'Support Tickets',
        icon: <FiUserPlus />,
        priority: 1,
        subItems: [
          { name: 'Create Ticket', path: '/company/create-Ticket' },
          { name: 'My Tickets', path: '/company/my-Tickets' },
        ],
      },
      { name: 'Disputes', icon: <FiShield />, path: '/company/disputes', priority: 2 },
      { name: 'Wishlist', icon: <FiHeart />, path: '/company/wishlist', priority: 3 },
      { name: 'Help', icon: <FiHelpCircle />, path: '/company/help', priority: 4 },
    ]
  }
];

const CompanySidebarContent = () => {
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);
  const { unreadCount, messageUnreadCount, markAsRead } = useNotifications();

  const handleDropdownClick = (itemName) => {
    setOpenDropdown(openDropdown === itemName ? null : itemName);
  };

  const handleQuoteRequestClick = (e) => {
    e.preventDefault();
    setShowRestrictionModal(true);
  };

  const handleModalClose = () => {
    setShowRestrictionModal(false);
  };

  const renderMenuItem = (item, sectionIndex, itemIndex) => {
    const isParentActive = item.subItems?.some(sub => location.pathname === sub.path);
    const uniqueKey = `${sectionIndex}-${itemIndex}`;
    
    if (item.subItems) {
      return (
        <li key={uniqueKey} className="mb-2">
          <button
            onClick={() => handleDropdownClick(item.name)}
            className={`w-full group flex items-center justify-between p-3 rounded-xl text-black hover:bg-gray-50 hover:text-black hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] ${
              isParentActive ? 'bg-[#bca142]/10 text-black shadow-md font-semibold border border-[#bca142]/30' : ''
            }`}
          >
            <div className="flex items-center">
              <span className={`mr-3 text-lg transition-all duration-300 ${isParentActive ? 'text-[#bca142] scale-110' : 'group-hover:text-[#bca142] group-hover:scale-110'}`}>
                {item.icon}
              </span>
              <span className="font-medium">{item.name}</span>
            </div>
            <FiChevronDown className={`text-sm transition-all duration-300 ${openDropdown === item.name ? 'rotate-180 text-[#bca142]' : 'group-hover:text-[#bca142]'}`} />
          </button>
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${openDropdown === item.name ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <ul className="pl-6 pt-2 space-y-1">
              {item.subItems.map((subItem, subIndex) => (
                <li key={subIndex}>
                  <NavLink 
                    to={subItem.path} 
                    className={({ isActive }) => `flex items-center p-2.5 rounded-lg text-sm transition-all duration-300 transform hover:scale-[1.02] ${
                      isActive 
                        ? 'bg-[#bca142] text-white font-semibold shadow-sm border-l-3 border-[#bca142]' 
                        : 'text-black hover:bg-gray-50 hover:text-black'
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full bg-current opacity-60 mr-3"></div>
                    {subItem.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </li>
      );
    }

    return (
      <li key={uniqueKey} className="mb-2">
        {item.name === 'Request Quote' ? (
          <button
            onClick={handleQuoteRequestClick}
            className="w-full group flex items-center justify-between p-3 rounded-xl text-black hover:bg-gray-50 hover:text-black hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]"
          >
            <div className="flex items-center">
              <span className="mr-3 text-lg transition-all duration-300 group-hover:text-[#bca142] group-hover:scale-110">
                {item.icon}
              </span>
              <span className="font-medium">{item.name}</span>
            </div>
          </button>
        ) : (
          <NavLink 
            to={item.path} 
            onClick={() => {
              if (item.name === 'Notifications') {
                markAsRead('all');
              }
            }}
            className={({ isActive }) => `group flex items-center justify-between p-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] ${
              isActive 
                ? 'bg-[#bca142]/10 text-black shadow-md font-semibold border border-[#bca142]/30' 
                : 'text-black hover:bg-gray-50 hover:text-black hover:shadow-md'
            }`}
          >
            <div className="flex items-center">
              <span className={`mr-3 text-lg transition-all duration-300 ${
                location.pathname === item.path ? 'text-[#bca142] scale-110' : 'group-hover:text-[#bca142] group-hover:scale-110'
              }`}>
                {item.icon}
              </span>
              <span className="font-medium">{item.name}</span>
            </div>
            {/* {item.name === 'Notifications' && unreadCount > 0 && (
              <span className="bg-black text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-bounce shadow-lg font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )} */}
            {item.name === 'Messages' && messageUnreadCount > 0 && (
              <span className="bg-[#bca142] text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-bounce shadow-lg font-bold">
                {messageUnreadCount > 99 ? '99+' : messageUnreadCount}
              </span>
            )}
          </NavLink>
        )}
      </li>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* User Card Section */}
      <div className="p-4 border-b border-gray-200 bg-[#bca142]">
        <UserCard />
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 p-4 pt-6 overflow-y-auto">
        <div className="space-y-8">
          {menuSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-3">
              {/* Section Header */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-0.5 bg-[#bca142] rounded-full"></div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {section.title}
                </h3>
                <div className="flex-1 h-0.5 bg-gray-200 rounded-full"></div>
              </div>
              
              {/* Section Items */}
              <ul className="space-y-1">
                {section.items
                  .sort((a, b) => (a.priority || 999) - (b.priority || 999))
                  .map((item, itemIndex) => renderMenuItem(item, sectionIndex, itemIndex))
                }
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="h-4 bg-gray-50"></div>

      {/* Company Restriction Modal */}
      <CompanyQuoteRestrictionModal
        isOpen={showRestrictionModal}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default CompanySidebarContent;