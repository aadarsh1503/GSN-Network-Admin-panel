import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';

// Import all the necessary sidebar components
import CompanySidebar from '../components/companysidebar/CompanySidebar';
import MobileCompanySidebar from '../components/companysidebar/MobileCompanySidebar'; 
import CompanyHeader from '../components/companysidebar/CompanyHeader';

const CompanyLayout = () => {
  // State to manage the sidebar's open/closed status
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // Function to toggle the sidebar state
  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
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
      {/* This div now dynamically adjusts its left margin based on the sidebar state */}
      <div 
        className={`flex-grow flex flex-col transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'md:ml-64' : 'md:ml-0'
        }`}
      >
        {/* The header receives the toggle function to trigger it from the menu button */}
        <CompanyHeader onMenuClick={toggleSidebar} />
        
        <main className="flex-grow p-4 sm:p-6 md:p-8 overflow-auto">
          
          {/* --- MODIFICATION START --- */}
          {/* This wrapper div constrains the width of the page content and centers it */}
          <div className="max-w-6xl mx-auto">
            {/* Outlet renders the current route's component inside the constrained container */}
            <Outlet /> 
          </div>
          {/* --- MODIFICATION END --- */}

        </main>
      </div>
    </div>
  );
};

export default CompanyLayout;