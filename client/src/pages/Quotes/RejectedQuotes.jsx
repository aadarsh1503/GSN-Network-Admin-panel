import React from 'react'; // Fixed the import statement here
import { FaArrowUp, FaArrowDown } from 'react-icons/fa6';
import { useState, useMemo } from 'react';

// --- Dummy Data ---
// Two dummy entries as requested, ready for testing.
const initialRejectedQuotes = [
  { id: 1, shippingMode: 'Air', departureCountry: 'Germany', departureState: 'Berlin', departureType: 'Commercial address', arrivalCountry: 'Japan', arrivalState: 'Tokyo', arrivalType: 'Commercial address', arrivalDate: '2024-03-10 00:00:00', productDescription: 'Electronics', packageType: 'Pallet 48x40', incoterms: 'CIF', quantity: 25, weight: '500Kilos', size: 'L120*W80*H100 cm', additionalItems: 'fragile, handle-with-care', additionalNote: 'Rejected: Incomplete documentation' },
  { id: 2, shippingMode: 'Surface (Road / Rail / Sea)', departureCountry: 'USA', departureState: 'California', departureType: 'Residential address', arrivalCountry: 'Brazil', arrivalState: 'São Paulo', arrivalType: 'Residential address', arrivalDate: '2024-04-05 00:00:00', productDescription: 'Apparel', packageType: 'Container 20\'', incoterms: 'FOB', quantity: 1200, weight: '3Tonnes', size: 'N/A', additionalItems: '-', additionalNote: 'Rejected: Prohibited items' },
];


function RejectedQuotes() {
  // --- FIX: Initialize state with the dummy data ---
  const [quotes, setQuotes] = useState(initialRejectedQuotes);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });

  // --- Logic for Sorting and Searching ---
  const filteredAndSortedQuotes = useMemo(() => {
    let sortableQuotes = [...quotes];

    if (searchTerm) {
        sortableQuotes = sortableQuotes.filter(quote =>
            Object.values(quote).some(val =>
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }

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
  }, [quotes, searchTerm, sortConfig]);

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
  
  // --- Sortable Header Component ---
  const SortableHeader = ({ children, name }) => {
    return (
        <th className="p-3 cursor-pointer whitespace-nowrap" onClick={() => handleSort(name)}>
            <div className="flex items-center justify-between">
                {children}
                <div className="flex flex-col ml-2 opacity-50">
                   <FaArrowUp size={10} />
                   <FaArrowDown size={10} className="-mt-1" />
                </div>
            </div>
        </th>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Rejected Quotes</h2>
        
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
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </div>
          <div className="flex items-center text-gray-600">
            <label htmlFor="search" className="mr-2">Search:</label>
            <input
              id="search"
              type="text"
              className="p-2 w-64 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
              value={searchTerm}
              onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
              }}
            />
          </div>
        </div>
        
        {/* --- Quotes Table --- */}
        <div className="overflow-x-auto border-t border-b border-gray-200">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="text-xs text-gray-800 uppercase" style={{ backgroundColor: '#eaddc0' }}>
              <tr>
                <SortableHeader name="id">Sr.No</SortableHeader>
                <SortableHeader name="shippingMode">Shipping Mode</SortableHeader>
                <SortableHeader name="departureCountry">Departure Country</SortableHeader>
                <SortableHeader name="departureState">Departure State</SortableHeader>
                <SortableHeader name="departureType">Departure Type</SortableHeader>
                <SortableHeader name="arrivalCountry">Arrival Country</SortableHeader>
                <SortableHeader name="arrivalState">Arrival State</SortableHeader>
                <SortableHeader name="arrivalType">Arrival Type</SortableHeader>
                <SortableHeader name="arrivalDate">Arrival Date</SortableHeader>
                <SortableHeader name="productDescription">Product Description</SortableHeader>
                <SortableHeader name="packageType">Package Type</SortableHeader>
                <SortableHeader name="incoterms">Incoterms</SortableHeader>
                <SortableHeader name="quantity">Quantity</SortableHeader>
                <SortableHeader name="weight">Weight</SortableHeader>
                <SortableHeader name="size">Size</SortableHeader>
                <SortableHeader name="additionalItems">Additional Items</SortableHeader>
                <SortableHeader name="additionalNote">Additional Note</SortableHeader>
              </tr>
            </thead>
            <tbody>
              {currentEntries.length > 0 ? (
                currentEntries.map((quote) => (
                  <tr key={quote.id} className="bg-white border-b hover:bg-gray-50 align-middle">
                    <td className="p-3 text-center">{quote.id}</td>
                    <td className="p-3 whitespace-nowrap">{quote.shippingMode}</td>
                    <td className="p-3">{quote.departureCountry}</td>
                    <td className="p-3">{quote.departureState}</td>
                    <td className="p-3">{quote.departureType}</td>
                    <td className="p-3">{quote.arrivalCountry}</td>
                    <td className="p-3">{quote.arrivalState}</td>
                    <td className="p-3">{quote.arrivalType}</td>
                    <td className="p-3 whitespace-nowrap">{quote.arrivalDate}</td>
                    <td className="p-3">{quote.productDescription}</td>
                    <td className="p-3">{quote.packageType}</td>
                    <td className="p-3">{quote.incoterms}</td>
                    <td className="p-3">{quote.quantity}</td>
                    <td className="p-3">{quote.weight}</td>
                    <td className="p-3 whitespace-nowrap">{quote.size}</td>
                    <td className="p-3">{quote.additionalItems}</td>
                    <td className="p-3">{quote.additionalNote}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="17" className="text-center p-8 text-gray-500">No data available in table</td>
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
              disabled={currentPage === 1 || totalPages === 0}
              className="px-3 py-1 border rounded-l-md bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{borderColor: '#eaddc0'}}
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1 border rounded-r-md bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{borderColor: '#eaddc0'}}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RejectedQuotes;