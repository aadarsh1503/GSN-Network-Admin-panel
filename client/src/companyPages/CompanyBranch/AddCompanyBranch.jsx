import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { fetchCountries, fetchStates, fetchCities } from '../../utils/locationData';

const AddCompanyBranch = () => {
  const [loading, setLoading] = useState(false);
  
  // Location data states
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  
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

  // Load countries on component mount
  useEffect(() => {
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

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));

    // Handle cascading dropdowns
    if (name === 'country') {
      // Reset state and city when country changes
      setFormData(prevState => ({
        ...prevState,
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
      setFormData(prevState => ({
        ...prevState,
        [name]: value,
        city: ''
      }));
      setCities([]);
      
      if (value && formData.country) {
        setLoadingCities(true);
        try {
          const citiesData = await fetchCities(formData.country, value);
          setCities(citiesData);
        } catch (error) {
          console.error('Error loading cities:', error);
        } finally {
          setLoadingCities(false);
        }
      }
    }
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
      // Reset location dropdowns
      setStates([]);
      setCities([]);
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
            <select 
              id="country" 
              name="country" 
              value={formData.country} 
              onChange={handleChange} 
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

          {/* State */}
          <div>
            <label htmlFor="state" className={labelClasses}>State</label>
            <select 
              id="state" 
              name="state" 
              value={formData.state} 
              onChange={handleChange} 
              className={inputClasses}
              disabled={!formData.country || loadingStates}
            >
              <option value="">
                {!formData.country 
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

          {/* City */}
          <div>
            <label htmlFor="city" className={labelClasses}>City</label>
            <select 
              id="city" 
              name="city" 
              value={formData.city} 
              onChange={handleChange} 
              className={inputClasses}
              disabled={!formData.state || loadingCities}
            >
              <option value="">
                {!formData.state 
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
            className={`px-10 py-3 font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#bca142] ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#bca142] hover:bg-black text-white'}`}
          >
            {loading ? 'Submitting...' : 'Submit Branch'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default AddCompanyBranch; 