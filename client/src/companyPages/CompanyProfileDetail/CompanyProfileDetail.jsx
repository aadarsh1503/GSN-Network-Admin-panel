import React, { useState, useEffect } from 'react';
import { FiGlobe, FiMapPin, FiPhone, FiSend } from 'react-icons/fi';
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaWhatsapp, FaTruck, FaFutbol, FaPaw } from 'react-icons/fa';
import api from '../../utils/api'; // Adjust path as needed

// --- Reusable Sub-Components ---
const ServiceItem = ({ icon, label }) => (
  <div className="flex flex-col items-center text-center text-gray-600">
    <div className="bg-gray-100 h-20 w-20 rounded-full flex items-center justify-center mb-2 text-gray-500">
      {icon}
    </div>
    <p className="text-sm font-medium">{label}</p>
  </div>
);

// Enhanced Country flag component with comprehensive country support
const CountryFlag = ({ countryCode, className = "w-10 h-auto mr-4 mt-1" }) => {
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
          fallback.innerHTML = '<svg class="text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
          parent.appendChild(fallback);
        }
      }}
    />
  );
};

// --- The Main Component ---
const CompanyProfileDetail = () => {
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Default data structure
  const defaultCompanyData = {
    name: '',
    address: '',
    website: '',
    location: '',
    country: '',
    coordinates: {
      latitude: null,
      longitude: null
    },
    isGuest: true,
    about: '',
    contactPerson: {
      name: '',
      role: 'Incharge',
      phone: '',
      avatarUrl: 'https://i.imgur.com/sCEw22l.png',
    },
    services: [],
    socialLinks: {
      facebook: '',
      twitter: '',
      linkedin: '',
      whatsapp: ''
    }
  };

  // Fetch company data from API
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        
        // Fetch company profile data and subscription status
        const [companyProfile, userData, subscriptionData] = await Promise.all([
          api.get('/api/company/profile'),
          api.get('/api/user/me'),
          api.get('/api/subscriptions/my-subscription')
        ]);

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
          isGuest: subscriptionData.is_guest || false, // Use actual subscription status
          subscriptionPlan: subscriptionData.plan_name || 'Guest Member', // Show actual plan name
          about: companyProfile.about_company || 'No company description available.',
          mapLocation: companyProfile.map_location || null, // Add map location
          contactPerson: {
            name: companyProfile.incharge_name || companyProfile.owner_name || 'Contact Person',
            role: companyProfile.incharge_name ? 'Incharge' : 'Owner',
            phone: companyProfile.incharge_phone || companyProfile.owner_phone || 'Phone not available',
            avatarUrl: companyProfile.incharge_image || companyProfile.logo || 'https://i.imgur.com/sCEw22l.png', // Use incharge image first, then logo, then default
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
        
        // Debug log the coordinates data
        console.log('Company coordinates data:', {
          latitude: transformedData.coordinates.latitude,
          longitude: transformedData.coordinates.longitude,
          mapLocation: transformedData.mapLocation,
          shouldShowMap: !!(transformedData.coordinates.latitude && transformedData.coordinates.longitude)
        });
      } catch (err) {
        console.error('Error fetching company data:', err);
        setError('Failed to load company profile');
        // Fallback to default data
        setCompanyData(defaultCompanyData);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, []);

  // Service icons mapping
  const serviceIcons = {
    'Time critical': <FaTruck size={32} />,
    'Fairs and Exhibitions': <FaFutbol size={32} />,
    'Heavy Lifts & Oversized Cargo': <FaPaw size={32} />,
    'RoRo': <FaPaw size={32} />,
    'Healthcare and Pharma': <FaPaw size={32} />,
    'Live Animals': <FaPaw size={32} />,
    'e-commerce': <FaPaw size={32} />,
    'Aerospace and Defence': <FaPaw size={32} />,
    'specialities of logistics companies': <FaTruck size={32} />,
    'Industrial and Construction': <FaTruck size={32} />,
    'Perishables': <FaTruck size={32} />,
    'Hotel Logistics': <FaTruck size={32} />,
    'Automotive': <FaTruck size={32} />,
    'Dangerous goods': <FaTruck size={32} />,
    'Beverages': <FaTruck size={32} />,
    'Marine Parts': <FaTruck size={32} />,
    'Recyclables': <FaTruck size={32} />,
    'Electronics': <FaTruck size={32} />,
    'AOG Desktop': <FaTruck size={32} />,
    'Sports and Events': <FaFutbol size={32} />,
    'Break bulk': <FaTruck size={32} />,
    'Fashion and retail': <FaTruck size={32} />,
    'Oil and gas': <FaTruck size={32} />,
    'Packing': <FaTruck size={32} />,
    'Distribution': <FaTruck size={32} />,
  };

  const getServiceIcon = (serviceName) => {
    return serviceIcons[serviceName] || <FaTruck size={32} />;
  };

  if (loading) {
    return (
      <div className="bg-gray-50 p-4 sm:p-6 lg:p-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading company profile...</p>
        </div>
      </div>
    );
  }

  if (error && !companyData) {
    return (
      <div className="bg-gray-50 p-4 sm:p-6 mt-20 lg:p-8 min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 sm:p-6 mt-2 lg:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* --- Header Section --- */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {/* Left Part: Name and Address */}
            <div className="lg:col-span-2 flex items-start">
              <CountryFlag countryCode={companyData.country} />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{companyData.name}</h1>
                <p className="text-gray-500 text-base mt-1">{companyData.address}</p>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-base text-gray-600 items-center mt-4">
                  <a href={companyData.website} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-yellow-600 transition-colors duration-200">
                    <FiGlobe className="mr-2 text-yellow-600" /> 
                    {companyData.website}
                  </a>
                  <p className="flex items-center">
                    <FiMapPin className="mr-2 text-yellow-600" /> 
                    {companyData.location}
                  </p>
                  {companyData.coordinates.latitude && companyData.coordinates.longitude && (
                    <p className="flex items-center text-sm text-blue-600">
                      <svg className="mr-2 w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      GPS: {parseFloat(companyData.coordinates.latitude).toFixed(4)}, {parseFloat(companyData.coordinates.longitude).toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {/* Right Part: Member Tag and Socials */}
            <div className="flex flex-col items-start md:items-end gap-4">
              <div className="bg-[#C9A959] text-white text-sm font-bold py-2 px-6 rounded-md shadow-sm">
                {companyData.subscriptionPlan}
              </div>
              <div className="flex space-x-2">
                <a href={companyData.socialLinks.facebook} className="h-10 w-10 flex items-center justify-center border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 transition-colors duration-200">
                  <FaFacebookF />
                </a>
                <a href={companyData.socialLinks.twitter} className="h-10 w-10 flex items-center justify-center border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 transition-colors duration-200">
                  <FaTwitter />
                </a>
                <a href={companyData.socialLinks.linkedin} className="h-10 w-10 flex items-center justify-center border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 transition-colors duration-200">
                  <FaLinkedinIn />
                </a>
                <a href={companyData.socialLinks.whatsapp} className="h-10 w-10 flex items-center justify-center border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 transition-colors duration-200">
                  <FaWhatsapp />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* --- Main Content Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Company Card */}
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">About Company</h3>
              <div 
                className="text-gray-600 text-base leading-relaxed prose max-w-none"
                dangerouslySetInnerHTML={{ __html: companyData.about }} 
              />
            </div>
            
            {/* Services Card */}
            {companyData.services && companyData.services.length > 0 && (
              <div className="bg-white p-8 rounded-lg shadow-md">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Services</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
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

            {/* Interactive Google Map using Coordinates */}
            {companyData.coordinates.latitude && companyData.coordinates.longitude && (
              <div className="bg-white p-8 rounded-lg shadow-md">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <FiMapPin className="mr-3 text-blue-600" />
                  Our Location
                </h3>
                
                {/* Coordinates Info Bar */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm">
                        <span className="font-medium text-blue-800">Coordinates:</span>
                        <span className="ml-2 font-mono text-blue-700">
                          {parseFloat(companyData.coordinates.latitude).toFixed(6)}, {parseFloat(companyData.coordinates.longitude).toFixed(6)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${companyData.coordinates.latitude}, ${companyData.coordinates.longitude}`);
                        }}
                        className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors duration-200"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </button>
                      <a
                        href={`https://www.google.com/maps?q=${companyData.coordinates.latitude},${companyData.coordinates.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors duration-200"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Open
                      </a>
                    </div>
                  </div>
                </div>

                {/* Interactive Google Map */}
                <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-100">
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

                {/* Map Controls */}
                <div className="mt-4 flex flex-wrap gap-3 justify-center">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${companyData.coordinates.latitude},${companyData.coordinates.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                    </svg>
                    Get Directions
                  </a>
                  <a
                    href={`https://www.google.com/maps/@${companyData.coordinates.latitude},${companyData.coordinates.longitude},18z`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Street View
                  </a>
                  {/* <button
                    onClick={() => {
                      const mapUrl = `https://www.google.com/maps?q=${companyData.coordinates.latitude},${companyData.coordinates.longitude}`;
                      navigator.share ? 
                        navigator.share({ title: 'Company Location', url: mapUrl }) :
                        navigator.clipboard.writeText(mapUrl);
                    }}
                    className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    Share Location
                  </button> */}
                </div>
              </div>
            )}

            {/* Google Maps Location Card - Only show if mapLocation exists and no coordinates */}
            {companyData.mapLocation && !companyData.coordinates.latitude && !companyData.coordinates.longitude && (
              <div className="bg-white p-8 rounded-lg shadow-md">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <FiMapPin className="mr-3 text-yellow-600" />
                  Our Location
                </h3>
                <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-200">
                  <iframe
                    src={companyData.mapLocation}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Company Location"
                  ></iframe>
                </div>
              </div>
            )}
          </div>

          {/* Right Column (Contact Card) */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-lg shadow-md text-center sticky top-8 border border-gray-200">
              <img 
                src={companyData.contactPerson.avatarUrl} 
                alt="Contact Person" 
                className="w-28 h-28 rounded-full mx-auto mb-4 object-cover border-4 border-gray-100 shadow-sm"
                onError={(e) => {
                  e.target.src = 'https://i.imgur.com/sCEw22l.png';
                }}
              />
              <h3 className="text-2xl font-bold text-gray-800">{companyData.contactPerson.name}</h3>
              <p className="text-gray-500 text-base mt-1">{companyData.contactPerson.role}</p>
              <div className="flex items-center justify-center text-gray-500 my-4 text-base">
                <FiPhone className="mr-2 text-yellow-600" />
                <span>{companyData.contactPerson.phone}</span>
              </div>
              <button className="w-full bg-[#C9A959] text-white font-bold py-3 rounded-lg shadow-md hover:bg-yellow-700 transition-colors duration-200 flex items-center justify-center text-lg transform hover:-translate-y-0.5">
                <FiSend className="mr-2" />
                Contact Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfileDetail;