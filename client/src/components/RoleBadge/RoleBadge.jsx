import React from 'react';
import { getRoleBadgeProps } from '../../utils/userRoleUtils';

/**
 * RoleBadge component for displaying user roles with icons and colors
 */
const RoleBadge = ({ 
  role, 
  user = {}, 
  size = 'sm', 
  showIcon = true, 
  showPremium = true,
  className = '' 
}) => {
  const badgeProps = getRoleBadgeProps(role, user, size);
  const IconComponent = badgeProps.icon;
  
  const getIconSize = (size) => {
    switch (size) {
      case 'xs': return 8;
      case 'sm': return 12;
      case 'md': return 14;
      case 'lg': return 16;
      default: return 12;
    }
  };
  
  return (
    <div className={`${badgeProps.className} ${className}`}>
      {showIcon && <IconComponent size={getIconSize(size)} />}
      <span>{badgeProps.label}</span>
      {showPremium && badgeProps.isPremium && badgeProps.planName && (
        <span className="ml-1 text-xs opacity-75">({badgeProps.planName})</span>
      )}
    </div>
  );
};

export default RoleBadge;