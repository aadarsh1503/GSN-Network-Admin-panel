import React, { useState } from 'react';
import { FiX, FiUser, FiPackage, FiTruck, FiMapPin, FiCalendar, FiDollarSign, FiClock, FiCheck, FiXCircle, FiAlertCircle } from 'react-icons/fi';
import { FaShip, FaPlane, FaTruck } from 'react-icons/fa';
import Flag from 'react-world-flags';
import FuturisticLoader from '../Loaders/FuturisticLoader';

const FuturisticQuoteModal = ({ quote, isOpen, onClose, onUpdateStatus, isLoading = false }) => {
  const [selectedStatus, setSelectedStatus] = useState(quote?.status || 'pending');

  if (!isOpen) return null;

  const getCountryCode = (countryName) => {
    const countryCodes = {
      'UAE': 'AE', 'United Arab Emirates': 'AE', 'Saudi Arabia': 'SA', 'Kuwait': 'KW',
      'Qatar': 'QA', 'Bahrain': 'BH', 'Oman': 'OM', 'India': 'IN', 'USA': 'US',
      'United States': 'US', 'United Kingdom': 'GB', 'UK': 'GB', 'China': 'CN',
      'Germany': 'DE', 'France': 'FR', 'Australia': 'AU', 'Canada': 'CA'
    };
    return countryCodes[countryName] || countryName?.substring(0, 2).toUpperCase();
  };

  const getShippingIcon = (mode) => {
    switch (mode?.toLowerCase()) {
      case 'sea': return <FaShip className="w-5 h-5" />;
      case 'air': return <FaPlane className="w-5 h-5" />;
      case 'land': return <FaTruck className="w-5 h-5" />;
      default: return <FiTruck className="w-5 h-5" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted': return <FiCheck className="w-4 h-4 text-[#bca142]" />;
      case 'rejected': return <FiXCircle className="w-4 h-4 text-red-600" />;
      default: return <FiAlertCircle className="w-4 h-4 text-[#bca142]" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'from-yellow-50 to-yellow-100 border-[#bca142]';
      case 'rejected': return 'from-red-50 to-red-100 border-red-200';
      case 'pending': return 'from-yellow-50 to-yellow-100 border-[#bca142]';
      case 'approved': return 'from-yellow-50 to-yellow-100 border-[#bca142]';
      case 'running': return 'from-yellow-50 to-yellow-100 border-[#bca142]';
      case 'closed': return 'from-gray-50 to-gray-100 border-gray-200';
      default: return 'from-gray-50 to-gray-100 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <FuturisticLoader size="large" message="Loading quote details..." />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#bca142] to-[#B8941F] p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-1">Quote Details</h2>
              <p className="text-white/80">ID: #{quote?.id}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          {/* Status Badge */}
          <div className="mb-6 flex justify-center">
            <div className={`inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r ${getStatusColor(quote?.status)} border-2 shadow-lg`}>
              {getStatusIcon(quote?.status)}
              <span className="ml-2 font-semibold text-gray-700 capitalize">
                {quote?.status || 'Pending'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* User Information */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-[#bca142] rounded-full">
                    <FiUser className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 ml-3">Customer Information</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="text-gray-600 w-16">Name:</span>
                    <span className="font-medium text-gray-800">{quote?.user_name || 'Guest User'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 w-16">Email:</span>
                    <span className="font-medium text-gray-800">{quote?.user_email}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 w-16">Phone:</span>
                    <span className="font-medium text-gray-800">{quote?.user_phone || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              {/* Shipment Route */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-[#bca142] rounded-full">
                    <FiMapPin className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 ml-3">Shipping Route</h3>
                </div>
                
                <div className="flex items-center justify-between">
                  {/* From */}
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-12 h-8 rounded overflow-hidden shadow-sm">
                      <Flag code={getCountryCode(quote?.departure_country)} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-800">{quote?.departure_city}</p>
                      <p className="text-sm text-gray-600">{quote?.departure_country}</p>
                    </div>
                  </div>
                  
                  {/* Arrow with shipping mode */}
                  <div className="flex flex-col items-center space-y-2">
                    <div className="p-3 bg-[#bca142] rounded-full text-white">
                      {getShippingIcon(quote?.shipping_mode)}
                    </div>
                    <span className="text-sm font-medium text-gray-700 capitalize">{quote?.shipping_mode}</span>
                  </div>
                  
                  {/* To */}
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-12 h-8 rounded overflow-hidden shadow-sm">
                      <Flag code={getCountryCode(quote?.arrival_country)} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-800">{quote?.arrival_city}</p>
                      <p className="text-sm text-gray-600">{quote?.arrival_country}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Information */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-[#bca142] rounded-full">
                    <FiPackage className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 ml-3">Product Details</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">{quote?.product_description}</p>
                
                <div className="mt-4 flex items-center text-sm text-gray-600">
                  <FiCalendar className="w-4 h-4 mr-2" />
                  <span>Created: {new Date(quote?.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
              </div>
            </div>

            {/* Right Column - Company Responses */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-3 bg-[#bca142] rounded-full">
                      <FiDollarSign className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 ml-3">Company Responses</h3>
                  </div>
                  <span className="bg-[#bca142] text-white px-3 py-1 rounded-full text-sm font-medium">
                    {quote?.responses?.length || 0} Responses
                  </span>
                </div>

                {quote?.responses && quote.responses.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {quote.responses.map((response, index) => (
                      <div key={response.id || index} className={`bg-gradient-to-r ${getStatusColor(response.user_response_status)} rounded-lg p-4 border-2 shadow-sm hover:shadow-md transition-shadow`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-800">{response.company_name}</h4>
                            <p className="text-sm text-gray-600">{response.company_email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-[#bca142]">${response.price}</p>
                            <div className="flex items-center text-sm text-gray-600 mt-1">
                              <FiClock className="w-3 h-3 mr-1" />
                              <span>{response.transit_time}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {getStatusIcon(response.user_response_status)}
                            <span className="ml-2 text-sm font-medium capitalize">
                              {response.user_response_status || 'Pending'}
                            </span>
                          </div>
                          
                          {(response.accepted_at || response.rejected_at) && (
                            <span className="text-xs text-gray-500">
                              {new Date(response.accepted_at || response.rejected_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        
                        {response.notes && (
                          <div className="mt-3 p-3 bg-white/50 rounded-lg">
                            <p className="text-sm text-gray-700">{response.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FiAlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No company responses yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <label htmlFor="status-select" className="text-sm font-medium text-gray-700">
                Update Status:
              </label>
              <select
                id="status-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent bg-white shadow-sm"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="running">Running</option>
                <option value="closed">Closed</option>
              </select>
              {selectedStatus !== quote?.status && (
                <button
                  onClick={() => onUpdateStatus(quote?.id, selectedStatus)}
                  className="px-4 py-2 bg-[#bca142] text-white rounded-lg hover:bg-[#B8941F] transition-colors shadow-sm"
                >
                  Update
                </button>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuturisticQuoteModal;