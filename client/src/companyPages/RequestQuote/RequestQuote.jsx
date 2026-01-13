import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPhone } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import { fetchCountries, fetchStates, fetchCities } from '../../utils/locationData';
import CompanyQuoteRestrictionModal from '../../components/Modal/CompanyQuoteRestrictionModal';
import AccountTypeSelectionModal from '../../components/Modal/AccountTypeSelectionModal';

// --- Reusable Form Field Components ---
const InputField = ({ label, name, placeholder, required = false, value, onChange, type = "text", min, max }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      min={min}
      max={max}
      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-[#CDA435] focus:ring-2 focus:ring-[#CDA435]/20 focus:bg-white transition-all duration-200 hover:border-gray-300"
    />
  </div>
);

const SelectField = ({ label, name, required = false, value, onChange, children, loading = false, disabled = false }) => (
  <div className="relative">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled || loading}
      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-[#CDA435] focus:ring-2 focus:ring-[#CDA435]/20 focus:bg-white transition-all duration-200 hover:border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none"
    >
      {children}
    </select>
    {loading && (
      <div className="absolute right-10 top-11">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#CDA435]"></div>
      </div>
    )}
    {!loading && (
      <div className="absolute right-3 top-11 pointer-events-none">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    )}
  </div>
);

const CheckboxField = ({ label, name, checked, onChange }) => (
    <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
        <input 
          id={name} 
          name={name} 
          type="checkbox" 
          checked={checked}
          onChange={onChange}
          className="h-4 w-4 text-[#CDA435] border-gray-300 rounded focus:ring-[#CDA435] focus:ring-2"
        />
        <label htmlFor={name} className="ml-3 block text-sm font-medium text-gray-700">{label}</label>
    </div>
);

// --- Section Heading Component ---
const SectionHeader = ({ title, subtitle }) => (
    <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
        {subtitle && <p className="text-gray-600 text-sm">{subtitle}</p>}
        <div className="h-1 bg-gradient-to-r from-[#CDA435] to-transparent w-20 mt-3 rounded-full"></div>
    </div>
);


// --- The Main RequestQuote Component ---
const RequestQuote = () => {
  const [loading, setLoading] = useState(false);
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);
  const [showAccountTypeModal, setShowAccountTypeModal] = useState(false);
  const [pendingQuoteData, setPendingQuoteData] = useState(null);
  const navigate = useNavigate();

  // Location data states
  const [countries, setCountries] = useState([]);
  const [departureStates, setDepartureStates] = useState([]);
  const [departureCities, setDepartureCities] = useState([]);
  const [arrivalStates, setArrivalStates] = useState([]);
  const [arrivalCities, setArrivalCities] = useState([]);
  
  // Loading states for location data
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingDepartureStates, setLoadingDepartureStates] = useState(false);
  const [loadingDepartureCities, setLoadingDepartureCities] = useState(false);
  const [loadingArrivalStates, setLoadingArrivalStates] = useState(false);
  const [loadingArrivalCities, setLoadingArrivalCities] = useState(false);

  // Check if company member is trying to access quote request
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (user.id && user.role === 'company') {
      setShowRestrictionModal(true);
    }
  }, []);

  // Load countries on component mount
  useEffect(() => {
    const loadCountries = async () => {
      setLoadingCountries(true);
      try {
        const countriesData = await fetchCountries();
        setCountries(countriesData);
      } catch (error) {
        toast.error('Failed to load countries');
      } finally {
        setLoadingCountries(false);
      }
    };
    
    loadCountries();
  }, []);
  const [formData, setFormData] = useState({
    shippingMode: '',
    arrivalDate: '',
    departureCountry: '',
    departureState: '',
    departureCity: '',
    departureType: '',
    arrivalCountry: '',
    arrivalState: '',
    arrivalCity: '',
    arrivalType: '',
    productDescription: '',
    packing: '',
    incoterms: '',
    quantity: '',
    weight: '',
    type: '',
    length: '',
    width: '',
    height: '',
    dimensionUnit: '',
    isStackable: false,
    isHazardous: false,
    hasInsurance: false,
    notes: ''
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Handle departure location cascading
    if (name === 'departureCountry') {
      setFormData(prev => ({ 
        ...prev, 
        departureCountry: value,
        departureState: '',
        departureCity: ''
      }));
      setDepartureStates([]);
      setDepartureCities([]);
      if (value) {
        loadDepartureStates(value);
      }
    } else if (name === 'departureState') {
      setFormData(prev => ({ 
        ...prev, 
        departureState: value,
        departureCity: ''
      }));
      setDepartureCities([]);
      if (value && formData.departureCountry) {
        loadDepartureCities(formData.departureCountry, value);
      }
    }

    // Handle arrival location cascading
    if (name === 'arrivalCountry') {
      setFormData(prev => ({ 
        ...prev, 
        arrivalCountry: value,
        arrivalState: '',
        arrivalCity: ''
      }));
      setArrivalStates([]);
      setArrivalCities([]);
      if (value) {
        loadArrivalStates(value);
      }
    } else if (name === 'arrivalState') {
      setFormData(prev => ({ 
        ...prev, 
        arrivalState: value,
        arrivalCity: ''
      }));
      setArrivalCities([]);
      if (value && formData.arrivalCountry) {
        loadArrivalCities(formData.arrivalCountry, value);
      }
    }
  };

  // Load departure states
  const loadDepartureStates = async (countryName) => {
    setLoadingDepartureStates(true);
    try {
      const statesData = await fetchStates(countryName);
      setDepartureStates(statesData);
    } catch (error) {
      toast.error('Failed to load departure states');
    } finally {
      setLoadingDepartureStates(false);
    }
  };

  // Load departure cities
  const loadDepartureCities = async (countryName, stateName) => {
    setLoadingDepartureCities(true);
    try {
      const citiesData = await fetchCities(countryName, stateName);
      setDepartureCities(citiesData);
    } catch (error) {
      toast.error('Failed to load departure cities');
    } finally {
      setLoadingDepartureCities(false);
    }
  };

  // Load arrival states
  const loadArrivalStates = async (countryName) => {
    setLoadingArrivalStates(true);
    try {
      const statesData = await fetchStates(countryName);
      setArrivalStates(statesData);
    } catch (error) {
      toast.error('Failed to load arrival states');
    } finally {
      setLoadingArrivalStates(false);
    }
  };

  // Load arrival cities
  const loadArrivalCities = async (countryName, stateName) => {
    setLoadingArrivalCities(true);
    try {
      const citiesData = await fetchCities(countryName, stateName);
      setArrivalCities(citiesData);
    } catch (error) {
      toast.error('Failed to load arrival cities');
    } finally {
      setLoadingArrivalCities(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.shippingMode || !formData.arrivalDate || !formData.departureCountry || 
        !formData.arrivalCountry || !formData.productDescription) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Check if company member is trying to submit
    if (user.id && user.role === 'company') {
      setPendingQuoteData(formData);
      setShowRestrictionModal(true);
      return;
    }

    if (!token || !user.id) {
      // User is not logged in, store quote data and show account type selection modal
      localStorage.setItem('pendingQuote', JSON.stringify(formData));
      setShowAccountTypeModal(true);
      return;
    }

    // User is logged in, submit the quote
    setLoading(true);
    try {
      await api.post('/api/quotes/submit', formData);

      toast.success('Quote request submitted successfully!');
      
      // Redirect to appropriate dashboard based on user role
      if (user.role === 'business') {
        navigate('/business/dashboard');
      } else if (user.role === 'user') {
        navigate('/user/dashboard');
      } else if (user.role === 'company') {
        navigate('/company/dashboard');
      } else {
        navigate('/'); // Default fallback
      }
      
      // Reset form
      setFormData({
        shippingMode: '',
        arrivalDate: '',
        departureCountry: '',
        departureState: '',
        departureCity: '',
        departureType: '',
        arrivalCountry: '',
        arrivalState: '',
        arrivalCity: '',
        arrivalType: '',
        productDescription: '',
        packing: '',
        incoterms: '',
        quantity: '',
        weight: '',
        type: '',
        length: '',
        width: '',
        height: '',
        dimensionUnit: '',
        isStackable: false,
        isHazardous: false,
        hasInsurance: false,
        notes: ''
      });
    } catch (error) {
      toast.error('Error submitting quote: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowRestrictionModal(false);
    setPendingQuoteData(null);
    // Redirect back to company dashboard
    navigate('/company/dashboard');
  };

  const handleAccountTypeModalClose = () => {
    setShowAccountTypeModal(false);
  };

  const handleSelectUserAccount = () => {
    setShowAccountTypeModal(false);
    navigate('/user-register', { 
      state: { 
        from: '/user/dashboard',
        hasPendingQuote: true,
        preSelectedRole: 'User',
        message: 'Create a User account to request and track quotes as an individual.'
      }
    });
  };

  const handleSelectBusinessAccount = () => {
    setShowAccountTypeModal(false);
    navigate('/register', { 
      state: { 
        from: '/business/dashboard',
        hasPendingQuote: true,
        preSelectedRole: 'Business',
        message: 'Create a Business account to request and track quotes for your business.'
      }
    });
  };

  return (
    <div className="bg-gray-100">
      {/* --- Hero Banner --- */}
      <div className="relative h-64 mt-20 bg-cover bg-center" style={{ backgroundImage: `url('/Login.jpg')` }}>
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold">Request a FREE shipping quote</h1>
          <p className="mt-2 text-sm">
            <a href="#" className="hover:underline">Home</a> &gt; <span>Request a FREE shipping quote</span>
          </p>
        </div>
      </div>
      
      {/* --- Main Content --- */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (Main Form) */}
          <div className="lg:col-span-2 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Quote Information Section */}
              <section className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                <SectionHeader 
                  title="Quote Information" 
                  subtitle="Tell us about your shipping requirements"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <SelectField 
                    label="Shipping mode" 
                    name="shippingMode" 
                    value={formData.shippingMode}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select shipping method</option>
                    <option value="air">✈️ Air Freight</option>
                    <option value="sea">🚢 Sea Freight</option>
                    <option value="road">🚛 Road Transport</option>
                    <option value="rail">🚂 Rail Transport</option>
                  </SelectField>
                  <div className="relative">
                    <label htmlFor="arrivalDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Select arrival date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="date" 
                        id="arrivalDate" 
                        name="arrivalDate" 
                        value={formData.arrivalDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]} // Prevent selecting past dates
                        className="w-full p-3 bg-gray-100 border-transparent rounded-md focus:border-[#CDA435] focus:ring-[#CDA435] focus:bg-white transition-colors" 
                      />
                      {/* <FiCalendar className="absolute right-3 top-3 text-gray-400 pointer-events-none"/> */}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Select a future date for cargo arrival</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <SelectField 
                    label="Departure country" 
                    name="departureCountry" 
                    value={formData.departureCountry}
                    onChange={handleInputChange}
                    loading={loadingCountries}
                    required
                  >
                    <option value="">Select Country</option>
                    {countries.map(country => (
                      <option key={country.code} value={country.name}>
                        {country.name}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField 
                    label="Departure State" 
                    name="departureState" 
                    value={formData.departureState}
                    onChange={handleInputChange}
                    loading={loadingDepartureStates}
                    disabled={!formData.departureCountry}
                  >
                    <option value="">Select State</option>
                    {departureStates.map(state => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField 
                    label="Departure City" 
                    name="departureCity" 
                    value={formData.departureCity}
                    onChange={handleInputChange}
                    loading={loadingDepartureCities}
                    disabled={!formData.departureState}
                  >
                    <option value="">Select City</option>
                    {departureCities.map(city => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField 
                    label="Departure type" 
                    name="departureType" 
                    value={formData.departureType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="port">Port</option>
                    <option value="airport">Airport</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="factory">Factory</option>
                  </SelectField>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <SelectField 
                    label="Arrival country" 
                    name="arrivalCountry" 
                    value={formData.arrivalCountry}
                    onChange={handleInputChange}
                    loading={loadingCountries}
                    required
                  >
                    <option value="">Select Country</option>
                    {countries.map(country => (
                      <option key={country.code} value={country.name}>
                        {country.name}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField 
                    label="Arrival State" 
                    name="arrivalState" 
                    value={formData.arrivalState}
                    onChange={handleInputChange}
                    loading={loadingArrivalStates}
                    disabled={!formData.arrivalCountry}
                    required
                  >
                    <option value="">Select State</option>
                    {arrivalStates.map(state => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField 
                    label="Arrival City" 
                    name="arrivalCity" 
                    value={formData.arrivalCity}
                    onChange={handleInputChange}
                    loading={loadingArrivalCities}
                    disabled={!formData.arrivalState}
                    required
                  >
                    <option value="">Select City</option>
                    {arrivalCities.map(city => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField 
                    label="Arrival type" 
                    name="arrivalType" 
                    value={formData.arrivalType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="port">Port</option>
                    <option value="airport">Airport</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="factory">Factory</option>
                  </SelectField>
                </div>
                <div className="mb-6">
                    <InputField 
                      label="What is the cargo / product?" 
                      name="productDescription" 
                      value={formData.productDescription}
                      onChange={handleInputChange}
                      placeholder="Describe The Product" 
                      required 
                    />
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                  <SelectField 
                    label="How is your cargo packed" 
                    name="packing" 
                    value={formData.packing}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Please select</option>
                    <option value="pallets">Pallets</option>
                    <option value="boxes">Boxes</option>
                    <option value="crates">Crates</option>
                    <option value="loose">Loose</option>
                    <option value="containers">Containers</option>
                  </SelectField>
                  <SelectField 
                    label="Incoterms" 
                    name="incoterms"
                    value={formData.incoterms}
                    onChange={handleInputChange}
                  >
                    <option value="">Unknown</option>
                    <option value="EXW">EXW - Ex Works</option>
                    <option value="FOB">FOB - Free on Board</option>
                    <option value="CIF">CIF - Cost, Insurance & Freight</option>
                    <option value="DDP">DDP - Delivered Duty Paid</option>
                  </SelectField>
                  <InputField 
                    label="Quantity" 
                    name="quantity" 
                    value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder="Quantity" 
                    required 
                  />
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <InputField 
                    label="Weight" 
                    name="weight" 
                    value={formData.weight}
                    onChange={handleInputChange}
                    placeholder="Weight (kg)" 
                    required 
                  />
                  <SelectField 
                    label="Type" 
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                  >
                    <option value="">Select one</option>
                    <option value="general">General Cargo</option>
                    <option value="hazardous">Hazardous</option>
                    <option value="perishable">Perishable</option>
                    <option value="fragile">Fragile</option>
                  </SelectField>
                </div>
              </section>

              {/* Dimensions Section */}
              <section className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                <SectionHeader 
                  title="Dimensions L x W x H" 
                  subtitle="Specify cargo dimensions for accurate pricing"
                />
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                  <InputField 
                    label="Length" 
                    name="length" 
                    value={formData.length}
                    onChange={handleInputChange}
                    placeholder="Length" 
                  />
                  <InputField 
                    label="Width" 
                    name="width" 
                    value={formData.width}
                    onChange={handleInputChange}
                    placeholder="Width" 
                  />
                  <InputField 
                    label="Height" 
                    name="height" 
                    value={formData.height}
                    onChange={handleInputChange}
                    placeholder="Height" 
                  />
                  <SelectField 
                    label="Unit" 
                    name="dimensionUnit"
                    value={formData.dimensionUnit}
                    onChange={handleInputChange}
                  >
                    <option value="">Select unit</option>
                    <option value="cm">📏 Centimeters</option>
                    <option value="m">📐 Meters</option>
                    <option value="in">📏 Inches</option>
                    <option value="ft">📐 Feet</option>
                  </SelectField>
                </div>
              </section>

              {/* Additional Items Section */}
              <section className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                <SectionHeader 
                  title="Additional Items" 
                  subtitle="Special requirements and cargo insurance options"
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <CheckboxField 
                      label="📦 Stackable cargo" 
                      name="isStackable" 
                      checked={formData.isStackable}
                      onChange={handleInputChange}
                    />
                    <CheckboxField 
                      label="⚠️ Hazardous materials" 
                      name="isHazardous" 
                      checked={formData.isHazardous}
                      onChange={handleInputChange}
                    />
                    <CheckboxField 
                      label="🛡️ Cargo insurance required" 
                      name="hasInsurance" 
                      checked={formData.hasInsurance}
                      onChange={handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes & Special Instructions
                    </label>
                    <textarea 
                      id="notes" 
                      name="notes" 
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows="4" 
                      placeholder="Any special handling requirements, delivery instructions, or additional information..." 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-[#CDA435] focus:ring-2 focus:ring-[#CDA435]/20 focus:bg-white transition-all duration-200 hover:border-gray-300 resize-none"
                    ></textarea>
                </div>
              </section>
              
              {/* Submit Button */}
              <div className="bg-gradient-to-r from-[#CDA435] to-[#B8941F] p-6 rounded-xl shadow-lg">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-white text-[#CDA435] font-bold py-4 px-8 rounded-lg shadow-md hover:bg-gray-50 transition-all duration-200 text-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#CDA435] mr-3"></div>
                      Submitting Quote Request...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span className="mr-2">🚀</span>
                      Submit Quote Request
                    </div>
                  )}
                </button>
                <p className="text-center text-white text-sm mt-3 opacity-90">
                  Get competitive quotes from verified shipping companies
                </p>
              </div>
            </form>
          </div>
          
          {/* Right Column (Sidebar) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Quote Button */}
            <div className="bg-gradient-to-br from-[#CDA435] to-[#B8941F] p-6 rounded-xl shadow-lg text-center">
              <button className="w-full bg-white text-[#CDA435] font-bold py-3 px-6 rounded-lg shadow-md hover:bg-gray-50 transition-all duration-200 transform hover:scale-105">
                🚀 Request a Quote
              </button>
            </div>

            {/* Contact Information Card */}
            <div className="bg-gradient-to-br from-[#C9A959] to-[#B8941F] p-6 rounded-xl shadow-lg text-center text-white">
                <div className="mb-4">
                  <h4 className="text-xl font-bold mb-2">Need Any Information?</h4>
                  <p className="text-sm opacity-90">Please Contact Our Experts</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-center justify-center mb-3">
                      <FiPhone className="h-8 w-8 mr-3 opacity-90" />
                      <p className="text-2xl font-bold">+973 17491222</p>
                  </div>
                  <p className="text-sm opacity-80">Available 24/7 for assistance</p>
                </div>
            </div>

            {/* Features List */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <h4 className="text-lg font-bold text-gray-800 mb-4">Why Choose Us?</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Free quote comparison
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Verified shipping companies
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Real-time tracking
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  24/7 customer support
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Secure payment options
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Company Restriction Modal */}
      <CompanyQuoteRestrictionModal
        isOpen={showRestrictionModal}
        onClose={handleModalClose}
        quoteData={pendingQuoteData}
      />

      {/* Account Type Selection Modal */}
      <AccountTypeSelectionModal
        isOpen={showAccountTypeModal}
        onClose={handleAccountTypeModalClose}
        onSelectUser={handleSelectUserAccount}
        onSelectBusiness={handleSelectBusinessAccount}
      />
    </div>
  );
};

export default RequestQuote;