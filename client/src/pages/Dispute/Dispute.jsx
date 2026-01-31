import React, { useState, useEffect } from 'react';
import { FiTrash2, FiChevronUp, FiChevronDown, FiEye, FiMessageSquare, FiUser, FiHome } from 'react-icons/fi';
import { api } from '../../utils/api';
import { adminToast } from '../../utils/adminToast';

// --- Reusable Components ---

// Custom Toggle Switch Component for the Status column
const ToggleSwitch = ({ checked, onChange }) => (
  <button
    onClick={onChange}
    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none ${
      checked ? 'bg-green-500' : 'bg-gray-300'
    }`}
  >
    <span
      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

// Sortable Table Header
const SortableHeader = ({ children, sortKey, sortConfig, onSort }) => {
    const isSorted = sortConfig.key === sortKey;
    return (
        <th 
            className="p-3 text-left text-sm font-semibold text-gray-600 tracking-wider cursor-pointer hover:bg-gray-100"
            onClick={() => onSort(sortKey)}
        >
            <div className="flex items-center">
                <span>{children}</span>
                <div className="flex flex-col ml-auto">
                    <FiChevronUp className={`h-3 w-3 -mb-1 ${isSorted && sortConfig.direction === 'asc' ? 'text-gray-700' : 'text-gray-400'}`}/>
                    <FiChevronDown className={`h-3 w-3 -mt-1 ${isSorted && sortConfig.direction === 'desc' ? 'text-gray-700' : 'text-gray-400'}`}/>
                </div>
            </div>
        </th>
    );
};

const Dispute = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [viewingDispute, setViewingDispute] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch disputes
  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/disputes/admin/all');
      setDisputes(data);
    } catch (error) {
      console.error('Error fetching disputes:', error);
      adminToast.error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Handle status toggle (resolve/unresolve)
  const handleStatusToggle = async (dispute) => {
    const newStatus = dispute.status === 'resolved' ? 'pending' : 'resolved';
    
    try {
      await api.put(`/api/disputes/admin/${dispute.id}/status`, {
        status: newStatus,
        admin_response: newStatus === 'resolved' ? 'Dispute resolved by admin' : 'Dispute reopened'
      });
      
      adminToast.success(`Dispute ${newStatus === 'resolved' ? 'resolved' : 'reopened'} successfully`);
      fetchDisputes();
    } catch (error) {
      console.error('Error updating dispute status:', error);
      adminToast.error('Failed to update dispute status');
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this dispute?')) {
      return;
    }

    try {
      await api.delete(`/api/disputes/admin/${id}`);
      adminToast.success('Dispute deleted successfully');
      fetchDisputes();
    } catch (error) {
      console.error('Error deleting dispute:', error);
      adminToast.error('Failed to delete dispute');
    }
  };

  // Handle view details
  const handleViewDetails = async (dispute) => {
    try {
      const details = await api.get(`/api/disputes/admin/${dispute.id}`);
      setViewingDispute(details);
    } catch (error) {
      console.error('Error fetching dispute details:', error);
      adminToast.error('Failed to load dispute details');
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'investigating':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter and sort disputes
  const filteredAndSortedDisputes = React.useMemo(() => {
    let filtered = [...disputes];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(dispute =>
        dispute.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.reason_title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(dispute => dispute.status === statusFilter);
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [disputes, searchTerm, statusFilter, sortConfig]);

  // Pagination
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredAndSortedDisputes.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredAndSortedDisputes.length / entriesPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bca142]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Disputes Management</h1>
            <p className="text-gray-600">Handle disputes between users and companies</p>
          </div>
          <div className="bg-yellow-50 text-[#bca142] px-4 py-2 rounded-lg">
            <span className="font-semibold">{filteredAndSortedDisputes.length}</span> Disputes
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-600">
              <span>Show</span>
              <select 
                className="mx-2 border border-gray-300 rounded-md p-1"
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span>entries</span>
            </div>
            
            <select
              className="border border-gray-300 rounded-md p-1.5 text-sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <label htmlFor="search" className="mr-2">Search:</label>
            <input 
              id="search"
              type="text" 
              className="border border-gray-300 rounded-md p-1.5"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search disputes..."
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-hidden max-w-5xl mx-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#D9B95B]">
              <tr>
                <SortableHeader sortKey="id" sortConfig={sortConfig} onSort={handleSort}>ID</SortableHeader>
                <SortableHeader sortKey="user_name" sortConfig={sortConfig} onSort={handleSort}>User</SortableHeader>
                <SortableHeader sortKey="company_name" sortConfig={sortConfig} onSort={handleSort}>Company</SortableHeader>
                <SortableHeader sortKey="reason_title" sortConfig={sortConfig} onSort={handleSort}>Reason</SortableHeader>
                <SortableHeader sortKey="title" sortConfig={sortConfig} onSort={handleSort}>Title</SortableHeader>
                <SortableHeader sortKey="priority" sortConfig={sortConfig} onSort={handleSort}>Priority</SortableHeader>
                <th className="p-3 text-left text-sm font-semibold text-gray-600 tracking-wider">Images</th>
                <SortableHeader sortKey="status" sortConfig={sortConfig} onSort={handleSort}>Status</SortableHeader>
                <SortableHeader sortKey="created_at" sortConfig={sortConfig} onSort={handleSort}>Date</SortableHeader>
                <th className="p-3 text-left text-sm font-semibold text-gray-600 tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentEntries.length > 0 ? (
                currentEntries.map((dispute, index) => (
                  <tr key={dispute.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 whitespace-nowrap text-gray-700 font-medium">#{dispute.id}</td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiUser className="text-gray-400 mr-2" />
                        <div>
                          <div className="font-medium text-gray-900">{dispute.user_name}</div>
                          <div className="text-xs text-gray-500">{dispute.user_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiHome className="text-gray-400 mr-2" />
                        <div>
                          <div className="font-medium text-gray-900">{dispute.company_name}</div>
                          <div className="text-xs text-gray-500">{dispute.company_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap text-gray-700">{dispute.reason_title}</td>
                    <td className="p-3 text-gray-700 max-w-xs truncate">{dispute.title}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(dispute.priority)}`}>
                        {dispute.priority}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        {dispute.images && dispute.images.length > 0 ? (
                          <>
                            {dispute.images.slice(0, 2).map((img, i) => (
                              <img 
                                key={i} 
                                src={img.image_url} 
                                alt={`dispute-img-${i}`} 
                                className="h-8 w-8 object-cover rounded border"
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/32x32?text=IMG';
                                }}
                              />
                            ))}
                            {dispute.images.length > 2 && (
                              <span className="text-xs text-gray-500">+{dispute.images.length - 2}</span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">No images</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(dispute.status)}`}>
                        {dispute.status}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap text-gray-700">
                      {new Date(dispute.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetails(dispute)}
                          className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-colors"
                          title="View Details"
                        >
                          <FiEye size={16} />
                        </button>
                        <button
                          onClick={() => handleStatusToggle(dispute)}
                          className={`p-2 rounded-md transition-colors ${
                            dispute.status === 'resolved' 
                              ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                              : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                          title={dispute.status === 'resolved' ? 'Reopen Dispute' : 'Mark as Resolved'}
                        >
                          <FiMessageSquare size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(dispute.id)}
                          className="bg-[#e63273] text-white p-2 rounded-md hover:bg-[#d12c66] transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center p-8">
                    <div className="text-gray-500">
                      <p>No disputes found</p>
                      {searchTerm && <p className="text-sm">Try adjusting your search criteria</p>}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-gray-600">
          <p>
            Showing {filteredAndSortedDisputes.length > 0 ? indexOfFirstEntry + 1 : 0} to{' '}
            {Math.min(indexOfLastEntry, filteredAndSortedDisputes.length)} of{' '}
            {filteredAndSortedDisputes.length} entries
          </p>
          <div className="flex items-center mt-2 sm:mt-0">
            <button 
              className="px-3 py-1 border border-[#D9B95B] text-[#D9B95B] rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="px-3 py-1 border-y border-[#D9B95B] bg-[#D9B95B] text-white">
              {currentPage}
            </span>
            <button 
              className="px-3 py-1 border border-[#D9B95B] text-[#D9B95B] rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Dispute Details Modal */}
      {viewingDispute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Dispute Details #{viewingDispute.id}</h2>
              <button
                onClick={() => setViewingDispute(null)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <p className="mt-1 text-gray-900">{viewingDispute.title}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reason</label>
                    <p className="mt-1 text-gray-900">{viewingDispute.reason_title}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(viewingDispute.status)}`}>
                      {viewingDispute.status}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(viewingDispute.priority)}`}>
                      {viewingDispute.priority}
                    </span>
                  </div>
                </div>

                {/* Parties Involved */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Parties Involved</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User (Complainant)</label>
                    <div className="mt-1">
                      <p className="font-medium text-gray-900">{viewingDispute.user_name}</p>
                      <p className="text-sm text-gray-600">{viewingDispute.user_email}</p>
                      {viewingDispute.user_phone && <p className="text-sm text-gray-600">{viewingDispute.user_phone}</p>}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company (Respondent)</label>
                    <div className="mt-1">
                      <p className="font-medium text-gray-900">{viewingDispute.company_name}</p>
                      <p className="text-sm text-gray-600">{viewingDispute.company_email}</p>
                      {viewingDispute.company_phone && <p className="text-sm text-gray-600">{viewingDispute.company_phone}</p>}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{viewingDispute.description}</p>
                </div>

                {/* Images */}
                {viewingDispute.images && viewingDispute.images.length > 0 && (
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Evidence Images</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {viewingDispute.images.map((img, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={img.image_url} 
                            alt={`Evidence ${index + 1}`}
                            className="w-full h-24 object-cover rounded border"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/150x100?text=Image+Not+Found';
                            }}
                          />
                          <span className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                            {img.image_type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Response */}
                {viewingDispute.admin_response && (
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Admin Response</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{viewingDispute.admin_response}</p>
                  </div>
                )}

                {/* Timeline */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Timeline</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Created:</strong> {new Date(viewingDispute.created_at).toLocaleString()}</p>
                    <p><strong>Last Updated:</strong> {new Date(viewingDispute.updated_at).toLocaleString()}</p>
                    {viewingDispute.resolved_at && (
                      <p><strong>Resolved:</strong> {new Date(viewingDispute.resolved_at).toLocaleString()}</p>
                    )}
                    {viewingDispute.resolved_by_name && (
                      <p><strong>Resolved By:</strong> {viewingDispute.resolved_by_name}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setViewingDispute(null)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dispute;