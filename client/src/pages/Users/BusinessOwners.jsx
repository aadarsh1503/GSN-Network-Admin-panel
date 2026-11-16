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
import BlacklistReasonModal from '../../components/Modal/BlacklistReasonModal';
import ConfirmationModal from '../../components/Modal/ConfirmationModal';
import UserDetailModal from '../../components/Modal/UserDetailModal';

// --- Custom Toggle Switch Component ---
const ToggleSwitch = ({ checked, onChange }) => {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
      <div className={`w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 ${checked ? 'peer-checked:bg-[#bca142]' : ''}`}></div>
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
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'descending' });
  const [filters, setFilters] = useState({ status: '', blacklist: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [detailTarget, setDetailTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: '',
    userId: null,
    currentValue: null,
    userName: ''
  });
  const [blacklistModal, setBlacklistModal] = useState({
    isOpen: false,
    userId: null,
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
  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/user/business-owners');
      setUsers(response);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching company users:", error);
      adminToast.error(error.message || "Failed to fetch business users");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
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
    if (!currentBlacklistStatus) {
      // Opening blacklist modal - need reason
      setBlacklistModal({
        isOpen: true,
        userId,
        userName
      });
    } else {
      // Unblacklisting - use confirmation modal
      setConfirmModal({
        isOpen: true,
        type: 'unblacklist',
        userId,
        currentValue: currentBlacklistStatus,
        userName
      });
    }
  };

  const confirmBlacklistWithReason = async (reason) => {
    const { userId } = blacklistModal;
    
    try {
        await api.put(`/api/user/business-status/${userId}`, { 
          type: 'blacklist', 
          value: true,
          reason: reason
        });
        
        adminToast.success('Business added to blacklist successfully');
        
        const updatedUsers = users.map(user =>
          user.id === userId ? { ...user, onBlacklist: true } : user
        );
        setUsers(updatedUsers);
        
    } catch (error) {
        console.error("Error updating blacklist:", error);
        adminToast.error("Failed to update blacklist status");
    } finally {
      setBlacklistModal({ isOpen: false, userId: null, userName: '' });
    }
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
  const handleViewUser = (user) => {
    setDetailTarget({ id: user.id, name: user.name });
  };

  // 8b. Handle Delete User
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeletingUser(true);
      const res = await api.delete(`/api/user/admin-delete/${deleteTarget.id}`);
      adminToast.success(res?.message || 'User deleted successfully');
      setDeleteTarget(null);
      setDetailTarget(null);
      fetchUsers();
    } catch (err) {
      adminToast.error(err.response?.data?.message || err.message || 'Failed to delete user');
    } finally {
      setDeletingUser(false);
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
      sortableUsers = sortableUsers.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        return (
          (user.name && user.name.toLowerCase().includes(searchLower)) ||
          (user.email && user.email.toLowerCase().includes(searchLower)) ||
          (user.mobile && user.mobile.toLowerCase().includes(searchLower)) ||
          (user.phone && user.phone.toLowerCase().includes(searchLower))
        );
      });
    }

    // Apply Sorting
    if (sortConfig.key) {
      sortableUsers.sort((a, b) => {
        if (typeof a[sortConfig.key] === 'boolean') {
             if (a[sortConfig.key] === b[sortConfig.key]) return 0;
             const comparison = a[sortConfig.key] ? -1 : 1;
             return sortConfig.direction === 'ascending' ? comparison : -comparison;
        }
        
        // Handle date sorting
        if (sortConfig.key === 'created_at') {
          const dateA = new Date(a[sortConfig.key]);
          const dateB = new Date(b[sortConfig.key]);
          return sortConfig.direction === 'ascending' ? dateA - dateB : dateB - dateA;
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
                        (sortConfig.direction === 'ascending' ? <FaArrowUp className="text-white" /> : <FaArrowDown className="text-white" />) 
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
                <select className="w-full p-2 border border-gray-300 rounded-md" 
                        value={`${sortConfig.key}-${sortConfig.direction}`} 
                        onChange={(e) => {
                          const [key, direction] = e.target.value.split('-');
                          setSortConfig({ key, direction });
                        }}>
                    <option value="created_at-descending">Newest First</option>
                    <option value="created_at-ascending">Oldest First</option>
                    <option value="name-ascending">Name A-Z</option>
                    <option value="name-descending">Name Z-A</option>
                    <option value="email-ascending">Email A-Z</option>
                    <option value="email-descending">Email Z-A</option>
                </select>
                <button 
                  type="button" 
                  onClick={() => { setFilters({ status: '', blacklist: '' }); setSearchTerm(''); setSortConfig({ key: 'created_at', direction: 'descending' }); }}
                  className="w-full flex items-center justify-center bg-[#bca142] hover:bg-[#B8941F] text-white font-bold py-2 px-4 rounded-md"
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
                placeholder="Search by name, email, or phone..."
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
              <thead className="text-xs text-white uppercase" style={{ backgroundColor: '#bca142' }}>
                <tr>
                  <SortableHeader name="id">Sr.No</SortableHeader>
                  <SortableHeader name="name">Name</SortableHeader>
                  <SortableHeader name="email">Email</SortableHeader>
                  <SortableHeader name="mobile">Mobile</SortableHeader>
                  <SortableHeader name="created_at">Registered</SortableHeader>
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
                      <td className="p-3 text-sm">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</td>
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
                            className="p-2 bg-[#bca142] text-white rounded hover:bg-[#B8941F] disabled:bg-gray-400"
                            title="Edit User"
                            disabled={loading}
                          >
                            <FaPen />
                          </button>
                          <button 
                            onClick={() => handleViewUser(user)}
                            className="p-2 bg-black text-white rounded hover:bg-gray-800"
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <button 
                            onClick={() => setDeleteTarget({ id: user.id, name: user.name })}
                            className="p-2 bg-red-600 text-white rounded hover:bg-red-700"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center p-4">No matching records found</td>
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
              
              <span className="px-3 py-1 border-t border-b text-white" style={{backgroundColor: '#bca142'}}>
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

      {/* Enhanced User Details Modal (separate admin-details route) */}
      <UserDetailModal
        isOpen={!!detailTarget}
        role="business"
        userId={detailTarget?.id}
        onClose={() => setDetailTarget(null)}
        onDelete={(profile) => setDeleteTarget({ id: detailTarget?.id, name: profile?.name || detailTarget?.name })}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteTarget}
        title="Delete Business Owner"
        message={`Are you sure you want to permanently delete "${deleteTarget?.name || 'this user'}"? All their records (quotes, wallet, referrals, transactions and subscriptions) will be removed.`}
        confirmText="Delete User"
        isLoading={deletingUser}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#bca142] px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Business Profile
              </h3>
              <button 
                onClick={handleCancelEdit}
                className="text-white hover:text-yellow-200 transition-colors"
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
                      <Building className="h-6 w-6 mr-3 text-[#bca142]" />
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
                          <label className="flex items-center space-x-2 bg-gradient-to-r from-[#bca142] to-[#B8941F] hover:from-[#B8941F] hover:to-[#bca142] text-white px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer">
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
                      <Building className="h-6 w-6 mr-3 text-[#bca142]" />
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
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
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
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
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
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
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
                                  ? 'border-[#bca142] bg-yellow-50 text-[#bca142]'
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
                                  ? 'border-[#bca142] bg-[#bca142]'
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
                          <div className="mt-3 p-3 bg-yellow-50 rounded-xl border border-[#bca142]">
                            <p className="text-sm text-[#bca142]">
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
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
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
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
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
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                        placeholder="Describe your business and what products/services you need logistics for..."
                      />
                    </div>
                  </div>

                  {/* Additional Information Section */}
                  <div className="bg-slate-50 rounded-2xl p-6">
                    <h4 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                      <Globe className="h-6 w-6 mr-3 text-[#bca142]" />
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
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
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
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
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
                className="px-6 py-2 bg-[#bca142] text-white rounded-lg hover:bg-[#B8941F] transition-colors flex items-center"
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

      {/* Blacklist Reason Modal */}
      <BlacklistReasonModal
        isOpen={blacklistModal.isOpen}
        onClose={() => setBlacklistModal({ isOpen: false, userId: null, userName: '' })}
        onConfirm={confirmBlacklistWithReason}
        userName={blacklistModal.userName}
      />
    </div>
  );
}

export default BusinessOwners;