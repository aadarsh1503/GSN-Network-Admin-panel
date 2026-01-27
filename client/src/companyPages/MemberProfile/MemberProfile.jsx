import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaTimes, FaMapMarkerAlt, FaGlobe, FaEye, FaStar, FaHeart, FaPhone, FaArrowLeft, FaRocket, FaAtom } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const MemberProfile = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState([]);

  // Service icons mapping
  const serviceIcons = {
    'Time critical': '🚚',
    'Fairs and Exhibitions': '🎪',
    'Heavy Lifts & Oversized Cargo': '🏗️',
    'RoRo': '🚢',
    'Healthcare and Pharma': '💊',
    'Live Animals': '🐾',
    'e-commerce': '📦',
    'Aerospace and Defence': '✈️',
    'specialities of logistics companies': '🚛',
    'Industrial and Construction': '🏭',
    'Perishables': '🥬',
    'Hotel Logistics': '🏨',
    'Automotive': '🚗',
    'Dangerous goods': '⚠️',
    'Beverages': '🥤',
    'Marine Parts': '⚓',
    'Recyclables': '♻️',
    'Electronics': '📱',
    'AOG Desktop': '💻',
    'Sports and Events': '⚽',
    'Break bulk': '📦',
    'Fashion and retail': '👗',
    'Oil and gas': '⛽',
    'Packing': '📦',
    'Distribution': '🚚',
  };

  const getServiceIcon = (serviceName) => {
    return serviceIcons[serviceName] || '🚚';
  };

  useEffect(() => {
    fetchCompanyProfile();
    fetchWishlist();
  }, [companyId]);

  const fetchCompanyProfile = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/api/directory/company/${companyId}`);
      
      // Transform the data to include all necessary fields
      const enhancedCompany = {
        ...data.company,
        services: data.company.services || [],
        incharge_name: data.company.incharge_name || data.company.owner_name,
        incharge_phone: data.company.incharge_phone || data.company.owner_phone,
        incharge_image: data.company.incharge_image || data.company.logo,
        company_address: data.company.company_address || data.company.address,
        latitude: data.company.latitude,
        longitude: data.company.longitude,
        map_location: data.company.map_location
      };
      
      setCompany(enhancedCompany);
    } catch (error) {
      console.error('Error loading company profile:', error);
      toast.error('Error loading company profile');
      navigate('/company/member-directory');
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      const data = await api.get('/api/wishlist');
      setWishlistItems(data.map(item => item.company_id) || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setWishlistItems([]);
    }
  };

  const handleAddToWishlist = async () => {
    if (!company) return;
    
    try {
      const isInWishlist = wishlistItems.includes(company.id);
      
      if (isInWishlist) {
        await api.delete(`/api/wishlist/${company.id}`);
        setWishlistItems(prev => prev.filter(id => id !== company.id));
        toast.success('Removed from wishlist!');
      } else {
        await api.post('/api/wishlist/add', { companyId: company.id });
        setWishlistItems(prev => [...prev, company.id]);
        toast.success('Added to wishlist!');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update wishlist');
    }
  };

  // Parse services if it's a string
  const services = company?.services ? 
    (typeof company.services === 'string' ? JSON.parse(company.services) : company.services) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-16 h-16 border-4 border-[#D9B95B]/30 border-t-[#D9B95B] rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-[#CDA435] rounded-full animate-spin animate-reverse"></div>
          </div>
          <p className="mt-4 text-lg font-bold text-gray-700 animate-pulse">Loading company profile...</p>
          <div className="flex justify-center mt-2 space-x-1">
            <div className="w-2 h-2 bg-[#D9B95B] rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-[#CDA435] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-[#D9B95B] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-xl text-gray-600 font-bold">Company not found</p>
          <button 
            onClick={() => navigate('/company/member-directory')}
            className="mt-4 bg-gradient-to-r from-[#D9B95B] to-[#CDA435] text-white px-6 py-2 rounded-lg hover:from-[#CDA435] hover:to-[#D9B95B] transition-all duration-300"
          >
            Back to Directory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-[#D9B95B]/5 to-[#CDA435]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-[#CDA435]/5 to-[#D9B95B]/5 rounded-full blur-3xl animate-bounce"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-[#D9B95B]/3 to-[#CDA435]/3 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Header */}
      <div className="relative bg-gradient-to-r from-[#D9B95B] via-[#E6C76B] to-[#CDA435] text-white overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button 
                onClick={() => navigate('/company/member-directory')}
                className="p-3 hover:bg-white/20 rounded-full transition-all duration-300 group backdrop-blur-sm border border-white/20"
              >
                <FaArrowLeft className="text-xl group-hover:-translate-x-1 transition-transform duration-300" />
              </button>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {company.logo ? (
                    <div className="relative">
                      <img src={company.logo} alt={company.name} className="w-16 h-16 rounded-full object-cover border-4 border-white/30 shadow-2xl" />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent"></div>
                      <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-white/20 to-transparent blur-lg animate-pulse"></div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30 shadow-2xl">
                        <span className="text-2xl font-bold text-white">{company.name?.charAt(0)}</span>
                      </div>
                      <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-white/20 to-transparent blur-lg animate-pulse"></div>
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                    {company.name}
                  </h1>
                  <p className="text-white/90 text-lg font-medium mt-1">{company.category}</p>
                  <div className="flex items-center mt-2 space-x-2">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                    <span className="text-white/70 text-sm">Premium Member</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Wishlist Button */}
            <button 
              onClick={handleAddToWishlist}
              className={`p-4 rounded-full transition-all duration-500 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-110 border backdrop-blur-sm ${
                wishlistItems.includes(company.id)
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-red-300/30'
                  : 'bg-white/20 text-white hover:bg-white/30 border-white/30'
              }`}
            >
              <FaHeart className="text-xl" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - Contact & Location */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Person Card */}
            {(company.incharge_name || company.owner_name) && (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 text-center relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 transition-all duration-500"></div>
                <div className="relative z-10">
                  <div className="relative inline-block mb-4">
                    {company.incharge_image || company.logo ? (
                      <img 
                        src={company.incharge_image || company.logo} 
                        alt="Contact Person" 
                        className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-white/50 shadow-xl"
                        onError={(e) => {
                          e.target.src = 'https://i.imgur.com/sCEw22l.png';
                        }}
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D9B95B] to-[#CDA435] flex items-center justify-center mx-auto border-4 border-white/50 shadow-xl">
                        <span className="text-2xl text-white font-bold">{(company.incharge_name || company.owner_name)?.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-gray-800 text-lg">{company.incharge_name || company.owner_name}</h4>
                  <p className="text-gray-600 text-sm mb-3">{company.incharge_name ? 'Incharge' : 'Owner'}</p>
                  {(company.incharge_phone || company.owner_phone) && (
                    <div className="flex items-center justify-center text-gray-600 mb-4">
                      <FaPhone className="mr-2 text-[#D9B95B]" />
                      <span className="text-sm">{company.incharge_phone || company.owner_phone}</span>
                    </div>
                  )}
                  <button className="w-full bg-gradient-to-r from-[#D9B95B] to-[#CDA435] text-white font-bold py-2 px-4 rounded-xl hover:from-[#CDA435] hover:to-[#D9B95B] transition-all duration-300 text-sm">
                    Contact Now
                  </button>
                </div>
              </div>
            )}

            {/* Location Card */}
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 transition-all duration-500"></div>
              <h4 className="font-bold text-gray-800 mb-4 flex items-center relative z-10">
                <div className="p-2 bg-gradient-to-r from-[#D9B95B] to-[#CDA435] rounded-xl mr-3 shadow-lg">
                  <FaMapMarkerAlt className="text-white" />
                </div>
                Location
              </h4>
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg relative z-10">
                <div className="flex items-start text-gray-700">
                  <FaMapMarkerAlt className="mr-3 text-[#D9B95B] mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">
                      {[company.city, company.state, company.country].filter(Boolean).join(', ')}
                    </p>
                    {company.company_address && (
                      <p className="text-sm text-gray-600 mt-1">{company.company_address}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Website Card */}
            {company.website && (
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 group-hover:from-emerald-500/10 group-hover:to-green-500/10 transition-all duration-500"></div>
                <h4 className="font-bold text-gray-800 mb-4 flex items-center relative z-10">
                  <div className="p-2 bg-gradient-to-r from-[#D9B95B] to-[#CDA435] rounded-xl mr-3 shadow-lg">
                    <FaGlobe className="text-white" />
                  </div>
                  Website
                </h4>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg relative z-10">
                  <a href={company.website} target="_blank" rel="noopener noreferrer" 
                     className="text-blue-600 hover:text-blue-800 font-medium flex items-center group transition-all duration-300">
                    <FaGlobe className="mr-2 text-[#D9B95B] group-hover:rotate-12 transition-transform duration-300" />
                    <span className="group-hover:underline text-sm">Visit Website</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* About Company */}
            {company.about_company && (
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 group-hover:from-amber-500/10 group-hover:to-orange-500/10 transition-all duration-500"></div>
                <h4 className="font-bold text-gray-800 mb-4 text-xl flex items-center relative z-10">
                  <div className="p-2 bg-gradient-to-r from-[#D9B95B] to-[#CDA435] rounded-xl mr-3 shadow-lg">
                    <FaAtom className="text-white" />
                  </div>
                  About Company
                </h4>
                <div className="text-gray-700 leading-relaxed bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg relative z-10">
                  <div dangerouslySetInnerHTML={{ __html: company.about_company }} />
                </div>
              </div>
            )}

            {/* Services */}
            {services && services.length > 0 && (
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 group-hover:from-green-500/10 group-hover:to-emerald-500/10 transition-all duration-500"></div>
                <h4 className="font-bold text-gray-800 mb-4 text-xl flex items-center relative z-10">
                  <div className="p-2 bg-gradient-to-r from-[#D9B95B] to-[#CDA435] rounded-xl mr-3 shadow-lg">
                    <FaRocket className="text-white" />
                  </div>
                  Services
                </h4>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg relative z-10">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {services.map((service, index) => (
                      <div key={index} className="flex flex-col items-center text-center p-3 bg-white/60 rounded-xl border border-white/30 hover:shadow-lg transition-all duration-300 group">
                        <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">
                          {getServiceIcon(service)}
                        </div>
                        <p className="text-xs font-medium text-gray-700 leading-tight">{service}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Reviews */}
            {company.average_rating > 0 && (
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all duration-500"></div>
                <h4 className="font-bold text-gray-800 mb-4 text-xl flex items-center relative z-10">
                  <div className="p-2 bg-gradient-to-r from-[#D9B95B] to-[#CDA435] rounded-xl mr-3 shadow-lg">
                    <FaStar className="text-white" />
                  </div>
                  Customer Reviews
                </h4>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex text-yellow-400 text-xl">
                        {[...Array(5)].map((_, i) => (
                          <FaStar key={i} className={`${i < Math.floor(company.average_rating) ? 'text-yellow-400' : 'text-gray-300'} hover:scale-110 transition-transform duration-200`} />
                        ))}
                      </div>
                      <span className="text-2xl font-bold text-gray-800">{company.average_rating}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600 font-medium">{company.total_reviews} Reviews</p>
                      <p className="text-sm text-gray-500">Verified customers</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Map */}
            {company.latitude && company.longitude && (
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 transition-all duration-500"></div>
                <h4 className="font-bold text-gray-800 mb-4 text-xl flex items-center relative z-10">
                  <div className="p-2 bg-gradient-to-r from-[#D9B95B] to-[#CDA435] rounded-xl mr-3 shadow-lg">
                    <FaMapMarkerAlt className="text-white" />
                  </div>
                  Our Location
                </h4>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg relative z-10">
                  {/* Coordinates Info */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="text-sm">
                        <span className="font-medium text-blue-800">Coordinates:</span>
                        <span className="ml-2 font-mono text-blue-700">
                          {parseFloat(company.latitude).toFixed(6)}, {parseFloat(company.longitude).toFixed(6)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${company.latitude}, ${company.longitude}`);
                            toast.success('Coordinates copied!');
                          }}
                          className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors duration-200"
                        >
                          Copy
                        </button>
                        <a
                          href={`https://www.google.com/maps?q=${company.latitude},${company.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors duration-200"
                        >
                          Open
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Google Map */}
                  <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-100">
                    <iframe
                      src={`https://maps.google.com/maps?q=${company.latitude},${company.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Company Location Map"
                    ></iframe>
                  </div>

                  {/* Map Controls */}
                  <div className="mt-4 flex flex-wrap gap-3 justify-center">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${company.latitude},${company.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
                    >
                      Get Directions
                    </a>
                    <a
                      href={`https://www.google.com/maps/@${company.latitude},${company.longitude},18z`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm"
                    >
                      Street View
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Map Location (if no coordinates but map_location exists) */}
            {company.map_location && !company.latitude && !company.longitude && (
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 transition-all duration-500"></div>
                <h4 className="font-bold text-gray-800 mb-4 text-xl flex items-center relative z-10">
                  <div className="p-2 bg-gradient-to-r from-[#D9B95B] to-[#CDA435] rounded-xl mr-3 shadow-lg">
                    <FaMapMarkerAlt className="text-white" />
                  </div>
                  Our Location
                </h4>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg relative z-10">
                  <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-200">
                    <iframe
                      src={company.map_location}
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberProfile;