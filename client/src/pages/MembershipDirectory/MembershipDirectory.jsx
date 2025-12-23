import React, { useState, useEffect, useMemo } from 'react';
import { FiSearch, FiMapPin, FiGlobe, FiMail, FiPhone, FiStar } from 'react-icons/fi';
import api from '../../utils/api';

const MembershipDirectory = () => {
  const [companies, setCompanies] = useState([]);
  const [filters, setFilters] = useState({
    categories: [],
    countries: [],
    states: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchFilters();
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [searchTerm, selectedCategory, selectedCountry, selectedState, currentPage]);

  const fetchFilters = async () => {
    try {
      const data = await api.get('/api/directory/filters');
      setFilters(data);
    } catch (err) {
      console.error('Error fetching filters:', err);
    }
  };

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 12,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedCountry && { country: selectedCountry }),
        ...(selectedState && { state: selectedState })
      });

      const data = await api.get(`/api/directory/companies?${params}`);
      setCompanies(data.companies);
      setTotalPages(data.pagination.totalPages);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedCountry('');
    setSelectedState('');
    setCurrentPage(1);
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FiStar
          key={i}
          className={`w-4 h-4 ${i <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
        />
      );
    }
    return stars;
  };

  const CompanyCard = ({ company }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="p-6">
        {/* Company Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            {company.logo ? (
              <img 
                src={company.logo} 
                alt={company.name}
                className="w-12 h-12 rounded-full object-cover mr-3"
              />
            ) : (
              <div className="w-12 h-12 bg-[#CDA435] rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">
                  {company.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{company.name}</h3>
              <p className="text-sm text-gray-600 capitalize">{company.category}</p>
            </div>
          </div>
          <div className="flex items-center">
            {renderStars(company.average_rating)}
            <span className="ml-1 text-sm text-gray-600">({company.total_reviews})</span>
          </div>
        </div>

        {/* Company Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <FiMapPin className="w-4 h-4 mr-2" />
            <span>{company.city}, {company.country}</span>
          </div>
          {company.website && (
            <div className="flex items-center text-sm text-gray-600">
              <FiGlobe className="w-4 h-4 mr-2" />
              <a 
                href={company.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#CDA435] hover:underline"
              >
                {company.website}
              </a>
            </div>
          )}
          <div className="flex items-center text-sm text-gray-600">
            <FiMail className="w-4 h-4 mr-2" />
            <span>{company.email}</span>
          </div>
          {company.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <FiPhone className="w-4 h-4 mr-2" />
              <span>{company.phone}</span>
            </div>
          )}
        </div>

        {/* Services */}
        {company.services && company.services.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Services:</h4>
            <div className="flex flex-wrap gap-1">
              {company.services.slice(0, 3).map((service, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {service}
                </span>
              ))}
              {company.services.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  +{company.services.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* About */}
        {company.about_company && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 line-clamp-3">
              {company.about_company}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          <button className="flex-1 bg-[#CDA435] text-white py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors text-sm font-medium">
            View Profile
          </button>
          <button className="flex-1 border border-[#CDA435] text-[#CDA435] py-2 px-4 rounded-md hover:bg-[#CDA435] hover:text-white transition-colors text-sm font-medium">
            Contact
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800">Membership Directory</h1>
          <p className="text-gray-600 mt-2">Find trusted logistics partners in the Gulf region</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CDA435]"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CDA435]"
              >
                <option value="">All Categories</option>
                {filters.categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Country Filter */}
            <div>
              <select
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setSelectedState(''); // Reset state when country changes
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CDA435]"
              >
                <option value="">All Countries</option>
                {filters.countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            {/* Reset Button */}
            <div>
              <button
                onClick={resetFilters}
                className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="relative inline-block">
              <div className="h-8 w-8 border-4 border-gray-200 rounded-full animate-spin">
                <div className="h-8 w-8 border-4 border-transparent border-t-[#CDA435] rounded-full animate-spin"></div>
              </div>
            </div>
            <p className="mt-3 text-gray-600 font-medium">Loading companies...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">Error: {error}</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No companies found matching your criteria.</p>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                Showing {companies.length} companies
              </p>
            </div>

            {/* Company Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {companies.map(company => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    if (page === currentPage || 
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 border rounded-md ${
                            currentPage === page
                              ? 'bg-[#CDA435] text-white border-[#CDA435]'
                              : 'border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-2">...</span>;
                    }
                    return null;
                  })}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MembershipDirectory;