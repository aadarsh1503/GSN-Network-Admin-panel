// src/components/Sidebar/Sidebar.jsx

import SidebarContent from './SidebarContent';

const Sidebar = ({ isSidebarOpen }) => {
  return (
    <div
      className={`hidden md:block w-72 bg-gradient-to-b from-slate-50 to-white h-screen fixed top-0 left-0 shadow-xl border-r border-slate-200/50 transition-transform duration-500 ease-in-out z-30 ${
        isSidebarOpen ? 'transform-none' : '-translate-x-full'
      }`}
    >
      {/* Futuristic Header */}
<div className="relative p-6 border-b border-slate-200/50 bg-gradient-to-r from-blue-50 to-indigo-50">
  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5"></div>
  <div className="relative">
    <div className="flex items-center space-x-3 mb-2">
      {/* Logo Container */}
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md overflow-hidden border border-slate-200/50">
        <img 
          src="https://res.cloudinary.com/ds1dt3qub/image/upload/v1769023793/payment_proofs/tiuj0ygbuvrcxon4y3ss.jpg" 
          alt="Logo" 
          className="w-full h-full object-contain p-1.5" 
        />
      </div>
      
      <div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
          Admin Panel
        </h1>
        <p className="text-xs text-slate-500 font-medium">Management Dashboard</p>
      </div>
    </div>
    
    {/* Status Indicator */}
    <div className="flex items-center space-x-2 mt-3">
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-xs text-slate-600 font-medium">System Online</span>
      </div>
    </div>
  </div>
</div>
      
      <SidebarContent />
    </div>
  );
};

export default Sidebar;