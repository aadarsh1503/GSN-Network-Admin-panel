import React, { useState } from 'react';
import { FiTrash2, FiChevronUp, FiChevronDown } from 'react-icons/fi';

// --- Reusable Components ---

// Custom Toggle Switch Component
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
            <div className="flex flex-col ml-2">
                <FiChevronUp className="h-3 w-3 -mb-1 text-gray-400"/>
                <FiChevronDown className="h-3 w-3 -mt-1 text-gray-400"/>
            </div>
        </div>
    </th>
);


// --- Mock Data (Replace with your API data) ---
const initialTransactions = [
  { id: 1, user: 'johndue1(company)', planName: '', amount: 49.00, paymentType: 'paypal', imageUrl: 'https://via.placeholder.com/40x20.png?text=IMG', approved: false, status: 'pending', date: 'December 04, 2024' },
  { id: 2, user: 'johndue1(company)', planName: 'Elite', amount: 99.00, paymentType: 'bank_transfer', imageUrl: 'https://via.placeholder.com/40x20.png?text=LOGO', approved: false, status: 'rejected', date: 'April 24, 2024' },
  { id: 3, user: 'johndue1(company)', planName: '', amount: 99.00, paymentType: 'paypal', imageUrl: 'https://via.placeholder.com/40x20.png?text=IMG', approved: false, status: 'pending', date: 'April 24, 2024' },
  { id: 4, user: '()', planName: 'Premier', amount: 49.00, paymentType: 'bank_transfer', imageUrl: 'https://via.placeholder.com/40x20.png?text=PAY', approved: false, status: 'rejected', date: 'March 16, 2024' },
  { id: 5, user: 'company logistics (company)', planName: '', amount: 99.00, paymentType: '', imageUrl: 'https://via.placeholder.com/40x20.png?text=IMG', approved: true, status: 'approved', date: 'January 20, 2024' },
  { id: 6, user: 'company logistics (company)', planName: '', amount: 49.00, paymentType: '', imageUrl: 'https://via.placeholder.com/40x20.png?text=IMG', approved: false, status: 'pending', date: 'January 20, 2024' },
  { id: 7, user: 'company logistics (company)', planName: '', amount: 49.00, paymentType: '', imageUrl: 'https://via.placeholder.com/40x20.png?text=IMG', approved: true, status: 'rejected', date: 'January 20, 2024' },
];

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState(initialTransactions);

  const handleToggle = (id) => {
    setTransactions(transactions.map(tx =>
      tx.id === id ? { ...tx, approved: !tx.approved } : tx
    ));
  };

  const handleDelete = (id) => {
    console.log(`Deleting transaction with ID: ${id}`);
    // setTransactions(transactions.filter(tx => tx.id !== id));
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Transaction History</h1>

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
                <TableHeader>User Name (Role)</TableHeader>
                <TableHeader>Plan Name</TableHeader>
                <TableHeader>Amount</TableHeader>
                <TableHeader>Payment Type</TableHeader>
                <TableHeader>Transaction Images</TableHeader>
                <TableHeader>Approved</TableHeader>
                <TableHeader>Reject</TableHeader>
                <TableHeader>Date</TableHeader>
                <TableHeader>Action</TableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((tx, index) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="p-3 whitespace-nowrap text-gray-700">{index + 1}</td>
                  <td className="p-3 whitespace-nowrap text-gray-700">{tx.user}</td>
                  <td className="p-3 whitespace-nowrap text-gray-700">{tx.planName}</td>
                  <td className="p-3 whitespace-nowrap text-gray-700">{tx.amount.toFixed(2)}</td>
                  <td className="p-3 whitespace-nowrap text-gray-700">{tx.paymentType}</td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="flex items-center">
                        <span className="mr-2 text-gray-600">{Math.floor(Math.random() * 30) + 100}</span>
                        <img src={tx.imageUrl} alt="transaction" className="w-auto h-5" />
                    </div>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <ToggleSwitch checked={tx.approved} onChange={() => handleToggle(tx.id)} />
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {tx.status === 'rejected' && (
                        <button className="bg-[#e63273] text-white text-xs font-bold py-1 px-3 rounded-full">
                            Reject
                        </button>
                    )}
                  </td>
                  <td className="p-3 whitespace-nowrap text-gray-700">{tx.date}</td>
                  <td className="p-3 whitespace-nowrap">
                    <button 
                      onClick={() => handleDelete(tx.id)}
                      className="bg-[#e63273] text-white p-2 rounded-md hover:bg-[#d12c66] transition-colors"
                      aria-label="Delete transaction"
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
            <p>Showing 1 to {transactions.length} of {transactions.length} entries</p>
            <div className="flex items-center mt-2 sm:mt-0">
                <button className="px-3 py-1 border border-gray-300 rounded-l-md hover:bg-gray-100">Previous</button>
                <button className="px-3 py-1 border-y border-gray-300 bg-[#D9B95B] text-white">1</button>
                <button className="px-3 py-1 border border-gray-300 rounded-r-md hover:bg-gray-100">Next</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;