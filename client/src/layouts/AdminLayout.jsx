import React from 'react';
import { Outlet } from 'react-router-dom';

import { FiMenu, FiMaximize2, FiBell, FiMail, FiChevronDown } from 'react-icons/fi';
import Sidebar from '../components/Sidebar/Sidebar';

// This is the Header component from the original DashboardContent
const AdminHeader = () => (
  <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm mb-6">
    <div className="flex items-center">
      <button className="text-gray-500 text-2xl mr-4"><FiMenu /></button>
    </div>
    <div className="flex items-center space-x-5">
      <button className="text-gray-500 text-xl"><FiMaximize2 /></button>
      <button className="relative text-gray-500 text-xl">
        <FiBell />
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"></span>
      </button>
      <button className="relative text-gray-500 text-xl">
        <FiMail />
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"></span>
      </button>
      <div className="flex items-center">
        <span className="text-gray-700 font-semibold mr-2">admin</span>
        <FiChevronDown className="text-gray-500" />
      </div>
      <div className="relative">
        <img src="https://i.pravatar.cc/40?u=admin" alt="Admin" className="w-10 h-10 rounded-full" />
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
      </div>
    </div>
  </div>
);

const AdminLayout = () => {
  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      <main className="ml-64 w-full p-6">
        <AdminHeader />
        {/* The Outlet component renders the matched child route's component */}
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;