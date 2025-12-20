import { useState, useEffect } from 'react';
import { FiChevronUp, FiChevronDown, FiMessageSquare } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

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

const Suggestions = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const data = await api('/api/suggestions/all');
      setSuggestions(data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setNewStatus(suggestion.status);
    setAdminResponse(suggestion.admin_response || '');
    setIsModalOpen(true);
  };

  const handleSubmitResponse = async () => {
    try {
      await api(`/api/suggestions/${selectedSuggestion.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus, adminResponse })
      });

      toast.success('Suggestion updated successfully');
      setIsModalOpen(false);
      fetchSuggestions();
    } catch (error) {
      toast.error(error.message || 'Failed to update suggestion');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      implemented: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const filteredSuggestions = suggestions.filter(item =>
    item.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedSuggestions = filteredSuggestions.slice(0, entries);

  if (loading) {
    return <div className="text-center py-8">Loading suggestions...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Suggestions</h1>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <div className="flex items-center text-sm text-gray-600">
            <span>Show</span>
            <select 
              value={entries}
              onChange={(e) => setEntries(Number(e.target.value))}
              className="mx-2 border border-gray-300 rounded-md p-1"
            >
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-md p-1.5"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#D9B95B]">
              <tr>
                <TableHeader>Sr.No</TableHeader>
                <TableHeader>User</TableHeader>
                <TableHeader>Subject</TableHeader>
                <TableHeader>Category</TableHeader>
                <TableHeader>Message</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Date</TableHeader>
                <TableHeader>Action</TableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayedSuggestions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-gray-500">No suggestions found</td>
                </tr>
              ) : (
                displayedSuggestions.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="p-3 whitespace-nowrap text-gray-700">{index + 1}</td>
                    <td className="p-3">
                      <div className="font-medium">{item.user_name}</div>
                      <div className="text-xs text-gray-500">{item.user_email}</div>
                      <div className="text-xs text-gray-400 capitalize">{item.user_role}</div>
                    </td>
                    <td className="p-3 text-gray-700">{item.subject}</td>
                    <td className="p-3 text-gray-700 capitalize">{item.category}</td>
                    <td className="p-3 text-gray-700 max-w-xs truncate">{item.message}</td>
                    <td className="p-3">{getStatusBadge(item.status)}</td>
                    <td className="p-3 whitespace-nowrap text-gray-700">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleRespond(item)}
                        className="bg-green-500 text-white p-2 rounded-md hover:bg-green-600"
                      >
                        <FiMessageSquare />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-gray-600">
          <p>Showing 1 to {Math.min(entries, filteredSuggestions.length)} of {filteredSuggestions.length} entries</p>
          <div className="flex items-center mt-2 sm:mt-0">
            <button className="px-3 py-1 border border-[#D9B95B] text-[#D9B95B] rounded-l-md hover:bg-gray-50">Previous</button>
            <button className="px-3 py-1 border-y border-[#D9B95B] bg-[#D9B95B] text-white">1</button>
            <button className="px-3 py-1 border border-[#D9B95B] text-[#D9B95B] rounded-r-md hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>

      {/* Response Modal */}
      {isModalOpen && selectedSuggestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Respond to Suggestion</h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>User:</strong> {selectedSuggestion.user_name}</div>
                <div><strong>Category:</strong> {selectedSuggestion.category}</div>
              </div>
              <div className="mt-2">
                <strong>Subject:</strong> {selectedSuggestion.subject}
              </div>
              <div className="mt-2">
                <strong>Message:</strong>
                <div className="mt-1 p-2 bg-white rounded border text-sm">
                  {selectedSuggestion.message}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="implemented">Implemented</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">Admin Response</label>
              <textarea
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Enter your response..."
                rows="4"
                className="w-full border border-gray-300 rounded-md p-3"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmitResponse}
                className="px-4 py-2 bg-[#CDA435] text-white rounded-md hover:bg-opacity-90"
              >
                Update Suggestion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suggestions;
