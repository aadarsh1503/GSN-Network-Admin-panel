import React, { useState } from 'react';
import { FaSort } from 'react-icons/fa'; // Icon for the table headers

const ProfileViewers = () => {
  const [entries, setEntries] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  
  // The data is empty to match the screenshot's empty state.
  // You can add objects to this array to see the populated state.
  const viewersData = [];

  // A reusable component for the sortable table headers
  const SortableHeader = ({ children }) => (
    <div className="flex items-center justify-between">
      <span>{children}</span>
      <FaSort className="text-gray-400" />
    </div>
  );

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full space-y-8">
      
      {/* --- Main Page Title --- */}
      <h2 className="text-2xl font-bold text-gray-800">Viewers List</h2>

      {/* --- Green Profile Views Banner --- */}
      <div className="bg-green-700 text-white rounded-lg p-8 text-center">
        <h3 className="text-4xl font-bold">Who Viewed Your Profile</h3>
        <p className="mt-2 text-green-200">Discover who is noticing me on Joinconference.online</p>
        <div className="flex justify-center items-center gap-16 md:gap-32 mt-8">
          <div className="flex flex-col items-center">
            <span className="text-7xl font-bold">0</span>
            <span className="mt-2 text-lg">This Week</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-7xl font-bold">0</span>
            <span className="mt-2 text-lg">This Month</span>
          </div>
        </div>
      </div>

      {/* --- Data Table Section --- */}
      <div>
        {/* Top Controls: Show Entries and Search */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Show</span>
            <select 
              value={entries} 
              onChange={(e) => setEntries(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#bca142]"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <span>entries</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <label htmlFor="search">Search:</label>
            <input 
              id="search"
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#bca142]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-[#D9CBAA] text-gray-800 text-sm">
              <tr>
                <th className="p-3 text-left font-semibold"><SortableHeader>Sr.No</SortableHeader></th>
                <th className="p-3 text-left font-semibold"><SortableHeader>Name</SortableHeader></th>
                <th className="p-3 text-left font-semibold"><SortableHeader>View Date</SortableHeader></th>
                <th className="p-3 text-left font-semibold"><SortableHeader>Viewer Email</SortableHeader></th>
                <th className="p-3 text-left font-semibold"><SortableHeader>Viewer Mobile</SortableHeader></th>
              </tr>
            </thead>
            <tbody>
              {viewersData.length > 0 ? (
                viewersData.map((viewer, index) => (
                  <tr key={viewer.id} className="border-b border-gray-200 hover:bg-gray-50">
                    {/* Your data rows would go here */}
                  </tr>
                ))
              ) : (
                // Empty state row
                <tr>
                  <td colSpan="5" className="text-center p-4 text-gray-500">
                    No data available in table
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Controls: Entry Count and Pagination */}
        <div className="flex flex-col md:flex-row items-center justify-between mt-4 gap-4">
          <div className="text-sm text-gray-600">
            Showing 0 to 0 of 0 entries
          </div>
          <div className="flex items-center">
            <button className="px-3 py-1 border border-[#D9CBAA] text-[#D9CBAA] font-semibold rounded-l-md hover:bg-yellow-50" disabled>
              Previous
            </button>
            <button className="px-3 py-1 border border-[#D9CBAA] text-[#D9CBAA] font-semibold rounded-r-md hover:bg-yellow-50">
              Next
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ProfileViewers;