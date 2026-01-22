import { useState, useEffect } from 'react';
import { FaTimes, FaMapMarkerAlt, FaGlobe, FaEye, FaBuilding, FaIndustry, FaCog, FaBoxes, FaCalendarAlt, FaUsers, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// Business Profile Modal Component
const BusinessProfileModal = ({ business, onClose }) => {
  if (!business) return null;

  // Function to format category names (replace underscores with spaces and capitalize)
  const formatCategoryName = (category) => {
    if (!category) return '';
    return category
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getCategoryIcon = (category) => {
    const categoryIcons = {
      'Aerospace and Defense': <FaIndustry className="text-[#D9B95B]" />,
      'Agriculture and Farming': <FaBoxes className="text-[#D9B95B]" />,
      'Automotive Industry': <FaCog className="text-[#D9B95B]" />,
      'Biotechnology': <FaIndustry className="text-[#D9B95B]" />,
      'Chemical Industry': <FaIndustry className="text-[#D9B95B]" />,
      'Clothing and Apparel': <FaBoxes className="text-[#D9B95B]" />,
      'Construction and Building Materials': <FaBuilding className="text-[#D9B95B]" />,
      'Distributors': <FaBoxes className="text-[#D9B95B]" />,
      'Education Sector': <FaUsers className="text-[#D9B95B]" />,
      'Energy and Utilities': <FaIndustry className="text-[#D9B95B]" />,
      'Financial Services and Banking': <FaBuilding className="text-[#D9B95B]" />,
      'Food and Beverage Industry': <FaBoxes className="text-[#D9B95B]" />,
      'Government and Public Sector': <FaBuilding className="text-[#D9B95B]" />,
      'Healthcare and Pharmaceuticals': <FaIndustry className="text-[#D9B95B]" />,
      'Hospitality and Tourism': <FaCalendarAlt className="text-[#D9B95B]" />,
      'Insurance Industry': <FaBuilding className="text-[#D9B95B]" />,
      'Manufacturers': <FaIndustry className="text-[#D9B95B]" />,
      'Media and Entertainment': <FaCalendarAlt className="text-[#D9B95B]" />,
      'Mining and Metals': <FaIndustry className="text-[#D9B95B]" />,
      'Non-Profit Organizations': <FaUsers className="text-[#D9B95B]" />,
      'Professional Services (Legal, Consulting)': <FaBuilding className="text-[#D9B95B]" />,
      'Real Estate': <FaBuilding className="text-[#D9B95B]" />,
      'Retailer': <FaBoxes className="text-[#D9B95B]" />,
      'Technology Companies': <FaCog className="text-[#D9B95B]" />,
      'Telecommunications': <FaCog className="text-[#D9B95B]" />
    };
    return categoryIcons[category] || <FaCog className="text-[#D9B95B]" />;
  };

  return (
    <div className="fixed inset-0  bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header with gradient */}
        <div className="sticky top-0 bg-gradient-to-r from-[#D9B95B] to-[#CDA435] text-white p-6 flex justify-between items-center rounded-t-2xl">
          <div className="flex items-center space-x-4">
            {business.logo ? (
              <img src={business.logo} alt={business.name} className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg" />
            ) : (
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                <span className="text-2xl font-bold text-[#D9B95B]">{business.name?.charAt(0)}</span>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold">{business.name}</h2>
              <p className="text-white/90">{formatCategoryName(business.category)}</p>
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
                  Business Location
                </h4>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-start text-gray-700">
                    <FaMapMarkerAlt className="mr-3 text-[#D9B95B] mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-lg">
                        {[business.city, business.state, business.country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Website Link Card */}
              {business.website && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 shadow-lg border border-green-200">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                    <FaGlobe className="mr-2 text-[#D9B95B]" />
                    Visit Website
                  </h4>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <a href={business.website} target="_blank" rel="noopener noreferrer" 
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
              {/* About Business */}
              {business.about_company && (
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 shadow-lg border border-yellow-200">
                  <h4 className="font-bold text-gray-800 mb-4 text-xl">About Business</h4>
                  <p className="text-gray-700 leading-relaxed text-lg bg-white p-4 rounded-lg shadow-sm">
                    {business.about_company}
                  </p>
                </div>
              )}

              {/* Business Categories */}
              {business.category && business.category.length > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 shadow-lg border border-green-200">
                  <h4 className="font-bold mb-6 text-xl flex items-center">
                    <FaCog className="mr-2 text-[#D9B95B]" />
                    Business Categories
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(Array.isArray(business.category) ? business.category : business.category.split(',')).map((category, index) => (
                      <div 
                        key={index}
                        className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-[#D9B95B] group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-br from-[#D9B95B] to-[#CDA435] rounded-lg group-hover:scale-110 transition-transform">
                            {getCategoryIcon(category.trim())}
                          </div>
                          <span className="font-semibold text-gray-800 group-hover:text-[#D9B95B] transition-colors">
                            {category.trim()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Business Type Badge */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 shadow-lg border border-purple-200">
                <h4 className="font-bold text-gray-800 mb-4 text-xl">Business Type</h4>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-center justify-center">
                    <div className="bg-gradient-to-r from-[#D9B95B] to-[#CDA435] text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg">
                      <FaUsers className="inline mr-2" />
                      Bulk Quote Requester
                    </div>
                  </div>
                  <p className="text-center text-gray-600 mt-3 text-sm">
                    This business specializes in requesting quotes for bulk amounts
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BusinessDirectoryPage = () => {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [filters, setFilters] = useState({ categories: [], countries: [] });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalBusinesses: 0 });

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
    fetchBusinesses();
  }, []);

  useEffect(() => {
    fetchBusinesses();
  }, [selectedCategory, selectedCountry, searchTerm, itemsPerPage, pagination.currentPage]);

  const fetchFilters = async () => {
    try {
      const data = await api.get('/api/business-directory/filters');
      setFilters(data || { categories: [], countries: [] });
    } catch (error) {
      console.error('Error fetching filters:', error);
      setFilters({ categories: [], countries: [] });
    }
  };

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedCountry) params.append('country', selectedCountry);
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', pagination.currentPage);
      params.append('limit', itemsPerPage);

      const data = await api.get(`/api/business-directory/businesses?${params.toString()}`);
      setBusinesses(data.businesses || []);
      setPagination(data.pagination || { currentPage: 1, totalPages: 1, totalBusinesses: 0 });
    } catch (error) {
      console.error('Error fetching businesses:', error);
      toast.error('Failed to load businesses');
      setBusinesses([]);
      setPagination({ currentPage: 1, totalPages: 1, totalBusinesses: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = async (business) => {
    try {
      const data = await api.get(`/api/business-directory/business/${business.id}`);
      setSelectedBusiness(data.business);
    } catch (error) {
      toast.error('Error loading business profile');
    }
  };

  return (
    <div className="min-h-screen mt-24 bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header - More compact */}
      <div className="bg-gradient-to-r from-[#D9B95B] to-[#CDA435] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <FaArrowLeft className="text-lg" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-full">
                  <FaUsers className="text-xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Business Directory</h1>
                  <p className="text-white/90 text-sm">Discover businesses requesting bulk quotes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters - More compact */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select 
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPagination(p => ({...p, currentPage: 1})); }}
              className="w-full p-3 border border-gray-200 rounded-lg focus:border-[#D9B95B] focus:ring-1 focus:ring-[#D9B95B]/20 transition-all text-sm"
            >
              <option value="">🏢 All Categories</option>
              {filters.categories?.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
            <select 
              value={selectedCountry}
              onChange={(e) => { setSelectedCountry(e.target.value); setPagination(p => ({...p, currentPage: 1})); }}
              className="w-full p-3 border border-gray-200 rounded-lg focus:border-[#D9B95B] focus:ring-1 focus:ring-[#D9B95B]/20 transition-all text-sm"
            >
              <option value="">🌍 All Countries</option>
              {filters.countries?.map((country, idx) => (
                <option key={idx} value={country}>{country}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="🔍 Search businesses..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPagination(p => ({...p, currentPage: 1})); }}
              className="w-full p-3 border border-gray-200 rounded-lg focus:border-[#D9B95B] focus:ring-1 focus:ring-[#D9B95B]/20 transition-all text-sm"
            />
            <select 
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setPagination(p => ({...p, currentPage: 1})); }}
              className="w-full p-3 border border-gray-200 rounded-lg focus:border-[#D9B95B] focus:ring-1 focus:ring-[#D9B95B]/20 transition-all text-sm"
            >
              <option value={5}>📄 5 per page</option>
              <option value={10}>📄 10 per page</option>
              <option value={12}>📄 12 per page</option>
              <option value={20}>📄 20 per page</option>
              <option value={30}>📄 30 per page</option>
            </select>
          </div>
        </div>

        {/* Businesses List - More compact */}
        <div className="bg-white rounded-xl shadow-md p-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#D9B95B] border-t-transparent"></div>
              <p className="mt-3 text-base font-medium text-gray-600">Loading businesses...</p>
            </div>
          ) : businesses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🏢</div>
              <p className="text-lg text-gray-500 font-medium">No businesses found</p>
              <p className="text-gray-400 text-sm">Try adjusting your search criteria</p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex justify-between items-center">
                <div className="text-base font-semibold text-gray-700">
                  <span className="text-[#D9B95B]">{businesses.length}</span> of <span className="text-[#D9B95B]">{pagination.totalBusinesses}</span> businesses
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <div className="w-2 h-2 bg-[#D9B95B] rounded-full"></div>
                  <span>Bulk Quote Requesters</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {businesses.map(business => (
                  <div key={business.id} className="group bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden hover:shadow-lg hover:border-[#D9B95B] transition-all duration-300 transform hover:-translate-y-1">
                    
                    {/* Business Header - Reduced height */}
                    <div className="relative h-24 bg-gradient-to-br from-[#D9B95B] to-[#CDA435] overflow-hidden">
                      {business.logo ? (
                        <img src={business.logo} alt={business.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl text-white font-bold drop-shadow-lg">{business.name?.charAt(0)}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                    </div>
                    
                    {/* Business Info - Reduced padding */}
                    <div className="p-3">
                      <h3 className="font-bold text-sm text-gray-800 group-hover:text-[#D9B95B] transition-colors line-clamp-2 mb-2 min-h-[2.5rem]">
                        {business.name}
                      </h3>
                      
                      <div className="mb-2">
                        <span className="bg-gradient-to-r from-[#D9B95B]/20 to-[#CDA435]/20 text-[#8B7355] px-2 py-1 rounded-full text-xs font-semibold line-clamp-1">
                          {formatCategoryName(Array.isArray(business.category) ? business.category[0] : business.category?.split(',')[0])}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-gray-600 text-xs mb-2 bg-gray-50 p-2 rounded-md">
                        <FaMapMarkerAlt className="mr-1 text-[#D9B95B] flex-shrink-0 text-xs" />
                        <span className="font-medium truncate">{business.city ? `${business.city}, ` : ''}{business.country}</span>
                      </div>
                      
                      <div className="flex items-center justify-center text-xs mb-3 bg-blue-50 p-2 rounded-md">
                        <FaUsers className="mr-1 text-[#D9B95B] text-xs" />
                        <span className="text-blue-600 font-medium">Bulk Requester</span>
                      </div>
                      
                      <button 
                        onClick={() => handleViewProfile(business)}
                        className="w-full bg-gradient-to-r from-[#D9B95B] to-[#CDA435] text-white py-2 rounded-lg hover:from-[#CDA435] hover:to-[#D9B95B] transition-all duration-300 flex items-center justify-center font-bold text-xs shadow-md hover:shadow-lg transform hover:scale-105"
                      >
                        <FaEye className="mr-1 text-xs" />
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination - More compact */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-3 mt-6 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => setPagination(p => ({...p, currentPage: p.currentPage - 1}))}
                    disabled={!pagination.hasPrev}
                    className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg hover:from-[#D9B95B] hover:to-[#CDA435] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
                  >
                    ← Previous
                  </button>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 text-sm">Page</span>
                    <span className="bg-[#D9B95B] text-white px-2 py-1 rounded-md font-bold text-sm">{pagination.currentPage}</span>
                    <span className="text-gray-600 text-sm">of {pagination.totalPages}</span>
                  </div>
                  <button 
                    onClick={() => setPagination(p => ({...p, currentPage: p.currentPage + 1}))}
                    disabled={!pagination.hasNext}
                    className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg hover:from-[#D9B95B] hover:to-[#CDA435] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Business Profile Modal */}
      {selectedBusiness && (
        <BusinessProfileModal 
          business={selectedBusiness} 
          onClose={() => setSelectedBusiness(null)} 
        />
      )}
    </div>
  );
};

export default BusinessDirectoryPage;