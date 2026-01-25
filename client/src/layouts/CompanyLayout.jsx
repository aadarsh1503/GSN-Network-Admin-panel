import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';
import { startAccountStatusMonitoring, stopAccountStatusMonitoring } from '../utils/api';
import { useAccountStatusWebSocket } from '../hooks/useAccountStatusWebSocket';
import AccountStatusModal from '../components/Modal/AccountStatusModal';
import { checkAndShowAccountStatus, forceLogout } from '../utils/accountStatusChecker';

// Import all the necessary sidebar components
import CompanySidebar from '../components/companysidebar/CompanySidebar';
import MobileCompanySidebar from '../components/companysidebar/MobileCompanySidebar'; 
import CompanyHeader from '../components/companysidebar/CompanyHeader';

const CompanyLayout = () => {
  // State to manage the sidebar's open/closed status
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  
  // WebSocket connection for real-time account status
  const { isConnected, accountStatus, clearAccountStatus, handleLogout } = useAccountStatusWebSocket();
  
  // State for modal visibility
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({ type: '', message: '' });

  // Function to toggle the sidebar state
  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  // Handle real-time account status changes
  useEffect(() => {
    if (accountStatus) {
      console.log('🚨 Account status change detected:', accountStatus);
      
      if (accountStatus.type === 'deactivated' || accountStatus.type === 'blacklisted') {
        setModalConfig({
          type: accountStatus.type,
          message: accountStatus.message
        });
        setShowStatusModal(true);
      } else if (accountStatus.type === 'reactivated') {
        // Show success message for reactivation
        toast.success(accountStatus.message || 'Your account has been reactivated!', {
          duration: 5000,
          position: 'top-center',
        });
        clearAccountStatus();
      }
    }
  }, [accountStatus, clearAccountStatus]);

  // Set up account status monitoring and event handling
  useEffect(() => {
    // CHECK ACCOUNT STATUS ON PAGE LOAD/REFRESH
    checkAndShowAccountStatus();

    // Start monitoring account status every 2 minutes (as backup to WebSocket)
    startAccountStatusMonitoring(2);

    // Listen for account deactivation events (from API calls)
    const handleAccountDeactivated = (event) => {
      setModalConfig({
        type: 'deactivated',
        message: event.detail.message
      });
      setShowStatusModal(true);
    };

    // Listen for account blacklisted events (from API calls)
    const handleAccountBlacklisted = (event) => {
      setModalConfig({
        type: 'blacklisted',
        message: event.detail.message
      });
      setShowStatusModal(true);
    };

    // Listen for custom account status modal event
    const handleShowAccountStatusModal = (event) => {
      console.log('🚨 Company account status modal event received:', event.detail);
      setModalConfig({
        type: event.detail.type,
        message: event.detail.message
      });
      setShowStatusModal(true);
    };

    window.addEventListener('accountDeactivated', handleAccountDeactivated);
    window.addEventListener('accountBlacklisted', handleAccountBlacklisted);
    window.addEventListener('showAccountStatusModal', handleShowAccountStatusModal);

    // Cleanup on unmount
    return () => {
      stopAccountStatusMonitoring();
      window.removeEventListener('accountDeactivated', handleAccountDeactivated);
      window.removeEventListener('accountBlacklisted', handleAccountBlacklisted);
      window.removeEventListener('showAccountStatusModal', handleShowAccountStatusModal);
    };
  }, []);

  const handleModalClose = () => {
    setShowStatusModal(false);
    clearAccountStatus();
  };

  const handleModalLogout = () => {
    setShowStatusModal(false);
    forceLogout('Company account status changed');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* --- Desktop Sidebar --- */}
      {/* It receives the state to control its slide-in/out animation */}
      <CompanySidebar isSidebarOpen={isSidebarOpen} />

      {/* --- Mobile Sidebar --- */}
      {/* Renders on top of everything on mobile, with an overlay */}
      <MobileCompanySidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* --- Main Content Wrapper --- */}
      {/* Updated margin to match new sidebar width: md:ml-80 instead of md:ml-64 */}
      <div 
        className={`flex-grow flex flex-col transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'md:ml-80' : 'md:ml-0'
        }`}
      >
        {/* The header receives the toggle function to trigger it from the menu button */}
        <CompanyHeader onMenuClick={toggleSidebar} />
        
        <main className="flex-grow p-4 sm:p-6 md:p-4 overflow-auto">
          
          {/* --- MODIFICATION START --- */}
          {/* This wrapper div constrains the width of the page content and centers it */}
          <div className="max-w-7xl mx-auto">
            {/* Outlet renders the current route's component inside the constrained container */}
            <Outlet /> 
          </div>
          {/* --- MODIFICATION END --- */}

        </main>
      </div>
      
      {/* Account Status Modal */}
      <AccountStatusModal
        isOpen={showStatusModal}
        onClose={handleModalClose}
        type={modalConfig.type}
        message={modalConfig.message}
        onLogout={handleModalLogout}
      />
    </div>
  );
};

export default CompanyLayout;