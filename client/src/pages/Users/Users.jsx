// src/components/User.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { FaPen, FaEye, FaTimes, FaSave } from 'react-icons/fa';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa6';
import { api } from '../../utils/api';
import { adminToast } from '../../utils/adminToast';
import StatusConfirmationModal from '../../components/Modal/StatusConfirmationModal';
import BlacklistReasonModal from '../../components/Modal/BlacklistReasonModal';

// --- Custom Toggle Switch Component ---
const ToggleSwitch = ({ checked, onChange }) => {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
    </label>
  );
};

function User() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });
  const [filters, setFilters] = useState({ status: '', blacklist: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- New Modal States ---
  const [viewingUser, setViewingUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
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

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Use regular-users endpoint to fetch only quote requesters (role = 'user')
      const response = await api.get('/api/user/regular-users');
      const formattedUsers = response.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        onBlacklist: user.onBlacklist,
        status: user.status,
        role: user.role,
        created_at: user.created_at
      }));
      setUsers(formattedUsers);
      setError(null);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
      adminToast.error('Failed to load quote requesting users');
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers for User Actions ---
  const handleViewUser = async (user) => {
    try {
      const details = await api.get(`/api/user/profile/${user.id}`);
      setViewingUser(details);
    } catch (err) {
      adminToast.error("Failed to fetch user details");
    }
  };

  const handleEditUser = async (user) => {
    try {
      const details = await api.get(`/api/user/profile/${user.id}`);
      setEditingUser(user.id);
      setEditForm({
        name: details.name,
        email: details.email,
        mobile: details.phone || '',
        country: details.country || '',
        state: details.state || '',
        city: details.city || '',
        category: details.category || ''
      });
    } catch (err) {
      adminToast.error("Failed to fetch user for editing");
    }
  };

  const handleSaveEdit = async () => {
    try {
      await api.put(`/api/user/update-profile/${editingUser}`, editForm);
      setEditingUser(null);
      fetchUsers(); // Refresh list
      adminToast.success("User updated successfully");
    } catch (err) {
      adminToast.error(err.response?.data?.message || "Error updating user");
    }
  };

  const handleStatusChange = (userId, userName) => {
    const user = users.find(u => u.id === userId);
    setConfirmModal({
      isOpen: true,
      type: user.status ? 'deactivate' : 'activate',
      userId,
      currentValue: user.status,
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
      setUsers(users.map(u => u.id === userId ? { ...u, status: !u.status } : u));
      
    } catch (error) {
      adminToast.error('Failed to update user status');
    } finally {
      setConfirmModal({ isOpen: false, type: '', userId: null, currentValue: null, userName: '' });
    }
  };

  const handleBlacklistToggle = (userId, userName) => {
    const user = users.find(u => u.id === userId);
    if (!user.onBlacklist) {
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
        currentValue: user.onBlacklist,
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
      
      adminToast.success('User added to blacklist successfully');
      
      const updatedUsers = users.map(user =>
        user.id === userId ? { ...user, onBlacklist: true } : user
      );
      setUsers(updatedUsers);
      
    } catch (error) {
      console.error("Error updating blacklist:", error);
      adminToast.error('Failed to update blacklist status');
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
      
      // Show toast BEFORE state update to prevent dismissal
      adminToast.success(`User ${!currentValue ? 'added to' : 'removed from'} blacklist`);
      
      // Then update UI
      setUsers(users.map(u => u.id === userId ? { ...u, onBlacklist: !u.onBlacklist } : u));
      
    } catch (error) {
      adminToast.error('Failed to update blacklist status');
    } finally {
      setConfirmModal({ isOpen: false, type: '', userId: null, currentValue: null, userName: '' });
    }
  };
  
  // --- Filtering and Sorting Logic ---
  const filteredAndSortedUsers = useMemo(() => {
    let sortableUsers = [...users];
    sortableUsers = sortableUsers.filter(user => {
      const statusMatch = filters.status ? String(user.status) === filters.status : true;
      const blacklistMatch = filters.blacklist ? String(user.onBlacklist) === filters.blacklist : true;
      return statusMatch && blacklistMatch;
    });

    if (searchTerm) {
        sortableUsers = sortableUsers.filter(user =>
        Object.values(user).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (sortConfig.key) {
      sortableUsers.sort((a, b) => {
        if (typeof a[sortConfig.key] === 'boolean') {
             if (a[sortConfig.key] === b[sortConfig.key]) return 0;
             const comparison = a[sortConfig.key] ? -1 : 1; 
             return sortConfig.direction === 'ascending' ? comparison : -comparison;
        }
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableUsers;
  }, [users, searchTerm, sortConfig, filters]);

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
  
  const SortableHeader = ({ children, name }) => (
    <th className="p-3 cursor-pointer" onClick={() => requestSort(name)}>
        <div className="flex items-center justify-between">
            {children}
            {sortConfig.key === name && (sortConfig.direction === 'ascending' ? <FaArrowUp /> : <FaArrowDown />)}
        </div>
    </th>
  );

  if (loading && users.length === 0) return <div className="p-10 text-center">Loading quote requesting users...</div>;

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-2">
      <div className="max-w-7xl mx-auto">
        {/* --- Filters --- */}
        <div className="bg-white p-4 rounded-t-lg shadow-sm border-b">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <select className="w-full p-2 border rounded-md" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                </select>
                <select className="w-full p-2 border rounded-md" value={filters.blacklist} onChange={(e) => setFilters({...filters, blacklist: e.target.value})}>
                    <option value="">All Blacklist</option>
                    <option value="true">On Blacklist</option>
                    <option value="false">Not on Blacklist</option>
                </select>
                <button onClick={() => { setFilters({ status: '', blacklist: '' }); setSearchTerm(''); }} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md">Reset</button>
            </div>
        </div>

        {/* --- Table --- */}
        <div className="bg-white p-6 rounded-b-lg shadow">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-semibold">Quote Requesters</h2>
              <p className="text-gray-600 text-sm mt-1">Users who request quotes from companies</p>
            </div>
            <div className="flex items-center mt-2 sm:mt-0">
              <label className="mr-2">Search:</label>
              <input type="text" className="p-2 border rounded-md" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase" style={{ backgroundColor: '#eaddc0' }}>
                <tr>
                  <SortableHeader name="id">Sr.No</SortableHeader>
                  <SortableHeader name="name">Name</SortableHeader>
                  <SortableHeader name="email">Email</SortableHeader>
                  <SortableHeader name="mobile">Mobile</SortableHeader>
                  <SortableHeader name="onBlacklist">Blacklist</SortableHeader>
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
                      <td className="p-3"><ToggleSwitch checked={user.onBlacklist} onChange={() => handleBlacklistToggle(user.id, user.name)} /></td>
                      <td className="p-3"><ToggleSwitch checked={user.status} onChange={() => handleStatusChange(user.id, user.name)} /></td>
                      <td className="p-3">
                        <div className="flex space-x-2">
                          <button onClick={() => handleEditUser(user)} className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"><FaPen /></button>
                          <button onClick={() => handleViewUser(user)} className="p-2 bg-pink-500 text-white rounded hover:bg-pink-600"><FaEye /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center p-4">No quote requesting users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4">
            <div className="text-gray-600 mb-2 sm:mb-0">
              Showing {filteredAndSortedUsers.length > 0 ? indexOfFirstEntry + 1 : 0} to {Math.min(indexOfLastEntry, filteredAndSortedUsers.length)} of {filteredAndSortedUsers.length} entries
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm">Show:</label>
              <select 
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="p-1 border rounded text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm">entries</span>
              
              <div className="flex items-center ml-4">
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
      </div>

      {/* --- View Detail Modal --- */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-xl font-bold">Quote Requester Details</h3>
              <button onClick={() => setViewingUser(null)} className="text-gray-500 hover:text-black"><FaTimes size={20}/></button>
            </div>
            <div className="space-y-3">
              <p><strong>Name:</strong> {viewingUser.name}</p>
              <p><strong>Email:</strong> {viewingUser.email}</p>
              <p><strong>Phone:</strong> {viewingUser.phone}</p>
              <p><strong>Role:</strong> {viewingUser.role}</p>
              <p><strong>Country:</strong> {viewingUser.country || 'N/A'}</p>
              <p><strong>Registration Date:</strong> {new Date(viewingUser.created_at).toLocaleDateString()}</p>
              <p><strong>Status:</strong> <span className={viewingUser.status ? 'text-green-600' : 'text-red-600'}>{viewingUser.status ? 'Active' : 'Inactive'}</span></p>
            </div>
            <button onClick={() => setViewingUser(null)} className="mt-6 w-full bg-gray-200 py-2 rounded font-semibold">Close</button>
          </div>
        </div>
      )}

      {/* --- Edit Modal --- */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-xl font-bold">Edit Quote Requester</h3>
              <button onClick={() => setEditingUser(null)} className="text-gray-500 hover:text-black"><FaTimes size={20}/></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input type="text" className="w-full p-2 border rounded" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input type="email" className="w-full p-2 border rounded" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium">Mobile</label>
                <input type="text" className="w-full p-2 border rounded" value={editForm.mobile} onChange={(e) => setEditForm({...editForm, mobile: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium">Country</label>
                <input type="text" className="w-full p-2 border rounded" value={editForm.country} onChange={(e) => setEditForm({...editForm, country: e.target.value})} />
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button onClick={handleSaveEdit} className="flex-1 bg-green-600 text-white py-2 rounded flex items-center justify-center gap-2 font-bold"><FaSave /> Save Changes</button>
              <button onClick={() => setEditingUser(null)} className="flex-1 bg-gray-300 py-2 rounded font-bold">Cancel</button>
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

export default User;