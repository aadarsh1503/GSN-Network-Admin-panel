import React from 'react';
import { getUserAvatarProps } from '../../utils/userRoleUtils';

/**
 * UserAvatar component with role indicators
 */
const UserAvatar = ({ 
  user, 
  size = 'md', 
  showRoleIndicator = true, 
  className = '' 
}) => {
  const avatarProps = getUserAvatarProps(user, size);
  const IconComponent = avatarProps.roleInfo.icon;
  
  return (
    <div className={`relative ${className}`}>
      {avatarProps.hasLogo ? (
        <img 
          src={avatarProps.logoUrl} 
          alt={avatarProps.userName} 
          className={`${avatarProps.size} rounded-full object-cover ring-2 ring-gray-200 shadow-sm`} 
        />
      ) : (
        <div className={`${avatarProps.size} rounded-full flex items-center justify-center text-white font-bold shadow-sm ${
          avatarProps.roleInfo.color === 'text-red-600' ? 'bg-gradient-to-r from-red-500 to-red-600' :
          avatarProps.roleInfo.color === 'text-blue-600' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
          avatarProps.roleInfo.color === 'text-purple-600' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
          avatarProps.roleInfo.color === 'text-green-600' ? 'bg-gradient-to-r from-green-500 to-green-600' :
          'bg-gradient-to-r from-gray-500 to-gray-600'
        }`}>
          {avatarProps.fallbackLetter}
        </div>
      )}
      
      {showRoleIndicator && (
        <div className={`absolute -bottom-1 -right-1 ${
          size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-6 h-6' : 'w-7 h-7'
        } rounded-full ${avatarProps.roleInfo.bgColor} ${avatarProps.roleInfo.borderColor} border-2 flex items-center justify-center shadow-sm`}>
          <IconComponent 
            size={size === 'sm' ? 10 : size === 'md' ? 12 : 14} 
            className={avatarProps.roleInfo.color}
          />
        </div>
      )}
    </div>
  );
};

export default UserAvatar;