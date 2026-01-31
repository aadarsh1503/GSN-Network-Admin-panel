import React from 'react';
import { FiCreditCard, FiMapPin, FiHash, FiUser, FiInfo, FiCopy } from 'react-icons/fi';

const SimpleBankDetails = ({ bankDetails, onCopy }) => {
  if (!bankDetails) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="p-6 bg-gray-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <FiCreditCard className="text-4xl text-gray-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Bank Details Not Available</h3>
        <p className="text-gray-600">Please contact support for payment information</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl p-8 border border-gray-200">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-gradient-to-r from-[#bca142] to-[#D9B95B] rounded-2xl text-white">
          <FiCreditCard className="text-3xl" />
        </div>
        <div>
          <h3 className="text-3xl font-bold text-gray-800">{bankDetails.bank_name}</h3>
          <p className="text-gray-600 text-lg">{bankDetails.branch_name}</p>
        </div>
      </div>

      {/* Bank Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Holder */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <FiUser className="text-[#bca142] text-xl" />
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Account Holder</span>
            </div>
            <button
              onClick={() => onCopy && onCopy(bankDetails.account_holder_name, 'holder')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiCopy className="text-gray-400" />
            </button>
          </div>
          <p className="text-xl font-bold text-gray-800">{bankDetails.account_holder_name}</p>
        </div>

        {/* Account Number */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <FiCreditCard className="text-[#bca142] text-xl" />
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Account Number</span>
            </div>
            <button
              onClick={() => onCopy && onCopy(bankDetails.account_number, 'account')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiCopy className="text-gray-400" />
            </button>
          </div>
          <p className="text-xl font-bold text-gray-800 font-mono tracking-wider">{bankDetails.account_number}</p>
        </div>

        {/* IFSC Code */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <FiHash className="text-[#bca142] text-xl" />
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">IFSC Code</span>
            </div>
            <button
              onClick={() => onCopy && onCopy(bankDetails.ifsc_code, 'ifsc')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiCopy className="text-gray-400" />
            </button>
          </div>
          <p className="text-xl font-bold text-gray-800 font-mono tracking-wider">{bankDetails.ifsc_code}</p>
        </div>

        {/* Branch Address */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <FiMapPin className="text-[#bca142] text-xl" />
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Branch Address</span>
            </div>
            <button
              onClick={() => onCopy && onCopy(bankDetails.branch_address, 'address')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiCopy className="text-gray-400" />
            </button>
          </div>
          <p className="text-lg font-medium text-gray-800 leading-relaxed">{bankDetails.branch_address}</p>
        </div>
      </div>

      {/* Instructions */}
      {bankDetails.instructions && (
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500 rounded-xl text-white">
              <FiInfo className="text-xl" />
            </div>
            <div>
              <h4 className="font-bold text-blue-800 text-lg mb-2">Payment Instructions</h4>
              <p className="text-blue-700 leading-relaxed">{bankDetails.instructions}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleBankDetails;