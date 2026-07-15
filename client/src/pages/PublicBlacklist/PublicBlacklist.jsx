import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiCalendar, FiMapPin, FiInfo, FiShield, FiEye, FiSearch } from 'react-icons/fi';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

const PublicBlacklist = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    fetchBlacklistedCompanies();
  }, []);

  const fetchBlacklistedCompanies = async () => {
    try {
      const data = await api.get('/api/user/public-blacklist');
      setCompanies(data);
    } catch (error) {
      console.error('Error fetching blacklisted companies:', error);
      toast.error('Failed to load blacklisted companies');
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company.blacklist_reason && company.blacklist_reason.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (company.category && company.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center mt-20">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-[#bca142] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-lg text-gray-600 font-medium">Loading Blacklisted Companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mt-20">
      {/* Hero Section */}
      <header
        className="h-60 bg-cover bg-center relative"
        style={{ backgroundImage: `url('/Login.jpg')` }}
      >
        <div className="absolute "></div>
        <div className="container mx-auto h-full flex flex-col justify-center items-center text-white relative z-10">
          <h1 className="text-5xl font-bold">Blacklisted Companies</h1>
          <p className="mt-2 text-base">
            <span>Home</span>
            <span className="mx-2">&gt;</span>
            <span>Blacklist</span>
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Info Banner */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-6 mb-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 rounded-lg flex-shrink-0">
              <FiAlertTriangle className="text-3xl text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-900 mb-2">Public Blacklist Notice</h2>
              <p className="text-gray-700 leading-relaxed">
                The following companies have been blacklisted by our administration for violating platform policies. 
                This list is publicly available to help maintain transparency and protect our community members. 
                If you believe a listing is in error, please contact our support team.
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4 mb-8">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Search by company name, category, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:border-[#bca142] focus:ring-2 focus:ring-[#bca142] focus:ring-opacity-20 transition-all"
            />
          </div>
        </div>

        {/* Companies Grid */}
        {filteredCompanies.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-12 text-center">
            <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
              <FiShield className="text-5xl text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Blacklisted Companies Found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'All companies are in good standing'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
              <div
                key={company.id}
                className="bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:shadow-lg hover:border-[#bca142] transition-all duration-300 overflow-hidden"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                      <FiAlertTriangle className="text-2xl text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-lg truncate">{company.name}</h3>
                      {company.category && (
                        <p className="text-red-100 text-sm truncate">{company.category}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  {/* Location */}
                  {(company.city || company.country) && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <FiMapPin className="text-[#bca142] flex-shrink-0" />
                      <span className="truncate">
                        {[company.city, company.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Blacklist Date */}
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <FiCalendar className="text-gray-400 flex-shrink-0" />
                    <span>Blacklisted: {new Date(company.blacklist_date).toLocaleDateString()}</span>
                  </div>

                  {/* Reason Preview */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-red-700 mb-1">Reason:</p>
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {company.blacklist_reason || 'No reason provided'}
                    </p>
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={() => setSelectedCompany(company)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#bca142] to-[#D9B95B] text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:shadow-[#bca142]/30 transition-all"
                  >
                    <FiEye />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <FiAlertTriangle className="text-3xl text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedCompany.name}</h2>
                    <p className="text-gray-600 mt-1">Blacklisted Company Details</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Company Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {selectedCompany.category && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-600 text-sm mb-1 font-medium">Category</p>
                    <p className="text-gray-800 font-semibold">{selectedCompany.category}</p>
                  </div>
                )}
                {(selectedCompany.city || selectedCompany.country) && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-600 text-sm mb-1 font-medium">Location</p>
                    <p className="text-gray-800 font-semibold">
                      {[selectedCompany.city, selectedCompany.country].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-600 text-sm mb-1 font-medium">Blacklist Date</p>
                  <p className="text-gray-800 font-semibold">
                    {new Date(selectedCompany.blacklist_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-600 text-sm mb-1 font-medium">Registration Date</p>
                  <p className="text-gray-800 font-semibold">
                    {new Date(selectedCompany.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Blacklist Reason */}
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <FiAlertTriangle className="text-2xl text-red-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-700 mb-2">Blacklist Reason</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedCompany.blacklist_reason || 'No reason provided'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Warning Notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Notice:</strong> This company has been blacklisted for violating platform policies. 
                  We recommend exercising caution when dealing with this entity.
                </p>
              </div>

              {/* Close Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicBlacklist;
