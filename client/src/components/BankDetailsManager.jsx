import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';

const BankDetailsManager = ({ onBankDetailsSelect, selectedBankDetailsId }) => {
  const [bankDetails, setBankDetails] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
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
      setLoading(true);
      const response = await api.get('/payments/company-bank-details');
      setBankDetails(response.data || []);
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
    try {
      setLoading(true);
      
      if (editingId) {
        await api.put(`/payments/company-bank-details/${editingId}`, formData);
        toast.success('Bank details updated successfully');
      } else {
        await api.post('/payments/company-bank-details', formData);
        toast.success('Bank details created successfully');
      }
      
      resetForm();
      fetchBankDetails();
    } catch (error) {
      console.error('Error saving bank details:', error);
      toast.error('Failed to save bank details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bankDetail) => {
    setFormData({
      bank_name: bankDetail.bank_name,
      branch_name: bankDetail.branch_name,
      branch_address: bankDetail.branch_address,
      ifsc_code: bankDetail.ifsc_code,
      account_number: bankDetail.account_number,
      account_holder_name: bankDetail.account_holder_name,
      swift_code: bankDetail.swift_code || '',
      routing_number: bankDetail.routing_number || '',
      instructions: bankDetail.instructions || '',
      is_default: bankDetail.is_default
    });
    setEditingId(bankDetail.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bank detail?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/payments/company-bank-details/${id}`);
      toast.success('Bank details deleted successfully');
      fetchBankDetails();
    } catch (error) {
      console.error('Error deleting bank details:', error);
      toast.error('Failed to delete bank details');
    } finally {
      setLoading(false);
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

  return (
    <div className="bank-details-manager">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Bank Details Management</h4>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
          disabled={loading}
        >
          Add Bank Details
        </button>
      </div>

      {/* Bank Details List */}
      {loading && bankDetails.length === 0 ? (
        <div className="text-center py-4">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="row">
          {bankDetails.map((bankDetail) => (
            <div key={bankDetail.id} className="col-md-6 mb-3">
              <div className={`card ${selectedBankDetailsId === bankDetail.id ? 'border-primary' : ''}`}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="card-title mb-0">
                      {bankDetail.bank_name}
                      {bankDetail.is_default && (
                        <span className="badge bg-success ms-2">Default</span>
                      )}
                    </h6>
                    <div className="dropdown">
                      <button 
                        className="btn btn-sm btn-outline-secondary dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                      >
                        Actions
                      </button>
                      <ul className="dropdown-menu">
                        <li>
                          <button 
                            className="dropdown-item"
                            onClick={() => handleEdit(bankDetail)}
                          >
                            Edit
                          </button>
                        </li>
                        <li>
                          <button 
                            className="dropdown-item text-danger"
                            onClick={() => handleDelete(bankDetail.id)}
                          >
                            Delete
                          </button>
                        </li>
                        {onBankDetailsSelect && (
                          <li>
                            <button 
                              className="dropdown-item"
                              onClick={() => onBankDetailsSelect(bankDetail.id)}
                            >
                              Select for Quote
                            </button>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="small text-muted">
                    <div><strong>Branch:</strong> {bankDetail.branch_name}</div>
                    <div><strong>Account:</strong> {bankDetail.account_number}</div>
                    <div><strong>Holder:</strong> {bankDetail.account_holder_name}</div>
                    <div><strong>IFSC:</strong> {bankDetail.ifsc_code}</div>
                    {bankDetail.swift_code && (
                      <div><strong>SWIFT:</strong> {bankDetail.swift_code}</div>
                    )}
                  </div>
                  
                  {bankDetail.instructions && (
                    <div className="mt-2">
                      <small className="text-info">
                        <strong>Instructions:</strong> {bankDetail.instructions}
                      </small>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {bankDetails.length === 0 && !loading && (
        <div className="text-center py-5">
          <div className="text-muted">
            <i className="fas fa-university fa-3x mb-3"></i>
            <h5>No Bank Details Found</h5>
            <p>Add your first bank details to start receiving payments</p>
          </div>
        </div>
      )}

      {/* Bank Details Form Modal */}
      {showForm && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingId ? 'Edit Bank Details' : 'Add Bank Details'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={resetForm}
                ></button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Bank Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="bank_name"
                        value={formData.bank_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Branch Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="branch_name"
                        value={formData.branch_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="col-12 mb-3">
                      <label className="form-label">Branch Address</label>
                      <textarea
                        className="form-control"
                        name="branch_address"
                        value={formData.branch_address}
                        onChange={handleInputChange}
                        rows="2"
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label">IFSC Code *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="ifsc_code"
                        value={formData.ifsc_code}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Account Number *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="account_number"
                        value={formData.account_number}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="col-12 mb-3">
                      <label className="form-label">Account Holder Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="account_holder_name"
                        value={formData.account_holder_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label">SWIFT Code</label>
                      <input
                        type="text"
                        className="form-control"
                        name="swift_code"
                        value={formData.swift_code}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Routing Number</label>
                      <input
                        type="text"
                        className="form-control"
                        name="routing_number"
                        value={formData.routing_number}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="col-12 mb-3">
                      <label className="form-label">Payment Instructions</label>
                      <textarea
                        className="form-control"
                        name="instructions"
                        value={formData.instructions}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Any special instructions for customers making payments..."
                      />
                    </div>
                    
                    <div className="col-12 mb-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          name="is_default"
                          checked={formData.is_default}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label">
                          Set as default bank details
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : (editingId ? 'Update' : 'Save')}
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