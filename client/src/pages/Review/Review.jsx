import React, { useState } from 'react';
import { FiEdit, FiTrash2, FiChevronUp, FiChevronDown } from 'react-icons/fi';

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
const initialReviews = [
  {
    id: 1,
    userName: '', // The user name is intentionally blank as per the screenshot
    companyName: 'john wick company',
    reason: 'Supply Chain Disruptions',
    status: true, // true for 'on', false for 'off'
    dateTime: 'March 15, 2024 at 07:07 am'
  }
];

const Review = () => {
  const [reviews, setReviews] = useState(initialReviews);

  const handleToggle = (id) => {
    setReviews(reviews.map(review =>
      review.id === id ? { ...review, status: !review.status } : review
    ));
    console.log(`Toggled status for review ID: ${id}`);
  };

  const handleEdit = (id) => console.log(`Editing review ID: ${id}`);
  const handleDelete = (id) => console.log(`Deleting review ID: ${id}`);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Review</h1>

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
                <TableHeader>Status</TableHeader>
                <TableHeader>Date/Time</TableHeader>
                <TableHeader>Action</TableHeader>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review, index) => (
                <tr key={review.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 whitespace-nowrap text-gray-700">{index + 1}</td>
                  <td className="p-3 whitespace-nowrap text-gray-700">{review.userName}</td>
                  <td className="p-3 whitespace-nowrap text-gray-700">{review.companyName}</td>
                  <td className="p-3 whitespace-nowrap text-gray-700">{review.reason}</td>
                  <td className="p-3 whitespace-nowrap">
                    <ToggleSwitch checked={review.status} onChange={() => handleToggle(review.id)} />
                  </td>
                  <td className="p-3 whitespace-nowrap text-gray-700">{review.dateTime}</td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={() => handleEdit(review.id)}
                            className="bg-[#84c44e] text-white p-2 rounded-md hover:bg-[#76b046] transition-colors"
                            aria-label="Edit"
                        >
                            <FiEdit size={16} />
                        </button>
                        <button 
                            onClick={() => handleDelete(review.id)}
                            className="bg-[#e63273] text-white p-2 rounded-md hover:bg-[#d12c66] transition-colors"
                            aria-label="Delete"
                        >
                            <FiTrash2 size={16} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-gray-600">
            <p>Showing 1 to {reviews.length} of {reviews.length} entries</p>
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

export default Review;