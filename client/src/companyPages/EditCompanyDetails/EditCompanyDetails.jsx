import React, { useState, useRef, useEffect } from 'react';
import $ from 'jquery';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import api from '../../utils/api';

// --- Reusable CONTROLLED Form Field Components ---
const InputField = ({ label, name, value, onChange, placeholder, type = 'text' }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            type={type}
            id={name}
            name={name}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200"
        />
    </div>
);

const SelectField = ({ label, name, value, onChange, children, loading = false, disabled = false }) => (
    <div className="relative">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select
            id={name}
            name={name}
            value={value || ''}
            onChange={onChange}
            disabled={disabled || loading}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none"
        >
            {children}
        </select>
        {loading && (
            <div className="absolute right-3 top-9">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
            </div>
        )}
        {!loading && (
            <div className="absolute right-3 top-9 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        )}
    </div>
);

// Enhanced Phone Field with react-phone-input-2
const PhoneField = ({ label, name, value, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <PhoneInput
            country={'in'}
            value={value || ''}
            onChange={(phone) => onChange({ target: { name, value: phone } })}
            inputClass="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200"
            buttonClass="border border-gray-300 rounded-l-md bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
            dropdownClass="border border-gray-300 rounded-md shadow-lg"
            containerClass="react-phone-input-wrapper"
            inputProps={{
                name: name,
                required: true,
            }}
        />
    </div>
);

const CheckboxField = ({ label, name, checked, onChange }) => (
    <div className="flex items-center group cursor-pointer">
        <div className="relative">
            <input
                id={name}
                name={name}
                type="checkbox"
                checked={checked || false}
                onChange={onChange}
                className="h-5 w-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500 transition-colors duration-200 opacity-0 absolute"
            />
            <div className={`h-5 w-5 border-2 rounded flex items-center justify-center transition-all duration-200 ${
                checked 
                    ? 'bg-yellow-600 border-yellow-600' 
                    : 'bg-white border-gray-300 group-hover:border-yellow-400'
            }`}>
                {checked && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </div>
        </div>
        <label htmlFor={name} className="ml-3 block text-sm text-gray-700 group-hover:text-gray-900 cursor-pointer transition-colors duration-200">
            {label}
        </label>
    </div>
);

const TextareaField = ({ label, name, value, onChange, rows = 3 }) => (
    <div>
        <label htmlFor={name} className="block text-base font-medium text-gray-700 mb-1">{label}</label>
        <textarea
            id={name}
            name={name}
            rows={rows}
            value={value || ''}
            onChange={onChange}
            className="w-full p-3 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 resize-vertical"
        ></textarea>
    </div>
);

const SectionHeader = ({ title }) => (
    <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-3 mb-6 flex items-center">
        <span className="bg-yellow-100 text-yellow-800 p-2 rounded-lg mr-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        </span>
        {title}
    </h2>
);

// Loading Spinner Component
const LoadingSpinner = ({ size = 'small' }) => (
    <div className={`animate-spin rounded-full border-b-2 border-yellow-600 ${
        size === 'small' ? 'h-4 w-4' : 
        size === 'medium' ? 'h-6 w-6' : 
        'h-8 w-8'
    }`}></div>
);

// --- NEW: Logo Upload Component ---
const LogoUpload = ({ currentLogo, onFileChange }) => {
    const [preview, setPreview] = useState(currentLogo);

    // Update preview if the prop changes (e.g., initial load)
    useEffect(() => {
        if (!preview && currentLogo) {
            setPreview(currentLogo);
        }
    }, [currentLogo]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Create a local URL for preview immediately
            setPreview(URL.createObjectURL(file));
            // Pass file back to parent for submission
            onFileChange(file);
        }
    };

    return (
        <div className="flex items-center space-x-6 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="shrink-0">
                <div className="h-24 w-24 rounded-full overflow-hidden bg-white border-2 border-yellow-500 relative flex items-center justify-center group shadow-sm">
                    {preview ? (
                        <img src={preview} alt="Company Logo" className="h-full w-full object-cover" />
                    ) : (
                        <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    )}
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer" onClick={() => document.getElementById('logo-upload').click()}>
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo</label>
                <div className="flex items-center">
                    <input
                        type="file"
                        id="logo-upload"
                        name="logo"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => document.getElementById('logo-upload').click()}
                        className="py-2 px-4 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                    >
                        Change Logo
                    </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">Recommended: Square JPG, PNG or WEBP. Max 5MB.</p>
            </div>
        </div>
    );
};


// --- The Main EditCompanyDetails Component ---
const EditCompanyDetails = () => {
    // --- STATE MANAGEMENT ---
    const [formData, setFormData] = useState({});
    const [logoFile, setLogoFile] = useState(null); // New state for file
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [locationMethod, setLocationMethod] = useState('coordinates'); // New state for location method
    
    // Location data states
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [loadingStates, setLoadingStates] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);

    const editorWrapperRef = useRef(null);

    const servicesList = [
        'specialities of logistics companies', 'Healthcare and Pharma', 'Live Animals', 'e-commerce',
        'Aerospace and Defence', 'Industrial and Construction', 'Perishables', 'Hotel Logistics',
        'Automotive', 'Time critical', 'Fairs and Exhibitions', 'Dangerous goods',
        'Beverages', 'Marine Parts', 'Recyclables', 'Heavy Lifts & Oversized Cargo',
        'Electronics', 'AOG Desktop', 'Sports and Events', 'Break bulk',
        'Fashion and retail', 'Oil and gas', 'RoRo', 'Packing', 'Distribution'
    ];

    // --- COUNTRY, STATE, CITY API FUNCTIONS ---
    
    // Fetch all countries
    const fetchCountries = async () => {
        setLoadingCountries(true);
        try {
            const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,flags');
            const countriesData = await response.json();
            const sortedCountries = countriesData
                .map(country => ({
                    name: country.name.common,
                    code: country.cca2,
                    flag: country.flags.png
                }))
                .sort((a, b) => a.name.localeCompare(b.name));
            
            setCountries(sortedCountries);
        } catch (err) {
            console.error('Error fetching countries:', err);
            setError('Failed to load countries');
        } finally {
            setLoadingCountries(false);
        }
    };

    // Fetch states based on selected country
    const fetchStates = async (countryName) => {
        if (!countryName) {
            setStates([]);
            setCities([]);
            return;
        }

        setLoadingStates(true);
        setStates([]);
        setCities([]);
        
        try {
            const response = await fetch(`https://countriesnow.space/api/v0.1/countries/states`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    country: countryName
                })
            });
            
            const statesData = await response.json();
            if (statesData.data && statesData.data.states) {
                const sortedStates = statesData.data.states
                    .map(state => state.name)
                    .sort();
                setStates(sortedStates);
            } else {
                setStates([]);
            }
        } catch (err) {
            console.error('Error fetching states:', err);
            setStates([]);
        } finally {
            setLoadingStates(false);
        }
    };

    // Fetch cities based on selected country and state
    const fetchCities = async (countryName, stateName) => {
        if (!countryName || !stateName) {
            setCities([]);
            return;
        }

        setLoadingCities(true);
        setCities([]);
        
        try {
            // Clean the country and state names (remove extra spaces)
            const cleanCountry = countryName.trim();
            const cleanState = stateName.trim();
            
            const response = await fetch(`https://countriesnow.space/api/v0.1/countries/state/cities`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    country: cleanCountry,
                    state: cleanState
                })
            });
            
            const citiesData = await response.json();
            if (citiesData.data && Array.isArray(citiesData.data)) {
                const sortedCities = citiesData.data.sort();
                setCities(sortedCities);
            } else {
                console.log('No cities found for:', cleanCountry, cleanState);
                setCities([]);
            }
        } catch (err) {
            console.error('Error fetching cities:', err);
            setCities([]);
        } finally {
            setLoadingCities(false);
        }
    };

    // --- DATA FETCHING ---
    useEffect(() => {
        const fetchInitialData = async () => {
            setError('');
            setLoading(true);
            try {
                // Fetch countries first
                await fetchCountries();
                
                // Then fetch company and user data
                const [companyData, userData] = await Promise.all([
                    api.get('/api/company/profile'),
                    api.get('/api/user/me')
                ]);

                companyData.services = companyData.services && typeof companyData.services === 'string'
                    ? JSON.parse(companyData.services)
                    : companyData.services || [];
                
                const combinedData = {
                    ...companyData,
                    owner_name: companyData.owner_name || userData.user || '', 
                    owner_phone: companyData.owner_phone || userData.phone_number || '',
                    // Ensure logo exists in state
                    logo: companyData.logo || '' 
                };
                setFormData(combinedData);

                // Set initial location method based on existing data
                if (combinedData.latitude && combinedData.longitude) {
                    setLocationMethod('coordinates');
                } else if (combinedData.map_location) {
                    setLocationMethod('maps');
                } else {
                    setLocationMethod('coordinates'); // Default to coordinates
                }

                // If country is already set, fetch states
                if (combinedData.country) {
                    await fetchStates(combinedData.country);
                }
                
                // If state is already set, fetch cities
                if (combinedData.country && combinedData.state) {
                    await fetchCities(combinedData.country, combinedData.state);
                }

            } catch (err) {
                if (err.message !== 'Session expired') {
                    setError(err.message);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    // --- INPUT HANDLERS ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Handle location cascading
        if (name === 'country') {
            setFormData(prev => ({ 
                ...prev, 
                country: value,
                state: '',
                city: ''
            }));
            setStates([]);
            setCities([]);
            if (value) {
                fetchStates(value);
            }
        } else if (name === 'state') {
            setFormData(prev => ({ 
                ...prev, 
                state: value,
                city: ''
            }));
            setCities([]);
            if (value && formData.country) {
                fetchCities(formData.country, value);
            }
        }
    };

    const handleServiceChange = (e) => {
        const { name, checked } = e.target;
        const currentServices = formData.services || [];
        const updatedServices = checked
            ? [...currentServices, name]
            : currentServices.filter(service => service !== name);
        setFormData({ ...formData, services: updatedServices });
    };

    const handleEditorChange = (content) => {
        setFormData(prev => ({ ...prev, about_company: content }));
    };

    // --- SUMMERNOTE INITIALIZATION ---
    useEffect(() => {
        if (loading || !editorWrapperRef.current) return;

        let shadow;
        if (!editorWrapperRef.current.shadowRoot) {
            shadow = editorWrapperRef.current.attachShadow({ mode: "open" });
        } else {
            shadow = editorWrapperRef.current.shadowRoot;
        }

        if (shadow.querySelector('.note-editor')) {
            return;
        }

        const bootstrapLink = document.createElement("link");
        bootstrapLink.rel = "stylesheet";
        bootstrapLink.href = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css";
        shadow.appendChild(bootstrapLink);

        const summernoteLink = document.createElement("link");
        summernoteLink.rel = "stylesheet";
        summernoteLink.href = "https://cdn.jsdelivr.net/npm/summernote@0.8.20/dist/summernote-lite.min.css";
        shadow.appendChild(summernoteLink);

        const editorDiv = document.createElement("div");
        shadow.appendChild(editorDiv);

        import("bootstrap/dist/js/bootstrap.bundle.min.js").then(() => {
            import("summernote/dist/summernote-lite.js").then(() => {
                $(editorDiv).summernote({
                    height: 300,
                    toolbar: [
                        ["style", ["style"]],
                        ["font", ["bold", "italic", "underline", "clear"]],
                        ["para", ["ul", "ol", "paragraph"]],
                        ["insert", ["link", "picture"]],
                        ["view", ["fullscreen", "codeview"]],
                    ],
                    callbacks: {
                        onChange: (contents) => handleEditorChange(contents),
                    },
                });

                $(editorDiv).summernote("code", formData.about_company || '');
            });
        });

        return () => {
            const editorInstance = $(shadow).find('> div');
            if (editorInstance.length && editorInstance.hasClass('note-editor')) {
                editorInstance.summernote('destroy');
            }
            if (shadow) {
                shadow.innerHTML = "";
            }
        };
    }, [loading]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const dataToSend = new FormData();

            // 1. Clean up location data based on selected method
            const cleanedFormData = { ...formData };
            
            if (locationMethod === 'coordinates') {
                // If coordinates method is selected, clear map_location
                cleanedFormData.map_location = '';
            } else if (locationMethod === 'maps') {
                // If maps method is selected, clear coordinates
                cleanedFormData.latitude = '';
                cleanedFormData.longitude = '';
            }

            // 2. Append Text Data
            Object.keys(cleanedFormData).forEach(key => {
                if (key === 'services') {
                    dataToSend.append('services', JSON.stringify(cleanedFormData.services || []));
                } else if (key !== 'logo' && key !== 'incharge_image' && key !== 'incharge_image_file' && cleanedFormData[key] !== null && cleanedFormData[key] !== undefined && cleanedFormData[key] !== '') {
                    dataToSend.append(key, cleanedFormData[key]);
                }
            });

            // 3. Append Files (if selected)
            if (logoFile) {
                dataToSend.append('logo', logoFile);
            }
            
            if (cleanedFormData.incharge_image_file) {
                dataToSend.append('incharge_image', cleanedFormData.incharge_image_file);
            }

            // 4. Get Token
            const token = localStorage.getItem('token'); 

            // 5. Debug log the data being sent
            console.log('Submitting form data:');
            for (let [key, value] of dataToSend.entries()) {
                console.log(`${key}:`, value);
            }

            // 6. Use raw fetch instead of 'api' utility
            const response = await fetch('/api/company/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}` 
                },
                body: dataToSend
            });

            // 7. Handle Response
            const result = await response.json();

            if (!response.ok) {
                console.error('Server error response:', result);
                throw new Error(result.message || 'Update failed');
            }
            
            // Update local state with new logo and incharge image
            if (result.logo) {
                setFormData(prev => ({ ...prev, logo: result.logo }));
            }
            
            if (result.incharge_image) {
                setFormData(prev => ({ ...prev, incharge_image: result.incharge_image }));
            }
            
            setSuccess('Profile updated successfully!');
            setTimeout(() => {
                window.location.reload();
            }, 1500);
            window.scrollTo(0, 0);

        } catch (err) {
            console.error('Form submission error:', err);
            if (err.message !== 'Session expired') {
                setError(err.message || 'An error occurred while updating the profile');
            }
        }
    };
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <LoadingSpinner size="large" />
                    <h3 className="mt-4 text-lg font-semibold text-gray-800">Loading Company Details</h3>
                    <p className="mt-2 text-gray-600">Please wait while we fetch your information...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header Card */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 bg-gradient-to-r from-yellow-600 to-yellow-700 bg-clip-text text-transparent">
                                Edit Company Details
                            </h1>
                            <p className="text-gray-600 mt-2">Update your company information and profile settings</p>
                        </div>
                        <div className="hidden md:block">
                            <div className="bg-yellow-100 text-yellow-800 p-3 rounded-xl">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-red-700 font-medium">{error}</span>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl shadow-sm">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-green-700 font-medium">{success}</span>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-200">
                    <form onSubmit={handleSubmit} className="space-y-12">
                        {/* Basic Information Section */}
                        <section>
                            <SectionHeader title="Basic Information" />
                            
                            {/* --- ADDED LOGO UPLOAD HERE --- */}
                            <LogoUpload 
                                currentLogo={formData.logo} 
                                onFileChange={setLogoFile} 
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField 
                                    label="Company Name" 
                                    name="name" 
                                    value={formData.name} 
                                    onChange={handleChange}
                                    placeholder="Enter your company name"
                                />
                                
                                <SelectField 
                                    label="Category" 
                                    name="category" 
                                    value={formData.category} 
                                    onChange={handleChange}
                                >
                                    <option value="">Select Category...</option>
                                    <option value="3pl">Third-Party Logistics Providers (3PLs)</option>
                                    <option value="freight_forwarders">Freight Forwarders</option>
                                    <option value="courier_parcel">Courier and Parcel Delivery Services</option>
                                    <option value="warehousing_distribution">Warehousing and Distribution</option>
                                    <option value="transportation_service">Transportation Service</option>
                                    <option value="supply_chain_management">Supply Chain Management</option>
                                    <option value="inventory_management">Inventory Management</option>
                                    <option value="cold_chain_logistics">Cold Chain Logistics</option>
                                    <option value="reverse_logistics">Reverse Logistics</option>
                                    <option value="ecommerce_logistics">E-commerce Logistics</option>
                                    <option value="cross_border_logistics">Cross-border Logistics</option>
                                    <option value="specialized_logistics">Specialized Logistics</option>
                                    <option value="technology_software_providers">Technology and Software Providers</option>
                                    <option value="packaging_labeling_services">Packaging and Labeling Services</option>
                                    <option value="last_mile_delivery">Last-Mile Delivery and Urban Logistics</option>
                                    <option value="air_cargo_freight">Air Cargo and Freight Services</option>
                                    <option value="rail_intermodal_logistics">Rail and Intermodal Logistics</option>
                                    <option value="freight_brokerage">Freight Brokerage</option>
                                    <option value="drone_autonomous_logistics">Drone and Autonomous Vehicle Logistics</option>
                                    <option value="custom_brokerage">Custom Brokerage</option>
                                </SelectField>
                            </div>
                        </section>

                        {/* Contact Information Section */}
                        <section>
                            <SectionHeader title="Contact Information" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField 
                                    label="Owner Name" 
                                    name="owner_name" 
                                    value={formData.owner_name} 
                                    onChange={handleChange}
                                    placeholder="Enter owner's full name"
                                />
                                
                                <PhoneField 
                                    label="Owner Phone No." 
                                    name="owner_phone" 
                                    value={formData.owner_phone} 
                                    onChange={handleChange}
                                />
                                
                                <InputField 
                                    label="Incharge Name" 
                                    name="incharge_name" 
                                    value={formData.incharge_name} 
                                    onChange={handleChange}
                                    placeholder="Enter incharge's full name"
                                />
                                
                                <PhoneField 
                                    label="Incharge Phone No." 
                                    name="incharge_phone" 
                                    value={formData.incharge_phone} 
                                    onChange={handleChange}
                                />
                            </div>
                            
                            {/* Incharge Image Upload */}
                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Incharge Photo</label>
                                <div className="flex items-center space-x-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="shrink-0">
                                        <div className="h-20 w-20 rounded-full overflow-hidden bg-white border-2 border-yellow-500 relative flex items-center justify-center group shadow-sm">
                                            {formData.incharge_image ? (
                                                <img src={formData.incharge_image} alt="Incharge" className="h-full w-full object-cover" />
                                            ) : (
                                                <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            )}
                                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer" onClick={() => document.getElementById('incharge-image-upload').click()}>
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <input
                                            type="file"
                                            id="incharge-image-upload"
                                            name="incharge_image"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    setFormData(prev => ({ ...prev, incharge_image: URL.createObjectURL(file) }));
                                                    // Store the file for upload
                                                    setFormData(prev => ({ ...prev, incharge_image_file: file }));
                                                }
                                            }}
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('incharge-image-upload').click()}
                                            className="py-2 px-4 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                                        >
                                            Upload Incharge Photo
                                        </button>
                                        <p className="mt-2 text-xs text-gray-500">Recommended: Square JPG, PNG or WEBP. Max 5MB.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Location Information Section */}
                        <section>
                            <SectionHeader title="Location Information" />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <SelectField 
                                    label="Country" 
                                    name="country" 
                                    value={formData.country} 
                                    onChange={handleChange}
                                    loading={loadingCountries}
                                >
                                    <option value="">Select Country...</option>
                                    {countries.map(country => (
                                        <option key={country.code} value={country.name}>
                                            {country.name}
                                        </option>
                                    ))}
                                </SelectField>
                                
                                <SelectField 
                                    label="State" 
                                    name="state" 
                                    value={formData.state} 
                                    onChange={handleChange}
                                    loading={loadingStates}
                                    disabled={!formData.country}
                                >
                                    <option value="">Select State...</option>
                                    {states.map(state => (
                                        <option key={state} value={state}>
                                            {state}
                                        </option>
                                    ))}
                                </SelectField>
                                
                                <SelectField 
                                    label="City" 
                                    name="city" 
                                    value={formData.city} 
                                    onChange={handleChange}
                                    loading={loadingCities}
                                    disabled={!formData.state}
                                >
                                    <option value="">Select City...</option>
                                    {cities.map(city => (
                                        <option key={city} value={city}>
                                            {city}
                                        </option>
                                    ))}
                                </SelectField>
                            </div>
                            
                            <div className="mt-6">
                                <TextareaField 
                                    label="Company Address" 
                                    name="company_address" 
                                    value={formData.company_address} 
                                    onChange={handleChange} 
                                    rows={3}
                                    placeholder="Enter complete company address"
                                />
                            </div>

                            {/* Location Method Selection */}
<div className="mt-8 relative group">
    {/* Futuristic Background Glow Effect */}
    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400/20 to-yellow-100/20 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition duration-1000"></div>
    
    <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl border border-yellow-200 shadow-2xl overflow-hidden">
        {/* Header Section */}
        <div className="p-6 border-b border-yellow-100 bg-gradient-to-r from-yellow-50/50 to-transparent">
            <h3 className="text-xl font-bold text-yellow-900 flex items-center tracking-tight">
                <span className="p-2 bg-yellow-400 rounded-lg mr-3 shadow-md shadow-yellow-200">
                    <svg className="w-6 h-6 text-yellow-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </span>
                Spatial Configuration
            </h3>
            <p className="mt-2 text-yellow-700/80 text-sm font-medium">
                Select a positioning protocol to synchronize your precise geographic location.
            </p>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* GPS Coordinates Option */}
            <div 
                onClick={() => {
                    setLocationMethod('coordinates');
                    setFormData(prev => ({ ...prev, map_location: '' }));
                }}
                className={`group/card relative p-5 rounded-xl border-2 transition-all duration-500 cursor-pointer ${
                locationMethod === 'coordinates'
                    ? 'bg-white border-yellow-400 shadow-xl shadow-yellow-100 translate-y-[-2px]' 
                    : 'bg-gray-50/50 border-gray-100 hover:border-yellow-200'
            }`}>
                <div className="flex items-center mb-5">
                    <div className="relative flex items-center justify-center">
                        <input
                            type="radio"
                            id="coordinates-method"
                            name="location-method"
                            checked={locationMethod === 'coordinates'}
                            onChange={() => {
                                setLocationMethod('coordinates');
                                setFormData(prev => ({ ...prev, map_location: '' }));
                            }}
                            className="w-5 h-5 text-yellow-600 focus:ring-yellow-500 border-gray-300 transition-all cursor-pointer"
                        />
                    </div>
                    <label htmlFor="coordinates-method" className={`ml-3 font-bold tracking-wide uppercase text-xs transition-colors ${locationMethod === 'coordinates' ? 'text-yellow-800' : 'text-gray-500'}`}>
                        GPS Satellite Protocol
                    </label>
                </div>
                
                <div className={`space-y-4 transition-all duration-300 ${
                    locationMethod === 'coordinates' ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'
                }`}>
                    <div className="grid grid-cols-1 gap-4">
                        <InputField 
                            label="Latitude" 
                            name="latitude" 
                            value={formData.latitude} 
                            onChange={handleChange}
                            placeholder="e.g., 25.2048"
                            type="number"
                        />
                        <InputField 
                            label="Longitude" 
                            name="longitude" 
                            value={formData.longitude} 
                            onChange={handleChange}
                            placeholder="e.g., 55.2708"
                            type="number"
                        />
                    </div>
                    
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition(
                                    (position) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            latitude: position.coords.latitude.toFixed(6),
                                            longitude: position.coords.longitude.toFixed(6),
                                            map_location: ''
                                        }));
                                        setSuccess('Current location coordinates added successfully!');
                                    },
                                    (error) => setError('Unable to get current location. Please enter coordinates manually.')
                                );
                            } else {
                                setError('Geolocation is not supported by this browser.');
                            }
                        }}
                        className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 active:scale-95 shadow-lg shadow-blue-200"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        Auto-Detect Signal
                    </button>
                </div>
            </div>

            {/* Google Maps URL Option */}
            <div 
                onClick={() => {
                    setLocationMethod('maps');
                    setFormData(prev => ({ ...prev, latitude: '', longitude: '' }));
                }}
                className={`group/card relative p-5 rounded-xl border-2 transition-all duration-500 cursor-pointer ${
                locationMethod === 'maps'
                    ? 'bg-white border-yellow-400 shadow-xl shadow-yellow-100 translate-y-[-2px]' 
                    : 'bg-gray-50/50 border-gray-100 hover:border-yellow-200'
            }`}>
                <div className="flex items-center mb-5">
                    <input
                        type="radio"
                        id="maps-method"
                        name="location-method"
                        checked={locationMethod === 'maps'}
                        onChange={() => {
                            setLocationMethod('maps');
                            setFormData(prev => ({ ...prev, latitude: '', longitude: '' }));
                        }}
                        className="w-5 h-5 text-yellow-600 focus:ring-yellow-500 border-gray-300 transition-all cursor-pointer"
                    />
                    <label htmlFor="maps-method" className={`ml-3 font-bold tracking-wide uppercase text-xs transition-colors ${locationMethod === 'maps' ? 'text-yellow-800' : 'text-gray-500'}`}>
                        Cloud Map Integration
                    </label>
                </div>
                
                <div className={`transition-all duration-300 ${
                    locationMethod === 'maps' ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'
                }`}>
                    <textarea
                        name="map_location"
                        rows={5}
                        value={formData.map_location || ''}
                        onChange={(e) => {
                            setFormData(prev => ({
                                ...prev,
                                map_location: e.target.value,
                                latitude: '',
                                longitude: ''
                            }));
                        }}
                        placeholder="Paste shared embed data source..."
                        className="w-full p-4 bg-gray-100/50 border-none rounded-xl text-sm font-mono focus:ring-2 focus:ring-yellow-400 transition-all resize-none shadow-inner"
                    />
                    <div className="mt-3 flex items-center text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                        <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-2 animate-pulse"></span>
                        Instruction: Maps → Share → Embed a map → Copy HTML
                    </div>
                </div>
            </div>
        </div>
        
        {/* Technical Guidance Footer */}
        <div className="px-6 py-4 bg-yellow-50/50 border-t border-yellow-100 flex flex-wrap gap-4 items-center justify-between">
            {/* <div className="flex gap-6">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-yellow-800/60 leading-none">Desktop</span>
                    <span className="text-xs text-yellow-900 font-medium">Right-click for info</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-yellow-800/60 leading-none">Mobile</span>
                    <span className="text-xs text-yellow-900 font-medium">Long press marker</span>
                </div>
            </div> */}
            <div className="px-3 py-1 bg-white rounded-full border border-yellow-200 text-[11px] font-bold text-yellow-700">
                Ready for sync
            </div>
        </div>
    </div>
</div>
                        </section>

                        {/* Social Media & Web Presence */}
                        <section>
                            <SectionHeader title="Social Media & Web Presence" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField 
                                    label="Website" 
                                    name="website" 
                                    value={formData.website} 
                                    onChange={handleChange}
                                    placeholder="https://example.com"
                                />
                                
                                <InputField 
                                    label="Skype" 
                                    name="skype" 
                                    value={formData.skype} 
                                    onChange={handleChange}
                                    placeholder="your.skype.id"
                                />
                                
                                <InputField 
                                    label="Facebook" 
                                    name="facebook" 
                                    value={formData.facebook} 
                                    onChange={handleChange}
                                    placeholder="https://facebook.com/yourpage"
                                />
                                
                                <InputField 
                                    label="Twitter" 
                                    name="twitter" 
                                    value={formData.twitter} 
                                    onChange={handleChange}
                                    placeholder="https://twitter.com/yourhandle"
                                />
                                
                                <InputField 
                                    label="Instagram" 
                                    name="instagram" 
                                    value={formData.instagram} 
                                    onChange={handleChange}
                                    placeholder="https://instagram.com/yourprofile"
                                />
                                
                                <InputField 
                                    label="LinkedIn" 
                                    name="linkedin" 
                                    value={formData.linkedin} 
                                    onChange={handleChange}
                                    placeholder="https://linkedin.com/company/yourcompany"
                                />
                            </div>
                        </section>

                        {/* Services Section */}
                        <section>
                            <SectionHeader title="Services" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl">
                                {servicesList.map(service => (
                                    <CheckboxField
                                        key={service}
                                        label={service}
                                        name={service}
                                        checked={(formData.services || []).includes(service)}
                                        onChange={handleServiceChange}
                                    />
                                ))}
                            </div>
                        </section>

                        {/* Additional Information */}
                        <section>
                            <SectionHeader title="Additional Information" />
                            <div className="space-y-6">
                                <div>
                                    <SectionHeader title="About Company" />
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <div ref={editorWrapperRef}></div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Submit Button */}
                        <div className="flex  justify-center pt-8">
                            <button 
                                type="submit" 
                                className="px-12 cursor-pointer py-4 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center space-x-3"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Update Company Profile</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditCompanyDetails;