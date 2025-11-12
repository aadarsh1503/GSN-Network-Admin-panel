import React, { useState, useMemo } from 'react';
// Corrected the import to include the icons actually used (FiChevronUp, FiChevronDown)
// and remove the incorrect ones (FaSort, etc.)
import { FiPlus, FiEdit, FiTrash2, FiChevronUp, FiChevronDown } from 'react-icons/fi';

// --- Dummy Data ---
// This mimics fetching data from an API. We need 20 entries to match the screenshot.
const initialCategories = [
    // Existing Data
    { id: 1, name: 'Retailers' },
    { id: 2, name: 'Manufacturers' },
    { id: 3, name: 'Distributors' },
    { id: 4, name: 'Automotive Industry' },
    { id: 5, name: 'Technology Companies' },
    { id: 6, name: 'Healthcare and Pharmaceuticals' },
    { id: 7, name: 'Food and Beverage Industry' },
    { id: 8, name: 'Clothing and Apparel' },
    { id: 9, name: 'Construction and Building Materials' },
    { id: 10, name: 'Energy and Utilities' },
  
    // New Dummy Data
    { id: 11, name: 'Aerospace and Defense' },
    { id: 12, name: 'Financial Services and Banking' },
    { id: 13, name: 'Hospitality and Tourism' },
    { id: 14, name: 'Media and Entertainment' },
    { id: 15, name: 'Telecommunications' },
    { id: 16, name: 'Real Estate' },
    { id: 17, name: 'Education Sector' },
    { id: 18, name: 'Agriculture and Farming' },
    { id: 19, name: 'Professional Services (Legal, Consulting)' },
    { id: 20, name: 'Non-Profit Organizations' },
    { id: 21, name: 'Government and Public Sector' },
    { id: 22, name: 'Biotechnology' },
    { id: 23, name: 'Insurance Industry' },
    { id: 24, name: 'Mining and Metals' },
    { id: 25, name: 'Chemical Industry' },
  ];

const BusinessCategories = () => {
  // --- State Management ---
  const [categories, setCategories] = useState(initialCategories);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // --- Client-Side Data Processing ---

  // 1. Filter data based on search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories;
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  // 2. Sort the filtered data
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
  
  // 3. Paginate the sorted data
  const paginatedCategories = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * itemsPerPage;
    const lastPageIndex = firstPageIndex + itemsPerPage;
    return sortedCategories.slice(firstPageIndex, lastPageIndex);
  }, [sortedCategories, currentPage, itemsPerPage]);

  // --- Handlers ---

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const handleAddCategory = () => {
    if (newCategoryName.trim() === '') return;
    const newCategory = {
      id: categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1,
      name: newCategoryName,
    };
    setCategories([...categories, newCategory]);
    setNewCategoryName('');
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
        setCategories(categories.filter(category => category.id !== id));
    }
  };

  const totalPages = Math.ceil(sortedCategories.length / itemsPerPage);
  const startEntry = (currentPage - 1) * itemsPerPage + 1;
  const endEntry = Math.min(startEntry + itemsPerPage - 1, sortedCategories.length);

  // --- Render ---
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Logistics Categories</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md flex items-center transition duration-300"
        >
          <FiPlus className="mr-2" /> Add
        </button>
      </div>

      {/* Controls: Entries per page and Search */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2 text-gray-600">
          <span>Show</span>
          <select 
            value={itemsPerPage}
            onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1); // Reset to first page
            }}
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
            onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page
            }}
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
                    Sr. No
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
            {paginatedCategories.map((category, index) => (
              <tr key={category.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-4">{startEntry + index}</td>
                <td className="py-3 px-4">{category.name}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <button className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-md transition duration-300">
                      <FiEdit />
                    </button>
                    <button onClick={() => handleDelete(category.id)} className="bg-pink-500 hover:bg-pink-600 text-white p-2 rounded-md transition duration-300">
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer and Pagination */}
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
          {[...Array(totalPages).keys()].map(number => (
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

      {/* Add Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Add New Category</h3>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Enter category name"
              className="w-full border border-gray-300 rounded-md p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <div className="flex justify-end space-x-4">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddCategory}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Save Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessCategories;