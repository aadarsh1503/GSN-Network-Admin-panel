import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';

const AddCompanyMember = () => {
  const [branches, setBranches] = useState([]); // Store fetched branches here
  const [loading, setLoading] = useState(false);

  // State to hold form data
  const [formData, setFormData] = useState({
    branch: '', // This will store the branch_id
    memberName: '',
    memberPhone: '',
    memberEmail: '',
    memberRole: '',
    skype: '',
    facebook: '',
    twitter: '',
    instagram: '',
    whatsapp: '',
    linkedin: ''
  });

  // Fetch Branches on Component Mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await api.get('/api/company/branches');
        setBranches(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching branches:", error);
      }
    };

    fetchBranches();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Basic Validation
    if(!formData.branch) {
        alert("Please select a branch");
        setLoading(false);
        return;
    }

    try {
        const data = await api.post('/api/company/members', formData);
        alert('Member added successfully!');
        // Reset form
        setFormData({
            branch: '', memberName: '', memberPhone: '', memberEmail: '', memberRole: '',
            skype: '', facebook: '', twitter: '', instagram: '', whatsapp: '', linkedin: ''
        });
    } catch (error) {
        console.error("Error:", error);
        alert(error.message || 'Something went wrong. Please try again.');
    } finally {
        setLoading(false);
    }
  };

  const labelClasses = "block text-sm font-medium text-gray-700 mb-1";
  const inputClasses = "w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-[#bca142] focus:border-[#bca142] transition duration-150 ease-in-out";

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md max-w-4xl mx-auto">
      <form onSubmit={handleSubmit}>
        
        {/* --- Section 1: Member Details --- */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Add Company Member</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          
          {/* Branch Dropdown */}
          <div>
            <label htmlFor="branch" className={labelClasses}>Branch <span className="text-red-500">*</span></label>
            <select 
                id="branch" 
                name="branch" 
                required
                value={formData.branch} 
                onChange={handleChange} 
                className={inputClasses}
            >
              <option value="">Select Branch</option>
              {Array.isArray(branches) && branches.length > 0 ? (
                branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branch_name} ({branch.city})
                  </option>
                ))
              ) : (
                <option value="" disabled>No branches available</option>
              )}
            </select>
            {Array.isArray(branches) && branches.length === 0 && (
                <p className="text-xs text-red-500 mt-1">You need to add a Branch first.</p>
            )}
          </div>

          {/* Member Name */}
          <div>
            <label htmlFor="memberName" className={labelClasses}>Member Name <span className="text-red-500">*</span></label>
            <input required type="text" id="memberName" name="memberName" value={formData.memberName} onChange={handleChange} placeholder="Member Name" className={inputClasses} />
          </div>

          {/* Member Phone No. */}
          <div>
            <label htmlFor="memberPhone" className={labelClasses}>Member Phone No.</label>
            <input type="tel" id="memberPhone" name="memberPhone" value={formData.memberPhone} onChange={handleChange} className={inputClasses} />
          </div>

          {/* Member Email */}
          <div>
            <label htmlFor="memberEmail" className={labelClasses}>Member Email</label>
            <input type="email" id="memberEmail" name="memberEmail" value={formData.memberEmail} onChange={handleChange} className={inputClasses} />
          </div>
          
          {/* Member Role */}
          <div>
            <label htmlFor="memberRole" className={labelClasses}>Member Role</label>
            <input type="text" id="memberRole" name="memberRole" value={formData.memberRole} onChange={handleChange} placeholder="e.g. Manager, Support" className={inputClasses} />
          </div>
        </div>

        {/* --- Section 2: Social Media --- */}
        <h2 className="text-2xl font-bold text-gray-800 my-6 mt-10 border-b pb-4">Social Media</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div><label htmlFor="skype" className={labelClasses}>Skype</label><input type="url" id="skype" name="skype" value={formData.skype} onChange={handleChange} className={inputClasses} /></div>
          <div><label htmlFor="facebook" className={labelClasses}>Facebook</label><input type="url" id="facebook" name="facebook" value={formData.facebook} onChange={handleChange} className={inputClasses} /></div>
          <div><label htmlFor="twitter" className={labelClasses}>Twitter</label><input type="url" id="twitter" name="twitter" value={formData.twitter} onChange={handleChange} className={inputClasses} /></div>
          <div><label htmlFor="instagram" className={labelClasses}>Instagram</label><input type="url" id="instagram" name="instagram" value={formData.instagram} onChange={handleChange} className={inputClasses} /></div>
          <div><label htmlFor="whatsapp" className={labelClasses}>Whatsapp</label><input type="tel" id="whatsapp" name="whatsapp" value={formData.whatsapp} onChange={handleChange} className={inputClasses} /></div>
          <div><label htmlFor="linkedin" className={labelClasses}>Linkedin</label><input type="url" id="linkedin" name="linkedin" value={formData.linkedin} onChange={handleChange} className={inputClasses} /></div>
        </div>

        {/* --- Submit Button --- */}
        <div className="mt-8 text-left">
          <button 
            type="submit" 
            disabled={loading}
            className={`px-10 py-3 font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#bca142] ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#bca142] hover:bg-black text-white'}`}
          >
            {loading ? 'Submitting...' : 'Submit Member'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default AddCompanyMember;