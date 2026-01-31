import React, { useState, useEffect, useMemo } from 'react';
import { FaPen, FaEye, FaTimes, FaGlobe, FaMapMarkerAlt, FaBuilding, FaUser, FaPhone, FaEnvelope, FaLink, FaSearch } from 'react-icons/fa';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa6';
import { api } from '../../utils/api';
import { adminToast } from '../../utils/adminToast';
import { fetchCountries, fetchStates } from '../../utils/locationData';
import StatusConfirmationModal from '../../components/Modal/StatusConfirmationModal';
import BlacklistReasonModal from '../../components/Modal/BlacklistReasonModal'; 

// Custom Toggle Switch Component
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

// Business categories for dropdown
const businessCategories = [
  { value: '3pl', label: 'Third-Party Logistics Providers (3PLs)' },
  { value: 'freight_forwarders', label: 'Freight Forwarders' },
  { value: 'courier_parcel', label: 'Courier and Parcel Delivery Services' },
  { value: 'warehousing_distribution', label: 'Warehousing and Distribution' },
  { value: 'transportation_service', label: 'Transportation Service' },
  { value: 'supply_chain_management', label: 'Supply Chain Management' },
  { value: 'inventory_management', label: 'Inventory Management' },
  { value: 'cold_chain_logistics', label: 'Cold Chain Logistics' },
  { value: 'ecommerce_logistics', label: 'E-commerce Logistics' },
  { value: 'cross_border_logistics', label: 'Cross-border Logistics' },
  { value: 'specialized_logistics', label: 'Specialized Logistics' },
  { value: 'technology_software_providers', label: 'Technology and Software Providers' },
  { value: 'packaging_labeling_services', label: 'Packaging and Labeling Services' },
  { value: 'last_mile_delivery', label: 'Last Mile Delivery' },
  { value: 'air_cargo_freight', label: 'Air Cargo and Freight Services' },
  { value: 'rail_intermodal_logistics', label: 'Rail and Intermodal Logistics' },
  { value: 'freight_brokerage', label: 'Freight Brokerage' },
  { value: 'drone_autonomous_logistics', label: 'Drone and Autonomous Vehicle Logistics' },
  { value: 'custom_brokerage', label: 'Custom Brokerage' }
];

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
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [locationMethod, setLocationMethod] = useState('coordinates'); // New state for location method

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

    const loadCountries = async () => {
      try {
        setLoadingCountries(true);
        const countriesData = await fetchCountries();
        setCountries(countriesData);
      } catch (error) {
        console.error("Error fetching countries:", error);
        adminToast.error("Failed to load countries");
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCompanies();
    loadCountries();
  }, []);


  // 2. Handle Status Change (Active/Inactive) with Confirmation
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
        await api.put(`/api/user/company-status/${userId}`, { 
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

  // 3. Handle Blacklist Toggle with Confirmation
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
        await api.put(`/api/user/company-status/${userId}`, { 
          type: 'blacklist', 
          value: true,
          reason: reason
        });
        
        adminToast.success('Company added to blacklist successfully');
        
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
        await api.put(`/api/user/company-status/${userId}`, { 
          type: 'blacklist', 
          value: !currentValue 
        });
        
        adminToast.success(`User ${!currentValue ? 'added to' : 'removed from'} blacklist`);
        
        const updatedUsers = users.map(user =>
          user.id === userId ? { ...user, onBlacklist: !currentValue } : user
        );
        setUsers(updatedUsers);
        
    } catch (error) {
        console.error("Error updating blacklist:", error);
        adminToast.error("Failed to update blacklist status");
    } finally {
      setConfirmModal({ isOpen: false, type: '', userId: null, currentValue: null, userName: '' });
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
      map_location: details.map_location || '',
      company_address: details.company_address || '',
      about_company: details.about_company || '',
      latitude: details.latitude || '',
      longitude: details.longitude || ''
    });

    // Set initial location method based on existing data
    if (details.latitude && details.longitude) {
      setLocationMethod('coordinates');
    } else if (details.map_location) {
      setLocationMethod('maps');
    } else {
      setLocationMethod('coordinates'); // Default to coordinates
    }
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
      // Clean up location data based on selected method
      const cleanedFormData = { ...editForm };
      
      if (locationMethod === 'coordinates') {
        // If coordinates method is selected, clear map_location
        cleanedFormData.map_location = '';
      } else if (locationMethod === 'maps') {
        // If maps method is selected, clear coordinates
        cleanedFormData.latitude = '';
        cleanedFormData.longitude = '';
      }

      // Use the new comprehensive admin company API
      await api.put(`/api/user/company-profile/${editingUser}`, {
        name: cleanedFormData.name,
        email: cleanedFormData.email,
        phone: cleanedFormData.mobile,
        category: cleanedFormData.category,
        country: cleanedFormData.country,
        state: cleanedFormData.state,
        city: cleanedFormData.city,
        owner_name: cleanedFormData.owner_name,
        owner_phone: cleanedFormData.owner_phone,
        incharge_name: cleanedFormData.incharge_name,
        incharge_phone: cleanedFormData.incharge_phone,
        website: cleanedFormData.website,
        skype: cleanedFormData.skype,
        facebook: cleanedFormData.facebook,
        twitter: cleanedFormData.twitter,
        instagram: cleanedFormData.instagram,
        linkedin: cleanedFormData.linkedin,
        map_location: cleanedFormData.map_location,
        company_address: cleanedFormData.company_address,
        about_company: cleanedFormData.about_company,
        latitude: cleanedFormData.latitude,
        longitude: cleanedFormData.longitude
      });
      
      // Update local state with the new data
      setUsers(users.map(user => 
        user.id === editingUser 
          ? { 
              ...user, 
              name: cleanedFormData.name,
              email: cleanedFormData.email,
              mobile: cleanedFormData.mobile
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
    setStates([]);
  };

  // 7. Handle Country Change
  const handleCountryChange = async (countryName) => {
    setEditForm({...editForm, country: countryName, state: '', city: ''});
    
    if (countryName) {
      setLoadingStates(true);
      try {
        const statesData = await fetchStates(countryName);
        setStates(statesData);
      } catch (error) {
        console.error("Error fetching states:", error);
        setStates([]);
        adminToast.error("Failed to load states");
      } finally {
        setLoadingStates(false);
      }
    } else {
      setStates([]);
    }
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
                        (sortConfig.direction === 'ascending' ? <FaArrowUp className="text-white" /> : <FaArrowDown className="text-white" />) 
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
                  className="w-full flex items-center justify-center bg-[#bca142] hover:bg-[#B8941F] text-white font-bold py-2 px-4 rounded-md"
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
              <thead className="text-xs text-white uppercase" style={{ backgroundColor: '#bca142' }}>
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
  className="p-2 bg-[#bca142] text-white rounded hover:bg-[#B8941F] disabled:bg-gray-400"
  title="Edit User"
  disabled={loading} // Prevent double clicks
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

      {/* Enhanced User Details Modal */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-[#bca142] p-6 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  {viewingUser.logo && (
                    <img 
                      src={viewingUser.logo} 
                      alt="Company Logo" 
                      className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <div>
                    <h3 className="text-2xl font-bold">{viewingUser.name}</h3>
                    <p className="text-yellow-100">{formatCategoryName(viewingUser.category) || 'Company Profile'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingUser(null)}
                  className="text-white hover:text-yellow-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20"
                >
                  <FaTimes size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
              <div className="p-6">
                {/* Company Header Section */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 mb-6 border border-gray-200 shadow-sm">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Company Info */}
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
                          {viewingUser.company_address && (
                            <p className="text-gray-600 mb-3">{viewingUser.company_address}</p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            {viewingUser.website && (
                              <a href={viewingUser.website} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-[#bca142] transition-colors">
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
                        viewingUser.status ? 'bg-[#bca142] text-white' : 'bg-red-100 text-red-800'
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
                    
                    {/* Basic Information Card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                      <div className="p-6 border-b border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-[#bca142]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Basic Information
                        </h4>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <p className="p-3 bg-gray-50 rounded-lg border text-gray-800">{formatCategoryName(viewingUser.category)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information Card */}
                    {(viewingUser.owner_name || viewingUser.owner_phone || viewingUser.incharge_name || viewingUser.incharge_phone) && (
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="p-6 border-b border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-[#bca142]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
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

                    {/* Services Card */}
                    {viewingUser.services && (
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="p-6 border-b border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-[#bca142]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Services
                          </h4>
                        </div>
                        <div className="p-6">
                          <div className="bg-gray-50 rounded-lg p-4">
                            {typeof viewingUser.services === 'string' ? (
                              (() => {
                                try {
                                  // Try to parse as JSON first
                                  const parsedServices = JSON.parse(viewingUser.services);
                                  if (Array.isArray(parsedServices)) {
                                    return (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {parsedServices.map((service, index) => (
                                          <div key={index} className="flex items-center p-2 bg-white rounded border">
                                            <svg className="w-4 h-4 mr-2 text-[#bca142]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-sm text-gray-800">{service}</span>
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  }
                                } catch (e) {
                                  // If JSON parsing fails, treat as plain text
                                }
                                // Display as plain text
                                return <div className="text-gray-800 whitespace-pre-wrap">{viewingUser.services}</div>;
                              })()
                            ) : Array.isArray(viewingUser.services) ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {viewingUser.services.map((service, index) => (
                                  <div key={index} className="flex items-center p-2 bg-white rounded border">
                                    <svg className="w-4 h-4 mr-2 text-[#bca142]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-sm text-gray-800">{service}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-gray-800">No services information available</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* About Company Card */}
                    {viewingUser.about_company && (
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="p-6 border-b border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-[#bca142]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            About Company
                          </h4>
                        </div>
                        <div className="p-6">
                          <div 
                            className="text-gray-700 prose max-w-none bg-gray-50 rounded-lg p-4"
                            dangerouslySetInnerHTML={{ __html: viewingUser.about_company }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Location & Map Card */}
                    {(viewingUser.latitude && viewingUser.longitude) && (
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="p-6 border-b border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-[#bca142]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Location & Map
                          </h4>
                        </div>
                        <div className="p-6">
                            <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-[#bca142]">
                            <div className="text-sm">
                              <span className="font-medium text-[#bca142]">Coordinates:</span>
                              <span className="ml-2 font-mono text-[#bca142]">
                                {parseFloat(viewingUser.latitude).toFixed(6)}, {parseFloat(viewingUser.longitude).toFixed(6)}
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-200">
                            <iframe
                              src={`https://maps.google.com/maps?q=${viewingUser.latitude},${viewingUser.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                              width="100%"
                              height="100%"
                              style={{ border: 0 }}
                              allowFullScreen=""
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              title="Company Location"
                            ></iframe>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Contact & Social */}
                  <div className="space-y-6">
                    
                    {/* Contact Person Card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm sticky top-4">
                      <div className="p-6 text-center">
                        <div className="mb-4">
                          {viewingUser.incharge_image || viewingUser.logo ? (
                            <img 
                              src={viewingUser.incharge_image || viewingUser.logo} 
                              alt="Contact Person" 
                              className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-gray-100 shadow-sm"
                              onError={(e) => {
                                e.target.src = 'https://i.imgur.com/sCEw22l.png';
                              }}
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full mx-auto bg-gray-200 flex items-center justify-center border-4 border-gray-100">
                              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">
                          {viewingUser.incharge_name || viewingUser.owner_name || 'Contact Person'}
                        </h3>
                        <p className="text-gray-500 mb-3">
                          {viewingUser.incharge_name ? 'Incharge' : 'Owner'}
                        </p>
                        <div className="text-gray-600 mb-4">
                          <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {viewingUser.incharge_phone || viewingUser.owner_phone || 'Phone not available'}
                        </div>
                      </div>
                    </div>

                    {/* Social Media & Online Presence */}
                    {(viewingUser.website || viewingUser.facebook || viewingUser.twitter || viewingUser.linkedin || viewingUser.instagram || viewingUser.skype) && (
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="p-6 border-b border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-[#bca142]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                              <a href={viewingUser.website} target="_blank" rel="noopener noreferrer" className="text-[#bca142] hover:underline text-sm">
                                {viewingUser.website}
                              </a>
                            </div>
                          )}
                          {viewingUser.facebook && (
                            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                              <svg className="w-5 h-5 mr-3 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                              </svg>
                              <a href={viewingUser.facebook} target="_blank" rel="noopener noreferrer" className="text-[#bca142] hover:underline text-sm">
                                Facebook
                              </a>
                            </div>
                          )}
                          {viewingUser.linkedin && (
                            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                              <svg className="w-5 h-5 mr-3 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                              </svg>
                              <a href={viewingUser.linkedin} target="_blank" rel="noopener noreferrer" className="text-[#bca142] hover:underline text-sm">
                                LinkedIn
                              </a>
                            </div>
                          )}
                          {viewingUser.skype && (
                            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                              <svg className="w-5 h-5 mr-3 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12.069 18.874c-4.023 0-5.82-1.979-5.82-3.464 0-.765.561-1.296 1.333-1.296 1.723 0 1.273 2.477 4.487 2.477 1.641 0 2.55-.895 2.55-1.811 0-.551-.269-1.16-1.354-1.429l-3.576-.895c-2.88-.724-3.403-2.286-3.403-3.751 0-3.047 2.861-4.191 5.549-4.191 2.471 0 5.393 1.373 5.393 3.199 0 .784-.688 1.24-1.453 1.24-1.469 0-1.198-2.037-4.164-2.037-1.469 0-2.292.664-2.292 1.617 0 .587.269 1.027 1.181 1.240l3.19.742c3.007.742 3.673 2.435 3.673 3.965 0 2.613-2.04 4.191-5.82 4.191l.526.002z"/>
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
                          <svg className="w-5 h-5 mr-2 text-[#bca142]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        {viewingUser.company_address && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                            <p className="p-2 bg-gray-50 rounded text-gray-800 text-sm">{viewingUser.company_address}</p>
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
                className="px-6 py-2 bg-[#bca142] text-white rounded-lg hover:bg-[#B8941F] transition-colors flex items-center"
              >
                <FaPen className="mr-2" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-[#bca142] p-6 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <FaBuilding className="text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Edit Company Profile</h3>
                    <p className="text-yellow-100">Update company information and details</p>
                  </div>
                </div>
                <button 
                  onClick={handleCancelEdit}
                  className="text-white hover:text-yellow-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20"
                >
                  <FaTimes size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(95vh-180px)]">
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Left Column - Basic Information */}
                  <div className="lg:col-span-2 space-y-8">
                    
                    {/* Basic Information Section */}
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                      <div className="flex items-center mb-6">
                        <div className="w-10 h-10 bg-[#bca142] rounded-xl flex items-center justify-center mr-4">
                          <FaBuilding className="text-white text-lg" />
                        </div>
                        <h4 className="text-xl font-bold text-gray-800">Basic Information</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Company Name *
                          </label>
                          <div className="relative">
                            <FaBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                              placeholder="Enter company name"
                              required
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Email Address *
                          </label>
                          <div className="relative">
                            <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="email"
                              value={editForm.email}
                              onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                              placeholder="Enter email address"
                              required
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Mobile Number
                          </label>
                          <div className="relative">
                            <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={editForm.mobile}
                              onChange={(e) => setEditForm({...editForm, mobile: e.target.value})}
                              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                              placeholder="Enter mobile number"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Business Category
                          </label>
                          <div className="relative">
                            <FaBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                            <select
                              value={editForm.category}
                              onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300 appearance-none"
                            >
                              <option value="">Select Business Category</option>
                              {businessCategories.map((category) => (
                                <option key={category.value} value={category.value}>
                                  {category.label}
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Location Information Section */}
                    <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border border-blue-200 shadow-sm">
                      <div className="flex items-center mb-6">
                        <div className="w-10 h-10 bg-[#bca142] rounded-xl flex items-center justify-center mr-4">
                          <FaMapMarkerAlt className="text-white text-lg" />
                        </div>
                        <h4 className="text-xl font-bold text-gray-800">Location Information</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Country
                          </label>
                          <div className="relative">
                            <FaGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                            <select
                              value={editForm.country}
                              onChange={(e) => handleCountryChange(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300 appearance-none"
                            >
                              <option value="">Select Country</option>
                              {countries.map((country) => (
                                <option key={country.code} value={country.name}>
                                  {country.name}
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            State/Province
                          </label>
                          <div className="relative">
                            <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                            <select
                              value={editForm.state}
                              onChange={(e) => setEditForm({...editForm, state: e.target.value})}
                              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300 appearance-none"
                              disabled={!editForm.country || loadingStates}
                            >
                              <option value="">
                                {loadingStates ? 'Loading states...' : 'Select State/Province'}
                              </option>
                              {states.map((state) => (
                                <option key={state} value={state}>
                                  {state}
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            City
                          </label>
                          <input
                            type="text"
                            value={editForm.city}
                            onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                            placeholder="Enter city name"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Company Address
                          </label>
                          <textarea
                            value={editForm.company_address}
                            onChange={(e) => setEditForm({...editForm, company_address: e.target.value})}
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                            rows="3"
                            placeholder="Enter complete company address"
                          />
                        </div>
                      </div>

                      {/* Location Method Selection - Enhanced Coordinate Section */}
                      <div className="mt-8 relative group">
                        {/* Futuristic Background Glow Effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400/20 to-yellow-100/20 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition duration-1000"></div>
                        
                        <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl border border-yellow-200 shadow-2xl overflow-hidden">
                          {/* Header Section */}
                          <div className="p-6 border-b border-yellow-100 bg-gradient-to-r from-yellow-50/50 to-transparent">
                            <h3 className="text-xl font-bold text-yellow-900 flex items-center tracking-tight">
                              <span className="p-2 bg-yellow-400 rounded-lg mr-3 shadow-md shadow-yellow-200">
                                <svg className="w-6 h-6 text-yellow-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </span>
                              Spatial Configuration
                            </h3>
                            <p className="mt-2 text-yellow-700/80 text-sm font-medium">
                              Select a positioning protocol to synchronize your precise geographic location.
                            </p>
                          </div>
                          
                          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* GPS Coordinates Option */}
                            <div 
                              onClick={() => {
                                setLocationMethod('coordinates');
                                setEditForm(prev => ({ ...prev, map_location: '' }));
                              }}
                              className={`group/card relative p-5 rounded-xl border-2 transition-all duration-500 cursor-pointer ${
                              locationMethod === 'coordinates'
                                ? 'bg-white border-yellow-400 shadow-xl shadow-yellow-100 translate-y-[-2px]' 
                                : 'bg-gray-50/50 border-gray-100 hover:border-yellow-200'
                          }`}>
                              <div className="flex items-center mb-5">
                                <div className="relative flex items-center justify-center">
                                  <input
                                    type="radio"
                                    id="coordinates-method"
                                    name="location-method"
                                    checked={locationMethod === 'coordinates'}
                                    onChange={() => {
                                      setLocationMethod('coordinates');
                                      setEditForm(prev => ({ ...prev, map_location: '' }));
                                    }}
                                    className="w-5 h-5 text-[#bca142] focus:ring-[#bca142] border-gray-300 transition-all cursor-pointer"
                                  />
                                </div>
                                <label htmlFor="coordinates-method" className={`ml-3 font-bold tracking-wide uppercase text-xs transition-colors ${locationMethod === 'coordinates' ? 'text-[#bca142]' : 'text-gray-500'}`}>
                                  GPS Satellite Protocol
                                </label>
                              </div>
                              
                              <div className={`space-y-4 transition-all duration-300 ${
                                locationMethod === 'coordinates' ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'
                              }`}>
                                <div className="grid grid-cols-1 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                                    <input
                                      type="number"
                                      step="any"
                                      value={editForm.latitude || ''}
                                      onChange={(e) => setEditForm({...editForm, latitude: e.target.value})}
                                      placeholder="e.g., 25.2048"
                                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-[#bca142] transition-all duration-200"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                                    <input
                                      type="number"
                                      step="any"
                                      value={editForm.longitude || ''}
                                      onChange={(e) => setEditForm({...editForm, longitude: e.target.value})}
                                      placeholder="e.g., 55.2708"
                                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-[#bca142] transition-all duration-200"
                                    />
                                  </div>
                                </div>
                                
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (navigator.geolocation) {
                                      navigator.geolocation.getCurrentPosition(
                                        (position) => {
                                          setEditForm(prev => ({
                                            ...prev,
                                            latitude: position.coords.latitude.toFixed(6),
                                            longitude: position.coords.longitude.toFixed(6),
                                            map_location: ''
                                          }));
                                          adminToast.success('Current location coordinates added successfully!');
                                        },
                                        (error) => adminToast.error('Unable to get current location. Please enter coordinates manually.')
                                      );
                                    } else {
                                      adminToast.error('Geolocation is not supported by this browser.');
                                    }
                                  }}
                                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 active:scale-95 shadow-lg shadow-blue-200"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  </svg>
                                  Auto-Detect Signal
                                </button>
                              </div>
                            </div>

                            {/* Google Maps URL Option */}
                            <div 
                              onClick={() => {
                                setLocationMethod('maps');
                                setEditForm(prev => ({ ...prev, latitude: '', longitude: '' }));
                              }}
                              className={`group/card relative p-5 rounded-xl border-2 transition-all duration-500 cursor-pointer ${
                              locationMethod === 'maps'
                                ? 'bg-white border-yellow-400 shadow-xl shadow-yellow-100 translate-y-[-2px]' 
                                : 'bg-gray-50/50 border-gray-100 hover:border-yellow-200'
                          }`}>
                              <div className="flex items-center mb-5">
                                <input
                                  type="radio"
                                  id="maps-method"
                                  name="location-method"
                                  checked={locationMethod === 'maps'}
                                  onChange={() => {
                                    setLocationMethod('maps');
                                    setEditForm(prev => ({ ...prev, latitude: '', longitude: '' }));
                                  }}
                                  className="w-5 h-5 text-[#bca142] focus:ring-[#bca142] border-gray-300 transition-all cursor-pointer"
                                />
                                <label htmlFor="maps-method" className={`ml-3 font-bold tracking-wide uppercase text-xs transition-colors ${locationMethod === 'maps' ? 'text-[#bca142]' : 'text-gray-500'}`}>
                                  Cloud Map Integration
                                </label>
                              </div>
                              
                              <div className={`transition-all duration-300 ${
                                locationMethod === 'maps' ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'
                              }`}>
                                <textarea
                                  value={editForm.map_location || ''}
                                  onChange={(e) => {
                                    setEditForm(prev => ({
                                      ...prev,
                                      map_location: e.target.value,
                                      latitude: '',
                                      longitude: ''
                                    }));
                                  }}
                                  placeholder="Paste shared embed data source..."
                                  rows={5}
                                  className="w-full p-4 bg-gray-100/50 border-none rounded-xl text-sm font-mono focus:ring-2 focus:ring-yellow-400 transition-all resize-none shadow-inner"
                                />
                                <div className="mt-3 flex items-center text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-2 animate-pulse"></span>
                                  Instruction: Maps → Share → Embed a map → Copy HTML
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Technical Guidance Footer */}
                          <div className="px-6 py-4 bg-yellow-50/50 border-t border-yellow-100 flex flex-wrap gap-4 items-center justify-between">
                            <div className="px-3 py-1 bg-white rounded-full border border-yellow-200 text-[11px] font-bold text-yellow-700">
                              Ready for sync
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information Section */}
                    <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-6 border border-green-200 shadow-sm">
                      <div className="flex items-center mb-6">
                        <div className="w-10 h-10 bg-[#bca142] rounded-xl flex items-center justify-center mr-4">
                          <FaUser className="text-white text-lg" />
                        </div>
                        <h4 className="text-xl font-bold text-gray-800">Contact Information</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Owner Name
                          </label>
                          <div className="relative">
                            <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={editForm.owner_name}
                              onChange={(e) => setEditForm({...editForm, owner_name: e.target.value})}
                              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                              placeholder="Enter owner name"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Owner Phone
                          </label>
                          <div className="relative">
                            <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={editForm.owner_phone}
                              onChange={(e) => setEditForm({...editForm, owner_phone: e.target.value})}
                              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                              placeholder="Enter owner phone"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Incharge Name
                          </label>
                          <div className="relative">
                            <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={editForm.incharge_name}
                              onChange={(e) => setEditForm({...editForm, incharge_name: e.target.value})}
                              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                              placeholder="Enter incharge name"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Incharge Phone
                          </label>
                          <div className="relative">
                            <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={editForm.incharge_phone}
                              onChange={(e) => setEditForm({...editForm, incharge_phone: e.target.value})}
                              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                              placeholder="Enter incharge phone"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Online Presence & Additional Info */}
                  <div className="space-y-8">
                    
                    {/* Online Presence Section */}
                    <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 border border-purple-200 shadow-sm">
                      <div className="flex items-center mb-6">
                        <div className="w-10 h-10 bg-[#bca142] rounded-xl flex items-center justify-center mr-4">
                          <FaLink className="text-white text-lg" />
                        </div>
                        <h4 className="text-xl font-bold text-gray-800">Online Presence</h4>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Website
                          </label>
                          <div className="relative">
                            <FaGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="url"
                              value={editForm.website}
                              onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                              placeholder="https://example.com"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Skype
                          </label>
                          <input
                            type="text"
                            value={editForm.skype}
                            onChange={(e) => setEditForm({...editForm, skype: e.target.value})}
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                            placeholder="Skype username"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Facebook
                          </label>
                          <input
                            type="url"
                            value={editForm.facebook}
                            onChange={(e) => setEditForm({...editForm, facebook: e.target.value})}
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                            placeholder="https://facebook.com/company"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            LinkedIn
                          </label>
                          <input
                            type="url"
                            value={editForm.linkedin}
                            onChange={(e) => setEditForm({...editForm, linkedin: e.target.value})}
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                            placeholder="https://linkedin.com/company/company"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Twitter
                          </label>
                          <input
                            type="url"
                            value={editForm.twitter}
                            onChange={(e) => setEditForm({...editForm, twitter: e.target.value})}
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                            placeholder="https://twitter.com/company"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Instagram
                          </label>
                          <input
                            type="url"
                            value={editForm.instagram}
                            onChange={(e) => setEditForm({...editForm, instagram: e.target.value})}
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                            placeholder="https://instagram.com/company"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Additional Information Section */}
                    <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-6 border border-orange-200 shadow-sm">
                      <div className="flex items-center mb-6">
                        <div className="w-10 h-10 bg-[#bca142] rounded-xl flex items-center justify-center mr-4">
                          <FaBuilding className="text-white text-lg" />
                        </div>
                        <h4 className="text-xl font-bold text-gray-800">Additional Information</h4>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            About Company
                          </label>
                          <textarea
                            value={editForm.about_company}
                            onChange={(e) => setEditForm({...editForm, about_company: e.target.value})}
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                            rows="5"
                            placeholder="Brief description about the company"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 flex justify-end space-x-4">
              <button 
                onClick={handleCancelEdit}
                className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors duration-300 flex items-center space-x-2"
              >
                <FaTimes className="text-sm" />
                <span>Cancel</span>
              </button>
              <button 
                onClick={handleSaveEdit}
                className="px-6 py-3 bg-[#bca142] text-white rounded-xl hover:bg-[#B8941F] transition-all duration-300 flex items-center space-x-2 shadow-lg"
              >
                <FaPen className="text-sm" />
                <span>Save Changes</span>
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

export default CompanyOwners;
