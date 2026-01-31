// src/components/Sidebar/Sidebar.jsx

import SidebarContent from './SidebarContent';

const Sidebar = ({ isSidebarOpen }) => {
  return (
    <div
      className={`hidden md:block w-72 bg-white h-screen fixed top-0 left-0 shadow-xl border-r border-gray-200 transition-transform duration-500 ease-in-out z-30 ${
        isSidebarOpen ? 'transform-none' : '-translate-x-full'
      }`}
    >
      {/* Header */}
<div className="relative p-6 border-b border-gray-200 bg-[#bca142]">
  <div className="relative">
    <div className="flex items-center space-x-3 mb-2">
      {/* Logo Container */}
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md overflow-hidden border border-gray-200">
        <img 
          src="https://res.cloudinary.com/ds1dt3qub/image/upload/v1769604932/gulf_star_network_4_znl5cm.png" 
          alt="Logo" 
          className="w-full h-full object-contain p-1.5" 
        />
      </div>
      
      <div>
        <h1 className="text-xl font-bold text-white">
          Admin Panel
        </h1>
        <p className="text-xs text-gray-100 font-medium">Management Dashboard</p>
      </div>
    </div>
    
    {/* Status Indicator */}
    <div className="flex items-center space-x-2 mt-3">
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-xs text-white font-medium">System Online</span>
      </div>
    </div>
  </div>
</div>
      
      <SidebarContent />
    </div>
  );
};

export default Sidebar;