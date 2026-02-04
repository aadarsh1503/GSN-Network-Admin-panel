import { useState, useEffect } from 'react';
import { BsCheckCircleFill } from 'react-icons/bs';
import { FaArrowRight, FaUsers } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const BusinessDirectory = () => {
  const navigate = useNavigate();
  const [featuredBusinesses, setFeaturedBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedBusinesses();
  }, []);

  const fetchFeaturedBusinesses = async () => {
    try {
      // Fetch latest featured businesses (business users who request quotes for bulk amounts)
      const data = await api.get('/api/business-directory/businesses?limit=3&page=1');
      setFeaturedBusinesses(data.businesses || []);
    } catch (error) {
      console.error('Error fetching featured businesses:', error);
      // Set empty array on error
      setFeaturedBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

const getCountryFlag = (countryName) => {
  const countryFlags = {
    "Afghanistan": "AF", "Albania": "AL", "Algeria": "DZ", "Andorra": "AD", "Angola": "AO", "Antigua and Barbuda": "AG", "Argentina": "AR", "Armenia": "AM", "Australia": "AU", "Austria": "AT", "Azerbaijan": "AZ",
    "Bahamas": "BS", "Bahrain": "BH", "Bangladesh": "BD", "Barbados": "BB", "Belarus": "BY", "Belgium": "BE", "Belize": "BZ", "Benin": "BJ", "Bhutan": "BT", "Bolivia": "BO", "Bosnia and Herzegovina": "BA", "Botswana": "BW", "Brazil": "BR", "Brunei": "BN", "Bulgaria": "BG", "Burkina Faso": "BF", "Burundi": "BI",
    "Cabo Verde": "CV", "Cambodia": "KH", "Cameroon": "CM", "Canada": "CA", "Central African Republic": "CF", "Chad": "TD", "Chile": "CL", "China": "CN", "Colombia": "CO", "Comoros": "KM", "Congo": "CG", "Costa Rica": "CR", "Croatia": "HR", "Cuba": "CU", "Cyprus": "CY", "Czech Republic": "CZ",
    "Denmark": "DK", "Djibouti": "DJ", "Dominica": "DM", "Dominican Republic": "DO",
    "Ecuador": "EC", "Egypt": "EG", "El Salvador": "SV", "Equatorial Guinea": "GQ", "Eritrea": "ER", "Estonia": "EE", "Eswatini": "SZ", "Ethiopia": "ET",
    "Fiji": "FJ", "Finland": "FI", "France": "FR",
    "Gabon": "GA", "Gambia": "GM", "Georgia": "GE", "Germany": "DE", "Ghana": "GH", "Greece": "GR", "Grenada": "GD", "Guatemala": "GT", "Guinea": "GN", "Guinea-Bissau": "GW", "Guyana": "GY",
    "Haiti": "HT", "Honduras": "HN", "Hungary": "HU",
    "Iceland": "IS", "India": "IN", "Indonesia": "ID", "Iran": "IR", "Iraq": "IQ", "Ireland": "IE", "Israel": "IL", "Italy": "IT", "Ivory Coast": "CI",
    "Jamaica": "JM", "Japan": "JP", "Jordan": "JO",
    "Kazakhstan": "KZ", "Kenya": "KE", "Kiribati": "KI", "Kuwait": "KW", "Kyrgyzstan": "KG",
    "Laos": "LA", "Latvia": "LV", "Lebanon": "LB", "Lesotho": "LS", "Liberia": "LR", "Libya": "LY", "Liechtenstein": "LI", "Lithuania": "LT", "Luxembourg": "LU",
    "Madagascar": "MG", "Malawi": "MW", "Malaysia": "MY", "Maldives": "MV", "Mali": "ML", "Malta": "MT", "Marshall Islands": "MH", "Mauritania": "MR", "Mauritius": "MU", "Mexico": "MX", "Micronesia": "FM", "Moldova": "MD", "Monaco": "MC", "Mongolia": "MN", "Montenegro": "ME", "Morocco": "MA", "Mozambique": "MZ", "Myanmar": "MM",
    "Namibia": "NA", "Nauru": "NR", "Nepal": "NP", "Netherlands": "NL", "New Zealand": "NZ", "Nicaragua": "NI", "Niger": "NE", "Nigeria": "NG", "North Korea": "KP", "North Macedonia": "MK", "Norway": "NO",
    "Oman": "OM",
    "Pakistan": "PK", "Palau": "PW", "Palestine": "PS", "Panama": "PA", "Papua New Guinea": "PG", "Paraguay": "PY", "Peru": "PE", "Philippines": "PH", "Poland": "PL", "Portugal": "PT",
    "Qatar": "QA",
    "Romania": "RO", "Russia": "RU", "Rwanda": "RW",
    "Saint Kitts and Nevis": "KN", "Saint Lucia": "LC", "Saint Vincent and the Grenadines": "VC", "Samoa": "WS", "San Marino": "SM", "Sao Tome and Principe": "ST", "Saudi Arabia": "SA", "Senegal": "SN", "Serbia": "RS", "Seychelles": "SC", "Sierra Leone": "SL", "Singapore": "SG", "Slovakia": "SK", "Slovenia": "SI", "Solomon Islands": "SB", "Somalia": "SO", "South Africa": "ZA", "South Korea": "KR", "South Sudan": "SS", "Spain": "ES", "Sri Lanka": "LK", "Sudan": "SD", "Suriname": "SR", "Sweden": "SE", "Switzerland": "CH", "Syria": "SY",
    "Taiwan": "TW", "Tajikistan": "TJ", "Tanzania": "TZ", "Thailand": "TH", "Timor-Leste": "TL", "Togo": "TG", "Tonga": "TO", "Trinidad and Tobago": "TT", "Tunisia": "TN", "Turkey": "TR", "Turkmenistan": "TM", "Tuvalu": "TV",
    "Uganda": "UG", "Ukraine": "UA", "UAE": "AE", "United Arab Emirates": "AE", "UK": "GB", "United Kingdom": "GB", "USA": "US", "United States": "US", "United States of America": "US", "Uruguay": "UY", "Uzbekistan": "UZ",
    "Vanuatu": "VU", "Vatican City": "VA", "Venezuela": "VE", "Vietnam": "VN",
    "Yemen": "YE", "Zambia": "ZM", "Zimbabwe": "ZW"
  };

  // Normalize input: trim spaces and handle case-insensitive lookup
  const normalizedInput = countryName?.trim();
  
  // Find the key regardless of casing
  const key = Object.keys(countryFlags).find(
    k => k.toLowerCase() === normalizedInput?.toLowerCase()
  );
  
  const countryCode = key ? countryFlags[key] : null;

  if (countryCode) {
    return (
      <div className="flex items-center gap-2">
        <img 
          src={`https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`}
          alt={`${normalizedInput} flag`}
          className="w-6 h-4 object-cover rounded shadow-sm"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'inline';
          }}
        />
        <span style={{ display: 'none' }}>🌍</span>
      </div>
    );
  }

  return <span className="text-lg">🌍</span>;
};

  return (
    <section className="bg-[#f7f7f7] py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-x-16 gap-y-20 items-center">
        
        {/* Left Column: Image Section */}
        <div className="relative w-full h-full flex items-center justify-center">
          
          {/* Rocket Icon: Absolutely positioned relative to the parent column */}
          <div className="absolute top-[-2rem] left-[-2rem] z-10 flex items-center justify-center bg-white rounded-3xl shadow-2xl w-40 h-40 animate-bounce-slow">
            <img 
              src="https://img.freepik.com/free-vector/rocket-spaceship-cartoon-vector-icon-illustration-science-technology-icon-concept-isolated-flat_138676-9714.jpg?semt=ais_hybrid&w=740&q=80" 
              alt="Rocket Icon" 
              className="w-24 h-auto"
            />

            <style jsx>{`
              @keyframes bounce-slow {
                0%, 100% {
                  transform: translateY(0);
                }
                50% {
                  transform: translateY(-15px);
                }
              }
              .animate-bounce-slow {
                animation: bounce-slow 2s ease-in-out infinite;
              }
            `}</style>
          </div>

          <div className="relative">
            {/* The image container with the custom shape */}
            <div className="relative max-w-lg mx-auto p-1 bg-gray-200 rounded-tl-[60px] rounded-tr-[180px] rounded-bl-[180px] rounded-br-[60px]">
              <div className="p-2 bg-white rounded-tl-[60px] rounded-tr-[180px] rounded-bl-[180px] rounded-br-[60px]">
                <div className="relative rounded-tl-[60px] rounded-tr-[180px] rounded-bl-[180px] rounded-br-[60px] overflow-hidden shadow-2xl">
                  <img 
                    src="https://images.pexels.com/photos/7072059/pexels-photo-7072059.jpeg" 
                    alt="Business professionals discussing bulk orders" 
                    className="w-full h-full object-cover block"
                  />
                </div>
              </div>
            </div>
            {/* Decorative purple line at the bottom */}
            <div className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-32 h-2 bg-[#6c47ff] rounded-full"></div>
          </div>
        </div>

        {/* Right Column: Content Section */}
        <div className="relative">
          {/* Decorative purple line on the left */}
          <div className="absolute left-[-7.5rem] top-[8rem] w-2 h-28 bg-[#6c47ff] rounded-full hidden lg:block"></div>

          <div>
            <p className="text-[#008001] font-bold tracking-widest text-sm mb-2">
              DIRECTORY
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-[#212121] leading-tight mb-5">
              Directory Of Business <br />Users
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              Discover businesses that request quotes for bulk amounts. Connect with companies across various industries looking for freight and logistics solutions.
            </p>
            <a href="/register" className="flex items-center text-[#008001] font-bold tracking-wider text-sm mb-12 hover:underline">
              FREE BUSINESS REGISTRATION 
              <FaArrowRight className="ml-2" />
            </a>

            <h3 className="font-bold text-xl text-[#212121] mb-5">
              Latest Featured Businesses
            </h3>

            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#D9B95B] border-t-transparent"></div>
                  <p className="text-sm text-gray-500 mt-3 font-medium">Loading featured businesses...</p>
                </div>
              ) : featuredBusinesses.length > 0 ? (
                featuredBusinesses.map((business) => (
                  <div key={business.id} className="group">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <BsCheckCircleFill className="text-[#D9B95B] text-2xl drop-shadow-sm" />
                      </div>
                      <div className="flex items-center space-x-4 bg-white border-2 border-gray-200 rounded-xl px-6 py-4 w-full shadow-lg hover:shadow-xl hover:border-[#D9B95B] transition-all duration-300 cursor-pointer group-hover:scale-[1.02]">
                        <div className="flex-shrink-0">
                          {getCountryFlag(business.country)}
                          <span className="text-lg ml-1 hidden">🌍</span>
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-gray-800 font-bold text-lg group-hover:text-[#D9B95B] transition-colors">
                              {business.name}
                            </span>
                          </div>
                          {business.city && (
                            <p className="text-sm text-gray-500 font-medium">
                              📍 {business.city}, {business.country}
                            </p>
                          )}
                          {business.category && (
                            <p className="text-xs text-[#D9B95B] font-semibold mt-1">
                              {Array.isArray(business.category) ? business.category[0] : business.category.split(',')[0]}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center text-xs">
                          <FaUsers className="text-[#D9B95B] mr-1" />
                          <span className="text-blue-600 font-medium">Bulk Requester</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🏢</div>
                  <p className="text-gray-500 font-medium">No featured businesses found</p>
                  <p className="text-sm text-gray-400">Check back soon for new businesses!</p>
                </div>
              )}
            </div>

            <button 
              onClick={() => navigate('/business-directory')}
              className="mt-12 relative overflow-hidden bg-gradient-to-r from-black to-gray-800 text-white font-bold py-5 px-12 rounded-full shadow-2xl transition-all duration-500 ease-in-out hover:scale-105 hover:-translate-y-2 group border-2 border-transparent hover:border-[#D9B95B]"
            >
              <span className="relative z-10 flex items-center text-lg">
                <FaUsers className="mr-3 text-xl" />
                Search Business Directory
                <FaArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" />
              </span>
              
              {/* Animated gradient overlay */}
              <span className="absolute inset-0 bg-gradient-to-r from-[#D9B95B] via-[#bca142] to-[#D9B95B] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700 ease-in-out opacity-90 rounded-full"></span>
              
              {/* Glow effect */}
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#D9B95B] to-[#bca142] opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></span>
            </button>

          </div>
        </div>
      </div>
    </section>
  );
};

export default BusinessDirectory;