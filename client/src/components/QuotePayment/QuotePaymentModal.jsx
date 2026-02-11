import { useState, useEffect, useRef } from 'react';
import { FaPaypal, FaUniversity, FaTimes } from 'react-icons/fa';
import { FiAlertCircle, FiUpload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';
import './QuotePaymentModal.css';

const QuotePaymentModal = ({ quote, onClose, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  
  // Bank Transfer State
  const [paymentFile, setPaymentFile] = useState(null);
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const paypalRef = useRef(null);

  const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

  useEffect(() => {
    loadPayPalScript();
  }, []);

  useEffect(() => {
    if (paypalLoaded && paymentMethod === 'paypal' && quote) {
      const timer = setTimeout(() => {
        renderPayPalButtons();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [paypalLoaded, paymentMethod, quote]);

  const loadPayPalScript = () => {
    if (window.paypal) {
      setPaypalLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
    script.async = true;
    script.onload = () => setPaypalLoaded(true);
    script.onerror = () => {
      console.error('Failed to load PayPal SDK');
      toast.error('Failed to load PayPal. Please try bank transfer.');
    };
    document.body.appendChild(script);
  };

  const renderPayPalButtons = () => {
    if (!paypalRef.current || !window.paypal) return;

    paypalRef.current.innerHTML = '';

    const amount = quote.amount || quote.price;

    window.paypal.Buttons({
      createOrder: (data, actions) => {
        return actions.order.create({
          purchase_units: [{
            description: `Quote #${quote.quote_id} - ${quote.company_name}`,
            amount: {
              currency_code: 'USD',
              value: amount
            }
          }]
        });
      },
      onApprove: async (data, actions) => {
        try {
          const order = await actions.order.capture();
          await handlePayPalSuccess(order);
        } catch (error) {
          console.error('PayPal capture error:', error);
          toast.error('Payment capture failed. Please contact support.', {
            duration: 10000
          });
        }
      },
      onError: (err) => {
        console.error('PayPal error:', err);
        toast.error('Payment failed. Please try again or use bank transfer.', {
          duration: 10000
        });
      },
      onCancel: () => {
        toast.info('Payment cancelled');
      },
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'paypal'
      }
    }).render(paypalRef.current);
  };

  const handlePayPalSuccess = async (order) => {
    try {
      const loadingToast = toast.loading('Processing your payment...');
      
      const formData = new FormData();
      formData.append('quote_id', quote.quote_id);
      formData.append('quote_response_id', quote.id);
      formData.append('payment_method', 'paypal');
      formData.append('paypal_order_id', order.id);
      formData.append('paypal_payer_id', order.payer.payer_id);
      formData.append('payment_details', JSON.stringify(order));
      formData.append('payment_date', new Date().toISOString().split('T')[0]);

      console.log('📤 Submitting PayPal payment:', {
        quote_id: quote.quote_id,
        quote_response_id: quote.id,
        order_id: order.id
      });

      const response = await api.post('/api/enhanced-quotes/upload-payment-proof', formData);

      toast.dismiss(loadingToast);
      toast.success('✅ Payment successful! The company will verify and begin work.', {
        duration: 5000
      });
      
      onSuccess && onSuccess();
      onClose && onClose();
      
    } catch (error) {
      console.error('Payment submission error:', error);
      toast.error(error.response?.data?.message || 'Failed to process payment');
    }
  };

  // Bank Transfer Functions
  const handleFileSelect = (file) => {
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      const allowedExtensions = ['.jpg', '.jpeg', '.png'];
      
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        toast.error('Please upload only JPG, JPEG, or PNG image files');
        return;
      }

      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!allowedExtensions.includes(fileExtension)) {
        toast.error('Please upload only JPG, JPEG, or PNG image files');
        return;
      }

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

  const handleBankTransferSubmit = async (e) => {
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
      formData.append('payment_method', 'bank_transfer');
      formData.append('payment_date', paymentDate);
      formData.append('payment_notes', paymentNotes);

      console.log('📤 Uploading bank transfer proof:', {
        quote_id: quote.quote_id,
        quote_response_id: quote.id,
        payment_date: paymentDate,
        file_name: paymentFile.name
      });

      const response = await api.post('/api/enhanced-quotes/upload-payment-proof', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.async) {
        toast.success('Payment proof uploaded successfully! Email notifications are being sent.', {
          duration: 6000
        });
      } else {
        toast.success('Payment proof uploaded successfully! The company will verify your payment.');
      }
      
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
    <div className="quote-payment-modal-overlay">
      <div className="quote-payment-modal">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2>Complete Payment</h2>
            <p className="text-sm text-gray-600">Quote #{quote.quote_id} - ${quote.amount || quote.price}</p>
          </div>
          <button onClick={onClose} className="close-button">
            <FaTimes />
          </button>
        </div>

        {/* Quote Summary */}
        <div className="quote-summary-compact">
          <div className="summary-row">
            <span className="label">Company:</span>
            <span className="value">{quote.company_name}</span>
          </div>
          <div className="summary-row">
            <span className="label">Amount:</span>
            <span className="value amount">${quote.amount || quote.price}</span>
          </div>
          <div className="summary-row">
            <span className="label">Transit Time:</span>
            <span className="value">{quote.transit_time}</span>
          </div>
        </div>

        {/* Payment Method Tabs */}
        <div className="payment-tabs">
          <button
            onClick={() => setPaymentMethod('paypal')}
            className={`tab ${paymentMethod === 'paypal' ? 'active' : ''}`}
          >
            <FaPaypal className="tab-icon" />
            <span>PayPal</span>
          </button>
          <button
            onClick={() => setPaymentMethod('bank')}
            className={`tab ${paymentMethod === 'bank' ? 'active' : ''}`}
          >
            <FaUniversity className="tab-icon" />
            <span>Bank Transfer</span>
          </button>
        </div>

        {/* Payment Content */}
        <div className="payment-content">
          {paymentMethod === 'paypal' ? (
            <div className="paypal-section">
              <div className="info-box">
                <FiAlertCircle className="info-icon" />
                <p>Secure payment via PayPal. The company will verify and begin work.</p>
              </div>
              {paypalLoaded ? (
                <div ref={paypalRef} className="paypal-buttons"></div>
              ) : (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading PayPal...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bank-section">
              {/* Bank Details */}
              {quote.bank_details && (
                <div className="bank-details-card">
                  <h4>Transfer to this account:</h4>
                  <div className="bank-info-grid">
                    {quote.bank_details.bank_name && (
                      <div className="info-item">
                        <span className="info-label">Bank Name</span>
                        <span className="info-value">{quote.bank_details.bank_name}</span>
                      </div>
                    )}
                    {quote.bank_details.account_holder_name && (
                      <div className="info-item">
                        <span className="info-label">Account Holder</span>
                        <span className="info-value">{quote.bank_details.account_holder_name}</span>
                      </div>
                    )}
                    {quote.bank_details.account_number && (
                      <div className="info-item">
                        <span className="info-label">Account Number</span>
                        <span className="info-value">{quote.bank_details.account_number}</span>
                      </div>
                    )}
                    {quote.bank_details.swift_code && (
                      <div className="info-item">
                        <span className="info-label">SWIFT Code</span>
                        <span className="info-value">{quote.bank_details.swift_code}</span>
                      </div>
                    )}
                    {quote.bank_details.ifsc_code && (
                      <div className="info-item">
                        <span className="info-label">IFSC Code</span>
                        <span className="info-value">{quote.bank_details.ifsc_code}</span>
                      </div>
                    )}
                    {quote.bank_details.iban_number && (
                      <div className="info-item">
                        <span className="info-label">IBAN</span>
                        <span className="info-value">{quote.bank_details.iban_number}</span>
                      </div>
                    )}
                    {quote.bank_details.branch_name && (
                      <div className="info-item">
                        <span className="info-label">Branch</span>
                        <span className="info-value">{quote.bank_details.branch_name}</span>
                      </div>
                    )}
                  </div>
                  {quote.bank_details.payment_instructions && (
                    <div className="instructions-box">
                      <strong>Instructions:</strong>
                      <p>{quote.bank_details.payment_instructions}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Form */}
              <form onSubmit={handleBankTransferSubmit} className="upload-form">
                <div className="form-group">
                  <label>Payment Date *</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    required
                    className="date-input"
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
                        <FiUpload className="upload-icon" />
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
                        <p className="file-info">JPG, JPEG, PNG only (Max 5MB)</p>
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
                    className="notes-textarea"
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={onClose}>
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-submit" 
                    disabled={uploading || !paymentFile}
                  >
                    {uploading ? (
                      <>
                        <div className="spinner-small"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      'Upload Payment Proof'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Security Note */}
        <div className="security-note">
          🔒 Your payment information is secure and encrypted
        </div>
      </div>
    </div>
  );
};

export default QuotePaymentModal;
