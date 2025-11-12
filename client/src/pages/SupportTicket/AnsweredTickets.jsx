import React from 'react';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';

// --- Reusable Components ---

// Table Header Cell with Sorting Icons
const TableHeader = ({ children }) => (
    <th className="p-3 text-left text-sm font-semibold text-gray-600 tracking-wider">
        <div className="flex items-center">
            <span>{children}</span>
            <div className="flex flex-col ml-auto">
                <FiChevronUp className="h-3 w-3 -mb-1 text-gray-400"/>
                <FiChevronDown className="h-3 w-3 -mt-1 text-gray-400"/>
            </div>
        </div>
    </th>
);

const AnsweredTickets = () => {
  // Mock Data is an empty array to show the empty state
  const answeredTicketsData = [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">
        {/* I've corrected the typo from "Answerd" to "Answered" for clarity */}
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Answered Tickets</h1>
        
        {/* Table Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <div className="flex items-center text-sm text-gray-600">
            <span>Show</span>
            <select className="mx-2 border border-gray-300 rounded-md p-1">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <span>entries</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <label htmlFor="search" className="mr-2">Search:</label>
            <input id="search" type="text" className="border border-gray-300 rounded-md p-1.5" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#D9B95B]">
              <tr>
                <TableHeader>Subject</TableHeader>
                <TableHeader>Submitted By</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Action</TableHeader>
              </tr>
            </thead>
            <tbody>
              {answeredTicketsData.length === 0 ? (
                // --- Empty State Row ---
                <tr>
                  <td colSpan="4" className="text-center py-10 text-gray-500 border-b">
                    No data available in table
                  </td>
                </tr>
              ) : (
                // --- Data Mapping (won't run with empty array) ---
                answeredTicketsData.map((ticket) => (
                  <tr key={ticket.id} className="border-b hover:bg-gray-50">
                    {/* Data cells would go here */}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-gray-600">
          <p>Showing 0 to 0 of 0 entries</p>
          <div className="flex items-center mt-2 sm:mt-0">
            <button className="px-3 py-1 border border-[#D9B95B] text-[#D9B95B] rounded-l-md hover:bg-gray-50">Previous</button>
            <button className="px-3 py-1 border-y border-r border-[#D9B95B] text-[#D9B95B] rounded-r-md hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnsweredTickets;