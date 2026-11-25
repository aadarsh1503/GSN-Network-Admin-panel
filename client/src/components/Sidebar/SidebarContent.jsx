// src/components/Sidebar/SidebarContent.jsx

import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../../utils/api';
import {
  LayoutDashboard,
  Users, User, UserPlus, Building2, Factory,
  ClipboardList, CheckCircle2, RotateCw, XCircle, Lock,
  DollarSign, CreditCard, FileText, Landmark, Wallet, Coins, Ticket,
  ClipboardCheck, ReceiptText,
  MessageSquare, Bell, Send, Mail,
  Headphones, Clock,
  Package, Truck, LayoutGrid,
  PlusCircle, SlidersHorizontal, Settings,
  Scale,
  BarChart3,
  Cloud, Tag, TrendingUp,
} from 'lucide-react';

// Maps a sidebar page segment to the pending-count keys that badge it.
// A page whose count is zero (or not listed here) shows no badge.
const BADGE_KEY_BY_PATH = {
  'business-Owners': ['pendingBusinessUsers'],
  'company-Owners': ['pendingCompanyUsers'],
  'all-company-Quotes': ['pendingQuotes'],
  'wallet-referral': ['pendingTopups'],
  'subscribers': ['pendingSubscriptions'],
  'messages': ['unreadMessages'],
  'pending-Ticket': ['pendingTickets'],
  'all-Ticket': ['pendingTickets'],
  'disputes': ['openDisputes'],
};

const SEEN_COUNTS_KEY = 'adminSidebarSeenCounts';

const SidebarContent = () => {
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState(null);

  // Live "needs admin action" counts (pending subscriptions, top-ups, tickets…).
  const [counts, setCounts] = useState({});
  // Per-key snapshot of what the admin has already viewed, so opening a page
  // clears its badge until genuinely new requests arrive.
  const [seen, setSeen] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SEEN_COUNTS_KEY) || '{}'); }
    catch { return {}; }
  });

  const loadCounts = useCallback(async () => {
    try { setCounts((await api.get('/api/admin/pending-counts')) || {}); }
    catch { /* badges are non-critical */ }
  }, []);

  useEffect(() => {
    loadCounts();
    const timer = setInterval(loadCounts, 30000);
    return () => clearInterval(timer);
  }, [loadCounts]);

  // Opening a page marks its pending items as seen → badge resets to 0.
  useEffect(() => {
    const segment = location.pathname.split('/').pop();
    const keys = BADGE_KEY_BY_PATH[segment];
    if (!keys?.length) return;
    setSeen(prev => {
      const next = { ...prev };
      let changed = false;
      keys.forEach(k => {
        const current = Number(counts[k] || 0);
        if (next[k] !== current) { next[k] = current; changed = true; }
      });
      if (!changed) return prev;
      try { localStorage.setItem(SEEN_COUNTS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, [location.pathname, counts]);

  // Badge value = pending count minus what the admin has already seen.
  const badgeFor = (keys) => {
    if (!keys?.length) return 0;
    return [...new Set(keys)].reduce(
      (sum, k) => sum + Math.max(0, Number(counts[k] || 0) - Number(seen[k] || 0)),
      0,
    );
  };

  // Reorganized menu items by priority with futuristic grouping
  const menuItems = [
    // Core Management (Highest Priority)
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '',
      priority: 'high',
      description: 'Overview & Analytics'
    },

    // User Management (High Priority)
    {
      name: 'Users Management',
      icon: Users,
      priority: 'high',
      description: 'Manage all users',
      subItems: [
        { name: 'Users', path: 'users', icon: User },
        { name: 'Business Owners', path: 'business-Owners', icon: Building2, badgeKeys: ['pendingBusinessUsers'] },
        { name: 'Company Owners', path: 'company-Owners', icon: Factory, badgeKeys: ['pendingCompanyUsers'] },
      ]
    },

    // Business Operations (High Priority)
    {
      name: 'Quote Management',
      icon: ClipboardList,
      priority: 'high',
      description: 'Company quotes & deals',
      subItems: [
        { name: 'All Quotes', path: 'all-company-Quotes', icon: ClipboardList, badgeKeys: ['pendingQuotes'] },
        { name: 'Approved Quotes', path: 'all-approved-Quotes', icon: CheckCircle2 },
        { name: 'Running Quotes', path: 'all-running-Quotes', icon: RotateCw },
        { name: 'Rejected Quotes', path: 'all-rejected-Quotes', icon: XCircle },
        { name: 'Closed Quotes', path: 'all-closed-Quotes', icon: Lock },
      ]
    },

    // Financial Management (High Priority)
    {
      name: 'Financial Hub',
      icon: DollarSign,
      priority: 'high',
      description: 'Money & transactions',
      subItems: [
        { name: 'All Transactions', path: 'all-transactions', icon: ReceiptText },
        { name: 'Transactions with Users', path: 'transactions-management', icon: CreditCard },
        { name: 'All Invoices', path: 'invoices-management', icon: FileText },
        { name: 'Bank Details', path: 'bank-details', icon: Landmark },
        { name: 'Company Bank Accounts', path: 'company-bank-details', icon: Building2 },
        { name: 'Wallet & Referral', path: 'wallet-referral', icon: Wallet, badgeKeys: ['pendingTopups'] },
        { name: 'Give Money', path: 'give-money', icon: Coins },
      ]
    },

    {
      name: 'Subscriber Payment Review',
      icon: ClipboardCheck,
      path: 'subscribers',
      priority: 'low',
      badgeKeys: ['pendingSubscriptions'],
      description: 'Approve subscriber payments'
    },

    // Communication (Medium Priority)
    {
      name: 'Communications',
      icon: MessageSquare,
      priority: 'medium',
      description: 'Messages & notifications',
      subItems: [
        { name: 'Messages', path: 'messages', icon: MessageSquare, badgeKeys: ['unreadMessages'] },
        { name: 'View Notifications', path: 'notifications', icon: Bell },
        { name: 'Send Notifications', path: 'send-notifications', icon: Send },
        { name: 'Send Emails', path: 'send-emails', icon: Mail },
      ]
    },

    // Support System (Medium Priority)
    {
      name: 'Support Center',
      icon: Headphones,
      priority: 'medium',
      description: 'Customer support',
      subItems: [
        { name: 'All Tickets', path: 'all-Ticket', icon: Ticket, badgeKeys: ['pendingTickets'] },
        { name: 'Pending Tickets', path: 'pending-Ticket', icon: Clock, badgeKeys: ['pendingTickets'] },
        { name: 'Answered Tickets', path: 'answered-Ticket', icon: CheckCircle2 },
        { name: 'Closed Tickets', path: 'closed-Ticket', icon: Lock },
      ]
    },

    // Business Configuration (Medium Priority)
    {
      name: 'Business Config',
      icon: Package,
      priority: 'medium',
      description: 'Categories & setup',
      subItems: [
        { name: 'Logistics Category', path: 'logistics-categories', icon: Truck },
        { name: 'Business Category', path: 'business-categories', icon: LayoutGrid },
      ]
    },

    // Subscription Management (Medium Priority)
    {
      name: 'Subscriptions',
      icon: CreditCard,
      priority: 'medium',
      description: 'Plans & billing',
      subItems: [
        { name: 'Create Subscription', path: 'create-Subscription', icon: PlusCircle },
        { name: 'Manage Subscription', path: 'manage-Subscription', icon: SlidersHorizontal },
      ]
    },

    // Dispute Resolution (Medium Priority)
    {
      name: 'Dispute Center',
      icon: Scale,
      priority: 'medium',
      description: 'Resolve conflicts',
      subItems: [
        { name: 'Dispute Reason', path: 'dispute-Reason', icon: FileText },
        { name: 'Active Disputes', path: 'disputes', icon: Scale, badgeKeys: ['openDisputes'] },
      ]
    },

    // Analytics & Reports (Lower Priority)
    {
      name: 'Reports',
      icon: BarChart3,
      path: 'reports',
      priority: 'low',
      description: 'Analytics & insights'
    },

    // System Settings (Lower Priority)
    {
      name: 'System Settings',
      icon: Settings,
      priority: 'low',
      description: 'App configuration',
      subItems: [
        { name: 'General Settings', path: 'general-settings', icon: SlidersHorizontal },
        { name: 'AWS Settings', path: 'aws-settings', icon: Cloud },
      ]
    },

    {
      name: 'Version Control',
      icon: Tag,
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
      case 'high': return 'bg-[#bca142]';
      case 'medium': return 'bg-[#bca142]';
      case 'low': return 'bg-[#bca142]';
      default: return 'bg-[#bca142]';
    }
  };

  const getPriorityBg = (priority, isActive) => {
    if (isActive) {
      switch (priority) {
        case 'high': return 'bg-[#bca142]/10 border-[#bca142]/30';
        case 'medium': return 'bg-[#bca142]/10 border-[#bca142]/30';
        case 'low': return 'bg-gray-50 border-gray-200';
        default: return 'bg-[#bca142]/10 border-[#bca142]/30';
      }
    }
    return 'hover:bg-gray-50';
  };

  return (
    <nav className="p-4 h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar">
      <div className="space-y-2">
        {menuItems.map((item, index) => {
          const isParentActive = item.subItems?.some(sub => currentPathSegment === sub.path);
          const isActive = currentPathSegment === item.path || isParentActive;
          const ParentIcon = item.icon;
          const itemBadge = badgeFor(
            item.subItems ? item.subItems.flatMap(sub => sub.badgeKeys || []) : item.badgeKeys
          );

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
                      <div className={`w-8 h-8 rounded-lg ${getPriorityColor(item.priority)} flex items-center justify-center text-white shadow-sm`}>
                        <ParentIcon className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className={`font-semibold text-sm ${isActive ? 'text-black' : 'text-black'}`}>
                          {item.name}
                        </span>
                        <p className="text-xs text-gray-600 mt-0.5">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {itemBadge > 0 ? (
                        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
                          {itemBadge > 99 ? '99+' : itemBadge}
                        </span>
                      ) : (
                        item.priority === 'high' && (
                          <div className="w-2 h-2 bg-[#bca142] rounded-full animate-pulse"></div>
                        )
                      )}
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${
                          openDropdown === item.name ? 'rotate-180' : ''
                        }`}
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openDropdown === item.name ? 'max-h-[32rem] mt-2' : 'max-h-0'
                  }`}
                >
                  <div className="bg-white rounded-lg border border-gray-200 p-2 ml-4">
                    {item.subItems.map((subItem, subIndex) => {
                      const SubIcon = subItem.icon;
                      const subActive = currentPathSegment === subItem.path;
                      const subBadge = badgeFor(subItem.badgeKeys);
                      return (
                        <Link
                          key={subIndex}
                          to={subItem.path}
                          className={`flex items-center space-x-3 p-3 rounded-lg text-sm transition-all duration-200 mb-1 ${
                            subActive
                              ? 'bg-[#bca142] text-white font-medium shadow-sm'
                              : 'text-black hover:bg-gray-100 hover:text-black'
                          }`}
                        >
                          <SubIcon className={`w-[18px] h-[18px] shrink-0 ${subActive ? 'text-white' : 'text-[#bca142]'}`} />
                          <span className="flex-1">{subItem.name}</span>
                          {subBadge > 0 && (
                            <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                              subActive ? 'bg-white text-[#bca142]' : 'bg-red-500 text-white'
                            }`}>
                              {subBadge > 99 ? '99+' : subBadge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
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
                  <div className={`w-8 h-8 rounded-lg ${getPriorityColor(item.priority)} flex items-center justify-center text-white shadow-sm`}>
                    <ParentIcon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className={`font-semibold text-sm ${isActive ? 'text-black' : 'text-black'}`}>
                      {item.name}
                    </span>
                    <p className="text-xs text-gray-600 mt-0.5">{item.description}</p>
                  </div>
                </div>
                {itemBadge > 0 ? (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
                    {itemBadge > 99 ? '99+' : itemBadge}
                  </span>
                ) : (
                  item.priority === 'high' && (
                    <div className="w-2 h-2 bg-[#bca142] rounded-full animate-pulse"></div>
                  )
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="text-center">
          <div className="w-8 h-8 bg-[#bca142] rounded-lg mx-auto mb-2 flex items-center justify-center">
            <TrendingUp className="text-white text-sm w-4 h-4" />
          </div>
          <p className="text-xs text-black font-medium">Admin Dashboard</p>
          {/* <p className="text-xs text-gray-400">v2.1.0</p> */}
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
          background: #bca142;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #b8932f;
        }
      `}</style>
    </nav>
  );
};

export default SidebarContent;
