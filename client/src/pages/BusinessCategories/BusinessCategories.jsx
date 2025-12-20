import React, { useState, useMemo, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiChevronUp, FiChevronDown } from 'react-icons/fi';

const BusinessCategories = () => {
  // --- State Management ---
  const [categories, setCategories] = useState([]);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null); // Track editing item

  // API State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- API Configuration ---
  const API_URL = '/api/business-categories'; 
  const getAuthHeader = () => {
      const token = localStorage.getItem('token');
      return { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
      };
  };

  // --- 1. Fetch Data ---
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
        setLoading(true);
        const response = await fetch(API_URL, { headers: getAuthHeader() });
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories(data);
        setError(null);
    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  // --- 2. Modal Handlers ---
  const openAddModal = () => {
    setEditingCategory(null);
    setNewCategoryName('');
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setNewCategoryName('');
  };

  // --- 3. Save Handler ---
  const handleSave = async () => {
    if (newCategoryName.trim() === '') return;
    
    if (editingCategory) {
        await handleUpdateCategory();
    } else {
        await handleAddCategory();
    }
  };

  // --- 4. API Operations ---

  const handleAddCategory = async () => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify({ name: newCategoryName }),
        });
        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Error adding category');
            return;
        }

        setCategories([...categories, data]);
        closeModal();
        alert('Category added successfully!');
    } catch (err) {
        console.error(err);
        alert('Failed to connect to server');
    }
  };

  const handleUpdateCategory = async () => {
    try {
        const response = await fetch(`${API_URL}/${editingCategory.id}`, {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify({ name: newCategoryName }),
        });
        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Error updating category');
            return;
        }

        const updatedCategories = categories.map(cat => 
            cat.id === editingCategory.id ? data : cat
        );
        setCategories(updatedCategories);
        closeModal();
        alert('Category updated successfully!');
    } catch (err) {
        console.error(err);
        alert('Failed to connect to server');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: getAuthHeader(),
        });

        if (!response.ok) {
            const data = await response.json();
            alert(data.message || 'Error deleting category');
            return;
        }

        setCategories(categories.filter(category => category.id !== id));
    } catch (err) {
        console.error(err);
        alert('Failed to delete category');
    }
  };

  // --- Client-Side Data Processing ---
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories;
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  const sortedCategories = useMemo(() => {
    let sortableItems = [...filteredCategories];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredCategories, sortConfig]);
  
  const paginatedCategories = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * itemsPerPage;
    const lastPageIndex = firstPageIndex + itemsPerPage;
    return sortedCategories.slice(firstPageIndex, lastPageIndex);
  }, [sortedCategories, currentPage, itemsPerPage]);

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const totalPages = Math.ceil(sortedCategories.length / itemsPerPage);
  const startEntry = (currentPage - 1) * itemsPerPage + 1;
  const endEntry = Math.min(startEntry + itemsPerPage - 1, sortedCategories.length);

  // --- Render ---
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Business Categories</h2>
        <button 
          onClick={openAddModal}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md flex items-center transition duration-300"
        >
          <FiPlus className="mr-2" /> Add
        </button>
      </div>
      
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2 text-gray-600">
          <span>Show</span>
          <select 
            value={itemsPerPage}
            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          <span>entries</span>
        </div>
        <div className="flex items-center space-x-2">
          <label htmlFor="search" className="text-gray-600">Search:</label>
          <input 
            id="search"
            type="text" 
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-[#e0c58a] text-gray-700">
            <tr>
              <th className="py-3 px-4 text-left font-semibold cursor-pointer" onClick={() => handleSort('id')}>
                <div className="flex items-center">
                    ID
                    {sortConfig.key === 'id' ? (sortConfig.direction === 'ascending' ? <FiChevronUp className="ml-1"/> : <FiChevronDown className="ml-1"/>) : null}
                </div>
              </th>
              <th className="py-3 px-4 text-left font-semibold cursor-pointer" onClick={() => handleSort('name')}>
                 <div className="flex items-center">
                    Name
                    {sortConfig.key === 'name' ? (sortConfig.direction === 'ascending' ? <FiChevronUp className="ml-1"/> : <FiChevronDown className="ml-1"/>) : null}
                 </div>
              </th>
              <th className="py-3 px-4 text-left font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {loading ? (
                <tr><td colSpan="3" className="text-center py-4">Loading data...</td></tr>
            ) : paginatedCategories.length === 0 ? (
                <tr><td colSpan="3" className="text-center py-4">No categories found.</td></tr>
            ) : (
                paginatedCategories.map((category) => (
                <tr key={category.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">{category.id}</td>
                    <td className="py-3 px-4">{category.name}</td>
                    <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={() => openEditModal(category)}
                            className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-md transition duration-300">
                        <FiEdit />
                        </button>
                        <button 
                            onClick={() => handleDelete(category.id)} 
                            className="bg-pink-500 hover:bg-pink-600 text-white p-2 rounded-md transition duration-300">
                        <FiTrash2 />
                        </button>
                    </div>
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-gray-600">
          Showing {sortedCategories.length > 0 ? startEntry : 0} to {endEntry} of {sortedCategories.length} entries
        </div>
        <div className="flex items-center">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded-l-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          {[...Array(totalPages).keys()].slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2)).map(number => (
            <button 
              key={number + 1}
              onClick={() => setCurrentPage(number + 1)}
              className={`px-3 py-1 border-t border-b ${currentPage === number + 1 ? 'bg-[#e0c58a] text-gray-800 font-bold border-[#e0c58a]' : 'border-gray-300 hover:bg-gray-100'}`}
            >
              {number + 1}
            </button>
          ))}
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded-r-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      {/* Add/Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Enter category name"
              className="w-full border border-gray-300 rounded-md p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <div className="flex justify-end space-x-4">
              <button 
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                {editingCategory ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessCategories;