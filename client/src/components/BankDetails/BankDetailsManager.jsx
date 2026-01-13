import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  FiPlus, FiEdit3, FiTrash2, FiCheck, FiX, FiEye, FiEyeOff,
  FiCreditCard, FiMapPin, FiHash, FiUser, FiInfo, FiStar
} from 'react-icons/fi';
import api from '../../utils/api';
import './BankDetailsManager.css';

const BankDetailsManager = () => {
  const [bankDetails, setBankDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState({});
  const [formData, setFormData] = useState({
    bank_name: '',
    branch_name: '',
    branch_address: '',
    ifsc_code: '',
    account_name: '',
    account_number: '',
    routing_number: '',
    swift_code: '',
    instructions: '',
    is_active: true
  });

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      const response = await api.get('/api/bank-details');
      console.log('Bank details API response:', response); // Debug log
      
      // The api.get() function returns the data directly, not wrapped in response.data
      if (Array.isArray(response)) {
        setBankDetails(response);
      } else {
        console.warn('Unexpected API response format:', response);
        setBankDetails([]);
      }
    } catch (error) {
      console.error('Error fetching bank details:', error);
      toast.error('Failed to fetch bank details');
      setBankDetails([]); // Ensure bankDetails is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (editingId) {
        await api.put(`/api/bank-details/${editingId}`, formData);
        toast.success('Bank details updated successfully');
      } else {
        await api.post('/api/bank-details', formData);
        toast.success('Bank details added successfully');
      }
      
      resetForm();
      fetchBankDetails();
    } catch (error) {
      console.error('Error saving bank details:', error);
      toast.error('Failed to save bank details');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (bankDetail) => {
    setFormData(bankDetail);
    setEditingId(bankDetail.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this bank detail?')) {
      try {
        await api.delete(`/api/bank-details/${id}`);
        toast.success('Bank details deleted successfully');
        fetchBankDetails();
      } catch (error) {
        console.error('Error deleting bank details:', error);
        toast.error('Failed to delete bank details');
      }
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/api/bank-details/${id}`, { is_active: !currentStatus });
      toast.success('Bank details status updated');
      fetchBankDetails();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      bank_name: '',
      branch_name: '',
      branch_address: '',
      ifsc_code: '',
      account_name: '',
      account_number: '',
      routing_number: '',
      swift_code: '',
      instructions: '',
      is_active: true
    });
    setEditingId(null);
    setShowForm(false);
  };

  const toggleAccountVisibility = (id) => {
    setShowAccountNumber(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const maskAccountNumber = (accountNumber) => {
    if (!accountNumber) return '';
    const visible = accountNumber.slice(-4);
    const masked = '*'.repeat(Math.max(0, accountNumber.length - 4));
    return masked + visible;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#CDA435] mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading bank details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#CDA435] to-[#D9B95B] bg-clip-text text-transparent">
                Bank Details Management
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Manage your payment bank details for receiving payments
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="group relative px-8 py-4 bg-gradient-to-r from-[#CDA435] to-[#D9B95B] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-3"
            >
              <FiPlus className="text-xl group-hover:rotate-90 transition-transform duration-300" />
              Add Bank Details
              <div className="absolute inset-0 bg-gradient-to-r from-[#D9B95B] to-[#CDA435] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
            </button>
          </div>
        </div>

        {/* Bank Details Grid */}
        {!Array.isArray(bankDetails) || bankDetails.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-6 bg-gradient-to-r from-[#CDA435] to-[#D9B95B] rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <FiCreditCard className="text-4xl text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Bank Details Found</h3>
            <p className="text-gray-600 mb-6">Add your first bank details to start receiving payments</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-8 py-4 bg-gradient-to-r from-[#CDA435] to-[#D9B95B] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              Add Bank Details
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {bankDetails.map((bank) => (
              <div
                key={bank.id}
                className={`relative bg-white rounded-2xl shadow-xl border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                  bank.is_active 
                    ? 'border-[#CDA435] bg-gradient-to-br from-[#CDA435]/5 to-[#D9B95B]/5' 
                    : 'border-gray-200 hover:border-[#CDA435]/50'
                }`}
              >
                {/* Active Badge */}
                {bank.is_active && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-[#CDA435] to-[#D9B95B] text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                    <FiStar className="text-sm" />
                    ACTIVE
                  </div>
                )}

                <div className="p-8">
                  {/* Bank Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-r from-[#CDA435] to-[#D9B95B] rounded-xl text-white">
                        <FiCreditCard className="text-2xl" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">{bank.bank_name}</h3>
                        <p className="text-gray-600">{bank.branch_name}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="space-y-4 mb-6">
                    {bank.branch_address && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <FiMapPin className="text-[#CDA435] text-lg" />
                        <div>
                          <p className="text-sm text-gray-500">Branch Address</p>
                          <p className="font-medium text-gray-800">{bank.branch_address}</p>
                        </div>
                      </div>
                    )}

                    {bank.ifsc_code && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <FiHash className="text-[#CDA435] text-lg" />
                        <div>
                          <p className="text-sm text-gray-500">IFSC Code</p>
                          <p className="font-mono font-bold text-gray-800 text-lg">{bank.ifsc_code}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <FiUser className="text-[#CDA435] text-lg" />
                      <div>
                        <p className="text-sm text-gray-500">Account Holder</p>
                        <p className="font-medium text-gray-800">{bank.account_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <FiCreditCard className="text-[#CDA435] text-lg" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Account Number</p>
                        <div className="flex items-center gap-3">
                          <p className="font-mono font-bold text-gray-800 text-lg">
                            {showAccountNumber[bank.id] 
                              ? bank.account_number 
                              : maskAccountNumber(bank.account_number)
                            }
                          </p>
                          <button
                            onClick={() => toggleAccountVisibility(bank.id)}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            {showAccountNumber[bank.id] ? (
                              <FiEyeOff className="text-gray-500" />
                            ) : (
                              <FiEye className="text-gray-500" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {bank.routing_number && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <FiHash className="text-[#CDA435] text-lg" />
                        <div>
                          <p className="text-sm text-gray-500">Routing Number</p>
                          <p className="font-mono font-bold text-gray-800">{bank.routing_number}</p>
                        </div>
                      </div>
                    )}

                    {bank.swift_code && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <FiHash className="text-[#CDA435] text-lg" />
                        <div>
                          <p className="text-sm text-gray-500">SWIFT Code</p>
                          <p className="font-mono font-bold text-gray-800">{bank.swift_code}</p>
                        </div>
                      </div>
                    )}

                    {bank.instructions && (
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                        <FiInfo className="text-blue-500 text-lg mt-1" />
                        <div>
                          <p className="text-sm text-blue-600 font-medium">Instructions</p>
                          <p className="text-blue-800 text-sm leading-relaxed">{bank.instructions}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {!bank.is_active && (
                      <button
                        onClick={() => toggleStatus(bank.id, bank.is_active)}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <FiCheck className="text-lg" />
                        Activate
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(bank)}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <FiEdit3 className="text-lg" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(bank.id)}
                      className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center"
                    >
                      <FiTrash2 className="text-lg" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-[#CDA435] to-[#D9B95B] bg-clip-text text-transparent">
                  {editingId ? 'Edit Bank Details' : 'Add Bank Details'}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <FiX className="text-2xl text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Bank Name *
                    </label>
                    <input
                      type="text"
                      name="bank_name"
                      required
                      value={formData.bank_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-200"
                      placeholder="e.g., Indian Bank"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Branch Name *
                    </label>
                    <input
                      type="text"
                      name="branch_name"
                      required
                      value={formData.branch_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-200"
                      placeholder="e.g., Main Branch"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Branch Address
                  </label>
                  <textarea
                    name="branch_address"
                    value={formData.branch_address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-200"
                    placeholder="Complete branch address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      name="ifsc_code"
                      value={formData.ifsc_code}
                      onChange={(e) => setFormData({...formData, ifsc_code: e.target.value.toUpperCase()})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-200 font-mono"
                      placeholder="e.g., IDIB000X048"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      name="account_number"
                      required
                      value={formData.account_number}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-200 font-mono"
                      placeholder="Account number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Account Holder Name *
                  </label>
                  <input
                    type="text"
                    name="account_name"
                    required
                    value={formData.account_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-200"
                    placeholder="e.g., Your Company Name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Routing Number
                    </label>
                    <input
                      type="text"
                      name="routing_number"
                      value={formData.routing_number}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-200 font-mono"
                      placeholder="Routing number (if applicable)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      SWIFT Code
                    </label>
                    <input
                      type="text"
                      name="swift_code"
                      value={formData.swift_code}
                      onChange={(e) => setFormData({...formData, swift_code: e.target.value.toUpperCase()})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-200 font-mono"
                      placeholder="SWIFT code (if applicable)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Instructions
                  </label>
                  <textarea
                    name="instructions"
                    value={formData.instructions}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-200"
                    placeholder="Special instructions for customers making payments..."
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-[#CDA435] border-gray-300 rounded focus:ring-[#CDA435]"
                  />
                  <label htmlFor="is_active" className="text-sm font-semibold text-gray-700">
                    Set as active bank details
                  </label>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#CDA435] to-[#D9B95B] text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {editingId ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingId ? 'Update Bank Details' : 'Create Bank Details'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankDetailsManager;