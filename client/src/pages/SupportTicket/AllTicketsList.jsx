import React, { useState } from 'react'; // <-- Import useState
import { FiFilter, FiEye, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import ReplyTicket from './ReplyTicket'; // <-- Import the new component

// --- Reusable Components (No changes here) ---

const StatusBadge = ({ status }) => {
  const baseStyle = 'px-3 py-1 text-xs font-medium rounded-md capitalize';
  
  switch (status.toLowerCase()) {
    case 'pending':
      return <span className={`${baseStyle} bg-[#f0e6c8] text-[#a57e2a]`}>{status}</span>;
    case 'closed':
      return <span className={`${baseStyle} bg-gray-500 text-white`}>{status}</span>;
    default:
      return <span className={`${baseStyle} bg-gray-200 text-gray-800`}>{status}</span>;
  }
};

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

// --- Mock Data (No changes here) ---
const ticketsData = [
  { id: 1, subject: '343535', submittedBy: '', status: 'closed' },
  { id: 2, subject: 'hello world', submittedBy: '', status: 'pending' },
  { id: 3, subject: 'hi ma\'am', submittedBy: 'bus4', status: 'pending' },
  { id: 4, subject: 'test', submittedBy: '', status: 'pending' },
  { id: 5, subject: 'test alert', submittedBy: '', status: 'pending' },
  { id: 6, subject: 'test alert', submittedBy: '', status: 'pending' },
  { id: 7, subject: 'test ticket', submittedBy: '', status: 'pending' },
  { id: 8, subject: 'test ticket', submittedBy: '', status: 'pending' },
  { id: 9, subject: 'Untitled', submittedBy: '', status: 'pending' },
  { id: 10, subject: 'Untitled', submittedBy: '', status: 'pending' },
];

const AllTicketsList = () => {
    // --- STATE MANAGEMENT FOR VIEW SWITCHING ---
    const [view, setView] = useState('list'); // Can be 'list' or 'detail'
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    
    // --- UPDATED CLICK HANDLER ---
    const handleActionClick = (id) => {
        console.log(`Viewing ticket with ID: ${id}`);
        setSelectedTicketId(id);
        setView('detail'); // Switch to the detail view
    };

    // --- FUNCTION TO RETURN TO THE LIST ---
    const handleCloseDetailView = () => {
        setView('list');
        setSelectedTicketId(null);
    };

    // --- CONDITIONAL RENDERING ---
    // If the view is 'detail', show the ReplyTicket component
    if (view === 'detail') {
        return <ReplyTicket ticketId={selectedTicketId} onClose={handleCloseDetailView} />;
    }

    // Otherwise, show the tickets list (the original component)
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
            {/* Filter Section */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input type="date" className="w-full border border-gray-300 rounded-md p-2 focus:ring-yellow-500 focus:border-yellow-500"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quote Type</label>
                    <select className="w-full border border-gray-300 rounded-md p-2 focus:ring-yellow-500 focus:border-yellow-500">
                        <option>All</option>
                        <option>Type 1</option>
                        <option>Type 2</option>
                    </select>
                </div>
                <button className="flex items-center justify-center bg-[#D9B95B] text-white px-4 py-2 rounded-md hover:bg-[#c8a84a] transition-colors">
                <FiFilter className="mr-2" />
                Filter
                </button>
            </div>
            </div>

            {/* Tickets Table Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4">All Tickets List</h2>
                
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
                        <tbody className="divide-y divide-gray-200">
                            {ticketsData.map((ticket) => (
                                <tr key={ticket.id} className="hover:bg-gray-50">
                                    <td className="p-3 whitespace-nowrap">
                                        <a href="#" className="text-blue-600 font-medium hover:underline">{ticket.subject}</a>
                                    </td>
                                    <td className="p-3 whitespace-nowrap text-gray-700">{ticket.submittedBy}</td>
                                    <td className="p-3 whitespace-nowrap">
                                        <StatusBadge status={ticket.status} />
                                    </td>
                                    <td className="p-3 whitespace-nowrap">
                                        <button 
                                        onClick={() => handleActionClick(ticket.id)}
                                        className="bg-[#e63273] text-white p-2 rounded-md hover:bg-[#d12c66] transition-colors"
                                        aria-label="View ticket"
                                        >
                                            <FiEye size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer */}
                <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-gray-600">
                    <p>Showing 1 to {ticketsData.length} of {ticketsData.length} entries</p>
                    <div className="flex items-center mt-2 sm:mt-0">
                        <button className="px-3 py-1 border border-gray-300 rounded-l-md hover:bg-gray-100">Previous</button>
                        <button className="px-3 py-1 border-y border-gray-300 bg-[#D9B95B] text-white">1</button>
                        <button className="px-3 py-1 border border-gray-300 rounded-r-md hover:bg-gray-100">Next</button>
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
};

export default AllTicketsList;