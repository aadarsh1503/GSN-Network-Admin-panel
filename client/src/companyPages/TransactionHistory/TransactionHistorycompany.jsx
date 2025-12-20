import React, { useState } from 'react';
import { FaSort, FaEye } from 'react-icons/fa'; // Icons for the table

// --- DUMMY DATA ---
// This data structure matches the provided screenshot exactly.
const dummyData = [
  {
    id: 1,
    category: 'Third-Party Logistics Providers (3PLs)',
    planName: null, // No plan name for this entry
    amount: '49.00',
    paymentType: 'paypal',
    imageUrl: 'placeholder', // Special key for the generic image
    date: 'December 04, 2024',
  },
  {
    id: 2,
    category: 'Third-Party Logistics Providers (3PLs)',
    planName: 'Elite',
    amount: '99.00',
    paymentType: 'bank_transfer',
    imageUrl: 'https://i.imgur.com/example-logo.png', // A placeholder for a real logo URL
    date: 'April 24, 2024',
  },
  {
    id: 3,
    category: 'Third-Party Logistics Providers (3PLs)',
    planName: null,
    amount: '99.00',
    paymentType: 'paypal',
    imageUrl: 'placeholder',
    date: 'April 24, 2024',
  },
];

const TransactionHistorycompany = () => {
  const [entries, setEntries] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Reusable component for sortable table headers
  const SortableHeader = ({ children }) => (
    <div className="flex items-center justify-between">
      <span>{children}</span>
      <FaSort className="text-gray-400" />
    </div>
  );

  return (
    // ---- MODIFIED LINE ----
    // Changed max-w-5xl to max-w-6xl for a wider layout.
    // 'w-full' ensures it takes the full available width up to the max-width.
    // 'mx-auto' centers the component horizontally.
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Transaction History</h2>

      {/* Top Controls: Show Entries and Search */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Show</span>
          <select 
            value={entries} 
            onChange={(e) => setEntries(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-400"
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
            className="border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-[#D9CBAA] text-gray-800 text-sm">
            <tr>
              <th className="p-3 text-left font-semibold"><SortableHeader>Sr.No</SortableHeader></th>
              <th className="p-3 text-left font-semibold"><SortableHeader>Category Name</SortableHeader></th>
              <th className="p-3 text-left font-semibold"><SortableHeader>Plan Name</SortableHeader></th>
              <th className="p-3 text-left font-semibold"><SortableHeader>Amount</SortableHeader></th>
              <th className="p-3 text-left font-semibold"><SortableHeader>Payment Type</SortableHeader></th>
              <th className="p-3 text-left font-semibold"><SortableHeader>Transaction Images</SortableHeader></th>
              <th className="p-3 text-left font-semibold"><SortableHeader>Transaction Detail</SortableHeader></th>
              <th className="p-3 text-left font-semibold"><SortableHeader>Status</SortableHeader></th>
              <th className="p-3 text-left font-semibold"><SortableHeader>Date</SortableHeader></th>
            </tr>
          </thead>
          <tbody>
            {dummyData.map((transaction) => (
              <tr key={transaction.id} className="border-b border-gray-200 hover:bg-gray-50 align-middle">
                <td className="p-3 text-sm text-gray-700">{transaction.id}</td>
                <td className="p-3 text-sm text-gray-700">{transaction.category}</td>
                <td className="p-3 text-sm text-gray-700">{transaction.planName || '—'}</td>
                <td className="p-3 text-sm text-gray-700">{transaction.amount}</td>
                <td className="p-3 text-sm text-gray-700">{transaction.paymentType}</td>
                <td className="p-3 text-sm text-gray-700">
                  {transaction.imageUrl === 'placeholder' ? (
                     <img src="https://i.imgur.com/generic-image-placeholder.png" alt="Payment" className="h-8" />
                  ) : (
                     <img src={transaction.imageUrl} alt="Payment" className="h-8 border p-1" />
                  )}
                </td>
                <td className="p-3 text-sm text-gray-700">
                  <button className="bg-[#D9CBAA] text-white p-2 rounded-full hover:opacity-80 transition-opacity">
                    <FaEye />
                  </button>
                </td>
                <td className="p-3 text-sm text-gray-700">{/* Status column is empty as per image */}</td>
                <td className="p-3 text-sm text-gray-700 whitespace-nowrap">{transaction.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom Controls: Entry Count and Pagination */}
      <div className="flex flex-col md:flex-row items-center justify-between mt-4 gap-4">
        <div className="text-sm text-gray-600">
          Showing 1 to {dummyData.length} of {dummyData.length} entries
        </div>
        <div className="flex items-center">
          <button className="px-3 py-1 border border-gray-300 rounded-l-md hover:bg-gray-100 disabled:opacity-50" disabled>
            Previous
          </button>
          <button className="px-3 py-1 border-t border-b border-gray-300 text-gray-800 bg-[#D9CBAA]">
            1
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded-r-md hover:bg-gray-100">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistorycompany;