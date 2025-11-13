import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { 
  FiMenu, FiMaximize2, FiMinimize2, FiBell, FiMail, FiChevronDown,
  FiUser, FiHome, FiMessageSquare, FiLogOut 
} from 'react-icons/fi';
import Sidebar from '../components/Sidebar/Sidebar';

// --- AdminHeader Component (Receives isFullscreen and toggleFullscreen) ---
const AdminHeader = ({ toggleSidebar, toggleFullscreen, isFullscreen }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = React.useRef(null);
  const toggleDropdown = () => setIsDropdownOpen(prevState => !prevState);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // --- MODIFICATION: New function to handle link clicks ---
  const handleLinkClick = () => {
    setIsDropdownOpen(false);
  };

  return (
    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm mb-6">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="text-gray-500 text-2xl mr-4 transition-transform duration-300 hover:scale-110">
          <FiMenu />
        </button>
      </div>
      <div className="flex items-center space-x-5">
        <button onClick={toggleFullscreen} className="text-gray-500 text-xl transition-transform duration-300 hover:scale-110">
          {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
        </button>
        <button className="relative text-gray-500 text-xl">
          <FiBell />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"></span>
        </button>
        <button className="relative text-gray-500 text-xl">
          <FiMail />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"></span>
        </button>
        
        <div className="relative" ref={dropdownRef}>
          <button onClick={toggleDropdown} className="flex items-center cursor-pointer">
            <span className="text-gray-700 font-semibold mr-2">admin</span>
            <div className="p-1.5 bg-yellow-400/50 rounded-full text-yellow-700">
                <FiChevronDown className="h-3 w-3" />
            </div>
            <div className="relative ml-3">
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRaWA6TWhO5NO0dODIIJG8rFUAYeaAYTk-JYQ&s" alt="Admin" className="w-10 h-10 rounded-full" />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
          </button>

          <div 
            className={`absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 ease-in-out z-10
              ${isDropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
          >
            <div className="p-6 text-center border-b">
                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRaWA6TWhO5NO0dODIIJG8rFUAYeaAYTk-JYQ&s" alt="Admin" className="w-20 h-20 rounded-full mx-auto mb-3" />
                <h3 className="font-bold text-gray-800">admin</h3>
                <p className="text-sm text-gray-500">admin@gmail.com</p>
            </div>
            {/* --- MODIFICATION: Added onClick handler to the container of the links --- */}
            <div className="p-4 space-y-1" onClick={handleLinkClick}>
                <Link to="/admin/user-Profile" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"><FiUser className="mr-3" /> Profile</Link>
                <Link to="/" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"><FiHome className="mr-3" /> Website</Link>
                <Link to="/messages" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"><FiMessageSquare className="mr-3" /> Message</Link>
            </div>
            <a href='/login' onClick={handleLinkClick}>
              <div className="p-4 border-t">
                  <button className="flex items-center cursor-pointer w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"><FiLogOut className="mr-3" /> Logout</button>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- THIS IS THE MAIN MODIFIED AdminLayout COMPONENT ---
const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar isSidebarOpen={isSidebarOpen} />
      
      <main className={`w-full p-6 transition-all duration-500 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <AdminHeader 
          toggleSidebar={toggleSidebar}
          toggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
        />
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;