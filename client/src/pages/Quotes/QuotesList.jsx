import React, { useState, useMemo } from 'react';
import { FaFilter, FaPen, FaEye } from 'react-icons/fa';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa6';

// --- Dummy Data ---
// A comprehensive set of dummy data to test all features.
const initialQuotes = [
  { id: 1, shippingMode: 'Air', arrivalDate: '2024-01-24', createdDate: '2024-01-19', isApproved: true },
  { id: 2, shippingMode: 'Air', arrivalDate: '2024-01-20', createdDate: '2024-01-19', isApproved: false },
  { id: 3, shippingMode: 'Air', arrivalDate: '2024-01-27', createdDate: '2024-01-19', isApproved: true },
  { id: 4, shippingMode: 'Air', arrivalDate: '2024-01-21', createdDate: '2024-01-20', isApproved: true },
  { id: 5, shippingMode: 'Surface (Road / Rail / Sea)', arrivalDate: '2024-01-31', createdDate: '2024-01-22', isApproved: true },
  { id: 6, shippingMode: 'Air', arrivalDate: '2021-02-10', createdDate: '2024-01-30', isApproved: false },
  { id: 7, shippingMode: 'Surface (Road / Rail / Sea)', arrivalDate: '2024-04-30', createdDate: '2024-04-27', isApproved: false },
  { id: 8, shippingMode: 'Surface (Road / Rail / Sea)', arrivalDate: '2024-05-10', createdDate: '2024-05-07', isApproved: false },
  { id: 9, shippingMode: 'Air', arrivalDate: '2025-01-16', createdDate: '2025-01-07', isApproved: false },
  { id: 10, shippingMode: 'Surface (Road / Rail / Sea)', arrivalDate: '2025-01-16', createdDate: '2025-01-07', isApproved: false },
  { id: 11, shippingMode: 'Air', arrivalDate: '2024-06-05', createdDate: '2024-06-01', isApproved: true },
  { id: 12, shippingMode: 'Rail', arrivalDate: '2024-07-20', createdDate: '2024-07-15', isApproved: false },
];

// --- Helper Function for Date Formatting ---
const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
};

function QuotesList() {
  const [quotes, setQuotes] = useState(initialQuotes);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });
  
  // State for filter inputs
  const [filters, setFilters] = useState({ date: '', quoteType: 'All' });
  // State to apply filters only when "Filter" button is clicked
  const [appliedFilters, setAppliedFilters] = useState({ date: '', quoteType: 'All' });


  // --- Logic for Sorting, Filtering, and Searching ---
  const filteredAndSortedQuotes = useMemo(() => {
    let sortableQuotes = [...quotes];

    // Apply Filters (from appliedFilters state)
    sortableQuotes = sortableQuotes.filter(quote => {
        const dateMatch = appliedFilters.date ? quote.createdDate === appliedFilters.date : true;
        const typeMatch = appliedFilters.quoteType !== 'All' ? quote.shippingMode.includes(appliedFilters.quoteType) : true;
        return dateMatch && typeMatch;
    });

    // Apply Search
    if (searchTerm) {
        sortableQuotes = sortableQuotes.filter(quote =>
            Object.values(quote).some(val =>
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }

    // Apply Sorting
    if (sortConfig.key) {
      sortableQuotes.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return sortableQuotes;
  }, [quotes, searchTerm, sortConfig, appliedFilters]);

  // --- Pagination Logic ---
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredAndSortedQuotes.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredAndSortedQuotes.length / entriesPerPage);

  // --- Handlers ---
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const handleApprovalChange = (quoteId) => {
    setQuotes(quotes.map(quote =>
      quote.id === quoteId ? { ...quote, isApproved: !quote.isApproved } : quote
    ));
  };

  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to first page on filter
    setAppliedFilters(filters);
  };
  
  // --- Sortable Header Component ---
  const SortableHeader = ({ children, name }) => {
    const isSorted = sortConfig.key === name;
    return (
        <th className="p-3 cursor-pointer" onClick={() => handleSort(name)}>
            <div className="flex items-center justify-between">
                {children}
                <span className="ml-2">
                    {isSorted ? 
                        (sortConfig.direction === 'ascending' ? <FaArrowUp size={12} /> : <FaArrowDown size={12} />) 
                        : <div className="opacity-30"><FaArrowUp size={12} /></div>
                    }
                </span>
            </div>
        </th>
    );
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* --- Filter Section --- */}
        <div className="bg-white p-4 rounded-t-lg shadow">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input 
                        id="date"
                        type="date"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                        value={filters.date}
                        onChange={(e) => setFilters({...filters, date: e.target.value})}
                    />
                </div>
                <div>
                    <label htmlFor="quoteType" className="block text-sm font-medium text-gray-700 mb-1">Quote Type</label>
                    <select 
                        id="quoteType"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                        value={filters.quoteType}
                        onChange={(e) => setFilters({...filters, quoteType: e.target.value})}
                    >
                        <option value="All">All</option>
                        <option value="Air">Air</option>
                        <option value="Surface">Surface</option>
                        <option value="Rail">Rail</option>
                    </select>
                </div>
                <button 
                    onClick={handleApplyFilters}
                    className="flex items-center justify-center bg-[#eaddc0] hover:bg-opacity-90 text-gray-800 font-semibold py-2 px-4 rounded-md shadow"
                >
                    <FaFilter className="mr-2" /> Filter
                </button>
            </div>
        </div>

        {/* --- Main Content and Table Section --- */}
        <div className="bg-white p-6 rounded-b-lg shadow">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">All Quotes List</h2>
          
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
            <div className="flex items-center mb-2 sm:mb-0 text-gray-600">
              <span>Show</span>
              <select 
                value={entriesPerPage}
                onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
                }}
                className="p-2 border border-gray-300 rounded-md mx-2 focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
              <span>entries</span>
            </div>
            <div className="flex items-center text-gray-600">
              <label htmlFor="search" className="mr-2">Search:</label>
              <input
                id="search"
                type="text"
                className="p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                }}
              />
            </div>
          </div>
          
          {/* --- Quotes Table --- */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700">
              <thead className="text-xs text-gray-800 uppercase" style={{ backgroundColor: '#eaddc0' }}>
                <tr>
                  <SortableHeader name="id">Sr.No</SortableHeader>
                  <SortableHeader name="shippingMode">Shipping Mode</SortableHeader>
                  <SortableHeader name="arrivalDate">Arrival Date</SortableHeader>
                  <SortableHeader name="createdDate">Created Date</SortableHeader>
                  <SortableHeader name="isApproved">Approval</SortableHeader>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentEntries.length > 0 ? (
                  currentEntries.map((quote, index) => (
                    <tr key={quote.id} className="bg-white border-b hover:bg-gray-50 align-middle">
                      <td className="p-3">{quote.id}</td>
                      <td className="p-3">{quote.shippingMode}</td>
                      <td className="p-3">{formatDate(quote.arrivalDate)}</td>
                      <td className="p-3">{formatDate(quote.createdDate)}</td>
                      <td className="p-3">
                        <input
                            type="checkbox"
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            checked={quote.isApproved}
                            onChange={() => handleApprovalChange(quote.id)}
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex space-x-2">
                          <button className="p-2 bg-green-500 text-white rounded hover:bg-green-600">
                            <FaPen size={12} />
                          </button>
                          <button className="p-2 bg-pink-500 text-white rounded hover:bg-pink-600">
                            <FaEye size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center p-4 text-gray-500">No matching records found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* --- Table Footer with Info and Pagination --- */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-gray-600">
            <div>
              Showing {filteredAndSortedQuotes.length > 0 ? indexOfFirstEntry + 1 : 0} to {Math.min(indexOfLastEntry, filteredAndSortedQuotes.length)} of {filteredAndSortedQuotes.length} entries
            </div>
            <div className="flex items-center mt-2 sm:mt-0">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-l-md bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="px-4 py-1 border-t border-b text-gray-800" style={{backgroundColor: '#eaddc0'}}>
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
  );
}

export default QuotesList;