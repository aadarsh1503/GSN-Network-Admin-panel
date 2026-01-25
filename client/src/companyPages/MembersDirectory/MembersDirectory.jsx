import { useState, useEffect } from 'react';
import { FaTimes, FaMapMarkerAlt, FaGlobe, FaEye, FaStar, FaHeart, FaPhone, FaArrowLeft, FaTh, FaList, FaUsers, FaRocket, FaAtom, FaSearch, FaFilter } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// Company Profile Modal Component - Futuristic Design
const CompanyProfileModal = ({ company, onClose }) => {
  if (!company) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 relative">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#D9B95B] via-transparent to-[#CDA435] animate-pulse"></div>
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#D9B95B]/20 rounded-full blur-3xl animate-bounce"></div>
          <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-[#CDA435]/20 rounded-full blur-3xl animate-pulse"></div>
        </div>

        {/* Header with futuristic gradient */}
        <div className="sticky top-0 bg-gradient-to-r from-[#D9B95B] via-[#E6C76B] to-[#CDA435] text-white p-8 flex justify-between items-center rounded-t-3xl relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
          
          <div className="flex items-center space-x-6 relative z-10">
            <div className="relative">
              {company.logo ? (
                <div className="relative">
                  <img src={company.logo} alt={company.name} className="w-20 h-20 rounded-full object-cover border-4 border-white/30 shadow-2xl" />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent"></div>
                  <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-white/20 to-transparent blur-lg animate-pulse"></div>
                </div>
              ) : (
                <div className="relative">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30 shadow-2xl">
                    <span className="text-3xl font-bold text-white">{company.name?.charAt(0)}</span>
                  </div>
                  <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-white/20 to-transparent blur-lg animate-pulse"></div>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">{company.name}</h2>
              <p className="text-white/90 text-lg font-medium">{company.category}</p>
              <div className="flex items-center mt-2 space-x-2">
                <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                <span className="text-white/70 text-sm">Premium Member</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="relative z-10 p-4 hover:bg-white/20 rounded-full transition-all duration-300 group"
          >
            <FaTimes className="text-2xl group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Content with glassmorphism */}
        <div className="p-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Enhanced Cards */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 transition-all duration-500"></div>
                <h4 className="font-bold text-gray-800 mb-4 flex items-center relative z-10">
                  <div className="p-2 bg-gradient-to-r from-[#D9B95B] to-[#CDA435] rounded-xl mr-3 shadow-lg">
                    <FaMapMarkerAlt className="text-white" />
                  </div>
                  Location Hub
                </h4>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg relative z-10">
                  <div className="flex items-start text-gray-700">
                    <FaMapMarkerAlt className="mr-3 text-[#D9B95B] mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-lg">
                        {[company.city, company.state, company.country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {company.website && (
                <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 group-hover:from-emerald-500/10 group-hover:to-green-500/10 transition-all duration-500"></div>
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center relative z-10">
                    <div className="p-2 bg-gradient-to-r from-[#D9B95B] to-[#CDA435] rounded-xl mr-3 shadow-lg">
                      <FaGlobe className="text-white" />
                    </div>
                    Digital Presence
                  </h4>
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg relative z-10">
                    <a href={company.website} target="_blank" rel="noopener noreferrer" 
                       className="text-blue-600 hover:text-blue-800 font-medium flex items-center group transition-all duration-300">
                      <FaGlobe className="mr-2 text-[#D9B95B] group-hover:rotate-12 transition-transform duration-300" />
                      <span className="group-hover:underline">Visit Website</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Enhanced Content */}
            <div className="lg:col-span-2 space-y-6">
              {company.about_company && (
                <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 group-hover:from-amber-500/10 group-hover:to-orange-500/10 transition-all duration-500"></div>
                  <h4 className="font-bold text-gray-800 mb-4 text-xl flex items-center relative z-10">
                    <div className="p-2 bg-gradient-to-r from-[#D9B95B] to-[#CDA435] rounded-xl mr-3 shadow-lg">
                      <FaAtom className="text-white" />
                    </div>
                    Company Directory
                  </h4>
                  <p className="text-gray-700 leading-relaxed text-lg bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg relative z-10">
                    {company.about_company}
                  </p>
                </div>
              )}

              {company.average_rating > 0 && (
                <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all duration-500"></div>
                  <h4 className="font-bold text-gray-800 mb-4 text-xl flex items-center relative z-10">
                    <div className="p-2 bg-gradient-to-r from-[#D9B95B] to-[#CDA435] rounded-xl mr-3 shadow-lg">
                      <FaStar className="text-white" />
                    </div>
                    Stellar Reviews
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MembersDirectory = () => {
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
  const [wishlistItems, setWishlistItems] = useState([]);

  // Function to format category names
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
    fetchWishlist();
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

  const fetchWishlist = async () => {
    try {
      const data = await api.get('/api/wishlist');
      setWishlistItems(data.map(item => item.company_id) || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setWishlistItems([]);
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

  const handleAddToWishlist = async (companyId) => {
    try {
      const isInWishlist = wishlistItems.includes(companyId);
      
      if (isInWishlist) {
        await api.delete(`/api/wishlist/${companyId}`);
        setWishlistItems(prev => prev.filter(id => id !== companyId));
        toast.success('Removed from wishlist!');
      } else {
        await api.post('/api/wishlist/add', { companyId });
        setWishlistItems(prev => [...prev, companyId]);
        toast.success('Added to wishlist!');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update wishlist');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-[#D9B95B]/5 to-[#CDA435]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-[#CDA435]/5 to-[#D9B95B]/5 rounded-full blur-3xl animate-bounce"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-[#D9B95B]/3 to-[#CDA435]/3 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Futuristic Header */}
      <div className="relative bg-gradient-to-r from-[#D9B95B] via-[#E6C76B] to-[#CDA435] text-white overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button 
                onClick={() => navigate(-1)}
                className="p-3 hover:bg-white/20 rounded-full transition-all duration-300 group backdrop-blur-sm border border-white/20"
              >
                <FaArrowLeft className="text-xl group-hover:-translate-x-1 transition-transform duration-300" />
              </button>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 shadow-2xl">
                    <FaRocket className="text-2xl animate-pulse" />
                  </div>
                  <div className="absolute -inset-2 bg-gradient-to-r from-white/20 to-transparent rounded-2xl blur-lg animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                    Members Directory
                  </h1>
                  <p className="text-white/90 text-lg font-medium mt-1">Explore our stellar network members</p>
                  <div className="flex items-center mt-2 space-x-2">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                    <span className="text-white/70 text-sm">Premium Directory</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Futuristic Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl p-6 mb-6 border border-white/20 relative overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#D9B95B]/5 via-transparent to-[#CDA435]/5 animate-pulse"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
            <div className="relative group">
              <select 
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setPagination(p => ({...p, currentPage: 1})); }}
                className="w-full p-4 bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl focus:border-[#D9B95B] focus:ring-2 focus:ring-[#D9B95B]/20 transition-all duration-300 text-sm font-medium shadow-lg group-hover:shadow-xl"
              >
                <option value="">🏢 All Categories</option>
                {filters.categories?.map((cat, idx) => (
                  <option key={idx} value={cat}>{formatCategoryName(cat)}</option>
                ))}
              </select>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#D9B95B]/10 to-[#CDA435]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
            
            <div className="relative group">
              <select 
                value={selectedCountry}
                onChange={(e) => { setSelectedCountry(e.target.value); setPagination(p => ({...p, currentPage: 1})); }}
                className="w-full p-4 bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl focus:border-[#D9B95B] focus:ring-2 focus:ring-[#D9B95B]/20 transition-all duration-300 text-sm font-medium shadow-lg group-hover:shadow-xl"
              >
                <option value="">🌍 All Countries</option>
                {filters.countries?.map((country, idx) => (
                  <option key={idx} value={country}>{country}</option>
                ))}
              </select>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#D9B95B]/10 to-[#CDA435]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
            
            <div className="relative group">
              <input
                type="text"
                placeholder="🔍 Search..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPagination(p => ({...p, currentPage: 1})); }}
                className="w-full p-4 bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl focus:border-[#D9B95B] focus:ring-2 focus:ring-[#D9B95B]/20 transition-all duration-300 text-sm font-medium shadow-lg group-hover:shadow-xl"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#D9B95B]/10 to-[#CDA435]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
            
            <div className="relative group">
              <select 
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setPagination(p => ({...p, currentPage: 1})); }}
                className="w-full p-4 bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl focus:border-[#D9B95B] focus:ring-2 focus:ring-[#D9B95B]/20 transition-all duration-300 text-sm font-medium shadow-lg group-hover:shadow-xl"
              >
                <option value={8}>📄 8 per page</option>
                <option value={12}>📄 12 per page</option>
                <option value={16}>📄 16 per page</option>
                <option value={24}>📄 24 per page</option>
              </select>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#D9B95B]/10 to-[#CDA435]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>
          
          {/* Futuristic View Toggle */}
          <div className="flex justify-end mt-6 pt-6 border-t border-white/20 relative z-10">
            <div className="flex items-center space-x-2 bg-white/50 backdrop-blur-sm rounded-2xl p-2 border border-white/30 shadow-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                  viewMode === 'grid'
                    ? 'bg-gradient-to-r from-[#D9B95B] to-[#CDA435] text-white shadow-xl transform scale-105'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                <FaTh className="text-sm" />
                <span>Grid</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                  viewMode === 'list'
                    ? 'bg-gradient-to-r from-[#D9B95B] to-[#CDA435] text-white shadow-xl transform scale-105'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                <FaList className="text-sm" />
                <span>List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Futuristic Companies List */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/20 relative overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#D9B95B]/3 via-transparent to-[#CDA435]/3 animate-pulse"></div>
          
          {loading ? (
            <div className="text-center py-16 relative z-10">
              <div className="relative inline-block">
                <div className="w-16 h-16 border-4 border-[#D9B95B]/30 border-t-[#D9B95B] rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-[#CDA435] rounded-full animate-spin animate-reverse"></div>
              </div>
              <p className="mt-4 text-lg font-bold text-gray-700 animate-pulse">Loading stellar companies...</p>
              <div className="flex justify-center mt-2 space-x-1">
                <div className="w-2 h-2 bg-[#D9B95B] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#CDA435] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-[#D9B95B] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-16 relative z-10">
              <div className="text-6xl mb-4 animate-bounce">🚀</div>
              <p className="text-xl text-gray-600 font-bold">No companies found</p>
              <p className="text-gray-500 text-sm mt-2">Try adjusting your search parameters</p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex justify-between items-center relative z-10">
                <div className="text-lg font-bold text-gray-800 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/30">
                  <span className="text-[#D9B95B]">{companies.length}</span> of <span className="text-[#CDA435]">{pagination.totalCompanies}</span> stellar companies
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/30">
                  <div className="w-3 h-3 bg-gradient-to-r from-[#D9B95B] to-[#CDA435] rounded-full animate-pulse"></div>
                  <span className="font-medium">Premium Network</span>
                </div>
              </div>
              
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 relative z-10"
                : "space-y-6 relative z-10"
              }>
                {companies.map((company, index) => (
                  viewMode === 'grid' ? (
                    // Futuristic Grid View
                    <div key={company.id} className="group relative">
                      {/* Animated background glow */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-[#D9B95B] to-[#CDA435] rounded-3xl blur-lg opacity-0 group-hover:opacity-30 transition-all duration-500"></div>
                      
                      <div className="relative bg-white/80 backdrop-blur-xl border border-white/30 rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
                        
                        {/* Wishlist Heart - Floating */}
                        {wishlistItems.includes(company.id) && (
                          <div className="absolute top-4 right-4 z-20">
                            <div className="bg-red-500/90 backdrop-blur-sm rounded-full p-2 shadow-lg animate-pulse">
                              <FaHeart className="text-white text-sm" />
                            </div>
                          </div>
                        )}
                        
                        {/* Company Header - Futuristic */}
                        <div className="relative p-4 bg-gradient-to-br from-gray-50/80 to-gray-100/80 backdrop-blur-sm text-center overflow-hidden">
                          {/* Animated background pattern */}
                          <div className="absolute inset-0 opacity-20">
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#D9B95B]/10 to-[#CDA435]/10 animate-pulse"></div>
                          </div>
                          
                          <div className="relative z-10">
                            {company.logo ? (
                              <div className="relative inline-block">
                                <img 
                                  src={company.logo} 
                                  alt={company.name} 
                                  className="w-12 h-12 rounded-full object-cover mx-auto border-2 border-white/50 shadow-xl group-hover:scale-110 transition-transform duration-500" 
                                />
                                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent"></div>
                                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#D9B95B]/20 to-[#CDA435]/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                              </div>
                            ) : (
                              <div className="relative inline-block">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D9B95B] to-[#CDA435] flex items-center justify-center mx-auto border-2 border-white/50 shadow-xl group-hover:scale-110 transition-transform duration-500">
                                  <span className="text-lg text-white font-bold">{company.name?.charAt(0)}</span>
                                </div>
                                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#D9B95B]/20 to-[#CDA435]/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Company Info - Enhanced */}
                        <div className="p-4 pt-2 relative">
                          <h3 className="font-bold text-sm text-gray-800 group-hover:text-[#D9B95B] transition-colors line-clamp-2 mb-2 min-h-[2rem] text-center">
                            {company.name}
                          </h3>
                          
                          <div className="mb-2 text-center">
                            <span className="bg-gradient-to-r from-[#D9B95B]/20 to-[#CDA435]/20 backdrop-blur-sm text-[#8B7355] px-2 py-1 rounded-full text-xs font-bold inline-block border border-[#D9B95B]/20 max-w-full truncate">
                              {formatCategoryName(company.category)}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-center text-gray-600 text-xs mb-2 bg-white/60 backdrop-blur-sm p-2 rounded-xl border border-white/30">
                            <FaMapMarkerAlt className="mr-1 text-[#D9B95B] flex-shrink-0 text-xs" />
                            <span className="font-bold truncate text-center">{company.city ? `${company.city}, ` : ''}{company.country}</span>
                          </div>
                          
                          {company.average_rating > 0 && (
                            <div className="flex items-center justify-center text-xs mb-2 bg-gradient-to-r from-yellow-50/80 to-orange-50/80 backdrop-blur-sm p-2 rounded-xl border border-yellow-200/30">
                              <div className="flex items-center text-yellow-600">
                                <div className="flex mr-1">
                                  {[...Array(5)].map((_, i) => (
                                    <FaStar key={i} className={`text-xs ${i < Math.floor(company.average_rating) ? 'text-yellow-400' : 'text-gray-300'} hover:scale-110 transition-transform duration-200`} />
                                  ))}
                                </div>
                                <span className="font-bold text-xs">{company.average_rating}</span>
                              </div>
                              <span className="text-gray-500 text-xs ml-1">({company.total_reviews})</span>
                            </div>
                          )}
                          
                          <div className="flex space-x-1">
                            <button 
                              onClick={() => handleViewProfile(company)}
                              className="flex-1 bg-gradient-to-r from-[#D9B95B] to-[#CDA435] text-white py-2 rounded-xl hover:from-[#CDA435] hover:to-[#D9B95B] transition-all duration-500 flex items-center justify-center font-bold text-xs shadow-lg hover:shadow-xl transform hover:scale-105 border border-white/20 backdrop-blur-sm"
                            >
                              <FaEye className="mr-1 text-xs" />
                              Explore
                            </button>
                            <button 
                              onClick={() => handleAddToWishlist(company.id)}
                              className={`p-2 rounded-xl transition-all duration-500 flex items-center justify-center text-xs shadow-lg hover:shadow-xl transform hover:scale-105 border backdrop-blur-sm ${
                                wishlistItems.includes(company.id)
                                  ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-red-300/30'
                                  : 'bg-white/60 text-gray-600 hover:bg-gradient-to-r hover:from-red-100 hover:to-pink-100 hover:text-red-600 border-white/30'
                              }`}
                            >
                              <FaHeart className="text-xs" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Futuristic List View
                    <div key={company.id} className="group relative">
                      {/* Animated background glow */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-[#D9B95B] to-[#CDA435] rounded-3xl blur-lg opacity-0 group-hover:opacity-20 transition-all duration-500"></div>
                      
                      <div className="relative bg-white/80 backdrop-blur-xl border border-white/30 rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
                        
                        {/* Wishlist Heart - Floating */}
                        {wishlistItems.includes(company.id) && (
                          <div className="absolute top-6 right-6 z-20">
                            <div className="bg-red-500/90 backdrop-blur-sm rounded-full p-2 shadow-lg animate-pulse">
                              <FaHeart className="text-white" />
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center p-6 space-x-6">
                          {/* Company Logo - Enhanced */}
                          <div className="flex-shrink-0 relative">
                            {company.logo ? (
                              <div className="relative">
                                <img 
                                  src={company.logo} 
                                  alt={company.name} 
                                  className="w-20 h-20 rounded-full object-cover border-4 border-white/50 shadow-2xl group-hover:scale-110 transition-transform duration-500" 
                                />
                                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent"></div>
                                <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-[#D9B95B]/20 to-[#CDA435]/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                              </div>
                            ) : (
                              <div className="relative">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D9B95B] to-[#CDA435] flex items-center justify-center border-4 border-white/50 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                                  <span className="text-2xl text-white font-bold">{company.name?.charAt(0)}</span>
                                </div>
                                <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-[#D9B95B]/20 to-[#CDA435]/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                              </div>
                            )}
                          </div>
                          
                          {/* Company Info - Enhanced */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-bold text-xl text-gray-800 group-hover:text-[#D9B95B] transition-colors truncate">
                                  {company.name}
                                </h3>
                                <div className="flex items-center space-x-4 mt-2">
                                  <span className="bg-gradient-to-r from-[#D9B95B]/20 to-[#CDA435]/20 backdrop-blur-sm text-[#8B7355] px-4 py-2 rounded-full text-sm font-bold border border-[#D9B95B]/20">
                                    {formatCategoryName(company.category)}
                                  </span>
                                  <div className="flex items-center text-gray-600 text-sm bg-white/60 backdrop-blur-sm px-3 py-2 rounded-full border border-white/30">
                                    <FaMapMarkerAlt className="mr-2 text-[#D9B95B] flex-shrink-0" />
                                    <span className="font-bold">{company.city ? `${company.city}, ` : ''}{company.country}</span>
                                  </div>
                                </div>
                                {company.average_rating > 0 && (
                                  <div className="flex items-center mt-3">
                                    <div className="flex items-center text-yellow-600 mr-4 bg-gradient-to-r from-yellow-50/80 to-orange-50/80 backdrop-blur-sm px-3 py-2 rounded-full border border-yellow-200/30">
                                      <div className="flex mr-2">
                                        {[...Array(5)].map((_, i) => (
                                          <FaStar key={i} className={`text-sm ${i < Math.floor(company.average_rating) ? 'text-yellow-400' : 'text-gray-300'} hover:scale-110 transition-transform duration-200`} />
                                        ))}
                                      </div>
                                      <span className="font-bold text-sm ml-1">{company.average_rating}</span>
                                    </div>
                                    <span className="text-gray-500 text-sm">({company.total_reviews} stellar reviews)</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Action Buttons - Enhanced */}
                              <div className="flex-shrink-0 ml-6 flex space-x-3">
                                <button 
                                  onClick={() => handleAddToWishlist(company.id)}
                                  className={`p-3 rounded-2xl transition-all duration-500 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-110 border backdrop-blur-sm ${
                                    wishlistItems.includes(company.id)
                                      ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-red-300/30'
                                      : 'bg-white/60 text-gray-600 hover:bg-gradient-to-r hover:from-red-100 hover:to-pink-100 hover:text-red-600 border-white/30'
                                  }`}
                                >
                                  <FaHeart />
                                </button>
                                <button 
                                  onClick={() => handleViewProfile(company)}
                                  className="bg-gradient-to-r from-[#D9B95B] to-[#CDA435] text-white px-8 py-3 rounded-2xl hover:from-[#CDA435] hover:to-[#D9B95B] transition-all duration-500 flex items-center font-bold text-sm shadow-xl hover:shadow-2xl transform hover:scale-105 border border-white/20 backdrop-blur-sm"
                                >
                                  <FaEye className="mr-2" />
                                  Explore Profile
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>

              {/* Futuristic Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-8 pt-6 border-t border-white/20 relative z-10">
                  <button 
                    onClick={() => setPagination(p => ({...p, currentPage: p.currentPage - 1}))}
                    disabled={!pagination.hasPrev}
                    className="px-6 py-3 bg-white/60 backdrop-blur-sm border border-white/30 rounded-2xl hover:bg-gradient-to-r hover:from-[#D9B95B] hover:to-[#CDA435] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    ← Previous
                  </button>
                  <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-3 rounded-2xl border border-white/30 shadow-lg">
                    <span className="text-gray-600 text-sm font-medium">Page</span>
                    <span className="bg-gradient-to-r from-[#D9B95B] to-[#CDA435] text-white px-3 py-1 rounded-xl font-bold text-sm shadow-lg">{pagination.currentPage}</span>
                    <span className="text-gray-600 text-sm font-medium">of {pagination.totalPages}</span>
                  </div>
                  <button 
                    onClick={() => setPagination(p => ({...p, currentPage: p.currentPage + 1}))}
                    disabled={!pagination.hasNext}
                    className="px-6 py-3 bg-white/60 backdrop-blur-sm border border-white/30 rounded-2xl hover:bg-gradient-to-r hover:from-[#D9B95B] hover:to-[#CDA435] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Futuristic Sidebar Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#D9B95B] to-[#CDA435] rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
            <a 
              href="/company/quote" 
              className="relative block bg-gradient-to-r from-[#D9B95B] to-[#CDA435] text-white font-bold py-6 px-8 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 text-center transform hover:scale-105 border border-white/20 backdrop-blur-sm"
            >
              <div className="flex items-center justify-center space-x-3">
                <FaRocket className="text-xl animate-pulse" />
                <span className="text-lg">Launch Quote Request</span>
              </div>
            </a>
          </div>
          
          <div className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-3xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#D9B95B]/5 to-[#CDA435]/5 group-hover:from-[#D9B95B]/10 group-hover:to-[#CDA435]/10 transition-all duration-500"></div>
            <div className="flex items-center justify-center space-x-3 relative z-10">
              <div className="p-2 bg-gradient-to-r from-[#D9B95B] to-[#CDA435] rounded-xl">
                <FaPhone className="text-white" />
              </div>
              <div>
                <span className="font-bold text-gray-800 text-lg">+973 17491222</span>
                {/* <p className="text-sm text-gray-600 mt-1">Stellar Support Line</p> */}
              </div>
            </div>
          </div>
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

export default MembersDirectory;
