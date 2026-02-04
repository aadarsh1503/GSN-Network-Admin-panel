import { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaEye, FaStar, FaHeart, FaPhone, FaArrowLeft, FaTh, FaList, FaRocket } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const MembersDirectory = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ categories: [], countries: [] });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
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

  const handleViewProfile = (company) => {
    // Navigate to the member profile page
    navigate(`/company/member-profile/${company.id}`);
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
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Header */}
      <div className="relative bg-[#bca142] text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
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
                    <FaRocket className="text-2xl" />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white">
                    Members Directory
                  </h1>
                  <p className="text-white/90 text-lg font-medium mt-1">Explore our network members</p>
                  <div className="flex items-center mt-2 space-x-2">
                    <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                    <span className="text-white/70 text-sm">Premium Directory</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl p-4 mb-4 border border-gray-200 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1">
              <div className="relative group">
                <select 
                  value={selectedCategory}
                  onChange={(e) => { setSelectedCategory(e.target.value); setPagination(p => ({...p, currentPage: 1})); }}
                  className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:border-[#bca142] focus:ring-2 focus:ring-[#bca142]/20 transition-all duration-300 text-sm font-medium shadow-lg group-hover:shadow-xl"
                >
                  <option value="">🏢 All Categories</option>
                  {filters.categories?.map((cat, idx) => (
                    <option key={idx} value={cat}>{formatCategoryName(cat)}</option>
                  ))}
                </select>
              </div>
              
              <div className="relative group">
                <select 
                  value={selectedCountry}
                  onChange={(e) => { setSelectedCountry(e.target.value); setPagination(p => ({...p, currentPage: 1})); }}
                  className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:border-[#bca142] focus:ring-2 focus:ring-[#bca142]/20 transition-all duration-300 text-sm font-medium shadow-lg group-hover:shadow-xl"
                >
                  <option value="">🌍 All Countries</option>
                  {filters.countries?.map((country, idx) => (
                    <option key={idx} value={country}>{country}</option>
                  ))}
                </select>
              </div>
              
              <div className="relative group">
                <input
                  type="text"
                  placeholder="🔍 Search..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPagination(p => ({...p, currentPage: 1})); }}
                  className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:border-[#bca142] focus:ring-2 focus:ring-[#bca142]/20 transition-all duration-300 text-sm font-medium shadow-lg group-hover:shadow-xl"
                />
              </div>
              
              <div className="relative group">
                <select 
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setPagination(p => ({...p, currentPage: 1})); }}
                  className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:border-[#bca142] focus:ring-2 focus:ring-[#bca142]/20 transition-all duration-300 text-sm font-medium shadow-lg group-hover:shadow-xl"
                >
                  <option value={10}>📄 10 per page</option>
                  <option value={20}>📄 20 per page</option>
                  <option value={30}>📄 30 per page</option>
                  <option value={40}>📄 40 per page</option>
                </select>
              </div>
            </div>
            
            {/* View Toggle - Inline */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-xl p-1 border border-gray-300 shadow-lg flex-shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                  viewMode === 'grid'
                    ? 'bg-[#bca142] text-white shadow-lg transform scale-105'
                    : 'text-black hover:text-gray-800 hover:bg-white'
                }`}
              >
                <FaTh className="text-sm" />
                <span>Grid</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                  viewMode === 'list'
                    ? 'bg-[#bca142] text-white shadow-lg transform scale-105'
                    : 'text-black hover:text-gray-800 hover:bg-white'
                }`}
              >
                <FaList className="text-sm" />
                <span>List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Companies List */}
        <div className="bg-white rounded-3xl shadow-2xl p-4 border border-gray-200 relative overflow-hidden">
          {loading ? (
            <div className="text-center py-16 relative z-10">
              <div className="relative inline-block">
                <div className="w-16 h-16 border-4 border-gray-300 border-t-[#bca142] rounded-full animate-spin"></div>
              </div>
              <p className="mt-4 text-lg font-bold text-black">Loading  companies...</p>
              <div className="flex justify-center mt-2 space-x-1">
                <div className="w-2 h-2 bg-[#bca142] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#bca142] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-[#bca142] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-16 relative z-10">
              <div className="text-6xl mb-4">🚀</div>
              <p className="text-xl text-black font-bold">No companies found</p>
              <p className="text-gray-500 text-sm mt-2">Try adjusting your search parameters</p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex justify-between items-center relative z-10">
                <div className="text-lg font-bold text-black bg-gray-100 px-4 py-2 rounded-2xl border border-gray-300">
                  <span className="text-[#bca142]">{companies.length}</span> of <span className="text-[#bca142]">{pagination.totalCompanies}</span> companies
                </div>
                <div className="flex items-center space-x-3 text-sm text-black bg-gray-100 px-4 py-2 rounded-2xl border border-gray-300">
                  <div className="w-3 h-3 bg-[#bca142] rounded-full"></div>
                  <span className="font-medium">Premium Network</span>
                </div>
              </div>
              
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 relative z-10"
                : "space-y-4 relative z-10"
              }>
                {companies.map((company, index) => (
                  viewMode === 'grid' ? (
                    // Futuristic Grid View
                    <div key={company.id} className="group relative">
                      <div className="relative bg-white border border-gray-200 rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
                        
                        {/* Wishlist Heart - Floating */}
                        {wishlistItems.includes(company.id) && (
                          <div className="absolute top-4 right-4 z-20">
                            <div className="bg-[#bca142] rounded-full p-2 shadow-lg">
                              <FaHeart className="text-white text-sm" />
                            </div>
                          </div>
                        )}
                        
                        {/* Company Header */}
                        <div className="relative p-3 bg-gray-50 text-center overflow-hidden">
                          <div className="relative z-10">
                            {company.logo ? (
                              <div className="relative inline-block">
                                <img 
                                  src={company.logo} 
                                  alt={company.name} 
                                  className="w-12 h-12 rounded-full object-cover mx-auto border-2 border-white shadow-xl group-hover:scale-110 transition-transform duration-500" 
                                />
                              </div>
                            ) : (
                              <div className="relative inline-block">
                                <div className="w-12 h-12 rounded-full bg-[#bca142] flex items-center justify-center mx-auto border-2 border-white shadow-xl group-hover:scale-110 transition-transform duration-500">
                                  <span className="text-lg text-white font-bold">{company.name?.charAt(0)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Company Info */}
                        <div className="p-3 pt-2 relative">
                          <h3 className="font-bold text-sm text-black group-hover:text-[#bca142] transition-colors line-clamp-2 mb-2 min-h-[2rem] text-center">
                            {company.name}
                          </h3>
                          
                          <div className="mb-2 text-center">
                            <span className="bg-[#bca142] text-white px-2 py-1 rounded-full text-xs font-bold inline-block border border-gray-200 max-w-full truncate">
                              {formatCategoryName(company.category)}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-center text-gray-600 text-xs mb-2 bg-gray-100 p-2 rounded-xl border border-gray-200">
                            <FaMapMarkerAlt className="mr-1 text-[#bca142] flex-shrink-0 text-xs" />
                            <span className="font-bold truncate text-center">{company.city ? `${company.city}, ` : ''}{company.country}</span>
                          </div>
                          
                          {company.average_rating > 0 && (
                            <div className="flex items-center justify-center text-xs mb-2 bg-gray-100 p-2 rounded-xl border border-gray-200">
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
                              className="flex-1 bg-[#bca142] text-white py-2 rounded-xl hover:bg-black transition-all duration-500 flex items-center justify-center font-bold text-xs shadow-lg hover:shadow-xl transform hover:scale-105 border border-gray-200"
                            >
                              <FaEye className="mr-1 text-xs" />
                              Explore
                            </button>
                            <button 
                              onClick={() => handleAddToWishlist(company.id)}
                              className={`p-2 rounded-xl transition-all duration-500 flex items-center justify-center text-xs shadow-lg hover:shadow-xl transform hover:scale-105 border ${
                                wishlistItems.includes(company.id)
                                  ? 'bg-[#bca142] text-white border-gray-200'
                                  : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-[#bca142] border-gray-200'
                              }`}
                            >
                              <FaHeart className="text-xs" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // List View
                    <div key={company.id} className="group relative">
                      <div className="relative bg-white border border-gray-200 rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
                        
                        {/* Wishlist Heart - Floating */}
                        {wishlistItems.includes(company.id) && (
                          <div className="absolute top-6 right-6 z-20">
                            <div className="bg-[#bca142] rounded-full p-2 shadow-lg">
                              <FaHeart className="text-white" />
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center p-4 space-x-6">
                          {/* Company Logo */}
                          <div className="flex-shrink-0 relative">
                            {company.logo ? (
                              <div className="relative">
                                <img 
                                  src={company.logo} 
                                  alt={company.name} 
                                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-2xl group-hover:scale-110 transition-transform duration-500" 
                                />
                              </div>
                            ) : (
                              <div className="relative">
                                <div className="w-20 h-20 rounded-full bg-[#bca142] flex items-center justify-center border-4 border-white shadow-2xl group-hover:scale-110 transition-transform duration-500">
                                  <span className="text-2xl text-white font-bold">{company.name?.charAt(0)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Company Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-bold text-xl text-black group-hover:text-[#bca142] transition-colors truncate">
                                  {company.name}
                                </h3>
                                <div className="flex items-center space-x-4 mt-2">
                                  <span className="bg-[#bca142] text-white px-4 py-2 rounded-full text-sm font-bold">
                                    {formatCategoryName(company.category)}
                                  </span>
                                  <div className="flex items-center text-gray-600 text-sm bg-gray-100 px-3 py-2 rounded-full border border-gray-200">
                                    <FaMapMarkerAlt className="mr-2 text-[#bca142] flex-shrink-0" />
                                    <span className="font-bold">{company.city ? `${company.city}, ` : ''}{company.country}</span>
                                  </div>
                                </div>
                                {company.average_rating > 0 && (
                                  <div className="flex items-center mt-3">
                                    <div className="flex items-center text-yellow-600 mr-4 bg-gray-100 px-3 py-2 rounded-full border border-gray-200">
                                      <div className="flex mr-2">
                                        {[...Array(5)].map((_, i) => (
                                          <FaStar key={i} className={`text-sm ${i < Math.floor(company.average_rating) ? 'text-yellow-400' : 'text-gray-300'} hover:scale-110 transition-transform duration-200`} />
                                        ))}
                                      </div>
                                      <span className="font-bold text-sm ml-1">{company.average_rating}</span>
                                    </div>
                                    <span className="text-gray-500 text-sm">({company.total_reviews} reviews)</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex-shrink-0 ml-6 flex space-x-3">
                                <button 
                                  onClick={() => handleAddToWishlist(company.id)}
                                  className={`p-3 rounded-2xl transition-all duration-500 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-110 border ${
                                    wishlistItems.includes(company.id)
                                      ? 'bg-[#bca142] text-white border-gray-200'
                                      : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-[#bca142] border-gray-200'
                                  }`}
                                >
                                  <FaHeart />
                                </button>
                                <button 
                                  onClick={() => handleViewProfile(company)}
                                  className="bg-[#bca142] text-white px-8 py-3 rounded-2xl hover:bg-black transition-all duration-500 flex items-center font-bold text-sm shadow-xl hover:shadow-2xl transform hover:scale-105 border border-gray-200"
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

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-6 pt-4 border-t border-gray-200 relative z-10">
                  <button 
                    onClick={() => setPagination(p => ({...p, currentPage: p.currentPage - 1}))}
                    disabled={!pagination.hasPrev}
                    className="px-6 py-3 bg-white border border-gray-300 rounded-2xl hover:bg-[#bca142] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    ← Previous
                  </button>
                  <div className="flex items-center space-x-2 bg-gray-100 px-4 py-3 rounded-2xl border border-gray-300 shadow-lg">
                    <span className="text-black text-sm font-medium">Page</span>
                    <span className="bg-[#bca142] text-white px-3 py-1 rounded-xl font-bold text-sm shadow-lg">{pagination.currentPage}</span>
                    <span className="text-black text-sm font-medium">of {pagination.totalPages}</span>
                  </div>
                  <button 
                    onClick={() => setPagination(p => ({...p, currentPage: p.currentPage + 1}))}
                    disabled={!pagination.hasNext}
                    className="px-6 py-3 bg-white border border-gray-300 rounded-2xl hover:bg-[#bca142] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          <div className="group relative">
            <a 
              href="/company/quote" 
              className="relative block bg-[#bca142] text-white font-bold py-4 px-6 rounded-3xl shadow-2xl hover:shadow-3xl hover:bg-black transition-all duration-500 text-center transform hover:scale-105 border border-gray-200"
            >
              <div className="flex items-center justify-center space-x-3">
                <FaRocket className="text-xl" />
                <span className="text-lg">Launch Quote Request</span>
              </div>
            </a>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-3xl p-4 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 relative overflow-hidden group">
            <div className="flex items-center justify-center space-x-3 relative z-10">
              <div className="p-2 bg-[#bca142] rounded-xl">
                <FaPhone className="text-white" />
              </div>
              <div>
                <span className="font-bold text-black text-lg">+973 17491222</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembersDirectory;
