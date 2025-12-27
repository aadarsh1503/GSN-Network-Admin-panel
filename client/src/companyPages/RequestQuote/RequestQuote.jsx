import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPhone, FiCalendar } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import CompanyQuoteRestrictionModal from '../../components/Modal/CompanyQuoteRestrictionModal';

// --- Reusable Form Field Components ---
const InputField = ({ label, name, placeholder, required = false, value, onChange }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type="text"
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full p-3 bg-gray-100 border-transparent rounded-md focus:border-yellow-500 focus:ring-yellow-500"
    />
  </div>
);

const SelectField = ({ label, name, required = false, value, onChange, children }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full p-3 bg-gray-100 border-transparent rounded-md focus:border-yellow-500 focus:ring-yellow-500"
    >
      {children}
    </select>
  </div>
);

const CheckboxField = ({ label, name, checked, onChange }) => (
    <div className="flex items-center">
        <input 
          id={name} 
          name={name} 
          type="checkbox" 
          checked={checked}
          onChange={onChange}
          className="h-4 w-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
        />
        <label htmlFor={name} className="ml-2 block text-sm text-gray-700">{label}</label>
    </div>
);

// --- Section Heading Component ---
const SectionHeader = ({ title }) => (
    <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <div className="border-b-2 border-[#C9A959] w-12 mt-1"></div>
    </div>
);


// --- The Main RequestQuote Component ---
const RequestQuote = () => {
  const [loading, setLoading] = useState(false);
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);
  const [pendingQuoteData, setPendingQuoteData] = useState(null);
  const navigate = useNavigate();

  // Check if company member is trying to access quote request
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (user.id && user.role === 'company') {
      setShowRestrictionModal(true);
    }
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
      // User is not logged in, store quote data and redirect to login
      localStorage.setItem('pendingQuote', JSON.stringify(formData));
      
      const shouldRegister = window.confirm(
        'To submit and track your quote, please create an account or login. Would you like to register now?'
      );
      
      if (shouldRegister) {
        navigate('/user-register', { 
          state: { 
            from: '/user/dashboard',
            hasPendingQuote: true 
          }
        });
      } else {
        navigate('/login', { 
          state: { 
            from: '/user/dashboard',
            hasPendingQuote: true 
          }
        });
      }
      return;
    }

    // User is logged in and is a regular user, submit the quote
    setLoading(true);
    try {
      const response = await api.post('/api/quotes/submit', formData);

      toast.success('Quote request submitted successfully!');
      
      // Redirect to user dashboard
      navigate('/user/dashboard');
      
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
          <div className="lg:col-span-2 bg-white p-8 rounded-lg shadow-md">
            <form onSubmit={handleSubmit}>
              {/* Quote Information Section */}
              <section>
                <SectionHeader title="Quote Information" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <SelectField 
                    label="Shipping mode" 
                    name="shippingMode" 
                    value={formData.shippingMode}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select one</option>
                    <option value="air">Air Freight</option>
                    <option value="sea">Sea Freight</option>
                    <option value="road">Road Transport</option>
                    <option value="rail">Rail Transport</option>
                  </SelectField>
                  <div className="relative">
                    <label htmlFor="arrivalDate" className="block text-sm font-medium text-gray-700 mb-1">Select arrival date <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      id="arrivalDate" 
                      name="arrivalDate" 
                      value={formData.arrivalDate}
                      onChange={handleInputChange}
                      className="w-full p-3 bg-gray-100 border-transparent rounded-md focus:border-yellow-500 focus:ring-yellow-500" 
                    />
                    {/* <FiCalendar className="absolute right-3 top-10 text-gray-400"/> */}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <SelectField 
                    label="Departure country" 
                    name="departureCountry" 
                    value={formData.departureCountry}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Country</option>
                    <option value="UAE">UAE</option>
                    <option value="Saudi Arabia">Saudi Arabia</option>
                    <option value="Kuwait">Kuwait</option>
                    <option value="Qatar">Qatar</option>
                    <option value="Bahrain">Bahrain</option>
                    <option value="Oman">Oman</option>
                  </SelectField>
                  <InputField 
                    label="Departure State" 
                    name="departureState" 
                    value={formData.departureState}
                    onChange={handleInputChange}
                    placeholder="Enter State"
                  />
                  <InputField 
                    label="Departure City" 
                    name="departureCity" 
                    value={formData.departureCity}
                    onChange={handleInputChange}
                    placeholder="Enter City"
                  />
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
                    required
                  >
                    <option value="">Select Country</option>
                    <option value="UAE">UAE</option>
                    <option value="Saudi Arabia">Saudi Arabia</option>
                    <option value="Kuwait">Kuwait</option>
                    <option value="Qatar">Qatar</option>
                    <option value="Bahrain">Bahrain</option>
                    <option value="Oman">Oman</option>
                  </SelectField>
                  <InputField 
                    label="Arrival State" 
                    name="arrivalState" 
                    value={formData.arrivalState}
                    onChange={handleInputChange}
                    placeholder="Enter State"
                    required
                  />
                  <InputField 
                    label="Arrival City" 
                    name="arrivalCity" 
                    value={formData.arrivalCity}
                    onChange={handleInputChange}
                    placeholder="Enter City"
                    required
                  />
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
              <section className="mt-10">
                <SectionHeader title="Dimensions L x W x H" />
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                  <InputField 
                    label="" 
                    name="length" 
                    value={formData.length}
                    onChange={handleInputChange}
                    placeholder="Length" 
                  />
                  <InputField 
                    label="" 
                    name="width" 
                    value={formData.width}
                    onChange={handleInputChange}
                    placeholder="Width" 
                  />
                  <InputField 
                    label="" 
                    name="height" 
                    value={formData.height}
                    onChange={handleInputChange}
                    placeholder="Height" 
                  />
                  <SelectField 
                    label="" 
                    name="dimensionUnit"
                    value={formData.dimensionUnit}
                    onChange={handleInputChange}
                  >
                    <option value="">Select unit</option>
                    <option value="cm">Centimeters</option>
                    <option value="m">Meters</option>
                    <option value="in">Inches</option>
                    <option value="ft">Feet</option>
                  </SelectField>
                </div>
              </section>

              {/* Additional Items Section */}
              <section className="mt-10">
                <SectionHeader title="Additional Items" />
                <div className="flex space-x-6 mb-6">
                    <CheckboxField 
                      label="Stackable?" 
                      name="isStackable" 
                      checked={formData.isStackable}
                      onChange={handleInputChange}
                    />
                    <CheckboxField 
                      label="Hazardous?" 
                      name="isHazardous" 
                      checked={formData.isHazardous}
                      onChange={handleInputChange}
                    />
                    <CheckboxField 
                      label="Cargo Insurance?" 
                      name="hasInsurance" 
                      checked={formData.hasInsurance}
                      onChange={handleInputChange}
                    />
                </div>
                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                    <textarea 
                      id="notes" 
                      name="notes" 
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows="6" 
                      placeholder="Additional Notes" 
                      className="w-full p-3 bg-gray-100 border-transparent rounded-md focus:border-yellow-500 focus:ring-yellow-500"
                    ></textarea>
                </div>
              </section>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-8 bg-[#C9A959] text-white font-bold py-4 rounded-lg shadow-md hover:bg-yellow-700 transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Quote Request'}
              </button>
            </form>
          </div>
          
          {/* Right Column (Sidebar) */}
          <div className="lg:col-span-1 space-y-8">
            <button className="w-full bg-[#C9A959] text-white font-bold py-3 rounded-lg shadow-md hover:bg-yellow-700 transition-colors">
              Request a quote
            </button>
            <div className="bg-[#C9A959] p-6 rounded-lg shadow-md text-center text-white">
                <h4 className="text-xl font-bold">Need Any Information?</h4>
                <p className="text-sm opacity-90 my-2">Please Contact Our Experts</p>
                <div className="flex items-center justify-center mt-4">
                    <FiPhone className="h-12 w-12 mr-3 opacity-80" />
                    <p className="text-3xl font-bold">+973 17491222</p>
                </div>
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
    </div>
  );
};

export default RequestQuote;