import { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaToggleOn, FaToggleOff, FaBan } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';

const RegularUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    try {
      const data = await api.get('/api/user/regular-users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    const filtered = Array.isArray(users) ? users.filter(user =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.mobile?.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];
    setFilteredUsers(filtered);
  };

  const toggleUserStatus = async (userId, currentStatus, type) => {
    try {
      await api.put(`/api/user/company-status/${userId}`, {
        type: type,
        value: !currentStatus
      });
      toast.success(`User ${type} updated successfully`);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error(`Error updating user ${type}:`, error);
      toast.error(`Failed to update user ${type}`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CDA435]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Regular Users</h1>
            <p className="text-gray-600 mt-1">Manage quote requesters and individual users</p>
          </div>
          <div className="bg-yellow-50 text-[#CDA435] px-4 py-2 rounded-lg">
            <span className="font-semibold">{filteredUsers.length}</span> Users
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search users by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <FaUser className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500">
              {users.length === 0 
                ? "No regular users have registered yet." 
                : "No users match your search criteria."
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center">
                          <FaUser className="text-[#CDA435]" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {user.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <FaEnvelope className="mr-2 text-gray-400" />
                        {user.email}
                      </div>
                      {user.mobile && (
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <FaPhone className="mr-2 text-gray-400" />
                          {user.mobile}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.status 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {user.onBlacklist && (
                          <div className="flex items-center">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              <FaBan className="inline mr-1" />
                              Blacklisted
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {/* Status Toggle */}
                        <button
                          onClick={() => toggleUserStatus(user.id, user.status, 'status')}
                          className={`flex items-center px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200 ${
                            user.status
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                          title={user.status ? 'Deactivate User' : 'Activate User'}
                        >
                          {user.status ? (
                            <>
                              <FaToggleOff className="mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <FaToggleOn className="mr-1" />
                              Activate
                            </>
                          )}
                        </button>

                        {/* Blacklist Toggle */}
                        <button
                          onClick={() => toggleUserStatus(user.id, user.onBlacklist, 'blacklist')}
                          className={`flex items-center px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200 ${
                            user.onBlacklist
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                          title={user.onBlacklist ? 'Remove from Blacklist' : 'Add to Blacklist'}
                        >
                          {user.onBlacklist ? (
                            <>
                              <FaToggleOn className="mr-1" />
                              Unblock
                            </>
                          ) : (
                            <>
                              <FaBan className="mr-1" />
                              Block
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegularUsers;