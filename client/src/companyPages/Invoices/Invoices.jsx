import React, { useState, useEffect, useRef } from 'react';
import { FaEye, FaDownload, FaFileInvoiceDollar } from 'react-icons/fa';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import QRScanner from '../../components/QRScanner/QRScanner';
import toast from 'react-hot-toast';
import GSNLogo from './GSN.jpg';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  const invoiceRef = useRef();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/company/invoices');
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = async (invoiceId) => {
    try {
      const invoice = await api.get(`/api/company/invoices/${invoiceId}`);
      setSelectedInvoice(invoice);
      
      // Generate QR code
      const qrUrl = await QRCode.toDataURL(invoice.qr_data);
      setQrCodeUrl(qrUrl);
      
      setShowInvoiceModal(true);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      toast.error('Failed to load invoice details');
    }
  };

  const handleQRScan = (qrData) => {
    try {
      // Display the scanned invoice information
      alert(`Scanned Invoice Data:
      
Invoice: ${qrData.invoiceNumber}
Amount: $${qrData.amount}
Company: ${qrData.company}
Plan: ${qrData.plan}
Status: ${qrData.status}
Date: ${new Date(qrData.date).toLocaleDateString()}`);
      
      setShowQRScanner(false);
    } catch (error) {
      toast.error('Invalid QR code data');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const element = invoiceRef.current;
      if (!element) {
        toast.error('Invoice content not found');
        return;
      }

      // Show loading toast
      const loadingToast = toast.loading('Generating PDF...');

      // Temporarily modify the element for better PDF rendering
      const originalStyle = element.style.cssText;
      element.style.width = '794px'; // A4 width in pixels at 96 DPI
      element.style.maxWidth = '794px';
      element.style.padding = '15px';
      element.style.fontSize = '12px';
      element.style.lineHeight = '1.5';
      element.style.wordSpacing = 'normal';
      element.style.letterSpacing = 'normal';

      // Wait for layout to settle
      await new Promise(resolve => setTimeout(resolve, 200));

      // Create canvas from the invoice element
      const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: element.scrollHeight,
        logging: false,
        letterRendering: true, // Better text rendering
        onclone: (clonedDoc) => {
          // Apply PDF-friendly styles to cloned document
          const style = clonedDoc.createElement('style');
          style.textContent = `
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
              word-spacing: normal !important;
              letter-spacing: normal !important;
              white-space: normal !important;
            }
            body { 
              margin: 0; 
              padding: 0; 
              font-family: Arial, sans-serif !important;
              line-height: 1.5 !important;
            }
            p, div, span {
              word-break: normal !important;
              word-wrap: break-word !important;
              white-space: normal !important;
              word-spacing: normal !important;
              letter-spacing: normal !important;
            }
            /* Specific fix for Bill To section spacing */
            .text-xs p {
              display: block !important;
              margin-bottom: 3px !important;
              line-height: 1.4 !important;
            }
            /* Ensure proper spacing in all text sections */
            p {
              margin-bottom: 3px !important;
            }
            .text-gray-600 { color: rgb(75, 85, 99) !important; }
            .text-gray-500 { color: rgb(107, 114, 128) !important; }
            .text-gray-800 { color: rgb(31, 41, 55) !important; }
            .text-green-600 { color: rgb(0, 0, 0) !important; }
            .bg-green-100 { background-color: rgb(0, 0, 0) !important; }
            .text-green-800 { color: rgb(255, 255, 255) !important; }
            .bg-yellow-100 { background-color: rgb(188, 161, 66) !important; }
            .text-yellow-800 { color: rgb(255, 255, 255) !important; }
            .bg-red-100 { background-color: rgb(156, 163, 175) !important; }
            .text-red-800 { color: rgb(255, 255, 255) !important; }
            .bg-gray-100 { background-color: rgb(243, 244, 246) !important; }
            .bg-gray-50 { background-color: rgb(249, 250, 251) !important; }
            .border-gray-300 { border-color: rgb(209, 213, 219) !important; }
            .border-gray-800 { border-color: rgb(31, 41, 55) !important; }
          `;
          clonedDoc.head.appendChild(style);
        }
      });

      // Restore original styles
      element.style.cssText = originalStyle;

      // Create PDF with better positioning
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Get PDF dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Convert canvas to mm (accounting for higher scale)
      const imgWidthMM = (canvas.width * 0.264583) / 2; // Divide by scale factor
      const imgHeightMM = (canvas.height * 0.264583) / 2;
      
      // Calculate margins - smaller margins for better use of space
      const margin = 5;
      const availableWidth = pdfWidth - (margin * 2);
      const availableHeight = pdfHeight - (margin * 2);
      
      // Scale to fit width
      let scale = availableWidth / imgWidthMM;
      let finalWidth = imgWidthMM * scale;
      let finalHeight = imgHeightMM * scale;
      
      // If height is too large, scale down further
      if (finalHeight > availableHeight) {
        scale = availableHeight / imgHeightMM;
        finalWidth = imgWidthMM * scale;
        finalHeight = imgHeightMM * scale;
      }
      
      // Position at top-left with small margin instead of centering
      const x = margin;
      const y = margin;
      
      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
      
      // Download the PDF
      const fileName = `Invoice_${selectedInvoice.invoice_number}.pdf`;
      pdf.save(fileName);
      
      toast.dismiss(loadingToast);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      paid: 'bg-[#bca142] text-white',
      pending: 'bg-[#bca142] text-white',
      overdue: 'bg-[#bca142] text-white',
      cancelled: 'bg-[#bca142] text-white'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-[#bca142] text-white'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Filter and pagination
  const filteredInvoices = invoices.filter(invoice => {
    const term = searchTerm.toLowerCase();
    return (
      invoice.invoice_number?.toLowerCase().includes(term) ||
      invoice.plan_name?.toLowerCase().includes(term) ||
      invoice.status?.toLowerCase().includes(term)
    );
  });

  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredInvoices.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredInvoices.length / entriesPerPage);

  if (loading) {
    return (
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full">
        <LoadingSpinner size="lg" text="Loading invoices..." />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full">
      <h2 className="text-2xl font-bold text-black mb-6 border-b pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaFileInvoiceDollar className="text-[#bca142]" />
          Invoices
        </div>
       
      </h2>

      {invoices.length === 0 ? (
        <div className="text-center py-12">
          <FaFileInvoiceDollar className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-black mb-2">No Invoices Yet</h3>
          <p className="text-gray-600">Your subscription invoices will appear here when you purchase plans.</p>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-2 text-sm text-black">
              <span>Show</span>
              <select 
                value={entriesPerPage} 
                onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#bca142]"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span>entries</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-black">
              <label htmlFor="search">Search:</label>
              <input 
                id="search"
                type="text" 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Invoice number, plan name..."
                className="border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#bca142]"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-[#bca142] text-white text-sm">
                <tr>
                  <th className="p-3 text-left font-semibold">Invoice #</th>
                  <th className="p-3 text-left font-semibold">Plan</th>
                  <th className="p-3 text-left font-semibold">Amount</th>
                  <th className="p-3 text-left font-semibold">Status</th>
                  <th className="p-3 text-left font-semibold">Date</th>
                  <th className="p-3 text-left font-semibold">Due Date</th>
                  <th className="p-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentEntries.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-3 text-sm text-black font-mono">{invoice.invoice_number}</td>
                    <td className="p-3 text-sm text-black">
                      <span className="font-semibold text-[#bca142]">{invoice.plan_name}</span>
                    </td>
                    <td className="p-3 text-sm text-black">
                      <span className="font-semibold text-black">{formatCurrency(invoice.total_amount)}</span>
                    </td>
                    <td className="p-3 text-sm text-black">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="p-3 text-sm text-black">{formatDate(invoice.created_at)}</td>
                    <td className="p-3 text-sm text-black">{formatDate(invoice.due_date)}</td>
                    <td className="p-3 text-sm text-black">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewInvoice(invoice.id)}
                          className="bg-black text-white p-2 rounded-full hover:bg-gray-800 transition-colors"
                          title="View Invoice"
                        >
                          <FaEye size={12} />
                        </button>
                        <button
                          onClick={() => handleViewInvoice(invoice.id)}
                          className="bg-[#bca142] text-white p-2 rounded-full hover:bg-[#a89139] transition-colors"
                          title="Download PDF"
                        >
                          <FaDownload size={12} />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {invoices.length > 0 && (
            <div className="flex flex-col md:flex-row items-center justify-between mt-4 gap-4">
              <div className="text-sm text-black">
                Showing {filteredInvoices.length === 0 ? 0 : indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, filteredInvoices.length)} of {filteredInvoices.length} entries
              </div>
              <div className="flex items-center">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-l-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 border-t border-b border-gray-300 text-white bg-[#bca142]">
                  {currentPage}
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-r-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Invoice Detail Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-black">Invoice Details</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center gap-2 transition-colors"
                >
                  <FaDownload size={14} /> Download PDF
                </button>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="text-gray-500 hover:text-black text-xl font-bold ml-2"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Invoice Content */}
            <div ref={invoiceRef} className="p-4" style={{ backgroundColor: '#ffffff', color: '#000000', maxWidth: '794px', margin: '0 auto', fontFamily: 'Arial, sans-serif', lineHeight: '1.5', wordSpacing: 'normal', letterSpacing: 'normal' }}>
              <div className="bg-white" style={{ backgroundColor: '#ffffff' }}>
                {/* Invoice Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <img 
                      src="https://res.cloudinary.com/ds1dt3qub/image/upload/v1769604932/gulf_star_network_4_znl5cm.png"
                      alt="GSN Logo" 
                      className="w-32 h-32 object-contain"
                      style={{ maxWidth: '108px', maxHeight: '108px' }}
                    />
                    <div>
                      <h1 className="text-2xl font-bold mb-1" style={{ color: '#bca142', fontSize: '24px', fontWeight: 'bold' }}>INVOICE</h1>
                      <p className="font-semibold" style={{ color: '#4B5563', fontSize: '14px', fontWeight: '600' }}>GSN Network Services</p>
                      <p className="text-xs" style={{ color: '#6B7280', fontSize: '12px' }}>Freight Forwarding & Logistics</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mb-3">
                      <img src={qrCodeUrl} alt="QR Code" className="w-20 h-20 border" style={{ width: '80px', height: '80px', border: '1px solid #D1D5DB' }} />
                      <p className="text-xs mt-1" style={{ color: '#6B7280', fontSize: '10px' }}>Scan for details</p>
                    </div>
                  </div>
                </div>

                {/* Invoice Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: '#1F2937', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Bill To:</h3>
                    <div className="text-xs" style={{ color: '#4B5563', fontSize: '12px', lineHeight: '1.5' }}>
                      <p className="font-medium" style={{ fontWeight: '500', marginBottom: '2px' }}>{selectedInvoice.company_name}</p>
                      <p style={{ marginBottom: '2px' }}>{selectedInvoice.company_email}</p>
                      {selectedInvoice.company_phone && <p style={{ marginBottom: '2px' }}>{selectedInvoice.company_phone}</p>}
                      {selectedInvoice.company_address && <p style={{ marginBottom: '2px' }}>{selectedInvoice.company_address}</p>}
                      {selectedInvoice.city && <p style={{ marginBottom: '2px' }}>{selectedInvoice.city}, {selectedInvoice.state}</p>}
                      {selectedInvoice.country && <p style={{ margin: '0' }}>{selectedInvoice.country}</p>}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ fontSize: '12px', lineHeight: '1.5' }}>
                      <div className="mb-1" style={{ marginBottom: '4px' }}>
                        <span className="font-semibold" style={{ fontWeight: '600' }}>Invoice Number: </span>
                        <span className="ml-2 font-mono">{selectedInvoice.invoice_number}</span>
                      </div>
                      <div className="mb-1" style={{ marginBottom: '4px' }}>
                        <span className="font-semibold" style={{ fontWeight: '600' }}>Invoice Date: </span>
                        <span className="ml-2">{formatDate(selectedInvoice.created_at)}</span>
                      </div>
                      <div className="mb-1" style={{ marginBottom: '4px' }}>
                        <span className="font-semibold" style={{ fontWeight: '600' }}>Due Date: </span>
                        <span className="ml-2">{formatDate(selectedInvoice.due_date)}</span>
                      </div>
                      <div className="mb-1" style={{ marginBottom: '4px' }}>
                        <span className="font-semibold" style={{ fontWeight: '600' }}>Status: </span>
                        <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium" style={{ 
                          backgroundColor: '#bca142',
                          color: '#ffffff',
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '12px'
                        }}>
                          {selectedInvoice.status?.charAt(0).toUpperCase() + selectedInvoice.status?.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Invoice Items */}
                <div className="mb-6">
                  <table className="w-full" style={{ border: '1px solid #D1D5DB', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#bca142' }}>
                      <tr>
                        <th className="p-2 text-left" style={{ border: '1px solid #D1D5DB', padding: '8px', textAlign: 'left', fontWeight: '600', fontSize: '12px', color: '#ffffff' }}>Description</th>
                        <th className="p-2 text-center" style={{ border: '1px solid #D1D5DB', padding: '8px', textAlign: 'center', fontWeight: '600', fontSize: '12px', color: '#ffffff' }}>Period</th>
                        <th className="p-2 text-right" style={{ border: '1px solid #D1D5DB', padding: '8px', textAlign: 'right', fontWeight: '600', fontSize: '12px', color: '#ffffff' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2" style={{ border: '1px solid #D1D5DB', padding: '8px', verticalAlign: 'top' }}>
                          <div>
                            <p className="font-semibold" style={{ fontWeight: '600', fontSize: '12px', marginBottom: '4px' }}>{selectedInvoice.plan_name} Subscription</p>
                            <p className="text-xs" style={{ color: '#4B5563', fontSize: '11px', marginBottom: '4px', wordWrap: 'break-word', whiteSpace: 'normal' }}>{selectedInvoice.plan_description}</p>
                            {selectedInvoice.features && (
                              <ul className="text-xs mt-1" style={{ color: '#6B7280', fontSize: '10px', marginTop: '4px', paddingLeft: '16px' }}>
                                {selectedInvoice.features.slice(0, 2).map((feature, idx) => (
                                  <li key={idx} style={{ marginBottom: '2px' }}>• {feature}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </td>
                        <td className="p-2 text-center text-xs" style={{ border: '1px solid #D1D5DB', padding: '8px', textAlign: 'center', fontSize: '11px', verticalAlign: 'top' }}>
                          {selectedInvoice.start_date && selectedInvoice.end_date ? 
                            `${formatDate(selectedInvoice.start_date)} - ${formatDate(selectedInvoice.end_date)}` : 
                            'Subscription Period (Cancelled)'
                          }
                        </td>
                        <td className="p-2 text-right font-semibold" style={{ border: '1px solid #D1D5DB', padding: '8px', textAlign: 'right', fontWeight: '600', fontSize: '12px', verticalAlign: 'top' }}>
                          {formatCurrency(selectedInvoice.amount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Invoice Summary */}
                <div className="flex justify-end mb-6">
                  <div className="w-48">
                    <div className="flex justify-between py-1" style={{ borderBottom: '1px solid #D1D5DB', paddingTop: '4px', paddingBottom: '4px', fontSize: '12px' }}>
                      <span>Subtotal:</span>
                      <span>{formatCurrency(selectedInvoice.amount)}</span>
                    </div>
                    <div className="flex justify-between py-1" style={{ borderBottom: '1px solid #D1D5DB', paddingTop: '4px', paddingBottom: '4px', fontSize: '12px' }}>
                      <span>Tax:</span>
                      <span>{formatCurrency(selectedInvoice.tax_amount || 0)}</span>
                    </div>
                    <div className="flex justify-between py-1 font-bold" style={{ borderBottom: '2px solid #1F2937', paddingTop: '4px', paddingBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
                      <span>Total:</span>
                      <span>{formatCurrency(selectedInvoice.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                {/* <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: '#F9FAFB', padding: '12px', borderRadius: '6px' }}>
                  <h4 className="font-semibold mb-2" style={{ fontWeight: '600', marginBottom: '6px', fontSize: '12px' }}>Payment Information</h4>
                  <div className="text-xs" style={{ color: '#4B5563', fontSize: '11px', lineHeight: '1.5' }}>
                    <p style={{ marginBottom: '2px' }}><strong>Payment Method:</strong> {selectedInvoice.payment_method}</p>
                    <p style={{ marginBottom: '2px' }}><strong>Payment Status:</strong> {selectedInvoice.payment_status}</p>
                    {selectedInvoice.transaction_id && (
                      <p style={{ margin: '0' }}><strong>Transaction ID:</strong> {selectedInvoice.transaction_id}</p>
                    )}
                  </div>
                </div> */}

                {/* Cancellation Info (if cancelled) */}
                {selectedInvoice.status === 'cancelled' && (
                  <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: '#FEF2F2', padding: '12px', borderRadius: '6px', border: '1px solid #FECACA' }}>
                    <h4 className="font-semibold mb-2" style={{ fontWeight: '600', marginBottom: '6px', fontSize: '12px', color: '#DC2626' }}>Cancellation Information</h4>
                    <div className="text-xs" style={{ color: '#7F1D1D', fontSize: '11px', lineHeight: '1.5' }}>
                      <p style={{ marginBottom: '2px' }}><strong>Status:</strong> This invoice has been cancelled</p>
                      {selectedInvoice.cancelled_at && (
                        <p style={{ marginBottom: '2px' }}><strong>Cancelled Date:</strong> {formatDate(selectedInvoice.cancelled_at)}</p>
                      )}
                      {selectedInvoice.cancellation_reason && (
                        <p style={{ margin: '0', wordWrap: 'break-word', whiteSpace: 'normal' }}><strong>Reason:</strong> {selectedInvoice.cancellation_reason}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-4 pt-3 text-center text-xs" style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #D1D5DB', textAlign: 'center', fontSize: '11px', color: '#6B7280' }}>
                  <p style={{ marginBottom: '2px' }}>Thank you for your business!</p>
                  <p style={{ margin: '0' }}>GSN Network - Connecting Global Trade</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
};

export default Invoices;