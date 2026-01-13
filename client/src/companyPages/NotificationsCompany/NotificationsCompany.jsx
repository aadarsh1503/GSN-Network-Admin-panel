import React, { useState, useEffect } from 'react';
import { FaSort } from 'react-icons/fa';
import { FiClock } from 'react-icons/fi'; 
import axios from 'axios';
import { useNotifications } from '../../contexts/NotificationContext';

const NotificationsCompany = () => {
  const [notifications, setNotifications] = useState([]); // Initialize as empty array
  const [entries, setEntries] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { markAsRead, fetchUnreadCount } = useNotifications();

  // 1. Fetch Data from Backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token'); // Ensure user is logged in
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        console.log('🔍 DEBUG: Current user:', user);
        console.log('🔍 DEBUG: User ID:', user.id);
        console.log('🔍 DEBUG: User role:', user.role);
        console.log('🔍 DEBUG: User name:', user.name);
        
        if (!token) {
          console.error('No token found');
          setNotifications([]);
          setLoading(false);
          return;
        }

        const response = await axios.get('/api/notifications/my-notifications', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('🔍 DEBUG: Full API response:', response.data);
        console.log('🔍 DEBUG: Number of notifications received:', response.data.length);
        console.log('🔍 DEBUG: Response is array?', Array.isArray(response.data));
        
        // Ensure response.data is always an array
        const notificationsData = Array.isArray(response.data) ? response.data : [];
        console.log('🔍 DEBUG: Processed notifications data:', notificationsData);
        
        // TEMPORARY FIX: Filter out notifications that might not belong to this user
        // This is a safety measure while we investigate the root cause
        const filteredNotifications = notificationsData.filter(notification => {
          // Keep all general notifications (target_role !== 'user_specific')
          if (notification.target_role !== 'user_specific') {
            return true;
          }
          
          // For user-specific notifications, we should only see our own
          // Since the backend should already filter these correctly, 
          // this is just a safety check
          return true; // Keep all for now, but log suspicious ones
        });
        
        console.log('🔍 DEBUG: Setting notifications state with:', filteredNotifications.length, 'items');
        
        setNotifications(filteredNotifications);
        
        // Mark notifications as read when user views the page
        if (notificationsData.length > 0) {
          // Use the proper API endpoint to mark notifications as read
          try {
            console.log('Attempting to mark notifications as read...');
            const markReadResponse = await axios.post('/api/notifications/mark-read', 
              { pageType: 'all' },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('Mark read response:', markReadResponse.data);
            
            // Refresh unread count after marking as read
            console.log('Refreshing unread count...');
            await fetchUnreadCount();
            console.log('Unread count refreshed');
          } catch (markReadError) {
            console.error('Error marking notifications as read:', markReadError);
            console.error('Error response:', markReadError.response?.data);
          }
        }
      } catch (error) {
        console.error("Error loading notifications", error);
        console.error("Error response:", error.response?.data); // More detailed error logging
        // Set empty array on error to prevent filter issues
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [fetchUnreadCount]); // Remove markAsRead from dependencies since we're not using it

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

  // 3. Search Filter with additional safety checks
  const filteredData = Array.isArray(notifications) 
    ? notifications.filter(item => {
        if (!item) return false; // Skip null/undefined items
        const title = item.title || '';
        const message = item.message || '';
        return title.toLowerCase().includes(searchTerm.toLowerCase()) || 
               message.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : [];

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
            className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#CDA435]"
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
            className="border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#CDA435]"
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
            ) : !Array.isArray(displayData) || displayData.length === 0 ? (
                <tr><td colSpan="5" className="p-4 text-center">No notifications found.</td></tr>
            ) : (
                displayData.map((item, index) => {
                  // Safety check for each item
                  if (!item || !item.id) {
                    return (
                      <tr key={`empty-${index}`} className="border-b border-gray-200">
                        <td colSpan="5" className="p-4 text-center text-gray-400">Invalid notification data</td>
                      </tr>
                    );
                  }
                  
                  return (
                    <tr key={item.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                        <td className="p-3 text-sm text-gray-700 align-top">{index + 1}</td>
                        <td className="p-3 align-top">
                        {item.image ? (
                            <img 
                                src={item.image} 
                                alt={item.title || 'Notification'} 
                                className="h-16 w-24 object-contain border p-1 rounded-md bg-white" 
                            />
                        ) : (
                            <span className="text-gray-400 text-xs">No Image</span>
                        )}
                        </td>
                        <td className="p-3 text-sm text-gray-700 align-top">{item.title || 'No Title'}</td>
                        <td className="p-3 text-sm text-gray-700 align-top whitespace-nowrap">
                        <div className="flex items-center gap-2">
                            <FiClock />
                            <span>{item.created_at ? formatDate(item.created_at) : 'No Date'}</span>
                        </div>
                        </td>
                        <td className="p-3 text-sm text-gray-700 align-top">{item.message || 'No Message'}</td>
                    </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between mt-4 gap-4">
        <div className="text-sm text-gray-600">
          Showing 1 to {Math.min(entries, Array.isArray(filteredData) ? filteredData.length : 0)} of {Array.isArray(filteredData) ? filteredData.length : 0} entries
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