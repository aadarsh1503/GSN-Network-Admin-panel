import { useState, useEffect } from 'react';
import { FiMapPin, FiEye, FiPhone, FiGrid, FiList, FiChevronLeft, FiChevronRight, FiStar, FiHeart } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import CompanyProfile from './CompanyProfile';

const MemberCard = ({ member, onViewProfile, onAddToWishlist, isLoading, loadingId, formatCategory, isInWishlist }) => (
  <div className="group relative bg-gradient-to-br from-white via-yellow-50 to-amber-50 rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:scale-105 cursor-pointer border border-yellow-200/50 backdrop-blur-sm">
    {/* Wishlist Heart Indicator */}
    {isInWishlist && (
      <div className="absolute top-4 right-4 z-30">
        <div className="bg-gradient-to-r from-pink-500 to-red-500 text-white p-2 rounded-full shadow-lg animate-pulse">
          <FiHeart className="w-4 h-4 fill-current" />
        </div>
      </div>
    )}
    
    {/* Futuristic Background Pattern */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#CDA435]/5 via-transparent to-[#8B7355]/5 opacity-60"></div>
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#CDA435] to-[#8B7355]"></div>
    
    {/* Main Content */}
    <div className="relative p-8 flex flex-col items-center text-center z-10 group-hover:blur-sm transition-all duration-300">
      {/* Circular Image with Futuristic Ring */}
      <div className="relative w-28 h-28 mb-6">
        {/* Outer Ring Animation */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#CDA435] to-[#8B7355] p-1 group-hover:animate-pulse">
          <div className="w-full h-full rounded-full bg-white p-1">
            {member.logo ? (
              <img 
                src={member.logo} 
                alt={member.name} 
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#CDA435] to-[#8B7355] flex items-center justify-center">
                <span className="text-3xl text-white font-bold">{member.name?.charAt(0)}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Rating Badge */}
        {member.average_rating > 0 && (
          <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg flex items-center border-2 border-white">
            <FiStar className="w-3 h-3 mr-1 fill-current" />
            {member.average_rating}
          </div>
        )}
      </div>
      
      {/* Company Name with Gradient */}
      <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3 truncate w-full">{member.name}</h3>
      
      {/* Location with Icon */}
      <div className="flex items-center text-gray-600 text-sm mb-3 bg-yellow-100/50 px-4 py-2 rounded-full">
        <FiMapPin className="w-4 h-4 mr-2 text-[#CDA435]" />
        <span className="truncate">{member.city ? `${member.city}, ` : ''}{member.country}</span>
      </div>
      
      {/* Category */}
      <p className="text-sm text-gray-500 truncate w-full bg-gray-100/50 px-3 py-1 rounded-full">{formatCategory(member.category)}</p>
    </div>

    {/* Futuristic Hover Overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/90 via-amber-50/90 to-orange-100/90 backdrop-blur-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-20 rounded-3xl">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#CDA435]/10 via-transparent to-[#8B7355]/10 animate-pulse"></div>
      <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-[#CDA435]/20 to-[#8B7355]/20 rounded-full blur-xl"></div>
      <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-yellow-400/20 to-amber-400/20 rounded-full blur-lg"></div>
      
      <div className="relative z-10 flex flex-col space-y-4">
        {/* View Profile Button - Icon Only with Tooltip */}
        <div className="relative group/tooltip">
          <button 
            onClick={() => onViewProfile(member)}
            disabled={isLoading && loadingId === member.id}
            className="bg-gradient-to-r from-[#CDA435] to-[#8B7355] text-white p-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed w-16 h-16 border-2 border-white/20 backdrop-blur-sm cursor-pointer"
          >
            {isLoading && loadingId === member.id ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FiEye className="w-6 h-6" />
            )}
          </button>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-30">
            View Profile
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
          </div>
        </div>
        
        {/* Wishlist Button - Icon Only with Tooltip */}
        <div className="relative group/tooltip">
          <button 
            onClick={() => onAddToWishlist(member.id)}
            className={`p-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center w-16 h-16 border-2 border-white/20 backdrop-blur-sm cursor-pointer ${
              isInWishlist 
                ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white' 
                : 'bg-gradient-to-r from-pink-400 to-rose-400 text-white'
            }`}
          >
            <FiHeart className={`w-6 h-6 ${isInWishlist ? 'fill-current' : ''}`} />
          </button>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-30">
            {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
          </div>
        </div>
      </div>
    </div>

    {/* Futuristic Corner Accents */}
    <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-[#CDA435] to-transparent opacity-30 rounded-bl-3xl"></div>
    <div className="absolute bottom-0 left-0 w-8 h-8 bg-gradient-to-tr from-[#8B7355] to-transparent opacity-30 rounded-tr-3xl"></div>
  </div>
);

const HelpCard = () => (
  <div className="bg-gradient-to-br from-white/80 via-yellow-50/80 to-amber-50/80 backdrop-blur-lg p-8 rounded-3xl shadow-2xl text-center relative overflow-hidden border border-yellow-200/30">
    {/* Futuristic Background Elements */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#CDA435]/10 via-transparent to-[#8B7355]/10"></div>
    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#CDA435] to-[#8B7355]"></div>
    <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br from-yellow-300/30 to-amber-300/30 rounded-full blur-xl"></div>
    <div className="absolute -bottom-10 -left-10 w-16 h-16 bg-gradient-to-tr from-[#CDA435]/30 to-[#8B7355]/30 rounded-full blur-lg"></div>
    
    <div className="relative z-10">
      <h4 className="text-2xl font-bold bg-gradient-to-r from-[#CDA435] to-[#8B7355] bg-clip-text text-transparent mb-3">Need Help?</h4>
      <p className="text-gray-600 mb-6 font-medium">Contact Our Experts</p>
      <div className="flex items-center justify-center bg-gradient-to-r from-[#CDA435] to-[#8B7355] text-white rounded-2xl p-4 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
        <FiPhone className="h-6 w-6 mr-3" />
        <p className="text-xl font-bold">+973 17491222</p>
      </div>
    </div>
  </div>
);

const MembersDirectory = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [currentView, setCurrentView] = useState('directory');
  const [selectedMember, setSelectedMember] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [loadingProfileId, setLoadingProfileId] = useState(null);
  const [filters, setFilters] = useState({ categories: [], countries: [] });
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCompanies: 0 });
  const [wishlistItems, setWishlistItems] = useState([]);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(16);

  // Function to format category text (remove underscores and capitalize)
  const formatCategory = (category) => {
    if (!category) return '';
    return category
      .split(',')
      .map(cat => cat.trim().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
      .join(', ');
  };

  useEffect(() => {
    fetchFilters();
    fetchCompanies();
    fetchWishlist();
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [selectedCategory, selectedCountry, searchTerm, pagination.currentPage, itemsPerPage]);

  const fetchFilters = async () => {
    try {
      const data = await api.get('/api/directory/filters');
      setFilters(data);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const fetchWishlist = async () => {
    try {
      const data = await api.get('/api/wishlist');
      setWishlistItems(data.map(item => item.company_id));
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
      setCompanies(data.companies);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = async (member) => {
    setProfileLoading(true);
    setLoadingProfileId(member.id);
    try {
      const data = await api.get(`/api/directory/company/${member.id}`);
      setSelectedMember(data);
      setCurrentView('profile');
    } catch (error) {
      toast.error('Error loading company profile');
    } finally {
      setProfileLoading(false);
      setLoadingProfileId(null);
    }
  };

  const handleAddToWishlist = async (companyId) => {
    try {
      const isInWishlist = wishlistItems.includes(companyId);
      
      if (isInWishlist) {
        await api.delete(`/api/wishlist/remove/${companyId}`);
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

  const handleCloseProfile = () => {
    setSelectedMember(null);
    setCurrentView('directory');
  };

  if (currentView === 'profile' && selectedMember) {
    return <CompanyProfile member={selectedMember} onClose={handleCloseProfile} />;
  }

  return (
    <div className=" p-4 sm:p-6 lg:p-8 min-h-screen relative overflow-hidden">
      {/* Futuristic Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-[#CDA435]/10 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tl from-[#8B7355]/10 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-yellow-200/20 to-amber-200/20 rounded-full blur-2xl"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-[#CDA435] via-yellow-600 to-[#8B7355] bg-clip-text text-transparent mb-4">
            Members Directory
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-[#CDA435] to-[#8B7355] mx-auto rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Futuristic Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="relative">
                <select 
                  value={selectedCategory}
                  onChange={(e) => { setSelectedCategory(e.target.value); setPagination(p => ({...p, currentPage: 1})); }}
                  className="w-full p-5 bg-white/80 backdrop-blur-sm border-2 border-yellow-200/50 rounded-2xl shadow-lg focus:border-[#CDA435] focus:ring-4 focus:ring-[#CDA435]/20 transition-all duration-300 text-gray-700 font-medium"
                >
                  <option value="">All Categories</option>
                  {filters.categories.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#CDA435] to-[#8B7355] rounded-t-2xl opacity-50"></div>
              </div>
              
              <div className="relative">
                <select 
                  value={selectedCountry}
                  onChange={(e) => { setSelectedCountry(e.target.value); setPagination(p => ({...p, currentPage: 1})); }}
                  className="w-full p-5 bg-white/80 backdrop-blur-sm border-2 border-yellow-200/50 rounded-2xl shadow-lg focus:border-[#CDA435] focus:ring-4 focus:ring-[#CDA435]/20 transition-all duration-300 text-gray-700 font-medium"
                >
                  <option value="">All Countries</option>
                  {filters.countries.map((country, idx) => (
                    <option key={idx} value={country}>{country}</option>
                  ))}
                </select>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#CDA435] to-[#8B7355] rounded-t-2xl opacity-50"></div>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPagination(p => ({...p, currentPage: 1})); }}
                  className="w-full p-5 bg-white/80 backdrop-blur-sm border-2 border-yellow-200/50 rounded-2xl shadow-lg focus:border-[#CDA435] focus:ring-4 focus:ring-[#CDA435]/20 transition-all duration-300 placeholder-gray-500 text-gray-700 font-medium"
                />
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#CDA435] to-[#8B7355] rounded-t-2xl opacity-50"></div>
              </div>
            </div>

            {/* Futuristic Info Bar */}
            <div className="bg-white/60 backdrop-blur-lg p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border border-yellow-200/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[#CDA435]/5 via-transparent to-[#8B7355]/5"></div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative z-10">
                <p className="text-lg font-bold text-gray-700">
                  Showing <span className="text-[#CDA435] text-xl">{companies.length}</span> of <span className="text-[#CDA435] text-xl">{pagination.totalCompanies}</span> companies
                </p>
                
                {/* Items Per Page Selector */}
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-600">Show:</span>
                  <select 
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setPagination(p => ({...p, currentPage: 1}));
                    }}
                    className="px-4 py-2 bg-white/80 backdrop-blur-sm border-2 border-yellow-200/50 rounded-xl shadow-lg focus:border-[#CDA435] focus:ring-2 focus:ring-[#CDA435]/20 transition-all duration-300 text-gray-700 font-medium cursor-pointer"
                  >
                    <option value="8">8</option>
                    <option value="16">16</option>
                    <option value="24">24</option>
                    <option value="32">32</option>
                  </select>
                  <span className="text-sm font-medium text-gray-600">per page</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 relative z-10">
                <button 
                  onClick={() => setViewMode('grid')} 
                  className={`p-4 rounded-xl transition-all duration-300 ${viewMode === 'grid' ? 'bg-gradient-to-r from-[#CDA435] to-[#8B7355] text-white shadow-lg scale-110' : 'bg-white/50 text-gray-600 hover:bg-white/80 hover:scale-105'}`}
                >
                  <FiGrid className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setViewMode('list')} 
                  className={`p-4 rounded-xl transition-all duration-300 ${viewMode === 'list' ? 'bg-gradient-to-r from-[#CDA435] to-[#8B7355] text-white shadow-lg scale-110' : 'bg-white/50 text-gray-600 hover:bg-white/80 hover:scale-105'}`}
                >
                  <FiList className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Companies Grid */}
            {loading ? (
              <div className="text-center py-12">Loading companies...</div>
            ) : companies.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No companies found</div>
            ) : (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
                {companies.map(member => (
                  <MemberCard 
                    key={member.id} 
                    member={member} 
                    onViewProfile={handleViewProfile}
                    onAddToWishlist={handleAddToWishlist}
                    isLoading={profileLoading}
                    loadingId={loadingProfileId}
                    formatCategory={formatCategory}
                    isInWishlist={wishlistItems.includes(member.id)}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <button 
                  onClick={() => setPagination(p => ({...p, currentPage: p.currentPage - 1}))}
                  disabled={!pagination.hasPrev}
                  className="h-12 w-12 flex items-center justify-center bg-white rounded-full shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border-2 border-gray-200 hover:border-[#CDA435]"
                >
                  <FiChevronLeft className="w-5 h-5 text-gray-600"/>
                </button>
                <div className="bg-gradient-to-r from-[#CDA435] to-[#8B7355] text-white px-6 py-3 rounded-full shadow-lg">
                  <span className="font-semibold">Page {pagination.currentPage} of {pagination.totalPages}</span>
                </div>
                <button 
                  onClick={() => setPagination(p => ({...p, currentPage: p.currentPage + 1}))}
                  disabled={!pagination.hasNext}
                  className="h-12 w-12 flex items-center justify-center bg-white rounded-full shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border-2 border-gray-200 hover:border-[#CDA435]"
                >
                  <FiChevronRight className="w-5 h-5 text-gray-600"/>
                </button>
              </div>
            )}
          </div>

          {/* Futuristic Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            <div className="relative">
              <a href="/company/quote" className="block w-full bg-gradient-to-r from-[#CDA435] to-[#8B7355] text-white font-bold py-6 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 text-center transform hover:scale-105 relative overflow-hidden border-2 border-white/20">
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 animate-pulse"></div>
                <span className="relative z-10 text-xl">Request a Quote</span>
              </a>
            </div>
            <HelpCard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembersDirectory;
