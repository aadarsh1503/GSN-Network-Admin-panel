// Utility functions for managing profile completion prompts

export const resetProfilePrompts = (userRole = null) => {
  const roles = userRole ? [userRole] : ['user', 'business', 'company'];
  
  roles.forEach(role => {
    localStorage.removeItem(`profilePromptShown_${role}`);
    localStorage.removeItem(`profilePromptDismissed_${role}`);
    localStorage.removeItem(`profilePromptLastShown_${role}`);
    localStorage.removeItem(`profileCompleted_${role}`);
  });
  
  console.log(`Profile prompts reset for: ${roles.join(', ')}`);
};

export const getProfilePromptStatus = (userRole) => {
  return {
    shown: localStorage.getItem(`profilePromptShown_${userRole}`) === 'true',
    dismissed: localStorage.getItem(`profilePromptDismissed_${userRole}`) === 'true',
    completed: localStorage.getItem(`profileCompleted_${userRole}`) === 'true',
    lastShown: localStorage.getItem(`profilePromptLastShown_${userRole}`),
  };
};

export const markProfileAsCompleted = (userRole) => {
  localStorage.setItem(`profileCompleted_${userRole}`, 'true');
  localStorage.setItem(`profilePromptShown_${userRole}`, 'true');
  localStorage.setItem(`profilePromptLastShown_${userRole}`, Date.now().toString());
};

// For debugging - call this in browser console to reset prompts
window.resetProfilePrompts = resetProfilePrompts;
window.getProfilePromptStatus = getProfilePromptStatus;