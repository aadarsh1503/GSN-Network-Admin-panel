import { useState, useEffect } from 'react';
import { FaPlus, FaCheck, FaClock, FaEdit, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';

const VersionManagement = () => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newVersion, setNewVersion] = useState({
    version_number: '',
    description: ''
  });

  useEffect(() => {
    fetchVersions();
  }, []);

  const fetchVersions = async () => {
    try {
      const data = await api.get('/api/version/all');
      setVersions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching versions:', error);
      toast.error('Error fetching versions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVersion = async (e) => {
    e.preventDefault();
    
    if (!newVersion.version_number.trim()) {
      toast.error('Version number is required');
      return;
    }

    try {
      await api.post('/api/version/create', newVersion);
      toast.success('Version created successfully');
      setNewVersion({ version_number: '', description: '' });
      setShowCreateForm(false);
      fetchVersions();
    } catch (error) {
      console.error('Error creating version:', error);
      toast.error(error.message || 'Error creating version');
    }
  };

  const handleSetCurrent = async (versionId) => {
    try {
      await api.put(`/api/version/set-current/${versionId}`);
      toast.success('Current version updated successfully');
      fetchVersions();
    } catch (error) {
      console.error('Error updating current version:', error);
      toast.error(error.message || 'Error updating current version');
    }
  };

  const handleDeleteVersion = async (versionId, versionNumber, isCurrent) => {
    // Prevent deleting the current version
    if (isCurrent) {
      toast.error('Cannot delete the current active version');
      return;
    }

    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete version ${versionNumber}? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/api/version/delete/${versionId}`);
      toast.success('Version deleted successfully');
      fetchVersions();
    } catch (error) {
      console.error('Error deleting version:', error);
      toast.error(error.message || 'Error deleting version');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bca142]"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-black">System Version Management</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-[#bca142] text-white px-4 py-2 rounded-md hover:bg-[#b8932f] flex items-center"
        >
          <FaPlus className="mr-2 text-white" />
          Create New Version
        </button>
      </div>

      {/* Create Version Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-4 text-black">Create New Version</h3>
          <form onSubmit={handleCreateVersion}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Version Number *
                </label>
                <input
                  type="text"
                  value={newVersion.version_number}
                  onChange={(e) => setNewVersion({...newVersion, version_number: e.target.value})}
                  placeholder="e.g., 1.2.0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#bca142]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newVersion.description}
                  onChange={(e) => setNewVersion({...newVersion, description: e.target.value})}
                  placeholder="Brief description of changes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#bca142]"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-[#bca142] text-white px-4 py-2 rounded-md hover:bg-[#b8932f]"
              >
                Create Version
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-200 text-black px-4 py-2 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Versions List */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-[#bca142]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Version
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Created Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {versions.map((version) => (
              <tr key={version.id} className={version.is_current ? 'bg-green-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-black">
                      v{version.version_number}
                    </span>
                    {version.is_current && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <FaCheck className="mr-1" size={10} />
                        Current
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-black">
                    {version.description || 'No description'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {version.is_current ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <FaCheck className="mr-1" size={10} />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <FaClock className="mr-1" size={10} />
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                  {formatDate(version.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    {version.is_current ? (
                      <span className="text-green-600 flex items-center">
                        <FaCheck className="mr-1" size={12} />
                        Current Version
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetCurrent(version.id)}
                        className="bg-[#bca142] hover:bg-[#b8932f] text-white px-3 py-1 rounded-md flex items-center transition-colors"
                      >
                        <FaEdit className="mr-1" size={12} />
                        Set as Current
                      </button>
                    )}
                    
                    {/* Delete button - always show but disabled for current version */}
                    <button
                      onClick={() => handleDeleteVersion(version.id, version.version_number, version.is_current)}
                      disabled={version.is_current}
                      className={`px-3 py-1 rounded-md flex items-center transition-colors ${
                        version.is_current 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'bg-black hover:bg-gray-800 text-white'
                      }`}
                      title={version.is_current ? 'Cannot delete current version' : 'Delete version'}
                    >
                      <FaTrash className="mr-1" size={12} />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {versions.length === 0 && (
        <div className="text-center py-8 text-black">
          No versions found. Create the first version to get started.
        </div>
      )}
    </div>
  );
};

export default VersionManagement;