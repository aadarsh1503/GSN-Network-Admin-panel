import React, { useState, useEffect, useRef } from 'react';
import { FaEye, FaDownload, FaFileInvoiceDollar, FaShippingFast, FaUser, FaCalendar } from 'react-icons/fa';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

const UserInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
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
      const data = await api.get('/api/user/transaction-invoices');
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching transaction invoices:', error);
      toast.error('Failed to load transaction invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = async (invoiceId) => {
    try {
      const invoice = await api.get(`/api/user/transaction-invoices/${invoiceId}`);
      setSelectedInvoice(invoice);
      
      // Generate QR code
      const qrData = {
        invoiceNumber: invoice.invoice_number,
        quoteId: invoice.quote_id,
        amount: invoice.total_amount,
        company: invoice.company_name,
        user: invoice.user_name,
        status: invoice.status,
        date: invoice.created_at
      };
      const qrUrl = await QRCode.toDataURL(JSON.stringify(qrData));
      setQrCodeUrl(qrUrl);
      
      setShowInvoiceModal(true);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      toast.error('Failed to load invoice details');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const element = invoiceRef.current;
      if (!element) {
        toast.error('Invoice content not found');
        return;
      }

      const loadingToast = toast.loading('Generating PDF...');

      const originalStyle = element.style.cssText;
      element.style.width = '794px';
      element.style.maxWidth = '794px';
      element.style.padding = '15px';
      element.style.fontSize = '12px';
      element.style.lineHeight = '1.5';

      await new Promise(resolve => setTimeout(resolve, 200));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: element.scrollHeight,
        logging: false,
        letterRendering: true
      });

      element.style.cssText = originalStyle;

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidthMM = (canvas.width * 0.264583) / 2;
      const imgHeightMM = (canvas.height * 0.264583) / 2;
      
      const margin = 5;
      const availableWidth = pdfWidth - (margin * 2);
      const availableHeight = pdfHeight - (margin * 2);
      
      let scale = availableWidth / imgWidthMM;
      let finalWidth = imgWidthMM * scale;
      let finalHeight = imgHeightMM * scale;
      
      if (finalHeight > availableHeight) {
        scale = availableHeight / imgHeightMM;
        finalWidth = imgWidthMM * scale;
        finalHeight = imgHeightMM * scale;
      }
      
      const x = margin;
      const y = margin;
      
      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
      
      const fileName = `Transaction_Invoice_${selectedInvoice.invoice_number}.pdf`;
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
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
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
      invoice.company_name?.toLowerCase().includes(term) ||
      invoice.quote_id?.toString().includes(term) ||
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
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CDA435]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaFileInvoiceDollar className="text-[#CDA435]" />
          My Transaction Invoices
        </div>
        <div className="text-sm text-gray-600 bg-yellow-50 px-3 py-1 rounded-lg">
          {invoices.length} Total Invoices
        </div>
      </h2>

      {invoices.length === 0 ? (
        <div className="text-center py-12">
          <FaShippingFast className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Transaction Invoices Yet</h3>
          <p className="text-gray-500">Your transaction invoices will appear here when your payments are verified and approved by companies.</p>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Show</span>
              <select 
                value={entriesPerPage} 
                onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#CDA435]"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span>entries</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <label htmlFor="search">Search:</label>
              <input 
                id="search"
                type="text" 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Invoice number, company name, quote ID..."
                className="border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#CDA435]"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-[#D9CBAA] text-gray-800 text-sm">
                <tr>
                  <th className="p-3 text-left font-semibold">Invoice #</th>
                  <th className="p-3 text-left font-semibold">Quote ID</th>
                  <th className="p-3 text-left font-semibold">Company</th>
                  <th className="p-3 text-left font-semibold">Amount</th>
                  <th className="p-3 text-left font-semibold">Status</th>
                  <th className="p-3 text-left font-semibold">Date</th>
                  <th className="p-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentEntries.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-700 font-mono">{invoice.invoice_number}</td>
                    <td className="p-3 text-sm text-gray-700">
                      <span className="font-semibold text-[#CDA435]">#{invoice.quote_id}</span>
                    </td>
                    <td className="p-3 text-sm text-gray-700">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mr-3">
                          <FaUser className="text-blue-500 text-sm" />
                        </div>
                        <div>
                          <div className="font-medium">{invoice.company_name}</div>
                          <div className="text-xs text-gray-500">{invoice.company_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-700">
                      <span className="font-semibold text-green-600">{formatCurrency(invoice.total_amount)}</span>
                    </td>
                    <td className="p-3 text-sm text-gray-700">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="p-3 text-sm text-gray-700">
                      <div className="flex items-center">
                        <FaCalendar className="text-gray-400 mr-1" />
                        {formatDate(invoice.created_at)}
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewInvoice(invoice.id)}
                          className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
                          title="View Invoice"
                        >
                          <FaEye size={12} />
                        </button>
                        <button
                          onClick={() => handleViewInvoice(invoice.id)}
                          className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors"
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
              <div className="text-sm text-gray-600">
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
                <span className="px-3 py-1 border-t border-b border-gray-300 text-gray-800 bg-[#D9CBAA]">
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
              <h3 className="text-lg font-bold text-gray-800">Transaction Invoice Details</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2 transition-colors"
                >
                  <FaDownload size={14} /> Download PDF
                </button>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="text-gray-500 hover:text-red-500 text-xl font-bold ml-2"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Invoice Content */}
            <div ref={invoiceRef} className="p-4" style={{ backgroundColor: '#ffffff', color: '#000000', maxWidth: '794px', margin: '0 auto', fontFamily: 'Arial, sans-serif', lineHeight: '1.5' }}>
              <div className="bg-white">
                {/* Invoice Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <img 
                      src="https://res.cloudinary.com/ds1dt3qub/image/upload/v1767724966/GSN_vebkrv.jpg"
                      alt="GSN Logo" 
                      className="w-12 h-12 object-contain"
                    />
                    <div>
                      <h1 className="text-2xl font-bold mb-1" style={{ color: '#CDA435', fontSize: '24px', fontWeight: 'bold' }}>TRANSACTION INVOICE</h1>
                      <p className="font-semibold" style={{ color: '#4B5563', fontSize: '14px', fontWeight: '600' }}>GSN Network Services</p>
                      <p className="text-xs" style={{ color: '#6B7280', fontSize: '12px' }}>Freight Forwarding & Logistics</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mb-3">
                      <img src={qrCodeUrl} alt="QR Code" className="w-20 h-20 border" />
                      <p className="text-xs mt-1" style={{ color: '#6B7280', fontSize: '10px' }}>Scan for details</p>
                    </div>
                  </div>
                </div>

                {/* Invoice Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: '#1F2937', fontSize: '14px', fontWeight: '600' }}>Service Provider:</h3>
                    <div className="text-xs" style={{ color: '#4B5563', fontSize: '12px', lineHeight: '1.5' }}>
                      <p className="font-medium">{selectedInvoice.company_name}</p>
                      <p>{selectedInvoice.company_email}</p>
                      {selectedInvoice.company_phone && <p>{selectedInvoice.company_phone}</p>}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ fontSize: '12px', lineHeight: '1.5' }}>
                      <div className="mb-1">
                        <span className="font-semibold">Invoice Number: </span>
                        <span className="ml-2 font-mono">{selectedInvoice.invoice_number}</span>
                      </div>
                      <div className="mb-1">
                        <span className="font-semibold">Quote ID: </span>
                        <span className="ml-2">#{selectedInvoice.quote_id}</span>
                      </div>
                      <div className="mb-1">
                        <span className="font-semibold">Invoice Date: </span>
                        <span className="ml-2">{formatDate(selectedInvoice.created_at)}</span>
                      </div>
                      <div className="mb-1">
                        <span className="font-semibold">Status: </span>
                        <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium" style={{ 
                          backgroundColor: selectedInvoice.status === 'paid' ? '#DCFCE7' : 
                                         selectedInvoice.status === 'completed' ? '#DBEAFE' : '#F3F4F6',
                          color: selectedInvoice.status === 'paid' ? '#166534' : 
                                selectedInvoice.status === 'completed' ? '#1E40AF' : '#374151',
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

                {/* Service Details */}
                <div className="mb-6">
                  <table className="w-full" style={{ border: '1px solid #D1D5DB', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#D9CBAA' }}>
                      <tr>
                        <th className="p-2 text-left" style={{ border: '1px solid #D1D5DB', padding: '8px', textAlign: 'left', fontWeight: '600', fontSize: '12px' }}>Service Description</th>
                        <th className="p-2 text-center" style={{ border: '1px solid #D1D5DB', padding: '8px', textAlign: 'center', fontWeight: '600', fontSize: '12px' }}>Route</th>
                        <th className="p-2 text-right" style={{ border: '1px solid #D1D5DB', padding: '8px', textAlign: 'right', fontWeight: '600', fontSize: '12px' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2" style={{ border: '1px solid #D1D5DB', padding: '8px', verticalAlign: 'top' }}>
                          <div>
                            <p className="font-semibold" style={{ fontWeight: '600', fontSize: '12px', marginBottom: '4px' }}>Freight Forwarding Service</p>
                            <p className="text-xs" style={{ color: '#4B5563', fontSize: '11px', marginBottom: '4px' }}>Quote #{selectedInvoice.quote_id} - Shipping Service</p>
                            <p className="text-xs" style={{ color: '#6B7280', fontSize: '10px' }}>Payment verified and service approved</p>
                          </div>
                        </td>
                        <td className="p-2 text-center text-xs" style={{ border: '1px solid #D1D5DB', padding: '8px', textAlign: 'center', fontSize: '11px', verticalAlign: 'top' }}>
                          {selectedInvoice.departure_city && selectedInvoice.arrival_city ? 
                            `${selectedInvoice.departure_city} → ${selectedInvoice.arrival_city}` : 
                            'Shipping Route'
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
                      <span>Service Fee:</span>
                      <span>{formatCurrency(selectedInvoice.service_fee || 0)}</span>
                    </div>
                    <div className="flex justify-between py-1 font-bold" style={{ borderBottom: '2px solid #1F2937', paddingTop: '4px', paddingBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
                      <span>Total:</span>
                      <span>{formatCurrency(selectedInvoice.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: '#F0FDF4', padding: '12px', borderRadius: '6px', border: '1px solid #BBF7D0' }}>
                  <h4 className="font-semibold mb-2" style={{ fontWeight: '600', marginBottom: '6px', fontSize: '12px', color: '#166534' }}>Payment Information</h4>
                  <div className="text-xs" style={{ color: '#15803D', fontSize: '11px', lineHeight: '1.5' }}>
                    <p style={{ marginBottom: '2px' }}><strong>Payment Status:</strong> Verified and Approved</p>
                    <p style={{ marginBottom: '2px' }}><strong>Payment Date:</strong> {formatDate(selectedInvoice.payment_date || selectedInvoice.created_at)}</p>
                    <p style={{ margin: '0' }}><strong>Service Status:</strong> Ready to Begin</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 text-center text-xs" style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #D1D5DB', textAlign: 'center', fontSize: '11px', color: '#6B7280' }}>
                  <p style={{ marginBottom: '2px' }}>Thank you for choosing GSN Network!</p>
                  <p style={{ margin: '0' }}>Your freight forwarding service will begin as scheduled.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserInvoices;