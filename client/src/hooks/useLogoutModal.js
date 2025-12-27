import { useState } from 'react';

export const useLogoutModal = () => {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const openLogoutModal = () => {
    setIsLogoutModalOpen(true);
  };
  
  const closeLogoutModal = () => {
    setIsLogoutModalOpen(false);
  };

  return {
    isLogoutModalOpen,
    openLogoutModal,
    closeLogoutModal
  };
};