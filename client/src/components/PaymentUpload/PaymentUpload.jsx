import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import './PaymentUpload.css';

const PaymentUpload = ({ quote, onClose, onSuccess }) => {
  const [paymentFile, setPaymentFile] = useState(null);
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (file) => {
    if (file) {
      // Validate file type - Only allow JPG, JPEG, and PNG files
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      const allowedExtensions = ['.jpg', '.jpeg', '.png'];
      
      // Check MIME type
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        toast.error('Please upload only JPG, JPEG, or PNG image files');
        return;
      }

      // Double-check file extension as backup validation
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!allowedExtensions.includes(fileExtension)) {
        toast.error('Please upload only JPG, JPEG, or PNG image files');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setPaymentFile(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!paymentFile) {
      toast.error('Please upload payment proof');
      return;
    }

    if (!paymentDate) {
      toast.error('Please select payment date');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('payment_proof', paymentFile);
      formData.append('quote_id', quote.quote_id);
      formData.append('quote_response_id', quote.id);
      formData.append('payment_date', paymentDate);
      formData.append('payment_notes', paymentNotes);

      await api.post('/api/enhanced-quotes/upload-payment-proof', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Payment proof uploaded successfully! The company will verify your payment before work begins.');
      onSuccess && onSuccess();
      onClose && onClose();
    } catch (error) {
      console.error('Error uploading payment proof:', error);
      toast.error(error.response?.data?.message || 'Failed to upload payment proof');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setPaymentFile(null);
  };

  return (
    <div className="payment-upload">
      <div className="upload-header">
        <h3>Upload Payment Proof</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="quote-summary">
        <h4>Quote Summary</h4>
        <div className="quote-details">
          <p><strong>Quote ID:</strong> #{quote.quote_id}</p>
          <p><strong>Amount:</strong> ${quote.amount}</p>
          <p><strong>Company:</strong> {quote.company_name}</p>
          <p><strong>Transit Time:</strong> {quote.transit_time}</p>
        </div>

        {quote.bank_details && (
          <div className="bank-details">
            <h5>Payment Details:</h5>
            <div className="bank-info">
              <p><strong>Bank Name:</strong> {quote.bank_details.bank_name}</p>
              <p><strong>Account Holder:</strong> {quote.bank_details.account_holder_name}</p>
              <p><strong>Account Number:</strong> {quote.bank_details.account_number}</p>
              {quote.bank_details.routing_number && (
                <p><strong>Routing Number:</strong> {quote.bank_details.routing_number}</p>
              )}
              {quote.bank_details.swift_code && (
                <p><strong>SWIFT Code:</strong> {quote.bank_details.swift_code}</p>
              )}
              {quote.bank_details.ifsc_code && (
                <p><strong>IFSC Code:</strong> {quote.bank_details.ifsc_code}</p>
              )}
              {quote.bank_details.iban_number && (
                <p><strong>IBAN Number:</strong> {quote.bank_details.iban_number}</p>
              )}
              {quote.bank_details.branch_name && (
                <p><strong>Branch:</strong> {quote.bank_details.branch_name}</p>
              )}
              {quote.bank_details.branch_address && (
                <p><strong>Branch Address:</strong> {quote.bank_details.branch_address}</p>
              )}
              {quote.bank_details.payment_instructions && (
                <div className="payment-instructions">
                  <p><strong>Payment Instructions:</strong></p>
                  <p className="instructions-text">{quote.bank_details.payment_instructions}</p>
                </div>
              )}
              {quote.bank_details.instructions && (
                <div className="payment-instructions">
                  <p><strong>Instructions:</strong></p>
                  <p className="instructions-text">{quote.bank_details.instructions}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label>Payment Date *</label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className="form-group">
          <label>Payment Proof * (JPG, JPEG, PNG only)</label>
          <div 
            className={`file-upload-area ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {!paymentFile ? (
              <>
                <div className="upload-icon">📁</div>
                <p>Drag and drop your payment proof here, or</p>
                <label className="file-input-label">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={handleFileChange}
                    hidden
                  />
                  Choose File
                </label>
                <p className="file-info">Supported: JPG, JPEG, PNG only (Max 5MB)</p>
              </>
            ) : (
              <div className="file-preview">
                <div className="file-info-display">
                  <span className="file-name">{paymentFile.name}</span>
                  <span className="file-size">
                    ({(paymentFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button 
                  type="button" 
                  className="remove-file-btn"
                  onClick={removeFile}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Additional Notes (Optional)</label>
          <textarea
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            rows="3"
            placeholder="Any additional information about the payment..."
          />
        </div>

        <div className="upload-warning">
          <p><strong>Important:</strong> Please ensure your payment proof clearly shows:</p>
          <ul>
            <li>Transaction amount matching the quote</li>
            <li>Payment date</li>
            <li>Recipient account details</li>
            <li>Transaction reference/ID</li>
          </ul>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn-upload" 
            disabled={uploading || !paymentFile}
          >
            {uploading ? 'Uploading...' : 'Accept Quote & Upload Proof'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentUpload;