import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiUsers, FiFileText, FiPlusCircle, FiUser, FiEdit, FiGitBranch,
  FiUserPlus, FiClipboard, FiAward, FiRepeat, FiFile, FiEye,
  FiHeart, FiMessageSquare, FiMail, FiThumbsUp, FiBell, FiChevronDown, FiCreditCard, FiSearch
} from 'react-icons/fi';
import UserCard from './UserCard';
import { useNotifications } from '../../contexts/NotificationContext';
import CompanyQuoteRestrictionModal from '../Modal/CompanyQuoteRestrictionModal';

// All the menu items are defined here
const menuItems = [
    { name: 'Dashboard', icon: <FiGrid />, path: '/company/dashboard' },
    { name: 'Member Directory', icon: <FiUsers />, path: '/company/member-directory' },
    { name: 'Quotes', icon: <FiFileText />, path: '/company/freight-quotes' },
    { name: 'Request Quote', icon: <FiPlusCircle />, path: '/quote' },
    { name: 'My Profile', icon: <FiUser />, path: '/company/my-profile' },
    { name: 'Edit Company Details', icon: <FiEdit />, path: '/company/edit-Profile' },
    {
      name: 'Company Branch',
      icon: <FiGitBranch />,
      subItems: [
        { name: 'Add Branch', path: '/company/add-Branch' },
        { name: 'Manage Branch', path: '/company/manage-Branch' },
      ],
    },
    {
      name: 'Company Members',
      icon: <FiUserPlus />,
      subItems: [
        { name: 'Add Member', path: '/company/add-member' },
        { name: 'Manage Members', path: '/company/manage-member' },
      ],
    },
    { name: 'Plans', icon: <FiClipboard />, path: '/company/plans' },
    { name: 'Subscriptions', icon: <FiCreditCard />, path: '/company/subscriptions' },
    { name: 'Available Quotes', icon: <FiSearch />, path: '/company/available-quotes' },
    { name: 'My Certificate', icon: <FiAward />, path: '/company/profile-certificate' },
    { name: 'Transaction History', icon: <FiRepeat />, path: '/company/transaction-History-Company' },
    { name: 'Invoices', icon: <FiFile />, path: '/company/invoices' },
    { name: 'Profile Viewers', icon: <FiEye />, path: '/company/profile-Viewers' },
    { name: 'Support Tickets', icon: <FiUserPlus />,
        subItems: [
          { name: 'Create Ticket', path: '/company/create-Ticket' },
          { name: 'My Tickets', path: '/company/my-Tickets' },
        ],
      },
    { name: 'Wishlist', icon: <FiHeart />, path: '/company/wishlist' },
    { name: 'Individual User Quotes', icon: <FiMessageSquare />, path: '/company/individual-Quotes' },
    { name: 'My Quotes', icon: <FiFileText />, path: '/company/my-Quotes' },
    { name: 'Messages', icon: <FiMail />, path: '/company/messages' },
    { name: 'Suggestion', icon: <FiThumbsUp />, path: '/company/suggestions' },
    { name: 'Notifications', icon: <FiBell />, path: '/company/notification-company' },
];

const CompanySidebarContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);
  const { unreadCount, messageUnreadCount } = useNotifications();

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

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        {/* Dynamic User Card */}
        <UserCard />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 pt-0 overflow-y-auto whitespace-nowrap">
        <ul>
          {menuItems.map((item, index) => {
            const isParentActive = item.subItems?.some(sub => location.pathname === sub.path);
            
            if (item.subItems) {
              return (
                <li key={index} className="mb-1">
                  <button
                    onClick={() => handleDropdownClick(item.name)}
                    className={`w-full  flex items-center justify-between p-3 rounded-lg text-gray-700 hover:bg-amber-50 hover:text-amber-800 transition-colors duration-200 ${
                      isParentActive ? 'bg-amber-100 text-amber-800 font-bold' : ''
                    }`}
                  >
                    <div className="flex items-center"><span className="mr-3 text-lg ">{item.icon}</span><span>{item.name}</span></div>
                    <FiChevronDown className={`text-xs transition-transform duration-300 ${openDropdown === item.name ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openDropdown === item.name ? 'max-h-96' : 'max-h-0'}`}>
                    <ul className="pl-6 pt-2">
                      {item.subItems.map((subItem, subIndex) => (
                        <li key={subIndex} className="mb-1 ">
                          <NavLink to={subItem.path} className={({ isActive }) => `flex  items-center p-2 rounded-lg text-sm text-gray-600 hover:bg-amber-50 hover:text-amber-800 ${ isActive ? 'bg-amber-100 text-amber-800 font-semibold' : '' }`}>
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
              <li key={index} className="mb-1">
                {item.name === 'Request Quote' ? (
                  <button
                    onClick={handleQuoteRequestClick}
                    className="w-full flex items-center justify-between p-3 rounded-lg text-gray-700 hover:bg-amber-50 hover:text-amber-800 transition-colors duration-200"
                  >
                    <div className="flex items-center">
                      <span className="mr-3 text-lg">{item.icon}</span>
                      <span>{item.name}</span>
                    </div>
                  </button>
                ) : (
                  <NavLink to={item.path} className={({ isActive }) => `flex items-center justify-between p-3 rounded-lg text-gray-700 hover:bg-amber-50 hover:text-amber-800 transition-colors duration-200 ${ isActive ? 'bg-amber-100 text-amber-800 font-bold' : '' }`}>
                    <div className="flex items-center">
                      <span className="mr-3 text-lg">{item.icon}</span>
                      <span>{item.name}</span>
                    </div>
                    {item.name === 'Notifications' && unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                    {item.name === 'Messages' && messageUnreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                        {messageUnreadCount > 99 ? '99+' : messageUnreadCount}
                      </span>
                    )}
                  </NavLink>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Company Restriction Modal */}
      <CompanyQuoteRestrictionModal
        isOpen={showRestrictionModal}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default CompanySidebarContent;