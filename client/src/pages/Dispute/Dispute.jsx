import React, { useState } from 'react';
import { FiTrash2, FiChevronUp, FiChevronDown } from 'react-icons/fi';

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


// --- Mock Data (Replace with your API data) ---
const initialDisputes = [
  {
    id: 1,
    userName: '', // Intentionally blank as per the screenshot
    companyName: 'john wick company',
    reason: 'Disagreement Over Terms',
    title: 'Late Delivery',
    images: [
        'https://i.imgur.com/3Y1Dk6H.png', // Placeholder images
        'https://i.imgur.com/8Q9Z5M2.png',
    ],
    status: true, // true for 'on', false for 'off'
    date: 'March 07, 2024'
  }
];

const Dispute = () => {
  const [disputes, setDisputes] = useState(initialDisputes);

  const handleToggle = (id) => {
    setDisputes(disputes.map(dispute =>
      dispute.id === id ? { ...dispute, status: !dispute.status } : dispute
    ));
    console.log(`Toggled status for dispute ID: ${id}`);
  };

  const handleDelete = (id) => console.log(`Deleting dispute ID: ${id}`);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Dispute</h1>

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
                <TableHeader>User Name</TableHeader>
                <TableHeader>Company Name</TableHeader>
                <TableHeader>Reason</TableHeader>
                <TableHeader>Title</TableHeader>
                <TableHeader>Images</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Date</TableHeader>
                <TableHeader>Action</TableHeader>
              </tr>
            </thead>
            <tbody>
              {disputes.map((dispute, index) => (
                <tr key={dispute.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 whitespace-nowrap text-gray-700">{index + 1}</td>
                  <td className="p-3 whitespace-nowrap text-gray-700">{dispute.userName}</td>
                  <td className="p-3 whitespace-nowrap text-gray-700">{dispute.companyName}</td>
                  <td className="p-3 whitespace-nowrap text-gray-700">{dispute.reason}</td>
                  <td className="p-3 whitespace-nowrap text-gray-700">{dispute.title}</td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {dispute.images.map((imgUrl, i) => (
                        <img key={i} src={imgUrl} alt={`dispute-img-${i}`} className="h-10 w-10 object-cover rounded-md border" />
                      ))}
                    </div>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <ToggleSwitch checked={dispute.status} onChange={() => handleToggle(dispute.id)} />
                  </td>
                  <td className="p-3 whitespace-nowrap text-gray-700">{dispute.date}</td>
                  <td className="p-3 whitespace-nowrap">
                    <button 
                        onClick={() => handleDelete(dispute.id)}
                        className="bg-[#e63273] text-white p-2 rounded-md hover:bg-[#d12c66] transition-colors"
                        aria-label="Delete"
                    >
                        <FiTrash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-gray-600">
            <p>Showing 1 to {disputes.length} of {disputes.length} entries</p>
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

export default Dispute;