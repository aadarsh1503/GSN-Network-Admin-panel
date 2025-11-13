// src/components/Sidebar/Sidebar.jsx

import React from 'react';
import SidebarContent from './SidebarContent'; // Assuming you created this file

const Sidebar = ({ isSidebarOpen }) => {
  return (

    <div
      className={`hidden md:block w-64 bg-white h-screen fixed top-0 left-0 shadow-sm transition-transform duration-500 ease-in-out z-30 ${
        isSidebarOpen ? 'transform-none' : '-translate-x-full'
      }`}
    >
      <div className="p-5 border-b">
        <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
      </div>
      <SidebarContent />
    </div>
  );
};

export default Sidebar;