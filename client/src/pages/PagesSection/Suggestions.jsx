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
const suggestionsData = [
  {
    id: 1,
    name: 'John due',
    email: 'johndue@gmail.com',
    mobile: '+9343434343',
    imageUrl: 'https://i.imgur.com/3Y1Dk6H.png', // A placeholder logo that looks similar
    description: 'test'
  },
  {
    id: 2,
    name: 'riyadh shaheen',
    email: 'sales@gmail.com',
    mobile: '39676669',
    imageUrl: 'https://via.placeholder.com/40x40.png?text=Asset', // Placeholder for the second image
    description: 'test'
  }
];

const Suggestions = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Suggestions</h1>

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
                <TableHeader>Sr.No</TableHeader>
                <TableHeader>Name</TableHeader>
                <TableHeader>Email</TableHeader>
                <TableHeader>Mobile</TableHeader>
                <TableHeader>Image</TableHeader>
                <TableHeader>Description</TableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {suggestionsData.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-3 whitespace-nowrap text-gray-700">{index + 1}</td>
                  <td className="p-3 whitespace-nowrap text-gray-700">{item.name}</td>
                  <td className="p-3 whitespace-nowrap text-gray-700">{item.email}</td>
                  <td className="p-3 whitespace-nowrap text-gray-700">{item.mobile}</td>
                  <td className="p-3">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="h-10 w-10 object-cover rounded-md" 
                    />
                  </td>
                  <td className="p-3 whitespace-nowrap text-gray-700">{item.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-gray-600">
            <p>Showing 1 to {suggestionsData.length} of {suggestionsData.length} entries</p>
            <div className="flex items-center mt-2 sm:mt-0">
                <button className="px-3 py-1 border border-[#D9B95B] text-[#D9B95B] rounded-l-md hover:bg-gray-50">Previous</button>
                <button className="px-3 py-1 border-y border-[#D9B95B] bg-[#D9B95B] text-white">1</button>
                <button className="px-3 py-1 border border-[#D9B95B] text-[#D9B95B] rounded-r-md hover:bg-gray-50">Next</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Suggestions;