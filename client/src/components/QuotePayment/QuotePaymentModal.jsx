import { useState } from 'react';
import { FaPaypal, FaUniversity, FaTimes } from 'react-icons/fa';
import { FiAlertCircle, FiUpload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api, isPaypalSandbox } from '../../utils/api';
import { useCurrency } from '../../contexts/CurrencyContext';
import './QuotePaymentModal.css';

const QuotePaymentModal = ({ quote, onClose, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState(quote.company_paypal_email ? 'paypal' : 'bank');

  // Payment proof state (shared by PayPal and Bank Transfer)
  const [paymentFile, setPaymentFile] = useState(null);
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Quote amounts are stored in USD; show them in the buyer's local currency with
  // the USD equivalent underneath. (The PayPal charge itself stays in USD below.)
  const { format, formatUsd } = useCurrency();

  const finalAmount = Number(quote.amount || quote.price) || 0;

  // PayPal cannot send funds to a third party from an embedded checkout, so hand off to
  // PayPal's hosted payment page with the company's email as the receiver. The money goes
  // straight to the company; there is no server-side confirmation, hence the receipt upload.
  const buildPaypalPayLink = () => {
    const params = new URLSearchParams({
      cmd: '_xclick',
      business: quote.company_paypal_email,
      item_name: `Quote #${quote.quote_id} - ${quote.company_name}`,
      amount: finalAmount.toFixed(2),
      currency_code: 'USD',
      no_shipping: '1',
    });
    const host = isPaypalSandbox()
      ? 'https://www.sandbox.paypal.com'
      : 'https://www.paypal.com';
    return `${host}/cgi-bin/webscr?${params.toString()}`;
  };

  // Opens the checkout in a centred, modal-sized popup instead of a full new tab so it
  // feels on-site. The window is named, so repeat clicks reuse it instead of stacking up.
  const handleOpenPaypal = () => {
    const width = 500;
    const height = 720;
    const screenLeft = window.screenLeft ?? window.screenX ?? 0;
    const screenTop = window.screenTop ?? window.screenY ?? 0;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || screen.width;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || screen.height;
    const left = Math.max(0, screenLeft + (viewportWidth - width) / 2);
    const top = Math.max(0, screenTop + (viewportHeight - height) / 2);

    const popup = window.open(
      buildPaypalPayLink(),
      'gsnPaypalCheckout',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );

    if (!popup) {
      // Popup blocked — fall back to a normal tab so the payment can still go through
      window.open(buildPaypalPayLink(), '_blank', 'noopener,noreferrer');
      toast.error('Popup was blocked. PayPal opened in a new tab instead.', { duration: 6000 });
      return;
    }

    try {
      popup.opener = null;
    } catch {
      // Cross-origin windows can refuse this; harmless
    }
    popup.focus();
    toast.success('Complete the payment in the PayPal window, then upload the receipt below.', {
      duration: 6000,
    });
  };

  // File selection (JPG/JPEG/PNG only, max 5MB)
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

  const removeFile = () => {
    setPaymentFile(null);
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
      formData.append('payment_method', paymentMethod === 'bank' ? 'bank_transfer' : 'paypal');
      formData.append('payment_date', paymentDate);
      formData.append('payment_notes', paymentNotes);

      console.log('📤 Uploading payment proof:', {
        quote_id: quote.quote_id,
        quote_response_id: quote.id,
        payment_method: paymentMethod,
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

  // Shared upload form (used by both PayPal and Bank Transfer tabs)
  const renderUploadForm = () => (
    <form onSubmit={handleSubmit} className="upload-form">
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
        <label>Payment Receipt * (JPG, JPEG, PNG only)</label>
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
              <p>Drag and drop your payment receipt here, or</p>
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
  );

  return (
    <div className="quote-payment-modal-overlay">
      <div className="quote-payment-modal">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2>Complete Payment</h2>
            <p className="text-sm text-gray-600">Quote #{quote.quote_id} - {format(finalAmount, 'USD')}</p>
            <p className="text-xs text-gray-400">≈ {formatUsd(finalAmount, 'USD')}</p>
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
            <span className="value amount">
              {format(finalAmount, 'USD')}
              <span className="block text-xs font-normal text-gray-400">≈ {formatUsd(finalAmount, 'USD')}</span>
            </span>
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
              {quote.company_paypal_email ? (
                <>
                  <div className="info-box">
                    <FiAlertCircle className="info-icon" />
                    <p>
                      Pay <strong>{format(finalAmount, 'USD')}</strong> to the company's PayPal account
                      below, then upload the payment receipt. The company will verify and begin work.
                      <span className="block text-xs text-gray-400">≈ {formatUsd(finalAmount, 'USD')}</span>
                    </p>
                  </div>

                  <div className="bank-details-card">
                    <h4>
                      <FaPaypal style={{ color: '#bca142' }} />
                      Company PayPal Account
                    </h4>
                    <div className="bank-info-grid">
                      <div className="info-item">
                        <span className="info-label">PayPal Email</span>
                        <span className="info-value">{quote.company_paypal_email}</span>
                      </div>
                    </div>
                    <div className="instructions-box">
                      <strong>How to pay:</strong>
                      <p>1. Click <strong>Pay with PayPal</strong> below to open PayPal's secure page and send {format(finalAmount, 'USD')} (<strong>≈ {formatUsd(finalAmount, 'USD')} USD</strong> charged in USD).</p>
                      <p>2. Attach the payment receipt/screenshot (and date) below.</p>
                    </div>
                    <button
                      type="button"
                      className="btn-paypal-pay"
                      onClick={handleOpenPaypal}
                    >
                      <FaPaypal />
                      <span className="flex flex-col items-center leading-tight">
                        <span>Pay {format(finalAmount, 'USD')} with PayPal</span>
                        <span className="text-[10px] font-normal opacity-80">≈ {formatUsd(finalAmount, 'USD')} USD</span>
                      </span>
                    </button>
                  </div>

                  {renderUploadForm()}
                </>
              ) : (
                <div className="info-box">
                  <FiAlertCircle className="info-icon" />
                  <p>This company has not added a PayPal account yet. Please use Bank Transfer.</p>
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

              {renderUploadForm()}
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
