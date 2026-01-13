// src/components/Sidebar/SidebarContent.jsx

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, FiBox, FiBriefcase, FiUsers, 
  FiMail, FiShield, FiChevronDown, FiSettings, FiTag, FiDollarSign,
  FiTrendingUp, FiBarChart, FiCreditCard, FiHeadphones
} from 'react-icons/fi';

const SidebarContent = () => {
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState(null);

  // Reorganized menu items by priority with futuristic grouping
  const menuItems = [
    // Core Management (Highest Priority)
    { 
      name: 'Dashboard', 
      icon: <FiHome />, 
      path: '',
      priority: 'high',
      description: 'Overview & Analytics'
    },
    
    // User Management (High Priority)
    { 
      name: 'Users Management', 
      icon: <FiUsers />,
      priority: 'high',
      description: 'Manage all users',
      subItems: [
        { name: 'Users', path: 'users', icon: '👤' },
        { name: 'Business Owners', path: 'business-Owners', icon: '🏢' },
        { name: 'Company Owners', path: 'company-Owners', icon: '🏭' },
      ]
    },

    // Business Operations (High Priority)
    { 
      name: 'Quote Management', 
      icon: <FiBriefcase />,
      priority: 'high',
      description: 'Company quotes & deals',
      subItems: [
        { name: 'All Quotes', path: 'all-company-Quotes', icon: '📋' },
        { name: 'Approved Quotes', path: 'all-approved-Quotes', icon: '✅' },
        { name: 'Running Quotes', path: 'all-running-Quotes', icon: '🔄' },
        { name: 'Rejected Quotes', path: 'all-rejected-Quotes', icon: '❌' },
        { name: 'Closed Quotes', path: 'all-closed-Quotes', icon: '🔒' },
      ]
    },

    // Financial Management (High Priority)
    { 
      name: 'Financial Hub', 
      icon: <FiDollarSign />,
      priority: 'high',
      description: 'Money & transactions',
      subItems: [
        { name: 'Transactions with Users', path: 'transactions-management', icon: '💳' },
        { name: 'All Invoices', path: 'invoices-management', icon: '🧾' },
        { name: 'Bank Details', path: 'bank-details', icon: '🏦' },
        // { name: 'Subscriptions', path: 'subscriptions-management', icon: '📊' },
      ]
    },
 { 
      name: 'Subscriber Payment Review', 
      icon: <FiBarChart />, 
      path: 'subscribers',
      priority: 'low',
      description: 'Data insights'
    },
    // Communication (Medium Priority)
    { 
      name: 'Communications', 
      icon: <FiMail />,
      priority: 'medium',
      description: 'Messages & notifications',
      subItems: [
        { name: 'Messages', path: 'messages', icon: '💬' },
        { name: 'View Notifications', path: 'notifications', icon: '🔔' },
        { name: 'Send Notifications', path: 'send-notifications', icon: '📤' },
        { name: 'Send Emails', path: 'send-emails', icon: '📧' },
      ]
    },

    // Support System (Medium Priority)
    { 
      name: 'Support Center', 
      icon: <FiHeadphones />,
      priority: 'medium',
      description: 'Customer support',
      subItems: [
        { name: 'All Tickets', path: 'all-Ticket', icon: '🎫' },
        { name: 'Pending Tickets', path: 'pending-Ticket', icon: '⏳' },
        { name: 'Answered Tickets', path: 'answered-Ticket', icon: '✅' },
        { name: 'Closed Tickets', path: 'closed-Ticket', icon: '🔒' },
      ]
    },

    // Business Configuration (Medium Priority)
    { 
      name: 'Business Config', 
      icon: <FiBox />,
      priority: 'medium',
      description: 'Categories & setup',
      subItems: [
        { name: 'Logistics Category', path: 'logistics-categories', icon: '📦' },
        { name: 'Business Category', path: 'business-categories', icon: '🏢' },
      ]
    },

    // Subscription Management (Medium Priority)
    { 
      name: 'Subscriptions', 
      icon: <FiCreditCard />,
      priority: 'medium',
      description: 'Plans & billing',
      subItems: [
        { name: 'Create Subscription', path: 'create-Subscription', icon: '➕' },
        { name: 'Manage Subscription', path: 'manage-subscription', icon: '⚙️' },
      ]
    },

    // Dispute Resolution (Medium Priority)
    { 
      name: 'Dispute Center', 
      icon: <FiShield />,
      priority: 'medium',
      description: 'Resolve conflicts',
      subItems: [
        { name: 'Dispute Reason', path: 'dispute-Reason', icon: '📝' },
        { name: 'Active Disputes', path: 'disputes', icon: '⚖️' },
      ]
    },

    // Analytics & Reports (Lower Priority)
   

    // System Settings (Lower Priority)
    { 
      name: 'System Settings', 
      icon: <FiSettings />, 
      path: 'general-settings',
      priority: 'low',
      description: 'App configuration'
    },
    
    { 
      name: 'Version Control', 
      icon: <FiTag />, 
      path: 'version-management',
      priority: 'low',
      description: 'App versions'
    },
  ];

  const handleDropdownClick = (itemName) => {
    setOpenDropdown(openDropdown === itemName ? null : itemName);
  };

  const currentPathSegment = location.pathname.split('/').pop();

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'from-blue-500 to-indigo-600';
      case 'medium': return 'from-emerald-500 to-teal-600';
      case 'low': return 'from-slate-500 to-gray-600';
      default: return 'from-blue-500 to-indigo-600';
    }
  };

  const getPriorityBg = (priority, isActive) => {
    if (isActive) {
      switch (priority) {
        case 'high': return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200';
        case 'medium': return 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200';
        case 'low': return 'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200';
        default: return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200';
      }
    }
    return 'hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50';
  };

  return (
    <nav className="p-4 h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar">
      <div className="space-y-2">
        {menuItems.map((item, index) => {
          const isParentActive = item.subItems?.some(sub => currentPathSegment === sub.path);
          const isActive = currentPathSegment === item.path || isParentActive;

          if (item.subItems) {
            return (
              <div key={index} className="mb-2">
                <button
                  onClick={() => handleDropdownClick(item.name)}
                  className={`w-full group relative overflow-hidden rounded-xl border transition-all duration-300 ${
                    getPriorityBg(item.priority, isActive)
                  } ${isActive ? 'border-opacity-50 shadow-sm' : 'border-transparent hover:border-slate-200'}`}
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getPriorityColor(item.priority)} flex items-center justify-center text-white shadow-sm`}>
                        <span className="text-sm">{item.icon}</span>
                      </div>
                      <div className="text-left">
                        <span className={`font-semibold text-sm ${isActive ? 'text-slate-800' : 'text-slate-700'}`}>
                          {item.name}
                        </span>
                        <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {item.priority === 'high' && (
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      )}
                      <FiChevronDown 
                        className={`text-sm text-slate-400 transition-transform duration-300 ${
                          openDropdown === item.name ? 'rotate-180' : ''
                        }`} 
                      />
                    </div>
                  </div>
                </button>
                
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openDropdown === item.name ? 'max-h-96 mt-2' : 'max-h-0'
                  }`}
                >
                  <div className="bg-white/50 rounded-lg border border-slate-100 p-2 ml-4">
                    {item.subItems.map((subItem, subIndex) => (
                      <Link
                        key={subIndex}
                        to={subItem.path}
                        className={`flex items-center space-x-3 p-3 rounded-lg text-sm transition-all duration-200 mb-1 ${
                          currentPathSegment === subItem.path 
                            ? 'bg-white text-slate-800 font-medium shadow-sm border border-slate-200' 
                            : 'text-slate-600 hover:bg-white/70 hover:text-slate-800'
                        }`}
                      >
                        <span className="text-base">{subItem.icon}</span>
                        <span>{subItem.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <Link
              key={index}
              to={item.path}
              className={`block group relative overflow-hidden rounded-xl border transition-all duration-300 mb-2 ${
                getPriorityBg(item.priority, isActive)
              } ${isActive ? 'border-opacity-50 shadow-sm' : 'border-transparent hover:border-slate-200'}`}
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getPriorityColor(item.priority)} flex items-center justify-center text-white shadow-sm`}>
                    <span className="text-sm">{item.icon}</span>
                  </div>
                  <div className="text-left">
                    <span className={`font-semibold text-sm ${isActive ? 'text-slate-800' : 'text-slate-700'}`}>
                      {item.name}
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                  </div>
                </div>
                {item.priority === 'high' && (
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mx-auto mb-2 flex items-center justify-center">
            <FiTrendingUp className="text-white text-sm" />
          </div>
          <p className="text-xs text-slate-600 font-medium">Admin Dashboard</p>
          {/* <p className="text-xs text-slate-400">v2.1.0</p> */}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #e2e8f0, #cbd5e1);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #cbd5e1, #94a3b8);
        }
      `}</style>
    </nav>
  );
};

export default SidebarContent;