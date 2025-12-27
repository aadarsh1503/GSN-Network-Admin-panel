// src/components/BusinessOwners.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { FaPen, FaEye, FaTimes, FaSave } from 'react-icons/fa';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa6';
import { api } from '../../utils/api';
import { adminToast } from '../../utils/adminToast'; 

// Custom Toggle Switch Component
const ToggleSwitch = ({ checked, onChange }) => {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
      <div className={`w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 ${checked ? 'peer-checked:bg-green-600' : ''}`}></div>
    </label>
  );
};

function CompanyOwners() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });
  const [filters, setFilters] = useState({ status: '', blacklist: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [viewingUser, setViewingUser] = useState(null);

  // 1. Fetch Data from API on Component Mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await api.get('/api/user/companies');
        setUsers(response);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching companies:", error);
        setLoading(false);
        // Optional: Add alert for unauthorized access
        if(error.message?.includes('Authentication failed')) {
            alert("Unauthorized. Please login as Admin.");
        }
      }
    };

    fetchCompanies();
  }, []);


  // 2. Handle Status Change (Active/Inactive)
  const handleStatusChange = async (userId, currentStatus) => {
    // Optimistic UI update (update immediately before API returns)
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, status: !currentStatus } : user
    );
    setUsers(updatedUsers);

    try {
        await api.put(`/api/user/company-status/${userId}`, { 
          type: 'status', 
          value: !currentStatus 
        });
        adminToast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
        console.error("Error updating status:", error);
        adminToast.error("Failed to update status");
        // Revert changes if API fails
        setUsers(users); 
    }
  };

  // 3. Handle Blacklist Toggle
  const handleBlacklistToggle = async (userId, currentBlacklistStatus) => {
    // Optimistic UI update
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, onBlacklist: !currentBlacklistStatus } : user
    );
    setUsers(updatedUsers);

    try {
        await api.put(`/api/user/company-status/${userId}`, { 
          type: 'blacklist', 
          value: !currentBlacklistStatus 
        });
        adminToast.success(`User ${!currentBlacklistStatus ? 'added to' : 'removed from'} blacklist`);
    } catch (error) {
        console.error("Error updating blacklist:", error);
        adminToast.error("Failed to update blacklist status");
        // Revert changes if API fails
        setUsers(users);
    }
  };

  // 4. Handle Edit User
const handleEditUser = async (user) => {
  setLoading(true); // Optional: show a small loader
  try {
    // We fetch the full profile data for this specific user
    const details = await api.get(`/api/user/company-profile/${user.id}`);
    
    setEditingUser(user.id);
    
    // Populate the form with data from the API response
    setEditForm({
      name: details.name || '',
      email: details.email || '',
      mobile: details.mobile || details.phone || '', // Check both possible field names
      category: details.category || '',
      country: details.country || '',
      state: details.state || '',
      city: details.city || '',
      owner_name: details.owner_name || '',
      owner_phone: details.owner_phone || '',
      incharge_name: details.incharge_name || '',
      incharge_phone: details.incharge_phone || '',
      website: details.website || '',
      skype: details.skype || '',
      facebook: details.facebook || '',
      twitter: details.twitter || '',
      instagram: details.instagram || '',
      linkedin: details.linkedin || '',
      services: details.services || '',
      map_location: details.map_location || '',
      company_address: details.company_address || '',
      about_company: details.about_company || ''
    });
  } catch (error) {
    console.error("Error fetching user details for edit:", error);
    adminToast.error("Failed to load user details");
  } finally {
    setLoading(false);
  }
};

  // 5. Handle Save Edit
  const handleSaveEdit = async () => {
    try {
      // Use the new comprehensive admin company API
      await api.put(`/api/user/company-profile/${editingUser}`, {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.mobile,
        category: editForm.category,
        country: editForm.country,
        state: editForm.state,
        city: editForm.city,
        owner_name: editForm.owner_name,
        owner_phone: editForm.owner_phone,
        incharge_name: editForm.incharge_name,
        incharge_phone: editForm.incharge_phone,
        website: editForm.website,
        skype: editForm.skype,
        facebook: editForm.facebook,
        twitter: editForm.twitter,
        instagram: editForm.instagram,
        linkedin: editForm.linkedin,
        services: editForm.services,
        map_location: editForm.map_location,
        company_address: editForm.company_address,
        about_company: editForm.about_company
      });
      
      // Update local state with the new data
      setUsers(users.map(user => 
        user.id === editingUser 
          ? { 
              ...user, 
              name: editForm.name,
              email: editForm.email,
              mobile: editForm.mobile
            }
          : user
      ));
      
      setEditingUser(null);
      setEditForm({});
      adminToast.success('Company profile updated successfully');
    } catch (error) {
      console.error("Error updating company:", error);
      adminToast.error(error.message || "Failed to update company profile");
    }
  };

  // 6. Handle Cancel Edit
  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({});
  };

  // 7. Handle View User Details
  const handleViewUser = async (user) => {
    try {
      // Use the comprehensive admin company API for full details
      const userDetails = await api.get(`/api/user/company-profile/${user.id}`);
      setViewingUser(userDetails);
    } catch (error) {
      console.error("Error fetching user details:", error);
      adminToast.error("Failed to fetch user details");
    }
  };
  
  // --- Filtering and Sorting Logic (Kept same as provided) ---
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

  if (loading) return <div className="p-10 text-center">Loading Companies...</div>;

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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Company Owners</h2>
            {/* Temporary Test Button - Remove after testing */}
            
          </div>
          
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
                            onChange={() => handleBlacklistToggle(user.id, user.onBlacklist)} 
                        />
                      </td>
                      <td className="p-3">
                        <ToggleSwitch 
                            checked={user.status} 
                            onChange={() => handleStatusChange(user.id, user.status)} 
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex space-x-2">
                        <button 
  onClick={() => handleEditUser(user)}
  className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
  title="Edit User"
  disabled={loading} // Prevent double clicks
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

      {/* User Details Modal */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Company Profile Details</h3>
              <button 
                onClick={() => setViewingUser(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Information */}
              <div className="md:col-span-2">
                <h4 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">Basic Information</h4>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <p className="p-2 bg-gray-50 rounded border">{viewingUser.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="p-2 bg-gray-50 rounded border">{viewingUser.email}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                <p className="p-2 bg-gray-50 rounded border">{viewingUser.phone || viewingUser.mobile}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <p className="p-2 bg-gray-50 rounded border">{viewingUser.category || 'N/A'}</p>
              </div>

              {/* Location Information */}
              <div className="md:col-span-2 mt-4">
                <h4 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">Location Information</h4>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <p className="p-2 bg-gray-50 rounded border">{viewingUser.country || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <p className="p-2 bg-gray-50 rounded border">{viewingUser.state || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <p className="p-2 bg-gray-50 rounded border">{viewingUser.city || 'N/A'}</p>
              </div>

              {viewingUser.company_address && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <p className="p-2 bg-gray-50 rounded border">{viewingUser.company_address}</p>
                </div>
              )}

              {/* Contact Information */}
              <div className="md:col-span-2 mt-4">
                <h4 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">Contact Information</h4>
              </div>

              {viewingUser.owner_name && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                  <p className="p-2 bg-gray-50 rounded border">{viewingUser.owner_name}</p>
                </div>
              )}

              {viewingUser.owner_phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner Phone</label>
                  <p className="p-2 bg-gray-50 rounded border">{viewingUser.owner_phone}</p>
                </div>
              )}

              {viewingUser.incharge_name && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Incharge Name</label>
                  <p className="p-2 bg-gray-50 rounded border">{viewingUser.incharge_name}</p>
                </div>
              )}

              {viewingUser.incharge_phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Incharge Phone</label>
                  <p className="p-2 bg-gray-50 rounded border">{viewingUser.incharge_phone}</p>
                </div>
              )}

              {/* Online Presence */}
              <div className="md:col-span-2 mt-4">
                <h4 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">Online Presence</h4>
              </div>

              {viewingUser.website && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <p className="p-2 bg-gray-50 rounded border">
                    <a href={viewingUser.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {viewingUser.website}
                    </a>
                  </p>
                </div>
              )}

              {viewingUser.skype && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skype</label>
                  <p className="p-2 bg-gray-50 rounded border">{viewingUser.skype}</p>
                </div>
              )}

              {viewingUser.facebook && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                  <p className="p-2 bg-gray-50 rounded border">
                    <a href={viewingUser.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {viewingUser.facebook}
                    </a>
                  </p>
                </div>
              )}

              {viewingUser.linkedin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                  <p className="p-2 bg-gray-50 rounded border">
                    <a href={viewingUser.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {viewingUser.linkedin}
                    </a>
                  </p>
                </div>
              )}

              {/* Status Information */}
              <div className="md:col-span-2 mt-4">
                <h4 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">Status Information</h4>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <p className={`p-2 rounded border ${viewingUser.status ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {viewingUser.status ? 'Active' : 'Inactive'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blacklisted</label>
                <p className={`p-2 rounded border ${viewingUser.is_blacklisted ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {viewingUser.is_blacklisted ? 'Yes' : 'No'}
                </p>
              </div>
              
              {viewingUser.created_at && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Date</label>
                  <p className="p-2 bg-gray-50 rounded border">
                    {new Date(viewingUser.created_at).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Additional Information */}
              {(viewingUser.services || viewingUser.about_company) && (
                <>
                  <div className="md:col-span-2 mt-4">
                    <h4 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">Additional Information</h4>
                  </div>

                  {viewingUser.services && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Services</label>
                      <p className="p-2 bg-gray-50 rounded border">{viewingUser.services}</p>
                    </div>
                  )}

                  {viewingUser.about_company && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">About Company</label>
                      <p className="p-2 bg-gray-50 rounded border">{viewingUser.about_company}</p>
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setViewingUser(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Edit Company Profile</h3>
              <button 
                onClick={handleCancelEdit}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Basic Information */}
              <div className="md:col-span-3">
                <h4 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">Basic Information</h4>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                <input
                  type="text"
                  value={editForm.mobile}
                  onChange={(e) => setEditForm({...editForm, mobile: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={editForm.category}
                  onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                />
              </div>

              {/* Location Information */}
              <div className="md:col-span-3 mt-4">
                <h4 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">Location Information</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  value={editForm.country}
                  onChange={(e) => setEditForm({...editForm, country: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={editForm.state}
                  onChange={(e) => setEditForm({...editForm, state: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Address</label>
                <textarea
                  value={editForm.company_address}
                  onChange={(e) => setEditForm({...editForm, company_address: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                  rows="2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Map Location</label>
                <input
                  type="text"
                  value={editForm.map_location}
                  onChange={(e) => setEditForm({...editForm, map_location: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                  placeholder="Google Maps URL or coordinates"
                />
              </div>

              {/* Contact Information */}
              <div className="md:col-span-3 mt-4">
                <h4 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">Contact Information</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                <input
                  type="text"
                  value={editForm.owner_name}
                  onChange={(e) => setEditForm({...editForm, owner_name: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Phone</label>
                <input
                  type="text"
                  value={editForm.owner_phone}
                  onChange={(e) => setEditForm({...editForm, owner_phone: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Incharge Name</label>
                <input
                  type="text"
                  value={editForm.incharge_name}
                  onChange={(e) => setEditForm({...editForm, incharge_name: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Incharge Phone</label>
                <input
                  type="text"
                  value={editForm.incharge_phone}
                  onChange={(e) => setEditForm({...editForm, incharge_phone: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                />
              </div>

              {/* Online Presence */}
              <div className="md:col-span-3 mt-4">
                <h4 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">Online Presence</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  value={editForm.website}
                  onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skype</label>
                <input
                  type="text"
                  value={editForm.skype}
                  onChange={(e) => setEditForm({...editForm, skype: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                <input
                  type="url"
                  value={editForm.facebook}
                  onChange={(e) => setEditForm({...editForm, facebook: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                  placeholder="https://facebook.com/company"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
                <input
                  type="url"
                  value={editForm.twitter}
                  onChange={(e) => setEditForm({...editForm, twitter: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                  placeholder="https://twitter.com/company"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                <input
                  type="url"
                  value={editForm.instagram}
                  onChange={(e) => setEditForm({...editForm, instagram: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                  placeholder="https://instagram.com/company"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                <input
                  type="url"
                  value={editForm.linkedin}
                  onChange={(e) => setEditForm({...editForm, linkedin: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                  placeholder="https://linkedin.com/company/company"
                />
              </div>

              {/* Additional Information */}
              <div className="md:col-span-3 mt-4">
                <h4 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">Additional Information</h4>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Services</label>
                <textarea
                  value={editForm.services}
                  onChange={(e) => setEditForm({...editForm, services: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                  rows="3"
                  placeholder="Describe the services offered by the company"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">About Company</label>
                <textarea
                  value={editForm.about_company}
                  onChange={(e) => setEditForm({...editForm, about_company: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#CDA435] focus:border-transparent"
                  rows="4"
                  placeholder="Brief description about the company"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-[#CDA435] text-white rounded hover:bg-[#B8941F]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyOwners;