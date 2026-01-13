import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiCheck, 
  FiCreditCard, FiGlobe, FiMapPin, FiInfo, FiAlertCircle
} from 'react-icons/fi';
import { api } from '../../utils/api';

const BankDetailsManager = () => {
  const [bankDetails, setBankDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    bank_name: '',
    branch_name: '',
    iban_number: '',
    account_number: '',
    account_holder_name: '',
    swift_code: '',
    payment_instructions: '',
    is_active: true
  });

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      const data = await api.get('/api/bank-details');
      setBankDetails(data);
    } catch (error) {
      console.error('Error fetching bank details:', error);
      toast.error('Failed to load bank details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await api.put(`/api/bank-details/${editingId}`, formData);
        toast.success('Bank details updated successfully');
      } else {
        await api.post('/api/bank-details', formData);
        toast.success('Bank details created successfully');
      }
      
      resetForm();
      fetchBankDetails();
    } catch (error) {
      console.error('Error saving bank details:', error);
      toast.error(error.response?.data?.message || 'Failed to save bank details');
    }
  };

  const handleEdit = (bankDetail) => {
    setFormData({
      bank_name: bankDetail.bank_name || '',
      branch_name: bankDetail.branch_name || '',
      iban_number: bankDetail.iban_number || '',
      account_number: bankDetail.account_number || '',
      account_holder_name: bankDetail.account_holder_name || '',
      swift_code: bankDetail.swift_code || '',
      payment_instructions: bankDetail.payment_instructions || '',
      is_active: bankDetail.is_active || false
    });
    setEditingId(bankDetail.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bank detail?')) {
      return;
    }

    try {
      await api.delete(`/api/bank-details/${id}`);
      toast.success('Bank details deleted successfully');
      fetchBankDetails();
    } catch (error) {
      console.error('Error deleting bank details:', error);
      toast.error('Failed to delete bank details');
    }
  };

  const resetForm = () => {
    setFormData({
      bank_name: '',
      branch_name: '',
      iban_number: '',
      account_number: '',
      account_holder_name: '',
      swift_code: '',
      payment_instructions: '',
      is_active: true
    });
    setEditingId(null);
    setShowForm(false);
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CDA435]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <FiCreditCard className="text-[#CDA435]" />
                Company Bank Details
              </h1>
              <p className="text-gray-600 mt-1">Manage your company's bank account details for receiving payments</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-[#CDA435] text-white rounded-lg hover:bg-[#B8941F] transition-colors flex items-center gap-2"
            >
              <FiPlus />
              Add Bank Details
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <FiInfo className="text-blue-500 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-800 mb-1">Bank Details Information</h3>
              <p className="text-blue-700 text-sm mb-2">
                Add your company's bank account details that customers will use for payments when responding to quotes.
              </p>
              <div className="text-blue-700 text-sm">
                <strong>Field Guidelines:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><strong>IBAN Number:</strong> Required for all bank accounts (e.g., GB29 NWBK 6016 1331 9268 19)</li>
                  <li><strong>SWIFT Code:</strong> Required for all transfers</li>
                  <li><strong>Payment Instructions:</strong> Additional guidance for customers making payments</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Details List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Your Bank Details</h2>
          </div>
          
          {bankDetails.length === 0 ? (
            <div className="p-8 text-center">
              <FiCreditCard className="mx-auto text-4xl text-gray-400 mb-4" />
              <p className="text-gray-500">No bank details added yet</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 bg-[#CDA435] text-white rounded-lg hover:bg-[#B8941F] transition-colors"
              >
                Add Your First Bank Details
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Info</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Codes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bankDetails.map((bank) => (
                    <tr key={bank.id} className={bank.is_active ? 'bg-green-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          bank.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {bank.is_active ? (
                            <>
                              <FiCheck className="mr-1" />
                              Active
                            </>
                          ) : (
                            'Inactive'
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{bank.bank_name}</div>
                          <div className="text-sm text-gray-500">{bank.branch_name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{bank.account_holder_name}</div>
                          <div className="text-sm text-gray-500 font-mono">{bank.account_number}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {bank.iban_number && (
                            <div className="flex items-center gap-2">
                              <FiGlobe className="text-gray-400 text-xs" />
                              <span className="text-xs text-gray-600">IBAN: {bank.iban_number}</span>
                            </div>
                          )}
                          {bank.swift_code && (
                            <div className="flex items-center gap-2">
                              <FiGlobe className="text-gray-400 text-xs" />
                              <span className="text-xs text-gray-600">SWIFT: {bank.swift_code}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(bank)}
                            className="text-indigo-600 hover:text-indigo-900 p-1"
                            title="Edit"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDelete(bank.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">
                    {editingId ? 'Edit Bank Details' : 'Add New Bank Details'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bank Name *
                      </label>
                      <input
                        type="text"
                        name="bank_name"
                        value={formData.bank_name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CDA435]"
                        placeholder="e.g., State Bank of India"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Branch Name *
                      </label>
                      <input
                        type="text"
                        name="branch_name"
                        value={formData.branch_name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CDA435]"
                        placeholder="e.g., Mumbai Central Branch"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Holder Name *
                      </label>
                      <input
                        type="text"
                        name="account_holder_name"
                        value={formData.account_holder_name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CDA435]"
                        placeholder="e.g., Your Company Name Pvt Ltd"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Number *
                      </label>
                      <input
                        type="text"
                        name="account_number"
                        value={formData.account_number}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CDA435]"
                        placeholder="e.g., 12345678901234"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        IBAN Number *
                      </label>
                      <input
                        type="text"
                        name="iban_number"
                        value={formData.iban_number}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CDA435]"
                        placeholder="e.g., GB29 NWBK 6016 1331 9268 19"
                      />
                      <p className="text-xs text-gray-500 mt-1">Required for all bank accounts</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SWIFT Code *
                      </label>
                      <input
                        type="text"
                        name="swift_code"
                        value={formData.swift_code}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CDA435]"
                        placeholder="e.g., SBININBB123"
                      />
                      <p className="text-xs text-gray-500 mt-1">Required for all transfers</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Instructions (Optional)
                    </label>
                    <textarea
                      name="payment_instructions"
                      value={formData.payment_instructions}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CDA435]"
                      placeholder="Additional instructions for customers making payments..."
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-[#CDA435] focus:ring-[#CDA435] border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                      Set as active bank account
                    </label>
                  </div>

                  {(!formData.iban_number || !formData.swift_code) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <div className="flex items-center gap-2">
                        <FiAlertCircle className="text-yellow-600" />
                        <p className="text-sm text-yellow-800">
                          {!formData.iban_number && !formData.swift_code 
                            ? 'Please provide both IBAN number and SWIFT code for the bank account'
                            : !formData.iban_number 
                            ? 'Please provide the IBAN number for the bank account'
                            : 'Please provide the SWIFT code for the bank account'
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!formData.iban_number || !formData.swift_code}
                      className="px-4 py-2 bg-[#CDA435] text-white rounded-md hover:bg-[#B8941F] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiSave />
                      {editingId ? 'Update' : 'Create'} Bank Details
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BankDetailsManager;