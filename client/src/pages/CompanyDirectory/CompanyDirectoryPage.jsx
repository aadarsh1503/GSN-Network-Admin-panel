import { useState, useEffect } from 'react';
import { FaTimes, FaMapMarkerAlt, FaGlobe, FaEye, FaStar, FaShip, FaTruck, FaPlane, FaIndustry, FaCog, FaBoxes, FaRecycle, FaCalendarAlt, FaArrowLeft, FaTh, FaList } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// Company Profile Modal Component
const CompanyProfileModal = ({ company, onClose }) => {
  if (!company) return null;

  // Function to format category names (replace underscores with spaces and capitalize)
  const formatCategoryName = (category) => {
    if (!category) return '';
    return category
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

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
        <div className="sticky top-0 bg-gradient-to-r from-[#D9B95B] to-[#bca142] text-white p-6 flex justify-between items-center rounded-t-2xl">
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
              <p className="text-white/90">{formatCategoryName(company.category)}</p>
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
                          <div className="p-2 bg-gradient-to-br from-[#D9B95B] to-[#bca142] rounded-lg group-hover:scale-110 transition-transform">
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
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCompanies: 0 });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Function to format category names (replace underscores with spaces and capitalize)
  const formatCategoryName = (category) => {
    if (!category) return '';
    return category
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  useEffect(() => {
    fetchFilters();
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [selectedCategory, selectedCountry, searchTerm, itemsPerPage, pagination.currentPage]);

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
      params.append('limit', itemsPerPage);

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
    <div className="min-h-screen mt-20 bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header - More compact */}
      <div className="bg-gradient-to-r from-[#D9B95B] to-[#bca142] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <FaArrowLeft className="text-lg" />
              </button>
              <div className="flex mt-4 items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-full">
                  <FaGlobe className="text-lg" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Freightnet Directory</h1>
                  <p className="text-white/90 text-xs">Discover top freight forwarding companies</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters - More compact */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <select 
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPagination(p => ({...p, currentPage: 1})); }}
              className="w-full p-2 border border-gray-200 rounded-md focus:border-[#D9B95B] focus:ring-1 focus:ring-[#D9B95B]/20 transition-all text-xs"
            >
              <option value="">🏢 All Categories</option>
              {filters.categories?.map((cat, idx) => (
                <option key={idx} value={cat}>{formatCategoryName(cat)}</option>
              ))}
            </select>
            <select 
              value={selectedCountry}
              onChange={(e) => { setSelectedCountry(e.target.value); setPagination(p => ({...p, currentPage: 1})); }}
              className="w-full p-2 border border-gray-200 rounded-md focus:border-[#D9B95B] focus:ring-1 focus:ring-[#D9B95B]/20 transition-all text-xs"
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
              className="w-full p-2 border border-gray-200 rounded-md focus:border-[#D9B95B] focus:ring-1 focus:ring-[#D9B95B]/20 transition-all text-xs"
            />
            <select 
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setPagination(p => ({...p, currentPage: 1})); }}
              className="w-full p-2 border border-gray-200 rounded-md focus:border-[#D9B95B] focus:ring-1 focus:ring-[#D9B95B]/20 transition-all text-xs"
            >
              <option value={5}>📄 5 per page</option>
              <option value={10}>📄 10 per page</option>
              <option value={12}>📄 12 per page</option>
              <option value={20}>📄 20 per page</option>
              <option value={30}>📄 30 per page</option>
            </select>
          </div>
          
          {/* View Toggle Buttons */}
          <div className="flex justify-end mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[#D9B95B] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                }`}
              >
                <FaTh className="text-xs" />
                <span>Grid View</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'list'
                    ? 'bg-[#D9B95B] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                }`}
              >
                <FaList className="text-xs" />
                <span>List View</span>
              </button>
            </div>
          </div>
        </div>

        {/* Companies List - More compact */}
        <div className="bg-white rounded-lg shadow-sm p-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#D9B95B] border-t-transparent"></div>
              <p className="mt-2 text-sm font-medium text-gray-600">Loading amazing companies...</p>
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">🏢</div>
              <p className="text-base text-gray-500 font-medium">No companies found</p>
              <p className="text-gray-400 text-xs">Try adjusting your search criteria</p>
            </div>
          ) : (
            <>
              <div className="mb-3 flex justify-between items-center">
                <div className="text-sm font-semibold text-gray-700">
                  <span className="text-[#D9B95B]">{companies.length}</span> of <span className="text-[#D9B95B]">{pagination.totalCompanies}</span> companies
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <div className="w-2 h-2 bg-[#D9B95B] rounded-full"></div>
                  <span>Featured Members First</span>
                </div>
              </div>
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3"
                : "space-y-3"
              }>
                {companies.map(company => (
                  viewMode === 'grid' ? (
                    // Grid View - Compact Cards
                    <div key={company.id} className="group bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md hover:border-[#D9B95B] transition-all duration-300 transform hover:-translate-y-1">
                      
                      {/* Company Header - Compact with circular logo */}
                      <div className="relative p-3 bg-gradient-to-br from-gray-50 to-gray-100 text-center">
                        {company.logo ? (
                          <img 
                            src={company.logo} 
                            alt={company.name} 
                            className="w-12 h-12 rounded-full object-cover mx-auto border-2 border-white shadow-md group-hover:scale-110 transition-transform duration-300" 
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D9B95B] to-[#bca142] flex items-center justify-center mx-auto border-2 border-white shadow-md group-hover:scale-110 transition-transform duration-300">
                            <span className="text-lg text-white font-bold">{company.name?.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Company Info - Compact */}
                      <div className="p-3 pt-1">
                        <h3 className="font-semibold text-xs text-gray-800 group-hover:text-[#D9B95B] transition-colors line-clamp-2 mb-2 min-h-[2rem] text-center">
                          {company.name}
                        </h3>
                        
                        <div className="mb-2 text-center">
                          <span className="bg-gradient-to-r from-[#D9B95B]/20 to-[#bca142]/20 text-[#8B7355] px-2 py-1 rounded-full text-xs font-medium line-clamp-1 inline-block">
                            {formatCategoryName(company.category)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-center text-gray-600 text-xs mb-2 bg-gray-50 p-1.5 rounded-md">
                          <FaMapMarkerAlt className="mr-1 text-[#D9B95B] flex-shrink-0 text-xs" />
                          <span className="font-medium truncate text-center">{company.city ? `${company.city}, ` : ''}{company.country}</span>
                        </div>
                        
                        {company.average_rating > 0 && (
                          <div className="flex items-center justify-center text-xs mb-2 bg-yellow-50 p-1.5 rounded-md">
                            <div className="flex items-center text-yellow-600">
                              <div className="flex mr-1">
                                {[...Array(5)].map((_, i) => (
                                  <FaStar key={i} className={`text-xs ${i < Math.floor(company.average_rating) ? 'text-yellow-400' : 'text-gray-300'}`} />
                                ))}
                              </div>
                              <span className="font-bold text-xs">{company.average_rating}</span>
                            </div>
                            <span className="text-gray-500 text-xs ml-1">({company.total_reviews})</span>
                          </div>
                        )}
                        
                        <button 
                          onClick={() => handleViewProfile(company)}
                          className="w-full bg-gradient-to-r from-[#D9B95B] to-[#bca142] text-white py-1.5 rounded-md hover:from-[#bca142] hover:to-[#D9B95B] transition-all duration-300 flex items-center justify-center font-medium text-xs shadow-sm hover:shadow-md transform hover:scale-105"
                        >
                          <FaEye className="mr-1 text-xs" />
                          View Profile
                        </button>
                      </div>
                    </div>
                  ) : (
                    // List View - One per row, compact
                    <div key={company.id} className="group bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md hover:border-[#D9B95B] transition-all duration-300">
                      <div className="flex items-center p-4 space-x-4">
                        {/* Company Logo */}
                        <div className="flex-shrink-0">
                          {company.logo ? (
                            <img 
                              src={company.logo} 
                              alt={company.name} 
                              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 shadow-sm group-hover:scale-105 transition-transform duration-300" 
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D9B95B] to-[#bca142] flex items-center justify-center border-2 border-gray-200 shadow-sm group-hover:scale-105 transition-transform duration-300">
                              <span className="text-xl text-white font-bold">{company.name?.charAt(0)}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Company Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-gray-800 group-hover:text-[#D9B95B] transition-colors truncate">
                                {company.name}
                              </h3>
                              <div className="flex items-center space-x-3 mt-1">
                                <span className="bg-gradient-to-r from-[#D9B95B]/20 to-[#bca142]/20 text-[#8B7355] px-3 py-1 rounded-full text-sm font-medium">
                                  {formatCategoryName(company.category)}
                                </span>
                                <div className="flex items-center text-gray-600 text-sm">
                                  <FaMapMarkerAlt className="mr-1 text-[#D9B95B] flex-shrink-0" />
                                  <span className="font-medium">{company.city ? `${company.city}, ` : ''}{company.country}</span>
                                </div>
                              </div>
                              {company.average_rating > 0 && (
                                <div className="flex items-center mt-2">
                                  <div className="flex items-center text-yellow-600 mr-3">
                                    <div className="flex mr-1">
                                      {[...Array(5)].map((_, i) => (
                                        <FaStar key={i} className={`text-sm ${i < Math.floor(company.average_rating) ? 'text-yellow-400' : 'text-gray-300'}`} />
                                      ))}
                                    </div>
                                    <span className="font-bold text-sm ml-1">{company.average_rating}</span>
                                  </div>
                                  <span className="text-gray-500 text-sm">({company.total_reviews} reviews)</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Action Button */}
                            <div className="flex-shrink-0 ml-4">
                              <button 
                                onClick={() => handleViewProfile(company)}
                                className="bg-gradient-to-r from-[#D9B95B] to-[#bca142] text-white px-6 py-2 rounded-lg hover:from-[#bca142] hover:to-[#D9B95B] transition-all duration-300 flex items-center font-medium text-sm shadow-sm hover:shadow-md transform hover:scale-105"
                              >
                                <FaEye className="mr-2" />
                                View Profile
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>

              {/* Pagination - More compact */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-4 pt-3 border-t border-gray-200">
                  <button 
                    onClick={() => setPagination(p => ({...p, currentPage: p.currentPage - 1}))}
                    disabled={!pagination.hasPrev}
                    className="px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-200 rounded-md hover:from-[#D9B95B] hover:to-[#bca142] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-medium"
                  >
                    ← Previous
                  </button>
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-600 text-xs">Page</span>
                    <span className="bg-[#D9B95B] text-white px-2 py-1 rounded-md font-bold text-xs">{pagination.currentPage}</span>
                    <span className="text-gray-600 text-xs">of {pagination.totalPages}</span>
                  </div>
                  <button 
                    onClick={() => setPagination(p => ({...p, currentPage: p.currentPage + 1}))}
                    disabled={!pagination.hasNext}
                    className="px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-200 rounded-md hover:from-[#D9B95B] hover:to-[#bca142] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-medium"
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