import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiCalendar, FiMail, FiPhone, FiMapPin, FiInfo, FiShield, FiEye, FiSearch } from 'react-icons/fi';
import { api } from '../../utils/api';
import { toast } from 'react-toastify';

const BlacklistedCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    fetchBlacklistedCompanies();
  }, []);

  const fetchBlacklistedCompanies = async () => {
    try {
      const data = await api.get('/api/user/blacklisted-companies');
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
    company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company.blacklist_reason && company.blacklist_reason.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <FiShield className="text-3xl text-red-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Blacklisted Companies</h1>
                <p className="text-gray-600 mt-1">Companies restricted from platform activities</p>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-700 text-sm font-medium">Total Blacklisted</p>
                  <p className="text-2xl font-bold text-red-900 mt-1">{companies.length}</p>
                </div>
                <FiAlertTriangle className="text-3xl text-red-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-700 text-sm font-medium">This Month</p>
                  <p className="text-2xl font-bold text-yellow-900 mt-1">
                    {companies.filter(c => {
                      const date = new Date(c.blacklist_date);
                      const now = new Date();
                      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
                <FiCalendar className="text-3xl text-[#bca142]" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-700 text-sm font-medium">Search Results</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{filteredCompanies.length}</p>
                </div>
                <FiInfo className="text-3xl text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Search by company name, email, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:border-[#bca142] focus:ring-2 focus:ring-[#bca142] focus:ring-opacity-20 transition-all"
            />
          </div>
        </div>

        {/* Companies Table */}
        {filteredCompanies.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
              <FiShield className="text-5xl text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Blacklisted Companies Found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'All companies are in good standing'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#bca142] to-[#D9B95B]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Company Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Contact</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Location</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Blacklist Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Reason</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-white">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCompanies.map((company, index) => (
                    <tr 
                      key={company.id} 
                      className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <FiAlertTriangle className="text-red-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{company.name}</p>
                            {company.category && (
                              <p className="text-xs text-gray-500">{company.category}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <FiMail className="text-[#bca142]" />
                            <span>{company.email}</span>
                          </div>
                          {company.mobile && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <FiPhone className="text-[#bca142]" />
                              <span>{company.mobile}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <FiMapPin className="text-gray-400" />
                          <span>{[company.city, company.country].filter(Boolean).join(', ') || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <FiCalendar className="text-gray-400" />
                          <span>{new Date(company.blacklist_date).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700 line-clamp-2 max-w-xs">
                          {company.blacklist_reason || 'No reason provided'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedCompany(company)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#bca142] to-[#D9B95B] text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-[#bca142]/30 transition-all"
                        >
                          <FiEye />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
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
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-600 text-sm mb-1 font-medium">Email</p>
                  <p className="text-gray-800">{selectedCompany.email}</p>
                </div>
                {selectedCompany.mobile && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-600 text-sm mb-1 font-medium">Phone</p>
                    <p className="text-gray-800">{selectedCompany.mobile}</p>
                  </div>
                )}
                {selectedCompany.category && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-600 text-sm mb-1 font-medium">Category</p>
                    <p className="text-gray-800">{selectedCompany.category}</p>
                  </div>
                )}
                {(selectedCompany.city || selectedCompany.country) && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-600 text-sm mb-1 font-medium">Location</p>
                    <p className="text-gray-800">
                      {[selectedCompany.city, selectedCompany.country].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-600 text-sm mb-1 font-medium">Blacklist Date</p>
                  <p className="text-gray-800">
                    {new Date(selectedCompany.blacklist_date).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-600 text-sm mb-1 font-medium">Registration Date</p>
                  <p className="text-gray-800">
                    {new Date(selectedCompany.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Blacklist Reason */}
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
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

              {/* Close Button */}
              <div className="mt-6 flex justify-end">
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

export default BlacklistedCompanies;
