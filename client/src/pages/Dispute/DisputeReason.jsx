import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiChevronUp, FiChevronDown, FiSave, FiX } from 'react-icons/fi';
import { api } from '../../utils/api';
import { adminToast } from '../../utils/adminToast';

// --- Reusable Component for Sortable Table Headers ---
const SortableHeader = ({ children, sortKey, sortConfig, onSort }) => {
    const isSorted = sortConfig.key === sortKey;
    return (
        <th 
            className="p-3 text-left text-sm font-semibold text-white tracking-wider cursor-pointer hover:bg-[#b8932f]"
            onClick={() => onSort(sortKey)}
        >
            <div className="flex items-center">
                <span>{children}</span>
                <div className="flex flex-col ml-auto">
                    <FiChevronUp className={`h-3 w-3 -mb-1 ${isSorted && sortConfig.direction === 'asc' ? 'text-white' : 'text-gray-300'}`}/>
                    <FiChevronDown className={`h-3 w-3 -mt-1 ${isSorted && sortConfig.direction === 'desc' ? 'text-white' : 'text-gray-300'}`}/>
                </div>
            </div>
        </th>
    );
};

const DisputeReason = () => {
    const [disputeReasons, setDisputeReasons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
    
    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingReason, setEditingReason] = useState(null);
    const [formData, setFormData] = useState({ title: '', description: '' });

    // Fetch dispute reasons
    useEffect(() => {
        fetchDisputeReasons();
    }, []);

    const fetchDisputeReasons = async () => {
        try {
            setLoading(true);
            const data = await api.get('/api/disputes/admin/reasons');
            setDisputeReasons(data);
        } catch (error) {
            console.error('Error fetching dispute reasons:', error);
            adminToast.error('Failed to load dispute reasons');
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

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title.trim()) {
            adminToast.error('Title is required');
            return;
        }

        try {
            if (editingReason) {
                await api.put(`/api/disputes/admin/reasons/${editingReason.id}`, {
                    ...formData,
                    is_active: editingReason.is_active
                });
                adminToast.success('Dispute reason updated successfully');
            } else {
                await api.post('/api/disputes/admin/reasons', formData);
                adminToast.success('Dispute reason created successfully');
            }
            
            setShowAddModal(false);
            setEditingReason(null);
            setFormData({ title: '', description: '' });
            fetchDisputeReasons();
        } catch (error) {
            console.error('Error saving dispute reason:', error);
            adminToast.error(error.response?.data?.message || 'Failed to save dispute reason');
        }
    };

    // Handle edit
    const handleEdit = (reason) => {
        setEditingReason(reason);
        setFormData({
            title: reason.title,
            description: reason.description || ''
        });
        setShowAddModal(true);
    };

    // Handle delete
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this dispute reason?')) {
            return;
        }

        try {
            await api.delete(`/api/disputes/admin/reasons/${id}`);
            adminToast.success('Dispute reason deleted successfully');
            fetchDisputeReasons();
        } catch (error) {
            console.error('Error deleting dispute reason:', error);
            adminToast.error(error.response?.data?.message || 'Failed to delete dispute reason');
        }
    };

    // Handle toggle active status
    const handleToggleActive = async (reason) => {
        try {
            await api.put(`/api/disputes/admin/reasons/${reason.id}`, {
                ...reason,
                is_active: !reason.is_active
            });
            adminToast.success(`Dispute reason ${!reason.is_active ? 'activated' : 'deactivated'} successfully`);
            fetchDisputeReasons();
        } catch (error) {
            console.error('Error updating dispute reason:', error);
            adminToast.error('Failed to update dispute reason status');
        }
    };

    // Filter and sort data
    const filteredAndSortedReasons = React.useMemo(() => {
        let filtered = [...disputeReasons];

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(reason =>
                reason.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (reason.description && reason.description.toLowerCase().includes(searchTerm.toLowerCase()))
            );
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
    }, [disputeReasons, searchTerm, sortConfig]);

    // Pagination
    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    const currentEntries = filteredAndSortedReasons.slice(indexOfFirstEntry, indexOfLastEntry);
    const totalPages = Math.ceil(filteredAndSortedReasons.length / entriesPerPage);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bca142]"></div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-black mb-2">Dispute Reasons</h1>
                        <p className="text-black">Manage dispute categories and reasons</p>
                    </div>
                    <button 
                        onClick={() => {
                            setEditingReason(null);
                            setFormData({ title: '', description: '' });
                            setShowAddModal(true);
                        }}
                        className="flex items-center bg-[#bca142] text-white font-bold py-2 px-4 rounded-md hover:bg-[#b8932f] transition-colors"
                    >
                        <FiPlus className="mr-2 text-white" />
                        Add Reason
                    </button>
                </div>

                {/* Top Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                    <div className="flex items-center text-sm text-black">
                        <span>Show</span>
                        <select 
                            className="mx-2 border border-gray-300 rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-[#bca142]"
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
                    <div className="flex items-center text-sm text-black">
                        <label htmlFor="search" className="mr-2">Search:</label>
                        <input 
                            id="search"
                            type="text" 
                            className="border border-gray-300 rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-[#bca142]"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Search reasons..."
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-[#bca142]">
                            <tr>
                                <SortableHeader sortKey="id" sortConfig={sortConfig} onSort={handleSort}>Sr. No</SortableHeader>
                                <SortableHeader sortKey="title" sortConfig={sortConfig} onSort={handleSort}>Title</SortableHeader>
                                <th className="p-3 text-left text-sm font-semibold text-white tracking-wider">Description</th>
                                <SortableHeader sortKey="is_active" sortConfig={sortConfig} onSort={handleSort}>Status</SortableHeader>
                                <SortableHeader sortKey="created_at" sortConfig={sortConfig} onSort={handleSort}>Created</SortableHeader>
                                <th className="p-3 text-left text-sm font-semibold text-white tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {currentEntries.length > 0 ? (
                                currentEntries.map((reason, index) => (
                                    <tr key={reason.id} className="hover:bg-gray-50">
                                        <td className="p-3 whitespace-nowrap text-black">{indexOfFirstEntry + index + 1}</td>
                                        <td className="p-3 text-black font-medium">{reason.title}</td>
                                        <td className="p-3 text-black max-w-xs truncate">
                                            {reason.description || 'No description'}
                                        </td>
                                        <td className="p-3 whitespace-nowrap">
                                            <button
                                                onClick={() => handleToggleActive(reason)}
                                                className={`px-3 py-1 text-xs font-medium rounded-full ${
                                                    reason.is_active 
                                                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                                                }`}
                                            >
                                                {reason.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="p-3 whitespace-nowrap text-black">
                                            {new Date(reason.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-3 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <button 
                                                    onClick={() => handleEdit(reason)}
                                                    className="bg-[#bca142] text-white p-2 rounded-md hover:bg-[#b8932f] transition-colors"
                                                    title="Edit"
                                                >
                                                    <FiEdit className="text-white" size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(reason.id)}
                                                    className="bg-black text-white p-2 rounded-md hover:bg-gray-800 transition-colors"
                                                    title="Delete"
                                                >
                                                    <FiTrash2 className="text-white" size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center p-8">
                                        <div className="text-gray-500">
                                            <p>No dispute reasons found</p>
                                            {searchTerm && <p className="text-sm">Try adjusting your search criteria</p>}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-black">
                    <p>
                        Showing {filteredAndSortedReasons.length > 0 ? indexOfFirstEntry + 1 : 0} to{' '}
                        {Math.min(indexOfLastEntry, filteredAndSortedReasons.length)} of{' '}
                        {filteredAndSortedReasons.length} entries
                    </p>
                    <div className="flex items-center mt-2 sm:mt-0">
                        <button 
                            className="px-3 py-1 border border-gray-300 rounded-l-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>
                        {[...Array(totalPages).keys()].slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2)).map(number => (
                            <button 
                                key={number + 1}
                                onClick={() => setCurrentPage(number + 1)}
                                className={`px-3 py-1 border-t border-b ${currentPage === number + 1 ? 'bg-[#bca142] text-white font-bold border-[#bca142]' : 'border-gray-300 hover:bg-gray-100'}`}
                            >
                                {number + 1}
                            </button>
                        ))}
                        <button 
                            className="px-3 py-1 border border-gray-300 rounded-r-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || totalPages === 0}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-black">
                                {editingReason ? 'Edit Dispute Reason' : 'Add New Dispute Reason'}
                            </h3>
                            <button 
                                onClick={() => {
                                    setShowAddModal(false);
                                    setEditingReason(null);
                                    setFormData({ title: '', description: '' });
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FiX size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-black mb-1">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-[#bca142] focus:border-transparent"
                                        placeholder="Enter dispute reason title"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-black mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-[#bca142] focus:border-transparent"
                                        rows="3"
                                        placeholder="Enter description (optional)"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setEditingReason(null);
                                        setFormData({ title: '', description: '' });
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex items-center px-4 py-2 bg-[#bca142] text-white rounded hover:bg-[#b8932f]"
                                >
                                    <FiSave className="mr-2 text-white" />
                                    {editingReason ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DisputeReason;