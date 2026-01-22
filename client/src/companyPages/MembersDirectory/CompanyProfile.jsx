import { useState } from 'react';
import { 
  FiGlobe, FiHeart, FiMapPin, FiPhone, FiMail, FiStar, FiMessageSquare,
  FiGrid, FiChevronDown, FiChevronUp, FiZap, FiTrendingUp, FiShield
} from 'react-icons/fi';
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram, FaSkype, FaTruck, FaFutbol, FaPaw } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../utils/api';

// Service Item Component
const ServiceItem = ({ icon, label }) => (
  <div className="flex flex-col items-center text-center text-gray-600">
    <div className="bg-gray-100 h-20 w-20 rounded-full flex items-center justify-center mb-2 text-gray-500">
      {icon}
    </div>
    <p className="text-sm font-medium">{label}</p>
  </div>
);

const CompanyProfile = ({ member, onClose }) => {
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageData, setMessageData] = useState({ subject: '', message: '' });
  const [sendingMessage, setSendingMessage] = useState(false);
  const [expandedBranch, setExpandedBranch] = useState(null);

  const company = member.company || member;
  const branches = member.branches || [];
  const members = member.members || [];
  const reviews = member.reviews || [];

  // Function to format category text (remove underscores and capitalize)
  const formatCategory = (category) => {
    if (!category) return '';
    return category
      .split(',')
      .map(cat => cat.trim().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
      .join(', ');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageData.subject || !messageData.message) {
      toast.error('Please fill in all fields');
      return;
    }

    setSendingMessage(true);
    try {
      await api.post('/api/messages/send', {
        receiverId: company.id,
        subject: messageData.subject,
        message: messageData.message
      });
      toast.success('Message sent successfully!');
      setMessageData({ subject: '', message: '' });
      setShowMessageForm(false);
    } catch (error) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAddToWishlist = async () => {
    try {
      await api.post('/api/wishlist/add', { companyId: company.id });
      toast.success('Added to wishlist!');
    } catch (error) {
      toast.error(error.message || 'Failed to add to wishlist');
    }
  };

  // Parse services with better error handling
  let services = [];
  
  // Debug log to see the actual data
  console.log('Raw services data:', company.services, typeof company.services);
  
  try {
    if (Array.isArray(company.services)) {
      // Check if it's a nested array (array containing arrays)
      if (company.services.length > 0 && Array.isArray(company.services[0])) {
        services = company.services[0]; // Take the first nested array
      } else {
        services = company.services;
      }
    } else if (typeof company.services === 'string' && company.services.trim()) {
      // Try to parse as JSON first
      try {
        services = JSON.parse(company.services);
        // Handle nested array after JSON parsing
        if (Array.isArray(services) && services.length > 0 && Array.isArray(services[0])) {
          services = services[0];
        }
      } catch {
        // If JSON parsing fails, split by comma or other delimiters
        services = company.services.split(/[,;|]/).map(s => s.trim()).filter(s => s);
      }
    }
  } catch (error) {
    console.error('Error parsing services:', error);
    services = [];
  }

  // Ensure services is always an array
  if (!Array.isArray(services)) {
    services = [];
  }
  
  console.log('Parsed services:', services);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[#CDA435]/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-[#CDA435]/5 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-[#CDA435]/3 to-transparent rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <button 
            onClick={onClose} 
            className="group flex items-center text-[#CDA435] hover:text-yellow-600 mb-6 transition-all duration-300 transform hover:scale-105"
          >
            <div className="w-8 h-8 rounded-full bg-[#CDA435]/10 flex items-center justify-center mr-3 group-hover:bg-[#CDA435]/20 transition-all duration-300">
              <span className="text-lg">←</span>
            </div>
            <span className="font-medium">Back to Members Directory</span>
          </button>

          {/* Futuristic Header Section */}
          <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-[#CDA435]/20 p-8 mb-8 overflow-hidden">
            {/* Glowing border effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#CDA435]/5 via-transparent to-[#CDA435]/5 rounded-3xl"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#CDA435] to-transparent"></div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  {company.logo ? (
                    <div className="relative">
                      <img 
                        src={company.logo} 
                        alt={company.name} 
                        className="w-32 h-auto rounded-2xl object-fill shadow-2xl border-2 border-[#CDA435]/30" 
                      />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#CDA435]/20 to-transparent"></div>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#CDA435] to-[#8B7355] flex items-center justify-center text-white text-3xl font-bold shadow-2xl border border-[#CDA435]/30 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"></div>
                      <span className="relative z-10">{company.name?.charAt(0)}</span>
                    </div>
                  )}
                  <div className="absolute -inset-2 bg-gradient-to-r from-[#CDA435]/20 to-transparent rounded-3xl blur-lg animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                    {company.name}
                  </h1>
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="px-3 py-1 bg-[#CDA435]/10 text-[#CDA435] rounded-full text-sm font-medium border border-[#CDA435]/30">
                      {formatCategory(company.category)}
                    </span>
                    <FiZap className="text-[#CDA435] animate-pulse" />
                  </div>
                  {company.average_rating > 0 && (
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center text-[#CDA435]">
                        {[...Array(5)].map((_, i) => (
                          <FiStar key={i} className={`${i < Math.floor(company.average_rating) ? 'fill-current' : ''} transition-all duration-300`} />
                        ))}
                      </div>
                      <span className="text-gray-600 text-sm">
                        {company.average_rating} ({company.total_reviews} reviews)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-600 items-center justify-center">
                {company.website && (
                  <a 
                    href={company.website} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="group flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-xl hover:bg-[#CDA435]/10 transition-all duration-300 border border-gray-200 hover:border-[#CDA435]/50"
                  >
                    <FiGlobe className="text-[#CDA435] group-hover:animate-spin" />
                    <span>Website</span>
                  </a>
                )}
                <button 
                  onClick={handleAddToWishlist} 
                  className="group flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-xl hover:bg-red-50 transition-all duration-300 border border-gray-200 hover:border-red-300"
                >
                  <FiHeart className="text-gray-400 group-hover:text-red-400 group-hover:animate-pulse" />
                  <span>Wishlist</span>
                </button>
                <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200">
                  <FiMapPin className="text-[#CDA435]" />
                  <span>
                    {company.city && `${company.city}, `}{company.state && `${company.state}, `}{company.country}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center lg:justify-end">
                <div className="flex space-x-3">
                  {company.facebook && (
                    <a 
                      href={company.facebook} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all duration-300 border border-gray-200 hover:border-blue-300 group"
                    >
                      <FaFacebookF className="group-hover:scale-110 transition-transform duration-300" />
                    </a>
                  )}
                  {company.twitter && (
                    <a 
                      href={company.twitter} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-xl text-gray-400 hover:text-blue-400 hover:bg-blue-50 transition-all duration-300 border border-gray-200 hover:border-blue-300 group"
                    >
                      <FaTwitter className="group-hover:scale-110 transition-transform duration-300" />
                    </a>
                  )}
                  {company.linkedin && (
                    <a 
                      href={company.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 border border-gray-200 hover:border-blue-300 group"
                    >
                      <FaLinkedinIn className="group-hover:scale-110 transition-transform duration-300" />
                    </a>
                  )}
                  {company.instagram && (
                    <a 
                      href={company.instagram} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-xl text-gray-400 hover:text-pink-500 hover:bg-pink-50 transition-all duration-300 border border-gray-200 hover:border-pink-300 group"
                    >
                      <FaInstagram className="group-hover:scale-110 transition-transform duration-300" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* About Company */}
              <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#CDA435]/20 p-8 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#CDA435] to-transparent"></div>
                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[#CDA435]/10 flex items-center justify-center">
                      <FiShield className="text-[#CDA435]" />
                    </div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      About Company
                    </h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {company.about_company || 'No description available.'}
                  </p>
                </div>
              </div>

              {/* Services */}
              {services.length > 0 && (
                <div className="bg-white p-8 rounded-lg shadow-md">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">Services</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                    {services.map((service, idx) => (
                      <ServiceItem 
                        key={idx} 
                        icon={getServiceIcon(service)} 
                        label={service} 
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Branches */}
              {branches.length > 0 && (
                <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#CDA435]/20 p-8 overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#CDA435] to-transparent"></div>
                  <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-[#CDA435]/10 flex items-center justify-center">
                        <FiMapPin className="text-[#CDA435]" />
                      </div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        Branch Locations
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {branches.map((branch) => (
                        <div key={branch.id} className="bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 overflow-hidden">
                          <button
                            onClick={() => setExpandedBranch(expandedBranch === branch.id ? null : branch.id)}
                            className="w-full p-6 flex justify-between items-center hover:bg-[#CDA435]/5 transition-all duration-300 group"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-8 h-8 rounded-lg bg-[#CDA435]/10 flex items-center justify-center group-hover:bg-[#CDA435]/20 transition-all duration-300">
                                <FiMapPin className="text-[#CDA435]" />
                              </div>
                              <div className="text-left">
                                <span className="font-medium text-gray-800 text-lg">{branch.branch_name}</span>
                                <p className="text-gray-600 text-sm">
                                  {branch.city && `${branch.city}, `}{branch.country}
                                </p>
                              </div>
                            </div>
                            <div className="text-[#CDA435] group-hover:scale-110 transition-transform duration-300">
                              {expandedBranch === branch.id ? <FiChevronUp /> : <FiChevronDown />}
                            </div>
                          </button>
                          {expandedBranch === branch.id && (
                            <div className="px-6 pb-6 border-t border-gray-200 bg-gray-50/50">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                                {branch.branch_phone && (
                                  <div className="flex items-center space-x-2 text-gray-700">
                                    <FiPhone className="text-[#CDA435]" />
                                    <span>{branch.branch_phone}</span>
                                  </div>
                                )}
                                {branch.branch_email && (
                                  <div className="flex items-center space-x-2 text-gray-700">
                                    <FiMail className="text-[#CDA435]" />
                                    <span>{branch.branch_email}</span>
                                  </div>
                                )}
                                {branch.address && (
                                  <div className="md:col-span-2 flex items-start space-x-2 text-gray-700">
                                    <FiMapPin className="text-[#CDA435] mt-1 flex-shrink-0" />
                                    <span>{branch.address}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Key Staff */}
              {members.length > 0 && (
                <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#CDA435]/20 p-8 overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#CDA435] to-transparent"></div>
                  <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-[#CDA435]/10 flex items-center justify-center">
                        <FiZap className="text-[#CDA435]" />
                      </div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        Key Staff / Directors
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {members.map((m) => (
                        <div key={m.id} className="group flex items-center space-x-4 p-6 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:border-[#CDA435]/50 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-lg">
                          <div className="relative">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#CDA435] to-[#8B7355] flex items-center justify-center text-white font-bold text-xl shadow-lg">
                              {m.member_name?.charAt(0)}
                            </div>
                            <div className="absolute -inset-1 bg-gradient-to-r from-[#CDA435]/20 to-transparent rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-lg">{m.member_name}</p>
                            <p className="text-[#CDA435] text-sm font-medium">{m.member_role || 'Staff'}</p>
                            {m.member_email && <p className="text-gray-600 text-xs mt-1">{m.member_email}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Reviews */}
              {reviews.length > 0 && (
                <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#CDA435]/20 p-8 overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#CDA435] to-transparent"></div>
                  <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-[#CDA435]/10 flex items-center justify-center">
                        <FiStar className="text-[#CDA435]" />
                      </div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        Client Reviews
                      </h3>
                    </div>
                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <div key={review.id} className="group p-6 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:border-[#CDA435]/50 transition-all duration-300 hover:shadow-lg">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="font-medium text-gray-800 text-lg">{review.reviewer_name}</p>
                              <div className="flex items-center space-x-1 mt-2">
                                {[...Array(5)].map((_, i) => (
                                  <FiStar 
                                    key={i} 
                                    className={`${i < review.rating ? 'fill-current text-[#CDA435]' : 'text-gray-400'} transition-all duration-300`} 
                                    size={16} 
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700 leading-relaxed">{review.review_text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Interactive Google Map using Coordinates */}
              {company.latitude && company.longitude && (
                <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#CDA435]/20 p-8 overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#CDA435] to-transparent"></div>
                  <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-[#CDA435]/10 flex items-center justify-center">
                        <FiMapPin className="text-[#CDA435]" />
                      </div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        Our Location
                      </h3>
                    </div>
                    
                    {/* Coordinates Info Bar */}
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                          <div className="text-sm">
                            <span className="font-medium text-blue-800">Coordinates:</span>
                            <span className="ml-2 font-mono text-blue-700">
                              {parseFloat(company.latitude).toFixed(6)}, {parseFloat(company.longitude).toFixed(6)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${company.latitude}, ${company.longitude}`);
                              toast.success('Coordinates copied to clipboard!');
                            }}
                            className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors duration-200"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy
                          </button>
                          <a
                            href={`https://www.google.com/maps?q=${company.latitude},${company.longitude}`}
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
                        src={`https://maps.google.com/maps?q=${company.latitude},${company.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
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
                        href={`https://www.google.com/maps/dir/?api=1&destination=${company.latitude},${company.longitude}`}
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
                        href={`https://www.google.com/maps/@${company.latitude},${company.longitude},18z`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Street View
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Google Maps Location Card - Only show if mapLocation exists and no coordinates */}
              {company.map_location && !company.latitude && !company.longitude && (
                <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#CDA435]/20 p-8 overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#CDA435] to-transparent"></div>
                  <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-[#CDA435]/10 flex items-center justify-center">
                        <FiMapPin className="text-[#CDA435]" />
                      </div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        Our Location
                      </h3>
                    </div>
                    <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-200">
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

            {/* Right Column - Contact */}
            <div className="lg:col-span-1 space-y-8">
              <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#CDA435]/20 p-8 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#CDA435] to-transparent"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-6 text-center">
                    Contact Information
                  </h3>
                  
                  {company.incharge_name && (
                    <div className="text-center mb-8">
                      <div className="relative inline-block">
                        {company.incharge_image ? (
                          <img 
                            src={company.incharge_image} 
                            alt={company.incharge_name}
                            className="w-24 h-24 rounded-3xl mx-auto mb-4 shadow-2xl object-cover border-4 border-gray-100"
                            onError={(e) => {
                              e.target.src = 'https://i.imgur.com/sCEw22l.png';
                            }}
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#CDA435] to-[#8B7355] flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-2xl">
                            {company.incharge_name?.charAt(0)}
                          </div>
                        )}
                        <div className="absolute -inset-2 bg-gradient-to-r from-[#CDA435]/20 to-transparent rounded-3xl blur-lg animate-pulse"></div>
                      </div>
                      <p className="font-medium text-gray-800 text-xl">{company.incharge_name}</p>
                      <p className="text-[#CDA435] text-sm font-medium">Incharge</p>
                    </div>
                  )}

                  <div className="space-y-4 mb-8">
                    {company.phone && (
                      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="w-10 h-10 rounded-xl bg-[#CDA435]/10 flex items-center justify-center">
                          <FiPhone className="text-[#CDA435]" />
                        </div>
                        <span className="text-gray-700">{company.phone}</span>
                      </div>
                    )}
                    {company.email && (
                      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="w-10 h-10 rounded-xl bg-[#CDA435]/10 flex items-center justify-center">
                          <FiMail className="text-[#CDA435]" />
                        </div>
                        <span className="text-gray-700">{company.email}</span>
                      </div>
                    )}
                    {company.skype && (
                      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="w-10 h-10 rounded-xl bg-[#CDA435]/10 flex items-center justify-center">
                          <FaSkype className="text-[#CDA435]" />
                        </div>
                        <span className="text-gray-700">{company.skype}</span>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => setShowMessageForm(!showMessageForm)}
                    className="group w-full bg-gradient-to-r from-[#CDA435] to-[#8B7355] text-white font-bold py-4 rounded-xl shadow-2xl hover:shadow-[#CDA435]/25 transition-all duration-300 flex items-center justify-center space-x-3 hover:transform hover:scale-105 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <FiMessageSquare className="group-hover:animate-pulse" />
                    <span className="relative z-10">Send Message</span>
                  </button>

                  {showMessageForm && (
                    <form onSubmit={handleSendMessage} className="mt-6 space-y-4">
                      <input
                        type="text"
                        placeholder="Subject"
                        value={messageData.subject}
                        onChange={(e) => setMessageData({...messageData, subject: e.target.value})}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent text-gray-800 placeholder-gray-500 transition-all duration-300"
                        required
                      />
                      <textarea
                        placeholder="Your message..."
                        value={messageData.message}
                        onChange={(e) => setMessageData({...messageData, message: e.target.value})}
                        rows="4"
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent text-gray-800 placeholder-gray-500 transition-all duration-300 resize-none"
                        required
                      />
                      <button
                        type="submit"
                        disabled={sendingMessage}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-3 rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-green-500/25"
                      >
                        {sendingMessage ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Sending...</span>
                          </div>
                        ) : (
                          'Send'
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;
