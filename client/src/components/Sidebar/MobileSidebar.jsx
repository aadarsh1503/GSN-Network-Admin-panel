// src/components/Sidebar/MobileSidebar.jsx

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiX } from 'react-icons/fi';
import SidebarContent from './SidebarContent'; // We will create this reusable component

const MobileSidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      ></div>

      {/* Mobile Sidebar Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg z-50 transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'transform-none' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center p-5 border-b">
          <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <FiX size={24} />
          </button>
        </div>
        {/* We use a shared component for the menu items */}
        <SidebarContent />
      </div>
    </>
  );
};

export default MobileSidebar;