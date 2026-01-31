import { 
  FiShield, 
  FiBriefcase, 
  FiUser, 
  FiUsers, 
  FiStar
} from 'react-icons/fi';
import { FaCrown, FaBuilding, FaUser as FaUserIcon } from 'react-icons/fa';

/**
 * Utility functions for user role identification in messaging
 */

// Role definitions and their properties
export const USER_ROLES = {
  admin: {
    label: 'Admin',
    color: 'text-white',
    bgColor: 'bg-[#bca142]',
    borderColor: 'border-[#bca142]',
    icon: FiShield,
    description: 'Platform Administrator'
  },
  business: {
    label: 'Business',
    color: 'text-white',
    bgColor: 'bg-[#bca142]',
    borderColor: 'border-[#bca142]',
    icon: FiBriefcase,
    description: 'Business Owner'
  },
  company: {
    label: 'Company',
    color: 'text-white',
    bgColor: 'bg-[#bca142]',
    borderColor: 'border-[#bca142]',
    icon: FaBuilding,
    description: 'Logistics Company'
  },
  user: {
    label: 'Member',
    color: 'text-white',
    bgColor: 'bg-black',
    borderColor: 'border-black',
    icon: FiUser,
    description: 'Platform Member'
  },
  default: {
    label: 'User',
    color: 'text-black',
    bgColor: 'bg-white',
    borderColor: 'border-gray-300',
    icon: FiUser,
    description: 'Platform User'
  }
};

/**
 * Get role information for a user
 * @param {string} role - User role
 * @param {object} user - User object (optional, for additional context)
 * @returns {object} Role information
 */
export const getRoleInfo = (role, user = {}) => {
  const roleKey = role?.toLowerCase() || 'default';
  const roleInfo = USER_ROLES[roleKey] || USER_ROLES.default;
  
  // Add premium/subscription status for enhanced identification
  if (user.subscription_status === 'active' && user.plan_name) {
    return {
      ...roleInfo,
      isPremium: true,
      planName: user.plan_name
    };
  }
  
  return roleInfo;
};

/**
 * Get role badge component props
 * @param {string} role - User role
 * @param {object} user - User object (optional)
 * @param {string} size - Badge size ('sm', 'md', 'lg')
 * @returns {object} Badge props
 */
export const getRoleBadgeProps = (role, user = {}, size = 'sm') => {
  const roleInfo = getRoleInfo(role, user);
  
  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };
  
  return {
    className: `inline-flex items-center gap-1 rounded-full font-medium ${roleInfo.bgColor} ${roleInfo.color} ${sizeClasses[size]}`,
    icon: roleInfo.icon,
    label: roleInfo.label,
    description: roleInfo.description,
    isPremium: roleInfo.isPremium,
    planName: roleInfo.planName
  };
};

/**
 * Get role icon component
 * @param {string} role - User role
 * @param {number} size - Icon size
 * @param {string} className - Additional CSS classes
 * @returns {object} Icon component props
 */
export const getRoleIcon = (role, size = 16, className = '') => {
  const roleInfo = getRoleInfo(role);
  const IconComponent = roleInfo.icon;
  
  return {
    Component: IconComponent,
    className: `${roleInfo.color} ${className}`,
    size
  };
};

/**
 * Get user avatar with role indicator
 * @param {object} user - User object
 * @param {string} size - Avatar size ('sm', 'md', 'lg')
 * @returns {object} Avatar props
 */
export const getUserAvatarProps = (user, size = 'md') => {
  const roleInfo = getRoleInfo(user.role, user);
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };
  
  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20
  };
  
  return {
    size: sizeClasses[size],
    iconSize: iconSizes[size],
    roleInfo,
    hasLogo: !!user.logo,
    logoUrl: user.logo,
    userName: user.name || user.userName,
    fallbackLetter: (user.name || user.userName || 'U').charAt(0).toUpperCase()
  };
};

/**
 * Get conversation header info with role identification
 * @param {object} conversation - Conversation object
 * @param {string} currentUserRole - Current user's role
 * @returns {object} Header info
 */
export const getConversationHeaderInfo = (conversation, currentUserRole) => {
  const otherUserRole = conversation.other_user_role || 'user';
  const roleInfo = getRoleInfo(otherUserRole, conversation);
  
  return {
    userName: conversation.other_user_name || conversation.userName,
    userRole: otherUserRole,
    roleInfo,
    isAdmin: otherUserRole === 'admin',
    isBusiness: otherUserRole === 'business',
    isCompany: otherUserRole === 'company',
    isUser: otherUserRole === 'user',
    logo: conversation.other_user_logo || conversation.logo,
    description: roleInfo.description
  };
};

/**
 * Get message sender info with role identification
 * @param {object} message - Message object
 * @param {object} currentUser - Current user object
 * @returns {object} Sender info
 */
export const getMessageSenderInfo = (message, currentUser) => {
  const isOwn = message.sender_id === currentUser.id;
  const senderRole = isOwn ? currentUser.role : (message.sender_role || 'user');
  const roleInfo = getRoleInfo(senderRole);
  
  return {
    isOwn,
    senderName: message.sender_display_name || message.sender_name || 'User',
    senderRole,
    roleInfo,
    isAdmin: senderRole === 'admin',
    isBusiness: senderRole === 'business',
    isCompany: senderRole === 'company',
    isUser: senderRole === 'user'
  };
};