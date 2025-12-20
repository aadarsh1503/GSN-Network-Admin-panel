import React, { useState, useEffect } from 'react';
import { FaSort } from 'react-icons/fa';
import { FiClock } from 'react-icons/fi'; 
import axios from 'axios';
import { useNotifications } from '../../contexts/NotificationContext';

const NotificationsCompany = () => {
  const [notifications, setNotifications] = useState([]);
  const [entries, setEntries] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { markAsRead, fetchUnreadCount } = useNotifications();

  // 1. Fetch Data from Backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token'); // Ensure user is logged in
        const response = await axios.get('/api/notifications/my-notifications', {
            headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(response.data);
        
        // Mark notifications as read when user views the page
        await markAsRead('all');
        // Refresh unread count
        await fetchUnreadCount();
      } catch (error) {
        console.error("Error loading notifications", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [markAsRead, fetchUnreadCount]);

  // 2. Format Date helper
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric', 
      hour: 'numeric', minute: 'numeric', hour12: true 
    });
  };

  const SortableHeader = ({ children }) => (
    <div className="flex items-center justify-between">
      <span>{children}</span>
      <FaSort className="text-gray-400" />
    </div>
  );

  // 3. Search Filter
  const filteredData = notifications.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 4. Pagination Slicing
  const displayData = filteredData.slice(0, entries);

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Notification</h2>

      {/* Top Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Show</span>
          <select 
            value={entries} 
            onChange={(e) => setEntries(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          <span>entries</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <label htmlFor="search">Search:</label>
          <input 
            id="search"
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-[#D9CBAA] text-gray-800 text-sm">
            <tr>
              <th className="p-3 text-left font-semibold"><SortableHeader>Sr.No</SortableHeader></th>
              <th className="p-3 text-left font-semibold"><SortableHeader>Image</SortableHeader></th>
              <th className="p-3 text-left font-semibold"><SortableHeader>Title</SortableHeader></th>
              <th className="p-3 text-left font-semibold"><SortableHeader>Date</SortableHeader></th>
              <th className="p-3 text-left font-semibold"><SortableHeader>Message</SortableHeader></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
                <tr><td colSpan="5" className="p-4 text-center">Loading notifications...</td></tr>
            ) : displayData.length === 0 ? (
                <tr><td colSpan="5" className="p-4 text-center">No notifications found.</td></tr>
            ) : (
                displayData.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-700 align-top">{index + 1}</td>
                    <td className="p-3 align-top">
                    {item.image ? (
                        <img 
                            src={item.image} 
                            alt={item.title} 
                            className="h-16 w-24 object-contain border p-1 rounded-md bg-white" 
                        />
                    ) : (
                        <span className="text-gray-400 text-xs">No Image</span>
                    )}
                    </td>
                    <td className="p-3 text-sm text-gray-700 align-top">{item.title}</td>
                    <td className="p-3 text-sm text-gray-700 align-top whitespace-nowrap">
                    <div className="flex items-center gap-2">
                        <FiClock />
                        <span>{formatDate(item.created_at)}</span>
                    </div>
                    </td>
                    <td className="p-3 text-sm text-gray-700 align-top">{item.message}</td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between mt-4 gap-4">
        <div className="text-sm text-gray-600">
          Showing 1 to {Math.min(entries, filteredData.length)} of {filteredData.length} entries
        </div>
        <div className="flex items-center">
          <button className="px-3 py-1 border border-gray-300 rounded-l-md hover:bg-gray-100 disabled:opacity-50" disabled>
            Previous
          </button>
          <button className="px-3 py-1 border-t border-b border-gray-300 text-gray-800 bg-[#D9CBAA]">
            1
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded-r-md hover:bg-gray-100">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationsCompany;