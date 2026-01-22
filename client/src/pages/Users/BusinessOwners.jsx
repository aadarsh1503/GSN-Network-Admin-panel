// src/components/BusinessOwners.jsx

import { useState, useEffect, useMemo } from 'react';
import { FaPen, FaEye, FaTimes } from 'react-icons/fa';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa6';
import { 
  Building, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Upload, 
  Trash2, 
  CheckCircle,
  X
} from 'lucide-react';
import { api } from '../../utils/api';
import { adminToast } from '../../utils/adminToast';
import StatusConfirmationModal from '../../components/Modal/StatusConfirmationModal';

// --- Custom Toggle Switch Component ---
const ToggleSwitch = ({ checked, onChange }) => {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
      <div className={`w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 ${checked ? 'peer-checked:bg-green-600' : ''}`}></div>
    </label>
  );
};

// Helper function to format category names
const formatCategoryName = (category) => {
  if (!category) return 'N/A';
  
  const categoryMap = {
    '3pl': 'Third-Party Logistics Providers (3PLs)',
    'freight_forwarders': 'Freight Forwarders',
    'courier_parcel': 'Courier and Parcel Delivery Services',
    'warehousing_distribution': 'Warehousing and Distribution',
    'transportation_service': 'Transportation Service',
    'supply_chain_management': 'Supply Chain Management',
    'inventory_management': 'Inventory Management',
    'cold_chain_logistics': 'Cold Chain Logistics',
    'ecommerce_logistics': 'E-commerce Logistics',
    'cross_border_logistics': 'Cross-border Logistics',
    'specialized_logistics': 'Specialized Logistics',
    'technology_software_providers': 'Technology and Software Providers',
    'packaging_labeling_services': 'Packaging and Labeling Services',
    'last_mile_delivery': 'Last Mile Delivery',
    'air_cargo_freight': 'Air Cargo and Freight Services',
    'rail_intermodal_logistics': 'Rail and Intermodal Logistics',
    'freight_brokerage': 'Freight Brokerage',
    'drone_autonomous_logistics': 'Drone and Autonomous Vehicle Logistics',
    'custom_brokerage': 'Custom Brokerage'
  };
  
  return categoryMap[category] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};


function BusinessOwners() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true); // Add loading state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });
  const [filters, setFilters] = useState({ status: '', blacklist: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [viewingUser, setViewingUser] = useState(null);
  const [showAllCategories, setShowAllCategories] = useState(false); // New state for category expansion
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: '',
    userId: null,
    currentValue: null,
    userName: ''
  });

  // Business categories for the edit form
  const businessCategories = [
    'Aerospace and Defense',
    'Agriculture and Farming',
    'Automotive Industry',
    'Biotechnology',
    'Chemical Industry',
    'Clothing and Apparel',
    'Construction and Building Materials',
    'Distributors',
    'Education Sector',
    'Energy and Utilities',
    'Financial Services and Banking',
    'Food and Beverage Industry',
    'Government and Public Sector',
    'Healthcare and Pharmaceuticals',
    'Hospitality and Tourism',
    'Insurance Industry',
    'Manufacturers',
    'Media and Entertainment',
    'Mining and Metals',
    'Non-Profit Organizations',
    'Professional Services (Legal, Consulting)',
    'Real Estate',
    'Retailer',
    'Technology Companies',
    'Telecommunications'
  ];

  // --- Fetch Data from Backend ---
  useEffect(() => {
    const fetchBusinessUsers = async () => {
      try {
        console.log('Fetching business users...'); // Debug log
        const response = await api.get('/api/user/business-owners');
        console.log('Business users response:', response); // Debug log
        setUsers(response);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching business users:", error);
        console.error("Error details:", error.response || error); // More detailed error logging
        adminToast.error(error.message || "Failed to fetch business users");
        setLoading(false);
      }
    };

    fetchBusinessUsers();
  }, []);


  // --- Handlers for User Actions (Connected to API) ---
  
  // 1. Handle Active/Inactive Status with Confirmation
  const handleStatusChange = (userId, currentStatus, userName) => {
    setConfirmModal({
      isOpen: true,
      type: currentStatus ? 'deactivate' : 'activate',
      userId,
      currentValue: currentStatus,
      userName
    });
  };

  const confirmStatusChange = async () => {
    const { userId, currentValue } = confirmModal;
    
    try {
        await api.put(`/api/user/business-status/${userId}`, { 
          type: 'status', 
          value: !currentValue 
        });
        
        // Show toast BEFORE state update to prevent dismissal
        adminToast.success(`User ${!currentValue ? 'activated' : 'deactivated'} successfully`);
        
        // Then update UI
        const updatedUsers = users.map(user =>
          user.id === userId ? { ...user, status: !currentValue } : user
        );
        setUsers(updatedUsers);
        
    } catch (error) {
        console.error("Error updating status:", error);
        adminToast.error("Failed to update status");
    } finally {
      setConfirmModal({ isOpen: false, type: '', userId: null, currentValue: null, userName: '' });
    }
  };

  // 2. Handle Blacklist Status with Confirmation
  const handleBlacklistToggle = (userId, currentBlacklistStatus, userName) => {
    setConfirmModal({
      isOpen: true,
      type: currentBlacklistStatus ? 'unblacklist' : 'blacklist',
      userId,
      currentValue: currentBlacklistStatus,
      userName
    });
  };

  const confirmBlacklistToggle = async () => {
    const { userId, currentValue } = confirmModal;
    
    try {
        await api.put(`/api/user/business-status/${userId}`, { 
          type: 'blacklist', 
          value: !currentValue 
        });
        
        // Show toast BEFORE state update to prevent dismissal
        adminToast.success(`User ${!currentValue ? 'added to' : 'removed from'} blacklist`);
        
        // Then update UI
        const updatedUsers = users.map(user =>
          user.id === userId ? { ...user, onBlacklist: !currentValue } : user
        );
        setUsers(updatedUsers);
        
    } catch (error) {
        console.error("Error updating blacklist:", error);
        adminToast.error("Failed to update blacklist");
    } finally {
      setConfirmModal({ isOpen: false, type: '', userId: null, currentValue: null, userName: '' });
    }
  };

  // 3. Handle Edit User
  const handleEditUser = async (user) => {
    console.log('Editing user:', user); // Debug log
    setLoading(true);
    
    // Show loading toast
    const loadingToastId = adminToast.info('Loading user details for editing...', { autoClose: false });
    
    try {
      // Fetch full user details for editing
      const userDetails = await api.get(`/api/user/profile/${user.id}`);
      console.log('User details fetched:', userDetails); // Debug log
      console.log('About company from API:', userDetails.about_company); // Debug specific field
      console.log('Logo from API:', userDetails.logo); // Debug specific field
      
      // Dismiss loading toast
      adminToast.dismiss(loadingToastId);
      
      setEditingUser(user.id);
      setEditForm({
        name: userDetails.name || '',
        email: userDetails.email || '',
        mobile: userDetails.phone || userDetails.mobile || '', // Map phone to mobile
        category: Array.isArray(userDetails.category) ? userDetails.category : 
                 (userDetails.category ? userDetails.category.split(',').map(c => c.trim()).filter(c => c) : []),
        country: userDetails.country || '',
        state: userDetails.state || '',
        city: userDetails.city || '',
        website: userDetails.website || '',
        about_company: userDetails.about_company || '', // This should now work
        logo: userDetails.logo || '' // This should now work
      });
      
      // Success toast with data confirmation
      adminToast.success(`✅ User details loaded! Found ${userDetails.about_company ? 'about company' : 'no about'} and ${userDetails.logo ? 'logo' : 'no logo'}`, {
        autoClose: 3000
      });
      
    } catch (error) {
      console.error("Error fetching user details for edit:", error);
      // Dismiss loading toast
      adminToast.dismiss(loadingToastId);
      
      // Show specific error
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      adminToast.error(`❌ Failed to load user details: ${errorMessage}`, {
        autoClose: 5000
      });
      
      // Fallback to basic user data if detailed fetch fails
      setEditingUser(user.id);
      setEditForm({
        name: user.name || '',
        email: user.email || '',
        mobile: user.phone || user.mobile || '', // Map phone to mobile
        category: Array.isArray(user.category) ? user.category : 
                 (user.category ? user.category.split(',').map(c => c.trim()).filter(c => c) : []),
        country: user.country || '',
        state: user.state || '',
        city: user.city || '',
        website: user.website || '',
        about_company: user.about_company || '',
        logo: user.logo || ''
      });
      
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Save Edit
  const handleSaveEdit = async () => {
    console.log('Saving edit form:', editForm); // Debug log
    
    // Show saving toast
    const savingToastId = adminToast.info('Saving changes...', { autoClose: false });
    
    try {
      // Use the admin update API with correct field mapping
      const updateData = {
        name: editForm.name,
        email: editForm.email,
        mobile: editForm.mobile, // Backend expects 'mobile' but stores as 'phone'
        category: Array.isArray(editForm.category) ? editForm.category.join(',') : editForm.category,
        country: editForm.country,
        state: editForm.state,
        city: editForm.city,
        website: editForm.website || '',
        logo: editForm.logo || '',
        about_company: editForm.about_company || ''
      };
      
      console.log('Sending update data:', updateData); // Debug log
      
      const response = await api.put(`/api/user/update-profile/${editingUser}`, updateData);
      console.log('Update response:', response); // Debug log
      
      // Dismiss saving toast
      adminToast.dismiss(savingToastId);
      
      // Update local state with the response data or form data
      setUsers(users.map(user => 
        user.id === editingUser 
          ? { 
              ...user, 
              name: editForm.name,
              email: editForm.email,
              mobile: editForm.mobile,
              category: Array.isArray(editForm.category) ? editForm.category.join(',') : editForm.category,
              country: editForm.country,
              state: editForm.state,
              city: editForm.city,
              website: editForm.website,
              logo: editForm.logo,
              about_company: editForm.about_company
            }
          : user
      ));
      
      setEditingUser(null);
      setEditForm({});
      adminToast.success('Business profile updated successfully! 🎉');
    } catch (error) {
      // Dismiss saving toast
      adminToast.dismiss(savingToastId);
      
      console.error("Error updating business:", error);
      console.error("Error details:", error.response || error); // More detailed error logging
      
      // Show specific error message
      const errorMessage = error.response?.data?.message || error.message || "Failed to update business profile";
      adminToast.error(`Update failed: ${errorMessage}`);
    }
  };

  // 5. Handle Cancel Edit
  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({});
  };

  // 6. Handle Category Toggle for Edit Form
  const handleCategoryToggle = (category) => {
    setEditForm(prev => ({
      ...prev,
      category: prev.category && prev.category.includes(category)
        ? prev.category.filter(c => c !== category)
        : [...(prev.category || []), category]
    }));
  };

  // 7. Handle Logo Upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      adminToast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      adminToast.error('Image size should be less than 5MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/api/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const logoUrl = response.url;
      
      // Update edit form with new logo URL
      setEditForm(prev => ({
        ...prev,
        logo: logoUrl
      }));

      adminToast.success('Logo uploaded successfully');
      
    } catch (error) {
      console.error('Error uploading logo:', error);
      adminToast.error(error.response?.data?.message || 'Failed to upload logo');
    }
  };

  // 8. Handle View User Details
  const handleViewUser = async (user) => {
    try {
      // Reset category expansion state when opening modal
      setShowAllCategories(false);
      
      // For business users, we'll use the user profile API with proper error handling
      let userDetails;
      try {
        // Try the admin user profile API first
        userDetails = await api.get(`/api/user/profile/${user.id}`);
      } catch (error) {
        // If that fails, try to get basic user info from the current data
        console.warn("Admin API failed, using current user data:", error);
        userDetails = {
          ...user,
          phone: user.mobile,
          created_at: new Date().toISOString() // Fallback
        };
      }
      setViewingUser(userDetails);
    } catch (error) {
      console.error("Error fetching user details:", error);
      adminToast.error("Failed to fetch user details");
    }
  };
  
  // --- Filtering and Sorting Logic ---
  const filteredAndSortedUsers = useMemo(() => {
    let sortableUsers = [...users];

    // Apply Filters
    sortableUsers = sortableUsers.filter(user => {
      const statusMatch = filters.status ? String(user.status) === filters.status : true;
      const blacklistMatch = filters.blacklist ? String(user.onBlacklist) === filters.blacklist : true;
      return statusMatch && blacklistMatch;
    });

    // Apply Search
    if (searchTerm) {
        sortableUsers = sortableUsers.filter(user =>
        Object.values(user).some(val =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply Sorting
    if (sortConfig.key) {
      sortableUsers.sort((a, b) => {
        if (typeof a[sortConfig.key] === 'boolean') {
             if (a[sortConfig.key] === b[sortConfig.key]) return 0;
             const comparison = a[sortConfig.key] ? -1 : 1;
             return sortConfig.direction === 'ascending' ? comparison : -comparison;
        }
        
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return sortableUsers;
  }, [users, searchTerm, sortConfig, filters]);

  // --- Pagination Logic ---
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredAndSortedUsers.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredAndSortedUsers.length / entriesPerPage);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const SortableHeader = ({ children, name }) => {
    const isSorted = sortConfig.key === name;
    return (
        <th className="p-3 text-left cursor-pointer" onClick={() => requestSort(name)}>
            <div className="flex items-center justify-between">
                {children}
                <span>
                    {isSorted ? 
                        (sortConfig.direction === 'ascending' ? <FaArrowUp className="text-gray-600" /> : <FaArrowDown className="text-gray-600" />) 
                        : null
                    }
                </span>
            </div>
        </th>
    );
  };

  if (loading) return <div className="p-10 text-center">Loading Business Owners...</div>;

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-2">
      <div className="max-w-7xl mx-auto">
        {/* --- Top Filter Section --- */}
        <div className="bg-white p-4 rounded-t-lg ">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <select 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                </select>
                <select 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={filters.blacklist}
                    onChange={(e) => setFilters({...filters, blacklist: e.target.value})}
                >
                    <option value="">All Blacklist</option>
                    <option value="true">On Blacklist</option>
                    <option value="false">Not on Blacklist</option>
                </select>
                <button 
                  type="button" 
                  onClick={() => { setFilters({ status: '', blacklist: '' }); setSearchTerm(''); }}
                  className="w-full flex items-center justify-center bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md"
                >
                    Reset Filters
                </button>
            </div>
        </div>

        {/* --- Main Content and Table Section --- */}
        <div className="bg-white p-6 rounded-b-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Business Owners</h2>
          
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
            <div className="flex items-center mb-2 sm:mb-0">
              <span className="mr-2">Show</span>
              <select 
                value={entriesPerPage}
                onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1); 
                }}
                className="p-2 border border-gray-300 rounded-md"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="ml-2">entries</span>
            </div>
            <div className="flex items-center">
              <label htmlFor="search" className="mr-2">Search:</label>
              <input
                id="search"
                type="text"
                placeholder="Search..."
                className="p-2 border border-gray-300 rounded-md"
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); 
                }}
              />
            </div>
          </div>
          
          {/* --- Users Table --- */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase" style={{ backgroundColor: '#eaddc0' }}>
                <tr>
                  <SortableHeader name="id">Sr.No</SortableHeader>
                  <SortableHeader name="name">Name</SortableHeader>
                  <SortableHeader name="email">Email</SortableHeader>
                  <SortableHeader name="mobile">Mobile</SortableHeader>
                  <SortableHeader name="onBlacklist">On Blacklist</SortableHeader>
                  <SortableHeader name="status">Status</SortableHeader>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentEntries.length > 0 ? (
                  currentEntries.map((user, index) => (
                    <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="p-3">{indexOfFirstEntry + index + 1}</td>
                      <td className="p-3 font-medium text-gray-900">{user.name}</td>
                      <td className="p-3">{user.email}</td>
                      <td className="p-3">{user.mobile}</td>
                      <td className="p-3">
                        <ToggleSwitch 
                            checked={user.onBlacklist} 
                            onChange={() => handleBlacklistToggle(user.id, user.onBlacklist, user.name)} 
                        />
                      </td>
                      <td className="p-3">
                        <ToggleSwitch 
                            checked={user.status} 
                            onChange={() => handleStatusChange(user.id, user.status, user.name)} 
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEditUser(user)}
                            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                            title="Edit User"
                            disabled={loading}
                          >
                            <FaPen />
                          </button>
                          <button 
                            onClick={() => handleViewUser(user)}
                            className="p-2 bg-pink-500 text-white rounded hover:bg-pink-600"
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center p-4">No matching records found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* --- Table Footer with Info and Pagination --- */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4">
            <div className="text-gray-600 mb-2 sm:mb-0">
              Showing {filteredAndSortedUsers.length > 0 ? indexOfFirstEntry + 1 : 0} to {Math.min(indexOfLastEntry, filteredAndSortedUsers.length)} of {filteredAndSortedUsers.length} entries
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-l-md bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="px-3 py-1 border-t border-b text-white" style={{backgroundColor: '#eaddc0'}}>
                {currentPage}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1 border rounded-r-md bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced User Details Modal */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-yellow-500 p-6 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  {(viewingUser.logo || viewingUser.profile_image || viewingUser.image) && (
                    <img 
                      src={viewingUser.logo || viewingUser.profile_image || viewingUser.image} 
                      alt="Business Logo" 
                      className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <div>
                    <h3 className="text-2xl font-bold">{viewingUser.name}</h3>
                    <p className="text-blue-100">Business Profile</p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingUser(null)}
                  className="text-white hover:text-blue-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20"
                >
                  <FaTimes size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
              <div className="p-6">
                {/* Business Header Section */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 mb-6 border border-gray-200 shadow-sm">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Business Info */}
                    <div className="lg:col-span-2">
                      <div className="flex items-start space-x-4">
                        {/* Country Flag */}
                        {viewingUser.country && (
                          <div className="flex-shrink-0">
                            <div className="w-12 h-8 bg-gray-200 rounded border border-gray-300 flex items-center justify-center text-xs font-bold text-gray-600">
                              {viewingUser.country.substring(0, 2).toUpperCase()}
                            </div>
                          </div>
                        )}
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold text-gray-800 mb-2">{viewingUser.name}</h2>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            {viewingUser.website && (
                              <a href={viewingUser.website} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-blue-600 transition-colors">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                                </svg>
                                Website
                              </a>
                            )}
                            {(viewingUser.country || viewingUser.state || viewingUser.city) && (
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {[viewingUser.city, viewingUser.state, viewingUser.country].filter(Boolean).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex flex-col items-start lg:items-end space-y-3">
                      <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                        viewingUser.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {viewingUser.status ? 'Active Account' : 'Inactive Account'}
                      </div>
                      {viewingUser.is_blacklisted && (
                        <div className="px-4 py-2 rounded-full text-sm font-bold bg-red-100 text-red-800">
                          Blacklisted
                        </div>
                      )}
                      {viewingUser.created_at && (
                        <div className="text-sm text-gray-500">
                          Joined: {new Date(viewingUser.created_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Main Information */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Business Information Card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                      <div className="p-6 border-b border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          Business Information
                        </h4>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                            <p className="p-3 bg-gray-50 rounded-lg border text-gray-800">{viewingUser.name}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <p className="p-3 bg-gray-50 rounded-lg border text-gray-800">{viewingUser.email}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <p className="p-3 bg-gray-50 rounded-lg border text-gray-800">{viewingUser.phone || viewingUser.mobile || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <p className="p-3 bg-gray-50 rounded-lg border text-gray-800 capitalize">{viewingUser.role}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                            <p className="p-3 bg-gray-50 rounded-lg border text-gray-800">{viewingUser.country || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                            <p className="p-3 bg-gray-50 rounded-lg border text-gray-800">{viewingUser.state || 'N/A'}</p>
                          </div>
                        </div>
                        {viewingUser.about_company && (
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">About Business</label>
                            <p className="p-3 bg-gray-50 rounded-lg border text-gray-800">{viewingUser.about_company}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact Information Card */}
                    {(viewingUser.owner_name || viewingUser.owner_phone || viewingUser.incharge_name || viewingUser.incharge_phone) && (
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="p-6 border-b border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                            <span className="w-5 h-5 mr-2 text-green-600">👤</span>
                            Contact Information
                          </h4>
                        </div>
                        <div className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {viewingUser.owner_name && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                                <p className="p-3 bg-gray-50 rounded-lg border text-gray-800">{viewingUser.owner_name}</p>
                              </div>
                            )}
                            {viewingUser.owner_phone && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Phone</label>
                                <p className="p-3 bg-gray-50 rounded-lg border text-gray-800">{viewingUser.owner_phone}</p>
                              </div>
                            )}
                            {viewingUser.incharge_name && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Incharge Name</label>
                                <p className="p-3 bg-gray-50 rounded-lg border text-gray-800">{viewingUser.incharge_name}</p>
                              </div>
                            )}
                            {viewingUser.incharge_phone && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Incharge Phone</label>
                                <p className="p-3 bg-gray-50 rounded-lg border text-gray-800">{viewingUser.incharge_phone}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Additional Information Card */}
                    {(viewingUser.website || viewingUser.city || viewingUser.skype || viewingUser.company_address || viewingUser.services) && (
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="p-6 border-b border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                            </svg>
                            Additional Information
                          </h4>
                        </div>
                        <div className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {viewingUser.website && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                                <a 
                                  href={viewingUser.website.startsWith('http') ? viewingUser.website : `https://${viewingUser.website}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-3 bg-gray-50 rounded-lg border text-blue-600 hover:text-blue-800 block"
                                >
                                  {viewingUser.website}
                                </a>
                              </div>
                            )}
                            {viewingUser.city && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                <p className="p-3 bg-gray-50 rounded-lg border text-gray-800">{viewingUser.city}</p>
                              </div>
                            )}
                            {viewingUser.skype && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Skype ID</label>
                                <p className="p-3 bg-gray-50 rounded-lg border text-gray-800">{viewingUser.skype}</p>
                              </div>
                            )}
                            {viewingUser.company_address && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Address</label>
                                <p className="p-3 bg-gray-50 rounded-lg border text-gray-800">{viewingUser.company_address}</p>
                              </div>
                            )}
                          </div>
                          {viewingUser.services && (
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Services Offered</label>
                              <p className="p-3 bg-gray-50 rounded-lg border text-gray-800">{viewingUser.services}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Social Media & Online Presence Card */}
                    {(viewingUser.facebook || viewingUser.twitter || viewingUser.instagram || viewingUser.linkedin) && (
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="p-6 border-b border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                            <span className="w-5 h-5 mr-2 text-purple-600">🌐</span>
                            Social Media & Online Presence
                          </h4>
                        </div>
                        <div className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {viewingUser.facebook && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                                <a 
                                  href={viewingUser.facebook.startsWith('http') ? viewingUser.facebook : `https://${viewingUser.facebook}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-3 bg-gray-50 rounded-lg border text-blue-600 hover:text-blue-800 block"
                                >
                                  {viewingUser.facebook}
                                </a>
                              </div>
                            )}
                            {viewingUser.twitter && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
                                <a 
                                  href={viewingUser.twitter.startsWith('http') ? viewingUser.twitter : `https://${viewingUser.twitter}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-3 bg-gray-50 rounded-lg border text-blue-600 hover:text-blue-800 block"
                                >
                                  {viewingUser.twitter}
                                </a>
                              </div>
                            )}
                            {viewingUser.instagram && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                                <a 
                                  href={viewingUser.instagram.startsWith('http') ? viewingUser.instagram : `https://${viewingUser.instagram}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-3 bg-gray-50 rounded-lg border text-blue-600 hover:text-blue-800 block"
                                >
                                  {viewingUser.instagram}
                                </a>
                              </div>
                            )}
                            {viewingUser.linkedin && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                                <a 
                                  href={viewingUser.linkedin.startsWith('http') ? viewingUser.linkedin : `https://${viewingUser.linkedin}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-3 bg-gray-50 rounded-lg border text-blue-600 hover:text-blue-800 block"
                                >
                                  {viewingUser.linkedin}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Business Categories Card */}
                    {viewingUser.category && (
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="p-6 border-b border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            Business Categories
                          </h4>
                        </div>
                        <div className="p-6">
                          <div className="bg-gray-50 rounded-lg p-4">
                            {(() => {
                              // Handle comma-separated categories
                              const categories = viewingUser.category.split(',').map(cat => cat.trim()).filter(Boolean);
                              
                              if (categories.length <= 6) {
                                // Show all categories if 6 or fewer
                                return (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {categories.map((category, index) => (
                                      <div key={index} className="flex items-center p-2 bg-white rounded border">
                                        <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="text-sm text-gray-800">{formatCategoryName(category)}</span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              } else {
                                // Show limited categories with expand/collapse for many categories
                                const categoriesToShow = showAllCategories ? categories : categories.slice(0, 6);
                                return (
                                  <div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                                      {categoriesToShow.map((category, index) => (
                                        <div key={index} className="flex items-center p-2 bg-white rounded border">
                                          <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                          <span className="text-sm text-gray-800">{formatCategoryName(category)}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="text-center">
                                      <button
                                        onClick={() => setShowAllCategories(!showAllCategories)}
                                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-purple-600 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                                      >
                                        {showAllCategories ? (
                                          <>
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                            </svg>
                                            Show Less
                                          </>
                                        ) : (
                                          <>
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                            Show All {categories.length} Categories
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Contact & Additional Info */}
                  <div className="space-y-6">
                    
                    {/* Contact Person Card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm sticky top-4">
                      <div className="p-6 text-center">
                        <div className="mb-4">
                          {(viewingUser.owner_image || viewingUser.profile_image || viewingUser.logo || viewingUser.image) ? (
                            <img 
                              src={viewingUser.owner_image || viewingUser.profile_image || viewingUser.logo || viewingUser.image} 
                              alt="Business Owner" 
                              className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-gray-100 shadow-sm"
                              onError={(e) => {
                                e.target.src = 'https://i.imgur.com/sCEw22l.png';
                              }}
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-4 border-gray-100 text-white text-2xl font-bold shadow-sm">
                              {(viewingUser.owner_name || viewingUser.name || 'B').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">
                          {viewingUser.owner_name || viewingUser.name}
                        </h3>
                        <p className="text-gray-500 mb-3">Business Owner</p>
                        <div className="text-gray-600 mb-4">
                          <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {viewingUser.owner_phone || viewingUser.phone || viewingUser.mobile || 'Phone not available'}
                        </div>
                      </div>
                    </div>

                    {/* Online Presence */}
                    {(viewingUser.website || viewingUser.skype) && (
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="p-6 border-b border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                            </svg>
                            Online Presence
                          </h4>
                        </div>
                        <div className="p-6 space-y-3">
                          {viewingUser.website && (
                            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                              <svg className="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                              </svg>
                              <a href={viewingUser.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                                {viewingUser.website}
                              </a>
                            </div>
                          )}
                          {viewingUser.skype && (
                            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                              <svg className="w-5 h-5 mr-3 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12.069 18.874c-4.023 0-5.82-1.979-5.82-3.464 0-.765.561-1.296 1.333-1.296 1.723 0 1.273 2.477 4.487 2.477 1.641 0 2.55-.895 2.55-1.811 0-.551-.269-1.16-1.354-1.429l-3.576-.895c-2.88-.724-3.403-2.286-3.403-3.751 0-3.047 2.861-4.191 5.549-4.191 2.471 0 5.393 1.373 5.393 3.199 0 .784-.688 1.24-1.453 1.24-1.469 0-1.198-2.037-4.164-2.037-1.469 0-2.292.664-2.292 1.617 0 .587.269 1.027 1.181 1.24l3.19.742c3.007.742 3.673 2.435 3.673 3.965 0 2.613-2.04 4.191-5.82 4.191l.526.002z"/>
                              </svg>
                              <span className="text-gray-700 text-sm">{viewingUser.skype}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Location Information */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                      <div className="p-6 border-b border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Location Details
                        </h4>
                      </div>
                      <div className="p-6 space-y-3">
                        {viewingUser.country && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                            <p className="p-2 bg-gray-50 rounded text-gray-800">{viewingUser.country}</p>
                          </div>
                        )}
                        {viewingUser.state && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                            <p className="p-2 bg-gray-50 rounded text-gray-800">{viewingUser.state}</p>
                          </div>
                        )}
                        {viewingUser.city && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <p className="p-2 bg-gray-50 rounded text-gray-800">{viewingUser.city}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button 
                onClick={() => setViewingUser(null)}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  setViewingUser(null);
                  handleEditUser(viewingUser);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <FaPen className="mr-2" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-yellow-500 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Business Profile
              </h3>
              <button 
                onClick={handleCancelEdit}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FaTimes size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
              <div className="p-6">
                <div className="space-y-8">
                  
                  {/* Company Logo Section */}
                  <div className="bg-slate-50 rounded-2xl p-6">
                    <h4 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                      <Building className="h-6 w-6 mr-3 text-[#CDA435]" />
                      Company Logo
                    </h4>
                    
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        <div className="w-24 h-24 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                          {editForm.logo ? (
                            <img 
                              src={editForm.logo} 
                              alt="Company Logo" 
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <Building className="h-8 w-8 text-slate-400" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <h5 className="text-lg font-semibold text-slate-800 mb-2">Upload Company Logo</h5>
                        <p className="text-slate-600 text-sm mb-4">
                          Upload your company logo to build trust with logistics providers. Recommended size: 200x200px, Max size: 5MB
                        </p>
                        
                        <div className="flex space-x-3">
                          <label className="flex items-center space-x-2 bg-gradient-to-r from-[#CDA435] to-[#B8941F] hover:from-[#B8941F] hover:to-[#CDA435] text-white px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer">
                            <Upload className="h-4 w-4" />
                            <span>Upload Logo</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                          </label>
                          
                          {editForm.logo && (
                            <button
                              onClick={() => setEditForm(prev => ({ ...prev, logo: '' }))}
                              className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition-all duration-300"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Business Information Section */}
                  <div className="bg-slate-50 rounded-2xl p-6">
                    <h4 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                      <Building className="h-6 w-6 mr-3 text-[#CDA435]" />
                      Business Information
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Business Name *
                        </label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                          <input
                            type="text"
                            value={editForm.name || ''}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-300"
                            placeholder="Enter business name"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Email Address *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                          <input
                            type="email"
                            value={editForm.email || ''}
                            onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-300"
                            placeholder="Enter email address"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                          <input
                            type="tel"
                            value={editForm.mobile || ''}
                            onChange={(e) => setEditForm({...editForm, mobile: e.target.value})}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-300"
                            placeholder="Enter phone number"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                          Business Categories *
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {businessCategories.map(category => (
                            <label
                              key={category}
                              className={`flex items-center space-x-2 p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                                editForm.category && editForm.category.includes(category)
                                  ? 'border-[#CDA435] bg-yellow-50 text-[#CDA435]'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={editForm.category && editForm.category.includes(category)}
                                onChange={() => handleCategoryToggle(category)}
                                className="hidden"
                              />
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                editForm.category && editForm.category.includes(category)
                                  ? 'border-[#CDA435] bg-[#CDA435]'
                                  : 'border-slate-300'
                              }`}>
                                {editForm.category && editForm.category.includes(category) && (
                                  <CheckCircle className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <span className="text-sm font-medium">{category}</span>
                            </label>
                          ))}
                        </div>
                        {editForm.category && editForm.category.length > 0 && (
                          <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-200">
                            <p className="text-sm text-green-700">
                              <CheckCircle className="inline h-4 w-4 mr-1" />
                              {editForm.category.length} categor{editForm.category.length !== 1 ? 'ies' : 'y'} selected: {editForm.category.join(', ')}
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Country
                        </label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                          <input
                            type="text"
                            value={editForm.country || ''}
                            onChange={(e) => setEditForm({...editForm, country: e.target.value})}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-300"
                            placeholder="Enter country"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          State/Province
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                          <input
                            type="text"
                            value={editForm.state || ''}
                            onChange={(e) => setEditForm({...editForm, state: e.target.value})}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-300"
                            placeholder="Enter state/province"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        About Business *
                      </label>
                      <textarea
                        value={editForm.about_company || ''}
                        onChange={(e) => setEditForm({...editForm, about_company: e.target.value})}
                        rows={4}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-300"
                        placeholder="Describe your business and what products/services you need logistics for..."
                      />
                    </div>
                  </div>

                  {/* Additional Information Section */}
                  <div className="bg-slate-50 rounded-2xl p-6">
                    <h4 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                      <Globe className="h-6 w-6 mr-3 text-[#CDA435]" />
                      Additional Information
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Website (Optional)
                        </label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                          <input
                            type="url"
                            value={editForm.website || ''}
                            onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-300"
                            placeholder="https://www.example.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          City
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                          <input
                            type="text"
                            value={editForm.city || ''}
                            onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-300"
                            placeholder="Enter city"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200">
              <button 
                onClick={handleCancelEdit}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Confirmation Modal */}
      <StatusConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: '', userId: null, currentValue: null, userName: '' })}
        onConfirm={confirmModal.type === 'activate' || confirmModal.type === 'deactivate' ? confirmStatusChange : confirmBlacklistToggle}
        title={
          confirmModal.type === 'activate' ? 'Activate User' :
          confirmModal.type === 'deactivate' ? 'Deactivate User' :
          confirmModal.type === 'blacklist' ? 'Add to Blacklist' :
          confirmModal.type === 'unblacklist' ? 'Remove from Blacklist' : 'Confirm Action'
        }
        message={
          confirmModal.type === 'activate' ? 
            `Are you sure you want to activate "${confirmModal.userName}"? This will allow them to access the platform.` :
          confirmModal.type === 'deactivate' ? 
            `Are you sure you want to deactivate "${confirmModal.userName}"? This will prevent them from accessing the platform.` :
          confirmModal.type === 'blacklist' ? 
            `Are you sure you want to add "${confirmModal.userName}" to the blacklist? This will restrict their access and activities.` :
          confirmModal.type === 'unblacklist' ? 
            `Are you sure you want to remove "${confirmModal.userName}" from the blacklist? This will restore their normal access.` :
            'Please confirm this action.'
        }
        confirmText={
          confirmModal.type === 'activate' ? 'Activate' :
          confirmModal.type === 'deactivate' ? 'Deactivate' :
          confirmModal.type === 'blacklist' ? 'Add to Blacklist' :
          confirmModal.type === 'unblacklist' ? 'Remove from Blacklist' : 'Confirm'
        }
        type={confirmModal.type}
      />
    </div>
  );
}

export default BusinessOwners;