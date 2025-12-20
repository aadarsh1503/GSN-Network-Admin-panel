import React from 'react';
import CompanySidebarContent from './CompanySidebarContent';

const CompanySidebar = ({ isSidebarOpen }) => {
  return (
    // This is the main container for DESKTOP
    // It's hidden on mobile (md:block)
    // The transform logic makes it slide in and out
    <aside
      className={`hidden md:block w-64 bg-white h-screen  fixed top-0 left-0 border-r border-gray-200 transition-transform duration-300 ease-in-out z-30 ${
        isSidebarOpen ? 'transform-none' : '-translate-x-full'
      }`}
    >
      <CompanySidebarContent />
    </aside>
  );
};

export default CompanySidebar;