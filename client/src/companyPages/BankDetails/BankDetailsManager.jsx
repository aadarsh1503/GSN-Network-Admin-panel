import { useState, useEffect } from 'react';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaBank, 
  FaCheck, 
  FaTimes,
  FaStar,
  FaRegStar
} from 'react-icons/fa';
import { 
  CreditCard, 
  Building, 
  MapPin, 
  Hash,
  User,
  Globe,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';

const BankDetailsManager = () => {
  const [bankDetails, setBankDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    bank_name: '',
    branch_name: '',
    branch_address: '',
    ifsc_code: '',
    account_number: '',
    account_holder_name: '',
    swift_code: '',
    routing_number: '',
    instructions: '',
    is_default: false
  });

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      const data = await api.get('/api/payments/company-bank-details');
      setBankDetails(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching bank details:', error);
      toast.error('Failed to fetch bank details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await api.put(`/api/payments/company-bank-details/${editingId}`, formData);
        toast.success('Bank details updated successfully');
      } else {
        await api.post('/api/payments/company-bank-details', formData);
        toast.success('Bank details created successfully');
      }
      
      resetForm();
      fetchBankDetails();
    } catch (error) {
      console.error('Error saving bank details:', error);
      toast.error(error.message || 'Failed to save bank details');
    }
  };

  const handleEdit = (bankDetail) => {
    setFormData(bankDetail);
    setEditingId(bankDetail.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bank detail?')) {
      return;
    }

    try {
      await api.delete(`/api/payments/company-bank-details/${id}`);
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
      branch_address: '',
      ifsc_code: '',
      account_number: '',
      account_holder_name: '',
      swift_code: '',
      routing_number: '',
      instructions: '',
      is_default: false
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#bca142] mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-black">Loading bank details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-8 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#bca142] mb-2">
              Bank Details Management
            </h1>
            <p className="text-black text-lg">Manage your company's bank accounts for quote responses</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 bg-[#bca142] hover:bg-[#a89139] text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <FaPlus className="h-4 w-4" />
            <span>Add Bank Details</span>
          </button>
        </div>
      </div>

      {/* Bank Details List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {bankDetails.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-gray-200">
            <div className="bg-gray-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <FaBank className="text-gray-400 h-16 w-16" />
            </div>
            <h3 className="text-2xl font-bold text-black mb-4">No Bank Details Yet</h3>
            <p className="text-gray-600 mb-6">Add your first bank account to start receiving payments</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center space-x-2 bg-[#bca142] hover:bg-[#a89139] text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FaPlus className="h-4 w-4" />
              <span>Add Bank Details</span>
            </button>
          </div>
        ) : (
          bankDetails.map((bank) => (
            <div
              key={bank.id}
              className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-xl transition-all duration-300"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-[#bca142] rounded-2xl">
                    <FaBank className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black">{bank.bank_name}</h3>
                    <p className="text-sm text-gray-600">{bank.branch_name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {bank.is_default && (
                    <div className="flex items-center space-x-1 bg-[#bca142] text-white px-2 py-1 rounded-full text-xs font-medium">
                      <FaStar className="h-3 w-3" />
                      <span>Default</span>
                    </div>
                  )}
                  <button
                    onClick={() => handleEdit(bank)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-300"
                  >
                    <FaEdit className="h-4 w-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(bank.id)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-300"
                  >
                    <FaTrash className="h-4 w-4 text-black" />
                  </button>
                </div>
              </div>

              {/* Bank Details */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                    <User className="h-4 w-4 text-[#bca142]" />
                    <div>
                      <p className="text-xs text-gray-500">Account Holder</p>
                      <p className="text-sm font-medium text-black">{bank.account_holder_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                    <CreditCard className="h-4 w-4 text-[#bca142]" />
                    <div>
                      <p className="text-xs text-gray-500">Account Number</p>
                      <p className="text-sm font-medium text-black">
                        ****{bank.account_number.slice(-4)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                    <Hash className="h-4 w-4 text-[#bca142]" />
                    <div>
                      <p className="text-xs text-gray-500">IFSC Code</p>
                      <p className="text-sm font-medium text-black">{bank.ifsc_code}</p>
                    </div>
                  </div>

                  {bank.swift_code && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                      <Globe className="h-4 w-4 text-[#bca142]" />
                      <div>
                        <p className="text-xs text-gray-500">SWIFT Code</p>
                        <p className="text-sm font-medium text-black">{bank.swift_code}</p>
                      </div>
                    </div>
                  )}

                  {bank.branch_address && (
                    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl">
                      <MapPin className="h-4 w-4 text-[#bca142] mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Branch Address</p>
                        <p className="text-sm text-black">{bank.branch_address}</p>
                      </div>
                    </div>
                  )}

                  {bank.instructions && (
                    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl">
                      <FileText className="h-4 w-4 text-[#bca142] mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Instructions</p>
                        <p className="text-sm text-black">{bank.instructions}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">
                {editingId ? 'Edit Bank Details' : 'Add Bank Details'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-300"
              >
                <FaTimes className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    name="bank_name"
                    value={formData.bank_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                    placeholder="Enter bank name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    name="branch_name"
                    value={formData.branch_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                    placeholder="Enter branch name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Account Holder Name *
                  </label>
                  <input
                    type="text"
                    name="account_holder_name"
                    value={formData.account_holder_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                    placeholder="Enter account holder name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    name="account_number"
                    value={formData.account_number}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                    placeholder="Enter account number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    name="ifsc_code"
                    value={formData.ifsc_code}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                    placeholder="Enter IFSC code"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    SWIFT Code
                  </label>
                  <input
                    type="text"
                    name="swift_code"
                    value={formData.swift_code}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                    placeholder="Enter SWIFT code (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Routing Number
                  </label>
                  <input
                    type="text"
                    name="routing_number"
                    value={formData.routing_number}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                    placeholder="Enter routing number (optional)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Branch Address
                </label>
                <textarea
                  name="branch_address"
                  value={formData.branch_address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                  placeholder="Enter branch address (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Payment Instructions
                </label>
                <textarea
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
                  placeholder="Enter any special payment instructions (optional)"
                />
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_default"
                  name="is_default"
                  checked={formData.is_default}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-[#bca142] bg-gray-100 border-gray-300 rounded focus:ring-[#bca142]"
                />
                <label htmlFor="is_default" className="text-sm font-medium text-black">
                  Set as default bank account
                </label>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-black rounded-xl transition-colors duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 bg-[#bca142] hover:bg-[#a89139] text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <FaCheck className="h-4 w-4" />
                  <span>{editingId ? 'Update' : 'Create'} Bank Details</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankDetailsManager;