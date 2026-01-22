import { useState, useEffect } from 'react';
import { FaSort, FaPen, FaTrash, FaTimes } from 'react-icons/fa';
import api from '../../utils/api';
import { fetchCountries, fetchStates, fetchCities } from '../../utils/locationData';

const ManageCompanyBranch = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination State
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Location data states for edit modal
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // --- EDIT STATE ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    branchName: '', branchPhone: '', branchEmail: '', country: '', state: '', city: '',
    branchAddress: '', skype: '', facebook: '', twitter: '', instagram: '',
    whatsapp: '', linkedin: '', mapLocation: '', website: '', telephone: ''
  });

  // Fetch Data on Component Mount
  useEffect(() => {
    fetchBranches();
    loadCountries();
  }, []);

  const loadCountries = async () => {
    setLoadingCountries(true);
    try {
      const countriesData = await fetchCountries();
      setCountries(countriesData);
    } catch (error) {
      console.error('Error loading countries:', error);
    } finally {
      setLoadingCountries(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const data = await api.get('/api/company/branches');
      setBranches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching branches:', error);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  // --- DELETE HANDLER ---
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this branch?")) return;
    try {
      await api.delete(`/api/company/branches/${id}`);
      setBranches(branches.filter(branch => branch.id !== id));
      alert("Branch deleted successfully");
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Failed to delete branch");
    }
  };

  // --- EDIT HANDLERS ---
  const handleEditClick = async (branch) => {
    setEditingId(branch.id);
    // Map database column names to form state names
    const formData = {
      branchName: branch.branch_name,
      branchPhone: branch.branch_phone || '',
      branchEmail: branch.branch_email || '',
      country: branch.country || '',
      state: branch.state || '',
      city: branch.city || '',
      branchAddress: branch.address || '', // Note: DB uses 'address', Form uses 'branchAddress'
      skype: branch.skype || '',
      facebook: branch.facebook || '',
      twitter: branch.twitter || '',
      instagram: branch.instagram || '',
      whatsapp: branch.whatsapp || '',
      linkedin: branch.linkedin || '',
      mapLocation: branch.map_location || '',
      website: branch.website || '',
      telephone: branch.telephone || ''
    };
    
    setEditFormData(formData);
    
    // Load states if country is selected
    if (formData.country) {
      setLoadingStates(true);
      try {
        const statesData = await fetchStates(formData.country);
        setStates(statesData);
        
        // Load cities if state is also selected
        if (formData.state) {
          setLoadingCities(true);
          try {
            const citiesData = await fetchCities(formData.country, formData.state);
            setCities(citiesData);
          } catch (error) {
            console.error('Error loading cities:', error);
          } finally {
            setLoadingCities(false);
          }
        }
      } catch (error) {
        console.error('Error loading states:', error);
      } finally {
        setLoadingStates(false);
      }
    }
    
    setIsEditModalOpen(true);
  };

  const handleEditChange = async (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));

    // Handle cascading dropdowns
    if (name === 'country') {
      // Reset state and city when country changes
      setEditFormData(prev => ({
        ...prev,
        [name]: value,
        state: '',
        city: ''
      }));
      setStates([]);
      setCities([]);
      
      if (value) {
        setLoadingStates(true);
        try {
          const statesData = await fetchStates(value);
          setStates(statesData);
        } catch (error) {
          console.error('Error loading states:', error);
        } finally {
          setLoadingStates(false);
        }
      }
    } else if (name === 'state') {
      // Reset city when state changes
      setEditFormData(prev => ({
        ...prev,
        [name]: value,
        city: ''
      }));
      setCities([]);
      
      if (value && editFormData.country) {
        setLoadingCities(true);
        try {
          const citiesData = await fetchCities(editFormData.country, value);
          setCities(citiesData);
        } catch (error) {
          console.error('Error loading cities:', error);
        } finally {
          setLoadingCities(false);
        }
      }
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/company/branches/${editingId}`, editFormData);
      alert("Branch updated successfully");
      setIsEditModalOpen(false);
      
      // Update local state to reflect changes immediately
      setBranches(branches.map(b => b.id === editingId ? {
          ...b,
          branch_name: editFormData.branchName,
          branch_phone: editFormData.branchPhone,
          branch_email: editFormData.branchEmail,
          country: editFormData.country,
          state: editFormData.state,
          city: editFormData.city,
          address: editFormData.branchAddress,
          // ... update other fields if needed for display
      } : b));
    } catch (error) {
      console.error("Error updating:", error);
      alert("Failed to update branch");
    }
  };

  // Filter & Pagination Logic
  const filteredBranches = branches.filter(branch => {
    const term = searchTerm.toLowerCase();
    return (
      branch.branch_name?.toLowerCase().includes(term) ||
      branch.city?.toLowerCase().includes(term) ||
      branch.country?.toLowerCase().includes(term)
    );
  });

  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredBranches.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredBranches.length / entriesPerPage);

  const SortableHeader = ({ children }) => (
    <div className="flex items-center justify-between cursor-pointer group">
      <span>{children}</span>
      <FaSort className="text-gray-400 group-hover:text-gray-600" />
    </div>
  );

  // CSS for inputs
  const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#CDA435] text-sm";
  const labelClasses = "block text-xs font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-6xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-md w-full my-8 relative">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Company Branches</h2>

      {/* Top Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Show</span>
          <select value={entriesPerPage} onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#CDA435]">
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
          </select>
          <span>entries</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <label htmlFor="search">Search:</label>
          <input id="search" type="text" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} placeholder="Name, City, Country..." className="border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#CDA435]" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto min-h-[300px]">
        {loading ? <div className="text-center py-10 text-gray-500">Loading branches...</div> : (
        <table className="min-w-full bg-white">
          <thead className="bg-[#D9CBAA] text-gray-800 text-sm">
            <tr>
              <th className="p-3 text-left font-semibold w-16"><SortableHeader>Sr.No</SortableHeader></th>
              <th className="p-3 text-left font-semibold"><SortableHeader>Branch Name</SortableHeader></th>
              <th className="p-3 text-left font-semibold"><SortableHeader>Phone</SortableHeader></th>
              <th className="p-3 text-left font-semibold"><SortableHeader>Email</SortableHeader></th>
              <th className="p-3 text-left font-semibold"><SortableHeader>City</SortableHeader></th>
              <th className="p-3 text-left font-semibold"><SortableHeader>Address</SortableHeader></th>
              <th className="p-3 text-left font-semibold w-28"><SortableHeader>Action</SortableHeader></th>
            </tr>
          </thead>
          <tbody>
            {currentEntries.map((branch, index) => (
              <tr key={branch.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                <td className="p-3 text-sm text-gray-700">{indexOfFirstEntry + index + 1}</td>
                <td className="p-3 text-sm text-gray-700 font-medium">{branch.branch_name}</td>
                <td className="p-3 text-sm text-gray-700">{branch.branch_phone || '-'}</td>
                <td className="p-3 text-sm text-gray-700">{branch.branch_email || '-'}</td>
                <td className="p-3 text-sm text-gray-700">{branch.city || '-'}</td>
                <td className="p-3 text-sm text-gray-700 max-w-xs break-words">{branch.address || '-'}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEditClick(branch)} className="bg-lime-500 text-white p-2 rounded-md hover:bg-lime-600 transition-colors"><FaPen size={12} /></button>
                    <button onClick={() => handleDelete(branch.id)} className="bg-pink-600 text-white p-2 rounded-md hover:bg-pink-700 transition-colors"><FaTrash size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {currentEntries.length === 0 && <tr><td colSpan="7" className="text-center p-4 text-gray-500">No records match your search.</td></tr>}
          </tbody>
        </table>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && branches.length > 0 && (
        <div className="flex flex-col md:flex-row items-center justify-between mt-4 gap-4">
            <div className="text-sm text-gray-600">Showing {filteredBranches.length === 0 ? 0 : indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, filteredBranches.length)} of {filteredBranches.length} entries</div>
            <div className="flex items-center select-none">
            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border border-gray-300 rounded-l-md hover:bg-gray-100 disabled:opacity-50">Previous</button>
            <div className="px-3 py-1 border-t border-b border-gray-300 bg-[#D9CBAA]">{currentPage}</div>
            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 border border-gray-300 rounded-r-md hover:bg-gray-100 disabled:opacity-50">Next</button>
            </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-gray-800">Edit Company Branch</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-red-500">
                <FaTimes size={20} />
              </button>
            </div>

            {/* Modal Body (Form) */}
            <form onSubmit={handleUpdateSubmit} className="p-6">
              
              {/* Location Details */}
              <h4 className="text-md font-semibold text-[#CDA435] mb-4 border-b pb-2">Location & Contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div><label className={labelClasses}>Branch Name</label><input type="text" name="branchName" value={editFormData.branchName} onChange={handleEditChange} className={inputClasses} required /></div>
                
                <div>
                  <label className={labelClasses}>Country</label>
                  <select 
                    name="country" 
                    value={editFormData.country} 
                    onChange={handleEditChange} 
                    className={inputClasses}
                    disabled={loadingCountries}
                  >
                    <option value="">
                      {loadingCountries ? 'Loading countries...' : 'Select Country'}
                    </option>
                    {countries.map((country) => (
                      <option key={country.code} value={country.name}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={labelClasses}>State</label>
                  <select 
                    name="state" 
                    value={editFormData.state} 
                    onChange={handleEditChange} 
                    className={inputClasses}
                    disabled={!editFormData.country || loadingStates}
                  >
                    <option value="">
                      {!editFormData.country 
                        ? 'Select country first' 
                        : loadingStates 
                          ? 'Loading states...' 
                          : 'Select State'
                      }
                    </option>
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={labelClasses}>City</label>
                  <select 
                    name="city" 
                    value={editFormData.city} 
                    onChange={handleEditChange} 
                    className={inputClasses}
                    disabled={!editFormData.state || loadingCities}
                  >
                    <option value="">
                      {!editFormData.state 
                        ? 'Select state first' 
                        : loadingCities 
                          ? 'Loading cities...' 
                          : 'Select City'
                      }
                    </option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div><label className={labelClasses}>Phone</label><input type="tel" name="branchPhone" value={editFormData.branchPhone} onChange={handleEditChange} className={inputClasses} /></div>
                <div><label className={labelClasses}>Email</label><input type="email" name="branchEmail" value={editFormData.branchEmail} onChange={handleEditChange} className={inputClasses} /></div>
                <div><label className={labelClasses}>Telephone</label><input type="tel" name="telephone" value={editFormData.telephone} onChange={handleEditChange} className={inputClasses} /></div>
                <div className="md:col-span-2"><label className={labelClasses}>Address</label><textarea name="branchAddress" value={editFormData.branchAddress} onChange={handleEditChange} rows="2" className={inputClasses}></textarea></div>
              </div>

              {/* Social Media */}
              <h4 className="text-md font-semibold text-[#CDA435] mb-4 border-b pb-2">Social Media & Web</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div><label className={labelClasses}>Website</label><input type="url" name="website" value={editFormData.website} onChange={handleEditChange} className={inputClasses} /></div>
                 <div><label className={labelClasses}>Map Location</label><input type="url" name="mapLocation" value={editFormData.mapLocation} onChange={handleEditChange} className={inputClasses} /></div>
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
                <button type="submit" className="px-6 py-2 bg-[#CDA435] text-white font-semibold rounded-lg hover:bg-[#B8941F]">Update Branch</button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageCompanyBranch;