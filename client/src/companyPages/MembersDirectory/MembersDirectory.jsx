import { useState, useEffect } from 'react';
import { FiMapPin, FiGlobe, FiEye, FiPhone, FiGrid, FiList, FiChevronLeft, FiChevronRight, FiStar, FiHeart } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import CompanyProfile from './CompanyProfile';

const MemberCard = ({ member, onViewProfile, onAddToWishlist }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <div className="relative h-48 bg-gradient-to-br from-[#CDA435] to-[#8B7355]">
      {member.logo ? (
        <img src={member.logo} alt={member.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-6xl text-white font-bold">{member.name?.charAt(0)}</span>
        </div>
      )}
    </div>
    <div className="p-6">
      <div className="flex items-center mb-3">
        <h3 className="text-xl font-bold text-gray-800">{member.name}</h3>
      </div>
      <p className="text-gray-500 text-sm mb-2">{member.category}</p>
      {member.average_rating > 0 && (
        <div className="flex items-center text-yellow-500 text-sm mb-2">
          <FiStar className="fill-current" />
          <span className="ml-1">{member.average_rating} ({member.total_reviews} reviews)</span>
        </div>
      )}
      <div className="flex items-center text-gray-600 text-sm mb-4">
        <FiMapPin className="mr-2 text-yellow-600" />
        <span>{member.city ? `${member.city}, ` : ''}{member.country}</span>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          {member.website && (
            <a href={member.website} target="_blank" rel="noopener noreferrer" className="h-8 w-8 flex items-center justify-center border-2 border-[#D9B95B] text-[#D9B95B] rounded-full hover:bg-yellow-50">
              <FiGlobe />
            </a>
          )}
          <button 
            onClick={() => onViewProfile(member)}
            className="h-8 w-8 flex items-center justify-center border-2 border-[#D9B95B] text-[#D9B95B] rounded-full hover:bg-yellow-50"
          >
            <FiEye />
          </button>
          <button 
            onClick={() => onAddToWishlist(member.id)}
            className="h-8 w-8 flex items-center justify-center border-2 border-[#D9B95B] text-[#D9B95B] rounded-full hover:bg-yellow-50"
          >
            <FiHeart />
          </button>
        </div>
      </div>
    </div>
  </div>
);

const HelpCard = () => (
  <div className="bg-[#D9B95B] p-6 rounded-lg shadow-md text-center text-white">
    <h4 className="text-lg font-bold">Need Any Information?</h4>
    <p className="text-sm opacity-90 my-2">Please Contact Our Experts</p>
    <div className="flex items-center justify-center mt-4">
      <FiPhone className="h-10 w-10 mr-3 opacity-80" />
      <p className="text-2xl font-bold">+973 17491222</p>
    </div>
  </div>
);

const MembersDirectory = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [currentView, setCurrentView] = useState('directory');
  const [selectedMember, setSelectedMember] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ categories: [], countries: [] });
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCompanies: 0 });
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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
      setFilters(data);
    } catch (error) {
      console.error('Error fetching filters:', error);
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
      setCompanies(data.companies);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = async (member) => {
    try {
      const data = await api.get(`/api/directory/company/${member.id}`);
      setSelectedMember(data);
      setCurrentView('profile');
    } catch (error) {
      toast.error('Error loading company profile');
    }
  };

  const handleAddToWishlist = async (companyId) => {
    try {
      await api.post('/api/wishlist/add', { companyId });
      toast.success('Added to wishlist!');
    } catch (error) {
      toast.error(error.message || 'Failed to add to wishlist');
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
    <div className="bg-gray-50 mt-32 p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Members Directory</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <select 
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setPagination(p => ({...p, currentPage: 1})); }}
                className="w-full p-3 bg-white border border-gray-300 rounded-md shadow-sm"
              >
                <option value="">All Categories</option>
                {filters.categories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
              <select 
                value={selectedCountry}
                onChange={(e) => { setSelectedCountry(e.target.value); setPagination(p => ({...p, currentPage: 1})); }}
                className="w-full p-3 bg-white border border-gray-300 rounded-md shadow-sm"
              >
                <option value="">All Countries</option>
                {filters.countries.map((country, idx) => (
                  <option key={idx} value={country}>{country}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPagination(p => ({...p, currentPage: 1})); }}
                className="w-full p-3 bg-white border border-gray-300 rounded-md shadow-sm"
              />
            </div>

            {/* Info Bar */}
            <div className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
              <p className="text-sm font-semibold text-gray-700">
                Showing {companies.length} of {pagination.totalCompanies} companies
              </p>
              <div className="flex items-center space-x-2 text-yellow-600">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-yellow-100' : 'hover:bg-yellow-50'}`}><FiGrid /></button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-yellow-100' : 'hover:bg-yellow-50'}`}><FiList /></button>
              </div>
            </div>

            {/* Companies Grid */}
            {loading ? (
              <div className="text-center py-12">Loading companies...</div>
            ) : companies.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No companies found</div>
            ) : (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {companies.map(member => (
                  <MemberCard 
                    key={member.id} 
                    member={member} 
                    onViewProfile={handleViewProfile}
                    onAddToWishlist={handleAddToWishlist}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-6">
                <button 
                  onClick={() => setPagination(p => ({...p, currentPage: p.currentPage - 1}))}
                  disabled={!pagination.hasPrev}
                  className="h-10 w-10 flex items-center justify-center bg-white rounded-full shadow-md hover:bg-gray-100 disabled:opacity-50"
                >
                  <FiChevronLeft/>
                </button>
                <span className="text-gray-600">Page {pagination.currentPage} of {pagination.totalPages}</span>
                <button 
                  onClick={() => setPagination(p => ({...p, currentPage: p.currentPage + 1}))}
                  disabled={!pagination.hasNext}
                  className="h-10 w-10 flex items-center justify-center bg-white rounded-full shadow-md hover:bg-gray-100 disabled:opacity-50"
                >
                  <FiChevronRight/>
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <a href="/company/quote" className="block w-full bg-[#D9B95B] text-white font-bold py-3 rounded-lg shadow-md hover:bg-yellow-600 transition-colors text-center">
              Request a quote
            </a>
            <HelpCard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembersDirectory;
