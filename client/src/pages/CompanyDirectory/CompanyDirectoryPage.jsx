import { useState, useEffect } from 'react';
import { FaTimes, FaMapMarkerAlt, FaGlobe, FaEye, FaStar, FaShip, FaTruck, FaPlane, FaIndustry, FaCog, FaBoxes, FaRecycle, FaCalendarAlt, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// Company Profile Modal Component
const CompanyProfileModal = ({ company, onClose }) => {
  if (!company) return null;

  const getServiceIcon = (service) => {
    const serviceIcons = {
      'FF Services': <FaShip className="text-[#D9B95B]" />,
      'Marine Parts': <FaShip className="text-[#D9B95B]" />,
      'Oil and gas': <FaIndustry className="text-[#D9B95B]" />,
      'AOG Desktop': <FaPlane className="text-[#D9B95B]" />,
      'Sports and Events': <FaCalendarAlt className="text-[#D9B95B]" />,
      'RoRo': <FaTruck className="text-[#D9B95B]" />,
      'Recyclables': <FaRecycle className="text-[#D9B95B]" />,
      'Fairs and Exhibitions': <FaCalendarAlt className="text-[#D9B95B]" />,
      'Logistics': <FaBoxes className="text-[#D9B95B]" />,
      'Freight': <FaTruck className="text-[#D9B95B]" />,
      'Transport': <FaTruck className="text-[#D9B95B]" />,
      'Shipping': <FaShip className="text-[#D9B95B]" />
    };
    return serviceIcons[service] || <FaCog className="text-[#D9B95B]" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header with gradient */}
        <div className="sticky top-0 bg-gradient-to-r from-[#D9B95B] to-[#CDA435] text-white p-6 flex justify-between items-center rounded-t-2xl">
          <div className="flex items-center space-x-4">
            {company.logo ? (
              <img src={company.logo} alt={company.name} className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg" />
            ) : (
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                <span className="text-2xl font-bold text-[#D9B95B]">{company.name?.charAt(0)}</span>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold">{company.name}</h2>
              <p className="text-white/90">{company.category}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-white/20 rounded-full transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Location Only */}
            <div className="lg:col-span-1 space-y-6">
              {/* Location Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-lg border border-blue-200">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                  <FaMapMarkerAlt className="mr-2 text-[#D9B95B]" />
                  Our Location
                </h4>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-start text-gray-700">
                    <FaMapMarkerAlt className="mr-3 text-[#D9B95B] mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-lg">
                        {[company.city, company.state, company.country].filter(Boolean).join(', ')}
                      </p>
                      {company.gps_coordinates && (
                        <p className="text-sm text-gray-500 mt-2 bg-gray-50 p-2 rounded font-mono">
                          GPS: {company.gps_coordinates}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Website Link Card */}
              {company.website && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 shadow-lg border border-green-200">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                    <FaGlobe className="mr-2 text-[#D9B95B]" />
                    Visit Our Website
                  </h4>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <a href={company.website} target="_blank" rel="noopener noreferrer" 
                       className="text-blue-600 hover:underline font-medium flex items-center">
                      <FaGlobe className="mr-2 text-[#D9B95B]" />
                      Visit Website
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* About Company */}
              {company.about_company && (
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 shadow-lg border border-yellow-200">
                  <h4 className="font-bold text-gray-800 mb-4 text-xl">About Company</h4>
                  <p className="text-gray-700 leading-relaxed text-lg bg-white p-4 rounded-lg shadow-sm">
                    {company.about_company}
                  </p>
                </div>
              )}

              {/* Services */}
              {company.services && company.services.length > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 shadow-lg border border-green-200">
                  <h4 className="font-bold mb-6 text-xl flex items-center">
                    <FaCog className="mr-2 text-[#D9B95B]" />
                    Our Services
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {company.services.map((service, index) => (
                      <div 
                        key={index}
                        className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-[#D9B95B] group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-br from-[#D9B95B] to-[#CDA435] rounded-lg group-hover:scale-110 transition-transform">
                            {getServiceIcon(service)}
                          </div>
                          <span className="font-semibold text-gray-800 group-hover:text-[#D9B95B] transition-colors">
                            {service}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rating & Reviews */}
              {company.average_rating > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 shadow-lg border border-purple-200">
                  <h4 className="font-bold text-gray-800 mb-4 text-xl">Customer Reviews</h4>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex text-yellow-400 text-xl">
                          {[...Array(5)].map((_, i) => (
                            <FaStar key={i} className={i < Math.floor(company.average_rating) ? 'text-yellow-400' : 'text-gray-300'} />
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

              {/* Social Links */}
              {(company.facebook || company.twitter || company.linkedin) && (
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 shadow-lg border border-indigo-200">
                  <h4 className="font-bold text-gray-800 mb-4 text-xl">Connect With Us</h4>
                  <div className="flex space-x-4">
                    {company.facebook && (
                      <a href={company.facebook} target="_blank" rel="noopener noreferrer" 
                         className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg">
                        Facebook
                      </a>
                    )}
                    {company.twitter && (
                      <a href={company.twitter} target="_blank" rel="noopener noreferrer" 
                         className="bg-blue-400 text-white px-6 py-3 rounded-lg hover:bg-blue-500 transition-colors font-medium shadow-md hover:shadow-lg">
                        Twitter
                      </a>
                    )}
                    {company.linkedin && (
                      <a href={company.linkedin} target="_blank" rel="noopener noreferrer" 
                         className="bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors font-medium shadow-md hover:shadow-lg">
                        LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CompanyDirectoryPage = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [filters, setFilters] = useState({ categories: [], countries: [] });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCompanies: 0 });

  useEffect(() => {
    fetchFilters();
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [selectedCategory, selectedCountry, searchTerm, pagination.currentPage]);

  const fetchFilters = async () => {
    try {
      const data = await api.get('/api/directory/filters');
      setFilters(data || { categories: [], countries: [] });
    } catch (error) {
      console.error('Error fetching filters:', error);
      setFilters({ categories: [], countries: [] });
    }
  };

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedCountry) params.append('country', selectedCountry);
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', pagination.currentPage);
      params.append('limit', 12);

      const data = await api.get(`/api/directory/companies?${params.toString()}`);
      setCompanies(data.companies || []);
      setPagination(data.pagination || { currentPage: 1, totalPages: 1, totalCompanies: 0 });
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Failed to load companies');
      setCompanies([]);
      setPagination({ currentPage: 1, totalPages: 1, totalCompanies: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = async (company) => {
    try {
      const data = await api.get(`/api/directory/company/${company.id}`);
      setSelectedCompany(data.company);
    } catch (error) {
      toast.error('Error loading company profile');
    }
  };

  return (
    <div className="min-h-screen mt-24 bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#D9B95B] to-[#CDA435] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate(-1)}
                className="p-3 hover:bg-white/20 rounded-full transition-colors"
              >
                <FaArrowLeft className="text-xl" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-white/20 rounded-full">
                  <FaGlobe className="text-2xl" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Freightnet Directory</h1>
                  <p className="text-white/90">Discover top freight forwarding companies</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select 
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPagination(p => ({...p, currentPage: 1})); }}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-[#D9B95B] focus:ring-2 focus:ring-[#D9B95B]/20 transition-all font-medium"
            >
              <option value="">🏢 All Categories</option>
              {filters.categories?.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
            <select 
              value={selectedCountry}
              onChange={(e) => { setSelectedCountry(e.target.value); setPagination(p => ({...p, currentPage: 1})); }}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-[#D9B95B] focus:ring-2 focus:ring-[#D9B95B]/20 transition-all font-medium"
            >
              <option value="">🌍 All Countries</option>
              {filters.countries?.map((country, idx) => (
                <option key={idx} value={country}>{country}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="🔍 Search companies..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPagination(p => ({...p, currentPage: 1})); }}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-[#D9B95B] focus:ring-2 focus:ring-[#D9B95B]/20 transition-all font-medium"
            />
          </div>
        </div>

        {/* Companies List */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#D9B95B] border-t-transparent"></div>
              <p className="mt-4 text-lg font-medium text-gray-600">Loading amazing companies...</p>
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🏢</div>
              <p className="text-xl text-gray-500 font-medium">No companies found</p>
              <p className="text-gray-400">Try adjusting your search criteria</p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex justify-between items-center">
                <div className="text-lg font-semibold text-gray-700">
                  <span className="text-[#D9B95B]">{companies.length}</span> of <span className="text-[#D9B95B]">{pagination.totalCompanies}</span> companies
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <div className="w-3 h-3 bg-[#D9B95B] rounded-full"></div>
                  <span>Featured Members First</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {companies.map(company => (
                  <div key={company.id} className="group bg-white border-2 border-gray-200 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl hover:border-[#D9B95B] transition-all duration-300 transform hover:-translate-y-1">
                    
                    {/* Company Header */}
                    <div className="relative h-40 bg-gradient-to-br from-[#D9B95B] to-[#CDA435] overflow-hidden">
                      {company.logo ? (
                        <img src={company.logo} alt={company.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-6xl text-white font-bold drop-shadow-lg">{company.name?.charAt(0)}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                    </div>
                    
                    {/* Company Info */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-xl text-gray-800 group-hover:text-[#D9B95B] transition-colors line-clamp-1">
                          {company.name}
                        </h3>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <span className="bg-gradient-to-r from-[#D9B95B]/20 to-[#CDA435]/20 text-[#8B7355] px-3 py-1 rounded-full text-sm font-semibold">
                          {company.category}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-gray-600 text-sm mb-4 bg-gray-50 p-3 rounded-lg">
                        <FaMapMarkerAlt className="mr-2 text-[#D9B95B] flex-shrink-0" />
                        <span className="font-medium">{company.city ? `${company.city}, ` : ''}{company.country}</span>
                      </div>
                      
                      {company.average_rating > 0 && (
                        <div className="flex items-center justify-between text-sm mb-4 bg-yellow-50 p-3 rounded-lg">
                          <div className="flex items-center text-yellow-600">
                            <div className="flex mr-2">
                              {[...Array(5)].map((_, i) => (
                                <FaStar key={i} className={`text-xs ${i < Math.floor(company.average_rating) ? 'text-yellow-400' : 'text-gray-300'}`} />
                              ))}
                            </div>
                            <span className="font-bold">{company.average_rating}</span>
                          </div>
                          <span className="text-gray-500">({company.total_reviews} reviews)</span>
                        </div>
                      )}
                      
                      <button 
                        onClick={() => handleViewProfile(company)}
                        className="w-full bg-gradient-to-r from-[#D9B95B] to-[#CDA435] text-white py-3 rounded-xl hover:from-[#CDA435] hover:to-[#D9B95B] transition-all duration-300 flex items-center justify-center font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <FaEye className="mr-2" />
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-8 pt-6 border-t border-gray-200">
                  <button 
                    onClick={() => setPagination(p => ({...p, currentPage: p.currentPage - 1}))}
                    disabled={!pagination.hasPrev}
                    className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl hover:from-[#D9B95B] hover:to-[#CDA435] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                  >
                    ← Previous
                  </button>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 font-medium">Page</span>
                    <span className="bg-[#D9B95B] text-white px-3 py-1 rounded-lg font-bold">{pagination.currentPage}</span>
                    <span className="text-gray-600 font-medium">of {pagination.totalPages}</span>
                  </div>
                  <button 
                    onClick={() => setPagination(p => ({...p, currentPage: p.currentPage + 1}))}
                    disabled={!pagination.hasNext}
                    className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl hover:from-[#D9B95B] hover:to-[#CDA435] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Company Profile Modal */}
      {selectedCompany && (
        <CompanyProfileModal 
          company={selectedCompany} 
          onClose={() => setSelectedCompany(null)} 
        />
      )}
    </div>
  );
};

export default CompanyDirectoryPage;