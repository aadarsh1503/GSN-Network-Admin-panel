import { useState, useEffect } from 'react';

export const useProfileCompletion = (userRole, userId) => {
  const [shouldShowPrompt, setShouldShowPrompt] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!userRole || !userId) return;

    // Check if user has permanently dismissed the prompt
    const permanentlyDismissed = localStorage.getItem(`profilePromptDismissed_${userRole}`);
    
    // Check if prompt has been shown for this user role
    const promptShown = localStorage.getItem(`profilePromptShown_${userRole}`);
    
    // Check if user has completed profile
    const hasCompletedProfile = checkProfileCompletion(userRole);
    
    // Show prompt if:
    // 1. Not permanently dismissed
    // 2. Profile is not complete
    // 3. User is not admin (admins don't need profile completion)
    // 4. Either never shown OR shown more than 7 days ago (for gentle reminders)
    if (!permanentlyDismissed && !hasCompletedProfile && userRole !== 'admin') {
      const lastShown = localStorage.getItem(`profilePromptLastShown_${userRole}`);
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      if (!lastShown || parseInt(lastShown) < sevenDaysAgo) {
        setShouldShowPrompt(true);
        // Small delay to let the dashboard load first
        setTimeout(() => {
          setIsModalOpen(true);
        }, 2000);
      }
    }
  }, [userRole, userId]);

  const checkProfileCompletion = (role) => {
    // This is a basic check - you can make it more sophisticated
    // by checking actual profile data from API
    const completionKey = `profileCompleted_${role}`;
    return localStorage.getItem(completionKey) === 'true';
  };

  const markProfileCompleted = () => {
    if (userRole) {
      localStorage.setItem(`profileCompleted_${userRole}`, 'true');
      localStorage.setItem(`profilePromptShown_${userRole}`, 'true');
      localStorage.setItem(`profilePromptLastShown_${userRole}`, Date.now().toString());
    }
  };

  const dismissPermanently = () => {
    if (userRole) {
      localStorage.setItem(`profilePromptDismissed_${userRole}`, 'true');
      localStorage.setItem(`profilePromptShown_${userRole}`, 'true');
      localStorage.setItem(`profilePromptLastShown_${userRole}`, Date.now().toString());
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setShouldShowPrompt(false);
    // Update last shown timestamp for temporary dismissal
    if (userRole) {
      localStorage.setItem(`profilePromptLastShown_${userRole}`, Date.now().toString());
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  return {
    shouldShowPrompt,
    isModalOpen,
    closeModal,
    openModal,
    markProfileCompleted,
    dismissPermanently
  };
};