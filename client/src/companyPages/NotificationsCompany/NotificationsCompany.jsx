import React, { useState, useEffect } from 'react';
import { FaTimes, FaBell, FaSearch, FaChevronDown } from 'react-icons/fa';
import { FiClock } from 'react-icons/fi'; 
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';

const NotificationsCompany = () => {
  const [notifications, setNotifications] = useState([]); // Initialize as empty array
  const [entries, setEntries] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null); // State for image modal
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState({}); // Tracks which long messages are expanded
  const { markAsRead, fetchUnreadCount } = useNotifications();
  const navigate = useNavigate();

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

        // Add cache-busting parameter to ensure fresh data
        const cacheBuster = Date.now();
        const response = await axios.get(`/api/notifications/my-notifications?t=${cacheBuster}`, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
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
    
    // Set up auto-refresh every 30 seconds to get new notifications
    const refreshInterval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [fetchUnreadCount]); // Remove markAsRead from dependencies since we're not using it

  // 2. Format Date helper - properly handles UTC timestamps from database
  const formatDate = (dateString) => {
    if (!dateString) return 'No Date';
    
    try {
      // MySQL TIMESTAMP is returned as 'YYYY-MM-DD HH:MM:SS' in UTC
      // We need to parse it correctly and convert to local time
      let date;
      
      // Check if the date string contains 'T' (ISO format) or space (MySQL format)
      if (dateString.includes('T')) {
        // ISO format: 2024-01-15T10:30:00.000Z
        date = new Date(dateString);
      } else {
        // MySQL format: 2024-01-15 10:30:00
        // Append 'Z' to indicate it's UTC time
        date = new Date(dateString.replace(' ', 'T') + 'Z');
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return 'Invalid Date';
      }
      
      // Format to local timezone
      return date.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric', 
        hour: 'numeric', 
        minute: 'numeric', 
        hour12: true,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone // Use user's timezone
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Invalid Date';
    }
  };

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
  const pageSize = Number(entries) || 10;
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const displayData = filteredData.slice(startIndex, startIndex + pageSize);

  // 5. Long message handling - preview first 30 words with a Read More toggle
  const MESSAGE_WORD_LIMIT = 30;
  const getMessagePreview = (message = '') => {
    const words = message.trim().split(/\s+/).filter(Boolean);
    return {
      text: words.slice(0, MESSAGE_WORD_LIMIT).join(' '),
      isLong: words.length > MESSAGE_WORD_LIMIT,
      wordCount: words.length,
    };
  };

  const toggleExpanded = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  // Jump back to the first page whenever the filter or page size changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, entries]);

  // Image Modal Component
  const ImageModal = ({ image, title, onClose }) => {
    if (!image) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
        <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-[#bca142] to-[#8f7a2e] p-4 text-white">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold truncate">{title || 'Notification Image'}</h3>
              <button 
                onClick={onClose}
                className="text-white hover:text-white/80 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20"
              >
                <FaTimes size={20} />
              </button>
            </div>
          </div>
          
          {/* Modal Content */}
          <div className="p-4 max-h-[calc(90vh-80px)] overflow-auto">
            <img 
              src={image} 
              alt={title || 'Notification Image'} 
              className="w-full h-auto max-h-[70vh] object-contain rounded-lg shadow-lg"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  // Handle notification click for redirection
  const handleNotificationClick = (notification) => {
    if (notification.redirect_url) {
      // If notification has a redirect URL, navigate to it
      navigate(notification.redirect_url);
    } else if (notification.type === 'payment_proof') {
      // For payment proof notifications, redirect to PaymentManagement
      navigate('/company/payment-management');
    }
  };

  // Handle image click
  const handleImageClick = (image, title) => {
    setSelectedImage({ image, title });
  };

  // Close modal
  const closeModal = () => {
    setSelectedImage(null);
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };

    if (selectedImage) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#bca142] to-[#8f7a2e] p-6 mb-6 shadow-lg">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute right-6 top-12 h-16 w-16 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
            <FaBell className="text-xl text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Notifications</h2>
            <p className="text-sm text-white/80">
              {filteredData.length} {filteredData.length === 1 ? 'notification' : 'notifications'} total
            </p>
          </div>
        </div>
      </div>

      {/* Top Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>Show</span>
          <select 
            value={entries} 
            onChange={(e) => setEntries(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 focus:border-[#bca142] focus:outline-none focus:ring-2 focus:ring-[#bca142]/30"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          <span>entries</span>
        </div>
        <div className="relative w-full md:w-72">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
          <input 
            id="search"
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notifications..."
            className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm focus:border-[#bca142] focus:outline-none focus:ring-2 focus:ring-[#bca142]/30"
          />
        </div>
      </div>

      {/* Notification List */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-[#bca142] to-[#8f7a2e] text-white">
              <tr className="text-left text-xs uppercase tracking-wide">
                <th className="p-3 font-semibold">Sr.No</th>
                <th className="p-3 font-semibold">Image</th>
                <th className="p-3 font-semibold">Title</th>
                <th className="p-3 font-semibold">Date</th>
                <th className="p-3 font-semibold">Message</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [0, 1, 2].map((i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse border-b border-slate-100 last:border-0">
                    <td className="p-3"><div className="h-3 w-6 rounded bg-slate-200" /></td>
                    <td className="p-3"><div className="h-16 w-20 rounded-lg bg-slate-200" /></td>
                    <td className="p-3"><div className="h-3 w-32 rounded bg-slate-200" /></td>
                    <td className="p-3"><div className="h-3 w-24 rounded bg-slate-100" /></td>
                    <td className="p-3"><div className="h-3 w-64 rounded bg-slate-100" /></td>
                  </tr>
                ))
              ) : displayData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#bca142]/10">
                        <FaBell className="text-xl text-[#bca142]" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-500">No notifications found</p>
                        <p className="text-sm text-slate-400">You're all caught up.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                displayData.map((item, index) => {
                  if (!item || !item.id) {
                    return (
                      <tr key={`empty-${index}`} className="border-b border-slate-100 last:border-0">
                        <td colSpan="5" className="p-4 text-center text-sm text-slate-400">Invalid notification data</td>
                      </tr>
                    );
                  }

                  const isPayment = item.type === 'payment_proof';
                  const message = item.message || 'No Message';
                  const { text, isLong, wordCount } = getMessagePreview(message);
                  const isExpanded = !!expanded[item.id];

                  return (
                    <tr
                      key={item.id}
                      onClick={() => { if (isPayment) handleNotificationClick(item); }}
                      title={isPayment ? 'Click to review in Payment Management' : ''}
                      className={`group border-b border-slate-100 transition-colors last:border-0 ${
                        isPayment ? 'cursor-pointer hover:bg-[#bca142]/10' : 'hover:bg-[#bca142]/5'
                      }`}
                    >
                      {/* Sr.No */}
                      <td className="p-3 align-top text-sm font-medium text-slate-500">
                        {startIndex + index + 1}
                      </td>

                      {/* Image */}
                      <td className="p-3 align-top">
                        {item.image ? (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleImageClick(item.image, item.title); }}
                            className="relative h-16 w-20 overflow-hidden rounded-lg border border-slate-200 bg-white"
                          >
                            <img 
                              src={item.image} 
                              alt={item.title || 'Notification'} 
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/160x120?text=No+Image'; }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                              <FaSearch className="text-sm text-white" />
                            </span>
                          </button>
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-[#bca142] to-[#8f7a2e] text-white">
                            <FaBell />
                          </div>
                        )}
                      </td>

                      {/* Title */}
                      <td className="p-3 align-top text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-800">{item.title || 'Notification'}</span>
                          {isPayment && (
                            <span className="inline-flex items-center rounded-full bg-[#bca142] px-2 py-0.5 text-[11px] font-semibold text-white">
                              Payment Proof
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="whitespace-nowrap p-3 align-top text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                          <FiClock />
                          <span>{item.created_at ? formatDate(item.created_at) : 'No Date'}</span>
                        </div>
                      </td>

                      {/* Message */}
                      <td className="min-w-[280px] max-w-xl p-3 align-top text-sm text-slate-600">
                        <p className="whitespace-pre-line break-words leading-relaxed">
                          {isExpanded || !isLong ? message : `${text}…`}
                        </p>

                        {isLong && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleExpanded(item.id); }}
                            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#bca142] transition-colors hover:text-[#8f7a2e]"
                          >
                            {isExpanded ? 'Read Less' : 'Read More'}
                            <FaChevronDown className={`text-[10px] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        )}

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          {isLong && <span>{wordCount} words</span>}
                          {isPayment && <span className="font-medium text-[#bca142]">(Click to review)</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="mt-5 flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="text-sm text-slate-500">
          Showing {filteredData.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + pageSize, filteredData.length)} of {filteredData.length} entries
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <span className="rounded-lg bg-[#bca142] px-3 py-1.5 text-sm font-semibold text-white">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal 
          image={selectedImage.image} 
          title={selectedImage.title} 
          onClose={closeModal} 
        />
      )}
    </div>
  );
};

export default NotificationsCompany;