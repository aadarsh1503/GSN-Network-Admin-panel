import { useState, useEffect } from 'react';
import { FaSort, FaEye } from 'react-icons/fa';
import api from '../../utils/api';

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const fetchMyTickets = async () => {
    try {
      const data = await api('/api/tickets/my-tickets');
      setTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedTickets = filteredTickets.slice(0, entries);

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      answered: 'bg-blue-100 text-blue-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[priority] || 'bg-gray-100 text-gray-800'}`}>
        {priority?.charAt(0).toUpperCase() + priority?.slice(1)}
      </span>
    );
  };

  const openModal = (ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedTicket(null);
    setIsModalOpen(false);
  };

  const SortableHeader = ({ children }) => (
    <div className="flex items-center justify-between">
      <span>{children}</span>
      <FaSort className="text-gray-400" />
    </div>
  );

  if (loading) {
    return <div className="text-center py-8">Loading tickets...</div>;
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">My Tickets</h2>

      {/* Top Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Show</span>
          <select 
            value={entries} 
            onChange={(e) => setEntries(Number(e.target.value))}
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
              <th className="p-3 text-left font-semibold"><SortableHeader>Ticket No</SortableHeader></th>
              <th className="p-3 text-left font-semibold"><SortableHeader>Subject</SortableHeader></th>
              <th className="p-3 text-left font-semibold"><SortableHeader>Priority</SortableHeader></th>
              <th className="p-3 text-left font-semibold"><SortableHeader>Status</SortableHeader></th>
              <th className="p-3 text-left font-semibold"><SortableHeader>Date</SortableHeader></th>
              <th className="p-3 text-left font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {displayedTickets.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-6 text-center text-gray-500">
                  No tickets found
                </td>
              </tr>
            ) : (
              displayedTickets.map((ticket, index) => (
                <tr key={ticket.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-3 text-sm text-gray-700">{index + 1}</td>
                  <td className="p-3 text-sm text-gray-700 font-medium">{ticket.ticket_number}</td>
                  <td className="p-3 text-sm text-gray-700">{ticket.subject}</td>
                  <td className="p-3 text-sm">{getPriorityBadge(ticket.priority)}</td>
                  <td className="p-3 text-sm">{getStatusBadge(ticket.status)}</td>
                  <td className="p-3 text-sm text-gray-700">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-sm text-gray-700">
                    <button 
                      onClick={() => openModal(ticket)}
                      className="bg-pink-600 text-white p-2 rounded-md hover:bg-pink-700 transition-colors"
                    >
                      <FaEye size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between mt-4 gap-4">
        <div className="text-sm text-gray-600">
          Showing 1 to {Math.min(entries, filteredTickets.length)} of {filteredTickets.length} entries
        </div>
        <div className="flex items-center">
          <button className="px-3 py-1 border border-[#D9CBAA] text-[#D9CBAA] font-semibold rounded-l-md hover:bg-amber-50" disabled>
            Previous
          </button>
          <button className="px-3 py-1 border-t border-b border-gray-300 text-gray-800 bg-[#D9CBAA]">
            1
          </button>
          <button className="px-3 py-1 border border-[#D9CBAA] text-[#D9CBAA] font-semibold rounded-r-md hover:bg-amber-50">
            Next
          </button>
        </div>
      </div>

      {/* Ticket Detail Modal */}
      {isModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Ticket Details</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Ticket Number</label>
                  <p className="font-medium">{selectedTicket.ticket_number}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <p>{getStatusBadge(selectedTicket.status)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Category</label>
                  <p className="capitalize">{selectedTicket.category}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Priority</label>
                  <p>{getPriorityBadge(selectedTicket.priority)}</p>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500">Subject</label>
                <p className="font-medium">{selectedTicket.subject}</p>
              </div>

              <div>
                <label className="text-sm text-gray-500">Description</label>
                <p className="p-3 bg-gray-50 rounded-lg">{selectedTicket.description}</p>
              </div>

              {selectedTicket.admin_response && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <label className="text-sm text-blue-600 font-medium">Admin Response</label>
                  <p className="mt-1 text-blue-800">{selectedTicket.admin_response}</p>
                  {selectedTicket.responded_at && (
                    <p className="text-xs text-blue-500 mt-2">
                      Responded on: {new Date(selectedTicket.responded_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              <div className="text-xs text-gray-400">
                Created: {new Date(selectedTicket.created_at).toLocaleString()}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button 
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTickets;
