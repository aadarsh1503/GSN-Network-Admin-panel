import React, { useState, useEffect } from 'react';
import { FiGlobe, FiMapPin, FiPhone, FiSend, FiX } from 'react-icons/fi';
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaWhatsapp, FaTruck, FaFutbol, FaPaw, FaBuilding } from 'react-icons/fa';
import { api } from '../../utils/api';

// --- Reusable Sub-Components ---
const ServiceItem = ({ icon, label }) => (
  <div className="flex flex-col items-center text-center text-gray-600">
    <div className="bg-gray-100 h-16 w-16 rounded-full flex items-center justify-center mb-2 text-gray-500">
      {icon}
    </div>
    <p className="text-xs font-medium">{label}</p>
  </div>
);

// Enhanced Country flag component
const CountryFlag = ({ countryCode, className = "w-8 h-auto mr-3 mt-1" }) => {
  const [flagUrl, setFlagUrl] = useState('');
  
  useEffect(() => {
    const getFlagUrl = () => {
      if (!countryCode) return '';
      
      // Comprehensive country name to ISO code mapping
      const countryMap = {
        // Asia
        'india': 'in',
        'pakistan': 'pk',
        'bangladesh': 'bd',
        'sri lanka': 'lk',
        'nepal': 'np',
        'bhutan': 'bt',
        'maldives': 'mv',
        'afghanistan': 'af',
        'china': 'cn',
        'japan': 'jp',
        'south korea': 'kr',
        'north korea': 'kp',
        'vietnam': 'vn',
        'thailand': 'th',
        'malaysia': 'my',
        'singapore': 'sg',
        'indonesia': 'id',
        'philippines': 'ph',
        'myanmar': 'mm',
        'cambodia': 'kh',
        'laos': 'la',
        'mongolia': 'mn',
        'taiwan': 'tw',
        'hong kong': 'hk',
        'macau': 'mo',
        
        // Middle East
        'saudi arabia': 'sa',
        'united arab emirates': 'ae',
        'qatar': 'qa',
        'kuwait': 'kw',
        'oman': 'om',
        'bahrain': 'bh',
        'iran': 'ir',
        'iraq': 'iq',
        'israel': 'il',
        'jordan': 'jo',
        'lebanon': 'lb',
        'syria': 'sy',
        'yemen': 'ye',
        'turkey': 'tr',
        
        // Europe
        'united kingdom': 'gb',
        'germany': 'de',
        'france': 'fr',
        'italy': 'it',
        'spain': 'es',
        'portugal': 'pt',
        'netherlands': 'nl',
        'belgium': 'be',
        'switzerland': 'ch',
        'austria': 'at',
        'sweden': 'se',
        'norway': 'no',
        'denmark': 'dk',
        'finland': 'fi',
        'russia': 'ru',
        'poland': 'pl',
        'ukraine': 'ua',
        'czech republic': 'cz',
        'greece': 'gr',
        'ireland': 'ie',
        
        // North America
        'usa': 'us',
        'united states': 'us',
        'united states of america': 'us',
        'canada': 'ca',
        'mexico': 'mx',
        
        // South America
        'brazil': 'br',
        'argentina': 'ar',
        'chile': 'cl',
        'colombia': 'co',
        'peru': 'pe',
        'venezuela': 've',
        
        // Africa
        'south africa': 'za',
        'egypt': 'eg',
        'nigeria': 'ng',
        'kenya': 'ke',
        'ethiopia': 'et',
        'ghana': 'gh',
        'morocco': 'ma',
        'tanzania': 'tz',
        
        // Oceania
        'australia': 'au',
        'new zealand': 'nz',
        'fiji': 'fj',
        'papua new guinea': 'pg',

        // Indian States (if provided as country)
        'mizoram': 'in',
        'maharashtra': 'in',
        'karnataka': 'in',
        'tamil nadu': 'in',
        'kerala': 'in',
        'andhra pradesh': 'in',
        'telangana': 'in',
        'west bengal': 'in',
        'gujarat': 'in',
        'rajasthan': 'in',
        'punjab': 'in',
        'haryana': 'in',
        'uttar pradesh': 'in',
        'bihar': 'in',
        'madhya pradesh': 'in',
        'odisha': 'in',
        'assam': 'in',
        'jharkhand': 'in',
        'chhattisgarh': 'in',
        'himachal pradesh': 'in',
        'uttarakhand': 'in',
        'goa': 'in',
        'delhi': 'in',
        'jammu and kashmir': 'in',
        'ladakh': 'in',
      };
      
      // Convert to lowercase and trim
      const normalizedCountry = countryCode.toLowerCase().trim();
      
      // Try exact match first
      let code = countryMap[normalizedCountry];
      
      // If no exact match, try partial matching for common variations
      if (!code) {
        for (const [key, value] of Object.entries(countryMap)) {
          if (normalizedCountry.includes(key) || key.includes(normalizedCountry)) {
            code = value;
            break;
          }
        }
      }
      
      // If still no match, try to extract 2-letter code from the string
      if (!code && normalizedCountry.length >= 2) {
        // Check if it might already be a 2-letter code
        if (normalizedCountry.length === 2 && /^[a-z]{2}$/.test(normalizedCountry)) {
          code = normalizedCountry;
        }
      }
      
      // Fallback to India if no match found
      code = code || 'in';
      
      return `https://flagcdn.com/w40/${code}.png`;
    };
    
    setFlagUrl(getFlagUrl());
  }, [countryCode]);

  if (!flagUrl) {
    return (
      <div className={`${className} bg-gray-200 rounded flex items-center justify-center`}>
        <FiGlobe className="text-gray-400" />
      </div>
    );
  }

  return (
    <img 
      src={flagUrl} 
      alt={`${countryCode} Flag`} 
      className={`${className} rounded border border-gray-200`}
      onError={(e) => {
        // Fallback to globe icon if flag fails to load
        e.target.style.display = 'none';
        const parent = e.target.parentElement;
        if (parent) {
          const fallback = document.createElement('div');
          fallback.className = `${className} bg-gray-200 rounded flex items-center justify-center`;
          fallback.innerHTML = '<svg class="text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
          parent.appendChild(fallback);
        }
      }}
    />
  );
};

const CompanyProfileModal = ({ companyId, onClose }) => {
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Service icons mapping
  const serviceIcons = {
    'Time critical': <FaTruck size={24} />,
    'Fairs and Exhibitions': <FaFutbol size={24} />,
    'Heavy Lifts & Oversized Cargo': <FaPaw size={24} />,
    'RoRo': <FaPaw size={24} />,
    'Healthcare and Pharma': <FaPaw size={24} />,
    'Live Animals': <FaPaw size={24} />,
    'e-commerce': <FaPaw size={24} />,
    'Aerospace and Defence': <FaPaw size={24} />,
    'specialities of logistics companies': <FaTruck size={24} />,
    'Industrial and Construction': <FaTruck size={24} />,
    'Perishables': <FaTruck size={24} />,
    'Hotel Logistics': <FaTruck size={24} />,
    'Automotive': <FaTruck size={24} />,
    'Dangerous goods': <FaTruck size={24} />,
    'Beverages': <FaTruck size={24} />,
    'Marine Parts': <FaTruck size={24} />,
    'Recyclables': <FaTruck size={24} />,
    'Electronics': <FaTruck size={24} />,
    'AOG Desktop': <FaTruck size={24} />,
    'Sports and Events': <FaFutbol size={24} />,
    'Break bulk': <FaTruck size={24} />,
    'Fashion and retail': <FaTruck size={24} />,
    'Oil and gas': <FaTruck size={24} />,
    'Packing': <FaTruck size={24} />,
    'Distribution': <FaTruck size={24} />,
  };

  const getServiceIcon = (serviceName) => {
    return serviceIcons[serviceName] || <FaTruck size={24} />;
  };

  // Fetch company data from API
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        
        // Fetch company profile data by company ID
        const companyProfile = await api.get(`/api/company/profile/${companyId}`);

        // Transform API data to component format
        const transformedData = {
          name: companyProfile.name || 'Company Name',
          address: companyProfile.company_address || 'Address not provided',
          website: companyProfile.website || '#',
          location: `${companyProfile.country || ''}${companyProfile.state ? `, ${companyProfile.state}` : ''}${companyProfile.city ? `, ${companyProfile.city}` : ''}`,
          country: companyProfile.country || '',
          coordinates: {
            latitude: companyProfile.latitude || null,
            longitude: companyProfile.longitude || null
          },
          subscriptionPlan: companyProfile.subscription_plan || 'Guest Member',
          about: companyProfile.about_company || 'No company description available.',
          mapLocation: companyProfile.map_location || null,
          contactPerson: {
            name: companyProfile.incharge_name || companyProfile.owner_name || 'Contact Person',
            role: companyProfile.incharge_name ? 'Incharge' : 'Owner',
            phone: companyProfile.incharge_phone || companyProfile.owner_phone || 'Phone not available',
            avatarUrl: companyProfile.incharge_image || companyProfile.logo || 'https://i.imgur.com/sCEw22l.png',
          },
          services: Array.isArray(companyProfile.services) 
            ? companyProfile.services 
            : (companyProfile.services ? JSON.parse(companyProfile.services) : []),
          socialLinks: {
            facebook: companyProfile.facebook || '#',
            twitter: companyProfile.twitter || '#',
            linkedin: companyProfile.linkedin || '#',
            whatsapp: companyProfile.whatsapp || '#'
          }
        };

        setCompanyData(transformedData);
      } catch (err) {
        console.error('Error fetching company data:', err);
        setError('Failed to load company profile');
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      fetchCompanyData();
    }
  }, [companyId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading company profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !companyData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header with Close Button */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-3">
            <FaBuilding className="text-yellow-600" />
            <span>Company Profile</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiX className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Company Header */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-start space-x-4">
              <CountryFlag countryCode={companyData.country} />
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-800">{companyData.name}</h1>
                <p className="text-gray-500 text-sm mt-1">{companyData.address}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600 items-center mt-3">
                  <a href={companyData.website} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-yellow-600 transition-colors duration-200">
                    <FiGlobe className="mr-2 text-yellow-600" /> 
                    {companyData.website}
                  </a>
                  <p className="flex items-center">
                    <FiMapPin className="mr-2 text-yellow-600" /> 
                    {companyData.location}
                  </p>
                  {companyData.coordinates.latitude && companyData.coordinates.longitude && (
                    <p className="flex items-center text-xs text-blue-600">
                      <svg className="mr-2 w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      GPS: {parseFloat(companyData.coordinates.latitude).toFixed(4)}, {parseFloat(companyData.coordinates.longitude).toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <div className="bg-[#C9A959] text-white text-xs font-bold py-2 px-4 rounded-md shadow-sm">
                  {companyData.subscriptionPlan}
                </div>
                <div className="flex space-x-2">
                  <a href={companyData.socialLinks.facebook} className="h-8 w-8 flex items-center justify-center border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 transition-colors duration-200">
                    <FaFacebookF size={12} />
                  </a>
                  <a href={companyData.socialLinks.twitter} className="h-8 w-8 flex items-center justify-center border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 transition-colors duration-200">
                    <FaTwitter size={12} />
                  </a>
                  <a href={companyData.socialLinks.linkedin} className="h-8 w-8 flex items-center justify-center border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 transition-colors duration-200">
                    <FaLinkedinIn size={12} />
                  </a>
                  <a href={companyData.socialLinks.whatsapp} className="h-8 w-8 flex items-center justify-center border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 transition-colors duration-200">
                    <FaWhatsapp size={12} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* About Company */}
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-3">About Company</h3>
                <div 
                  className="text-gray-600 text-sm leading-relaxed prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: companyData.about }} 
                />
              </div>
              
              {/* Services */}
              {companyData.services && companyData.services.length > 0 && (
                <div className="bg-white border border-gray-200 p-6 rounded-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Services</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {companyData.services.map((service, index) => (
                      <ServiceItem 
                        key={index} 
                        icon={getServiceIcon(service)} 
                        label={service} 
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Google Map */}
              {companyData.coordinates.latitude && companyData.coordinates.longitude && (
                <div className="bg-white border border-gray-200 p-6 rounded-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <FiMapPin className="mr-2 text-blue-600" />
                    Location
                  </h3>
                  
                  {/* Coordinates Info */}
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="text-xs">
                        <span className="font-medium text-blue-800">Coordinates:</span>
                        <span className="ml-2 font-mono text-blue-700">
                          {parseFloat(companyData.coordinates.latitude).toFixed(6)}, {parseFloat(companyData.coordinates.longitude).toFixed(6)}
                        </span>
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${companyData.coordinates.latitude},${companyData.coordinates.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-2 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors duration-200"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Open
                      </a>
                    </div>
                  </div>

                  {/* Map */}
                  <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-100">
                    <iframe
                      src={`https://maps.google.com/maps?q=${companyData.coordinates.latitude},${companyData.coordinates.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="eager"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Company Location Map"
                    ></iframe>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Contact Card */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 p-6 rounded-lg text-center sticky top-6">
                <img 
                  src={companyData.contactPerson.avatarUrl} 
                  alt="Contact Person" 
                  className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border-4 border-gray-100 shadow-sm"
                  onError={(e) => {
                    e.target.src = 'https://i.imgur.com/sCEw22l.png';
                  }}
                />
                <h3 className="text-lg font-bold text-gray-800">{companyData.contactPerson.name}</h3>
                <p className="text-gray-500 text-sm mt-1">{companyData.contactPerson.role}</p>
                <div className="flex items-center justify-center text-gray-500 my-3 text-sm">
                  <FiPhone className="mr-2 text-yellow-600" />
                  <span>{companyData.contactPerson.phone}</span>
                </div>
                <button className="w-full bg-[#C9A959] text-white font-bold py-2 rounded-lg shadow-md hover:bg-yellow-700 transition-colors duration-200 flex items-center justify-center text-sm transform hover:-translate-y-0.5">
                  <FiSend className="mr-2" />
                  Contact Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfileModal;