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

  const getCountryFlag = (country) => {
    const countryFlags = {
      'India': 'IN',
      'Australia': 'AU', 
      'USA': 'US',
      'United States': 'US',
      'UK': 'GB',
      'United Kingdom': 'GB',
      'Canada': 'CA',
      'Germany': 'DE',
      'France': 'FR',
      'China': 'CN',
      'Japan': 'JP',
      'Singapore': 'SG',
      'UAE': 'AE',
      'Netherlands': 'NL',
      'Brazil': 'BR',
      'Italy': 'IT',
      'Spain': 'ES',
      'South Korea': 'KR',
      'Mexico': 'MX',
      'Russia': 'RU',
      'Turkey': 'TR',
      'Saudi Arabia': 'SA',
      'South Africa': 'ZA',
      'Thailand': 'TH',
      'Malaysia': 'MY',
      'Indonesia': 'ID',
      'Philippines': 'PH',
      'Vietnam': 'VN',
      'Egypt': 'EG',
      'Nigeria': 'NG',
      'Kenya': 'KE',
      'Morocco': 'MA',
      'Argentina': 'AR',
      'Chile': 'CL',
      'Colombia': 'CO',
      'Peru': 'PE'
    };
    
    const countryCode = countryFlags[country];
    if (countryCode) {
      return (
        <img 
          src={`https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`}
          alt={`${country} flag`}
          className="w-6 h-4 object-cover rounded shadow-sm"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'inline';
          }}
        />
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
              <span className="absolute inset-0 bg-gradient-to-r from-[#D9B95B] via-[#CDA435] to-[#D9B95B] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700 ease-in-out opacity-90 rounded-full"></span>
              
              {/* Glow effect */}
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#D9B95B] to-[#CDA435] opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></span>
            </button>

          </div>
        </div>
      </div>
    </section>
  );
};

export default BusinessDirectory;