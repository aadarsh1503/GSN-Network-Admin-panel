import React, { useState } from 'react';
import { FiEye, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import ReplyTicket from './ReplyTicket'; // We reuse the same detail page component

// --- Reusable Components (Copied from AllTicketsList for self-containment) ---

// Status Badge Component for consistent styling
const StatusBadge = ({ status }) => {
  const baseStyle = 'px-3 py-1 text-xs font-medium rounded-md capitalize';
  
  if (status.toLowerCase() === 'pending') {
    return <span className={`${baseStyle} bg-[#f0e6c8] text-[#a57e2a]`}>{status}</span>;
  }
  return <span className={`${baseStyle} bg-gray-200 text-gray-800`}>{status}</span>;
};

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

// --- Mock Data (Only contains pending tickets) ---
const pendingTicketsData = [
  { id: 1, subject: 'hi ma\'am', submittedBy: 'bus4', status: 'pending' },
  // You can add more pending tickets here if needed for testing
];

const PendingTickets = () => {
  // State management to switch between list and detail view
  const [view, setView] = useState('list');
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  
  // Handler to switch to the detail view when the eye icon is clicked
  const handleActionClick = (id) => {
    console.log(`Viewing ticket with ID: ${id}`);
    setSelectedTicketId(id);
    setView('detail');
  };

  // Handler to return to the list view from the detail page
  const handleCloseDetailView = () => {
    setView('list');
    setSelectedTicketId(null);
  };

  // Conditional Rendering: If view is 'detail', show the ReplyTicket component
  if (view === 'detail') {
    return <ReplyTicket ticketId={selectedTicketId} onClose={handleCloseDetailView} />;
  }

  // Otherwise, render the list of pending tickets
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Pending Tickets</h1>
        
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
              {pendingTicketsData.map((ticket) => (
                <tr key={ticket.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 whitespace-nowrap">
                    <a href="#" className="text-blue-600 font-bold hover:underline">{ticket.subject}</a>
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
          <p>Showing 1 to {pendingTicketsData.length} of {pendingTicketsData.length} entries</p>
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

export default PendingTickets;