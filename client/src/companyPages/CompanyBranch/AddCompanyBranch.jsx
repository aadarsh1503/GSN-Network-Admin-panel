import { useState } from 'react';
import { api } from '../../utils/api';

const AddCompanyBranch = () => {
  const [loading, setLoading] = useState(false);
  
  // State to hold all form data
  const [formData, setFormData] = useState({
    branchName: '',
    branchPhone: '',
    branchEmail: '',
    country: '',
    state: '',
    city: '',
    branchAddress: '',
    skype: '',
    facebook: '',
    twitter: '',
    instagram: '',
    whatsapp: '',
    linkedin: '',
    mapLocation: '',
    website: '',
    telephone: ''
  });

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

    try {
      await api.post('/api/company/branches', formData);
      alert('Branch added successfully!');
      // Reset form
      setFormData({
          branchName: '', branchPhone: '', branchEmail: '', country: '', state: '', city: '',
          branchAddress: '', skype: '', facebook: '', twitter: '', instagram: '',
          whatsapp: '', linkedin: '', mapLocation: '', website: '', telephone: ''
      });
    } catch (error) {
      console.error("Error:", error);
      alert(error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const labelClasses = "block text-sm font-medium text-gray-700 mb-1";
  const inputClasses = "w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-amber-500 focus:border-amber-500 transition duration-150 ease-in-out";

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md max-w-4xl mx-auto">
      <form onSubmit={handleSubmit}>
        
        {/* --- Section 1: Core Branch Details --- */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Add Company Branch</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          
          {/* Branch Name */}
          <div>
            <label htmlFor="branchName" className={labelClasses}>Branch Name <span className="text-red-500">*</span></label>
            <input required type="text" id="branchName" name="branchName" value={formData.branchName} onChange={handleChange} placeholder="Branch Name" className={inputClasses} />
          </div>

          {/* Branch Phone No. */}
          <div>
            <label htmlFor="branchPhone" className={labelClasses}>Branch Phone No.</label>
            <input type="tel" id="branchPhone" name="branchPhone" value={formData.branchPhone} onChange={handleChange} className={inputClasses} />
          </div>

          {/* Branch Email */}
          <div>
            <label htmlFor="branchEmail" className={labelClasses}>Branch Email</label>
            <input type="email" id="branchEmail" name="branchEmail" value={formData.branchEmail} onChange={handleChange} className={inputClasses} />
          </div>

          {/* Country */}
          <div>
            <label htmlFor="country" className={labelClasses}>Country</label>
            <select id="country" name="country" value={formData.country} onChange={handleChange} className={inputClasses}>
              <option value="">Select Country</option>
              <option value="India">India</option>
              <option value="USA">United States</option>
              <option value="UK">United Kingdom</option>
              <option value="Canada">Canada</option>
            </select>
          </div>

          {/* State */}
          <div>
            <label htmlFor="state" className={labelClasses}>State</label>
            <input type="text" id="state" name="state" value={formData.state} onChange={handleChange} className={inputClasses} placeholder="State" />
          </div>

          {/* City */}
          <div>
            <label htmlFor="city" className={labelClasses}>City</label>
            <input type="text" id="city" name="city" value={formData.city} onChange={handleChange} className={inputClasses} placeholder="City" />
          </div>

          {/* Company Branch Address */}
          <div className="md:col-span-2">
            <label htmlFor="branchAddress" className={labelClasses}>Company Branch Address</label>
            <textarea id="branchAddress" name="branchAddress" value={formData.branchAddress} onChange={handleChange} rows="3" className={inputClasses}></textarea>
          </div>
        </div>

        {/* --- Section 2: Social Media & Additional Info --- */}
        <h2 className="text-2xl font-bold text-gray-800 my-6 mt-10 border-b pb-4">Social Media</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div><label htmlFor="skype" className={labelClasses}>Skype</label><input type="url" id="skype" name="skype" value={formData.skype} onChange={handleChange} className={inputClasses} /></div>
          <div><label htmlFor="facebook" className={labelClasses}>Facebook</label><input type="url" id="facebook" name="facebook" value={formData.facebook} onChange={handleChange} className={inputClasses} /></div>
          <div><label htmlFor="twitter" className={labelClasses}>Twitter</label><input type="url" id="twitter" name="twitter" value={formData.twitter} onChange={handleChange} className={inputClasses} /></div>
          <div><label htmlFor="instagram" className={labelClasses}>Instagram</label><input type="url" id="instagram" name="instagram" value={formData.instagram} onChange={handleChange} className={inputClasses} /></div>
          <div><label htmlFor="whatsapp" className={labelClasses}>Whatsapp</label><input type="tel" id="whatsapp" name="whatsapp" value={formData.whatsapp} onChange={handleChange} className={inputClasses} /></div>
          <div><label htmlFor="linkedin" className={labelClasses}>Linkedin</label><input type="url" id="linkedin" name="linkedin" value={formData.linkedin} onChange={handleChange} className={inputClasses} /></div>
          <div><label htmlFor="mapLocation" className={labelClasses}>Map Location</label><input type="url" id="mapLocation" name="mapLocation" value={formData.mapLocation} onChange={handleChange} className={inputClasses} /></div>
          <div><label htmlFor="website" className={labelClasses}>Website</label><input type="url" id="website" name="website" value={formData.website} onChange={handleChange} className={inputClasses} /></div>
          <div><label htmlFor="telephone" className={labelClasses}>Telephone No</label><input type="tel" id="telephone" name="telephone" value={formData.telephone} onChange={handleChange} className={inputClasses} /></div>
        </div>

        {/* --- Submit Button --- */}
        <div className="mt-8 text-left">
          <button 
            type="submit" 
            disabled={loading}
            className={`px-10 py-3 font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-amber-400 hover:bg-amber-500 text-gray-800'}`}
          >
            {loading ? 'Submitting...' : 'Submit Branch'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default AddCompanyBranch; 