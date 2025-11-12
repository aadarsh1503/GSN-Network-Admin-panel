import React from 'react';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';

// --- Reusable Component for Table Headers ---
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

// --- Mock Data (Replace with your API data) ---
const subscribersData = [
    { id: 1, email: 'marcuscollins1995@yahoo.com', date: '2024-03-08 15:29:33' },
    { id: 2, email: 'marcuscollins1995@yahoo.com', date: '2024-03-08 15:29:29' },
    { id: 3, email: 'marcuscollins1995@yahoo.com', date: '2024-03-08 15:29:26' },
    { id: 4, email: 'marcuscollins1995@yahoo.com', date: '2024-03-08 15:29:06' },
    { id: 5, email: 'marcuscollins1995@yahoo.com', date: '2024-03-08 15:29:05' },
    { id: 6, email: 'marcuscollins1995@yahoo.com', date: '2024-03-08 15:29:00' },
    { id: 7, email: 'lucinda_harrisbr6v@outlook.com', date: '2024-03-04 01:35:14' },
    { id: 8, email: 'lucinda_harrisbr6v@outlook.com', date: '2024-03-04 01:35:11' },
    { id: 9, email: 'lucinda_harrisbr6v@outlook.com', date: '2024-03-04 01:35:07' },
    { id: 10, email: 'lucinda_harrisbr6v@outlook.com', date: '2024-03-04 01:34:51' },
];
const totalEntries = 23;

const Subscribers = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Subscribers</h1>

        {/* Top Controls */}
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
            <input 
              id="search"
              type="text" 
              className="border border-gray-300 rounded-md p-1.5"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#D9B95B]">
              <tr>
                <TableHeader>Sr. No</TableHeader>
                <TableHeader>Email</TableHeader>
                <TableHeader>Date</TableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subscribersData.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-3 whitespace-nowrap text-gray-700">{index + 1}</td>
                  <td className="p-3 whitespace-nowrap text-gray-700">{item.email}</td>
                  <td className="p-3 whitespace-nowrap text-gray-700">{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-gray-600">
            <p>Showing 1 to {subscribersData.length} of {totalEntries} entries</p>
            <div className="flex items-center mt-2 sm:mt-0">
                <button className="px-3 py-1 border border-[#D9B95B] text-[#D9B95B] rounded-l-md hover:bg-gray-50">Previous</button>
                <button className="px-3 py-1 border-y border-[#D9B95B] bg-[#D9B95B] text-white">1</button>
                <button className="px-3 py-1 border-y border-r border-[#D9B95B] text-[#D9B95B] hover:bg-gray-50">2</button>
                <button className="px-3 py-1 border-y border-r border-[#D9B95B] text-[#D9B95B] hover:bg-gray-50">3</button>
                <button className="px-3 py-1 border border-[#D9B95B] text-[#D9B95B] rounded-r-md hover:bg-gray-50">Next</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Subscribers;