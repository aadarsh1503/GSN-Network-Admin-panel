import { useState, useEffect } from 'react';
import { FaPlus, FaCheck, FaClock, FaEdit } from 'react-icons/fa';
import toast from 'react-hot-toast';

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
      const token = localStorage.getItem('token');
      const response = await fetch('/api/version/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVersions(data);
      } else {
        toast.error('Failed to fetch versions');
      }
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
      const token = localStorage.getItem('token');
      const response = await fetch('/api/version/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newVersion)
      });

      if (response.ok) {
        toast.success('Version created successfully');
        setNewVersion({ version_number: '', description: '' });
        setShowCreateForm(false);
        fetchVersions();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create version');
      }
    } catch (error) {
      console.error('Error creating version:', error);
      toast.error('Error creating version');
    }
  };

  const handleSetCurrent = async (versionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/version/set-current/${versionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Current version updated successfully');
        fetchVersions();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update current version');
      }
    } catch (error) {
      console.error('Error updating current version:', error);
      toast.error('Error updating current version');
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">System Version Management</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
        >
          <FaPlus className="mr-2" />
          Create New Version
        </button>
      </div>

      {/* Create Version Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">Create New Version</h3>
          <form onSubmit={handleCreateVersion}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Version Number *
                </label>
                <input
                  type="text"
                  value={newVersion.version_number}
                  onChange={(e) => setNewVersion({...newVersion, version_number: e.target.value})}
                  placeholder="e.g., 1.2.0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newVersion.description}
                  onChange={(e) => setNewVersion({...newVersion, description: e.target.value})}
                  placeholder="Brief description of changes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Create Version
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
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
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Version
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {versions.map((version) => (
              <tr key={version.id} className={version.is_current ? 'bg-green-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900">
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
                  <div className="text-sm text-gray-900">
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(version.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {!version.is_current && (
                    <button
                      onClick={() => handleSetCurrent(version.id)}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      <FaEdit className="mr-1" size={12} />
                      Set as Current
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {versions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No versions found. Create the first version to get started.
        </div>
      )}
    </div>
  );
};

export default VersionManagement;