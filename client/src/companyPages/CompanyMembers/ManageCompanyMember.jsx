import React, { useState, useEffect } from 'react';
import { FaSort, FaPen, FaTrash, FaTimes } from 'react-icons/fa';
import api from '../../utils/api';

const ManageCompanyMember = () => {
  const [members, setMembers] = useState([]);
  const [branches, setBranches] = useState([]); // Need branches for the edit dropdown
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // --- EDIT STATE ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    branch: '', memberName: '', memberPhone: '', memberEmail: '', memberRole: '',
    skype: '', facebook: '', twitter: '', instagram: '', whatsapp: '', linkedin: ''
  });

  // 1. Fetch Data (Members and Branches)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Members
        const membersData = await api.get('/api/company/members');
        
        // Fetch Branches (for the edit dropdown)
        const branchesData = await api.get('/api/company/branches');

        setMembers(Array.isArray(membersData) ? membersData : []);
        setBranches(Array.isArray(branchesData) ? branchesData : []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setMembers([]);
        setBranches([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. Handle Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this member?")) return;
    try {
      await api.delete(`/api/company/members/${id}`);
      setMembers(members.filter(member => member.id !== id));
      alert("Member deleted successfully");
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Failed to delete member");
    }
  };

  // 3. Open Edit Modal
  const handleEditClick = (member) => {
    setEditingId(member.id);
    setEditFormData({
      branch: member.branch_id, // Ensure your API returns branch_id
      memberName: member.member_name,
      memberPhone: member.member_phone || '',
      memberEmail: member.member_email || '',
      memberRole: member.member_role || '',
      skype: member.skype || '',
      facebook: member.facebook || '',
      twitter: member.twitter || '',
      instagram: member.instagram || '',
      whatsapp: member.whatsapp || '',
      linkedin: member.linkedin || ''
    });
    setIsEditModalOpen(true);
  };

  // 4. Handle Edit Form Change
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // 5. Submit Update
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/company/members/${editingId}`, editFormData);
      alert("Member updated successfully");
      setIsEditModalOpen(false);
      // Refresh the list locally to show updates immediately
      // We find the branch name from the branches array to update the UI correctly
      const selectedBranch = branches.find(b => b.id == editFormData.branch);
      
      setMembers(members.map(m => m.id === editingId ? {
          ...m,
          branch_id: editFormData.branch,
          branch_name: selectedBranch ? selectedBranch.branch_name : 'Unknown', // Update branch name for display
          member_name: editFormData.memberName,
          member_phone: editFormData.memberPhone,
          member_email: editFormData.memberEmail,
          member_role: editFormData.memberRole,
          // ... update other fields if you display them
      } : m));

    } catch (error) {
      console.error("Error updating:", error);
      alert("Failed to update member");
    }
  };

  // --- Filtering & Pagination ---
  const filteredMembers = members.filter(member => {
    const term = searchTerm.toLowerCase();
    return (
      member.member_name?.toLowerCase().includes(term) ||
      member.member_email?.toLowerCase().includes(term) ||
      member.member_role?.toLowerCase().includes(term) ||
      member.branch_name?.toLowerCase().includes(term)
    );
  });

  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredMembers.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredMembers.length / entriesPerPage);

  const SortableHeader = ({ children }) => (
    <div className="flex items-center justify-between cursor-pointer group">
      <span>{children}</span>
      <FaSort className="text-gray-400 group-hover:text-gray-600" />
    </div>
  );

  // CSS classes for Edit Modal inputs
  const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#bca142] text-sm";
  const labelClasses = "block text-xs font-medium text-gray-700 mb-1";

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full max-w-6xl mx-auto my-8 relative">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Company Members</h2>

      {/* Top Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Show</span>
          <select value={entriesPerPage} onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#bca142]">
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
          </select>
          <span>entries</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <label htmlFor="search">Search:</label>
          <input id="search" type="text" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} placeholder="Name, Role..." className="border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#bca142]" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto min-h-[200px]">
        {loading ? <div className="text-center py-10 text-gray-500">Loading...</div> : (
          <table className="min-w-full bg-white">
            <thead className="bg-[#bca142] text-white text-sm">
              <tr>
                <th className="p-3 text-left font-semibold w-16"><SortableHeader>Sr.No</SortableHeader></th>
                <th className="p-3 text-left font-semibold"><SortableHeader>Branch</SortableHeader></th>
                <th className="p-3 text-left font-semibold"><SortableHeader>Name</SortableHeader></th>
                <th className="p-3 text-left font-semibold"><SortableHeader>Phone</SortableHeader></th>
                <th className="p-3 text-left font-semibold"><SortableHeader>Email</SortableHeader></th>
                <th className="p-3 text-left font-semibold"><SortableHeader>Role</SortableHeader></th>
                <th className="p-3 text-left font-semibold w-28"><SortableHeader>Action</SortableHeader></th>
              </tr>
            </thead>
            <tbody>
              {currentEntries.map((member, index) => (
                <tr key={member.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-3 text-sm text-gray-700">{indexOfFirstEntry + index + 1}</td>
                  <td className="p-3 text-sm text-gray-700 text-[#bca142]">{member.branch_name || 'N/A'}</td>
                  <td className="p-3 text-sm text-gray-700 font-semibold">{member.member_name}</td>
                  <td className="p-3 text-sm text-gray-700">{member.member_phone || '-'}</td>
                  <td className="p-3 text-sm text-gray-700">{member.member_email || '-'}</td>
                  <td className="p-3 text-sm text-gray-700"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{member.member_role}</span></td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEditClick(member)} className="bg-[#bca142] text-white p-2 rounded-md hover:bg-black transition-colors"><FaPen size={12} /></button>
                      <button onClick={() => handleDelete(member.id)} className="bg-black text-white p-2 rounded-md hover:bg-[#bca142] transition-colors"><FaTrash size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {currentEntries.length === 0 && <tr><td colSpan="7" className="text-center p-4 text-gray-500">No records found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls ... (Same as before) */}
      {!loading && members.length > 0 && (
         <div className="flex flex-col md:flex-row items-center justify-between mt-4 gap-4">
            <div className="text-sm text-gray-600">Showing {filteredMembers.length === 0 ? 0 : indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, filteredMembers.length)} of {filteredMembers.length} entries</div>
            <div className="flex items-center select-none">
                <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border border-gray-300 rounded-l-md hover:bg-gray-100 disabled:opacity-50">Previous</button>
                <div className="px-3 py-1 border-t border-b border-gray-300 bg-[#bca142] text-white">{currentPage}</div>
                <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 border border-gray-300 rounded-r-md hover:bg-gray-100 disabled:opacity-50">Next</button>
            </div>
         </div>
      )}

      {/* --- EDIT MODAL --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-800">Edit Company Member</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-red-500">
                <FaTimes size={20} />
              </button>
            </div>

            {/* Modal Body (Form) */}
            <form onSubmit={handleUpdateSubmit} className="p-6">
              
              {/* Basic Details */}
              <h4 className="text-md font-semibold text-[#bca142] mb-4 border-b pb-2">Basic Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className={labelClasses}>Branch</label>
                  <select name="branch" value={editFormData.branch} onChange={handleEditChange} className={inputClasses} required>
                    <option value="">Select Branch</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                  </select>
                </div>
                <div><label className={labelClasses}>Member Name</label><input type="text" name="memberName" value={editFormData.memberName} onChange={handleEditChange} className={inputClasses} required /></div>
                <div><label className={labelClasses}>Phone</label><input type="tel" name="memberPhone" value={editFormData.memberPhone} onChange={handleEditChange} className={inputClasses} /></div>
                <div><label className={labelClasses}>Email</label><input type="email" name="memberEmail" value={editFormData.memberEmail} onChange={handleEditChange} className={inputClasses} /></div>
                <div><label className={labelClasses}>Role</label><input type="text" name="memberRole" value={editFormData.memberRole} onChange={handleEditChange} className={inputClasses} /></div>
              </div>

              {/* Social Media */}
              <h4 className="text-md font-semibold text-[#bca142] mb-4 border-b pb-2">Social Media</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div><label className={labelClasses}>Whatsapp</label><input type="tel" name="whatsapp" value={editFormData.whatsapp} onChange={handleEditChange} className={inputClasses} /></div>
                 <div><label className={labelClasses}>Skype</label><input type="url" name="skype" value={editFormData.skype} onChange={handleEditChange} className={inputClasses} /></div>
                 <div><label className={labelClasses}>Facebook</label><input type="url" name="facebook" value={editFormData.facebook} onChange={handleEditChange} className={inputClasses} /></div>
                 <div><label className={labelClasses}>Twitter</label><input type="url" name="twitter" value={editFormData.twitter} onChange={handleEditChange} className={inputClasses} /></div>
                 <div><label className={labelClasses}>Instagram</label><input type="url" name="instagram" value={editFormData.instagram} onChange={handleEditChange} className={inputClasses} /></div>
                 <div><label className={labelClasses}>Linkedin</label><input type="url" name="linkedin" value={editFormData.linkedin} onChange={handleEditChange} className={inputClasses} /></div>
              </div>

              {/* Modal Actions */}
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-[#bca142] text-white font-semibold rounded-lg hover:bg-black transition-colors">Update Member</button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageCompanyMember;