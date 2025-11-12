import React from 'react';
import { FiPlus, FiEdit, FiTrash2, FiChevronUp, FiChevronDown } from 'react-icons/fi';

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
const disputeReasonsData = [
    { id: 1, title: 'Breach of Contract' },
    { id: 2, title: 'Non-payment or Late Payment' },
    { id: 3, title: 'Misrepresentation or Fraud' },
    { id: 4, title: 'Quality or Performance Issues' },
    { id: 5, title: 'Delivery Delays' },
    { id: 6, title: 'Termination of Agreement' },
    { id: 7, title: 'Intellectual Property Infringement' },
    { id: 8, title: 'Scope Creep or Change Orders' },
    { id: 9, title: 'Confidentiality Breach' },
    { id: 10, title: 'Disagreement Over Terms' },
];

const DisputeReason = () => {
    
    const handleEdit = (id) => console.log(`Editing item with id: ${id}`);
    const handleDelete = (id) => console.log(`Deleting item with id: ${id}`);

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Dispute Reason</h1>
                    <button className="flex items-center bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
                        <FiPlus className="mr-2" />
                        Add
                    </button>
                </div>

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
                                <TableHeader>Title</TableHeader>
                                <TableHeader>Action</TableHeader>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {disputeReasonsData.map((item, index) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="p-3 whitespace-nowrap text-gray-700">{index + 1}</td>
                                    <td className="p-3 whitespace-nowrap text-gray-700">{item.title}</td>
                                    <td className="p-3 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                            <button 
                                                onClick={() => handleEdit(item.id)}
                                                className="bg-[#84c44e] text-white p-2 rounded-md hover:bg-[#76b046] transition-colors"
                                                aria-label="Edit"
                                            >
                                                <FiEdit size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(item.id)}
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
                    <p>Showing 1 to {disputeReasonsData.length} of {disputeReasonsData.length} entries</p>
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

export default DisputeReason;