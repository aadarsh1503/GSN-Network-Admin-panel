import React, { useState, useEffect, useRef } from 'react';
import { FaEye, FaDownload, FaPrint, FaQrcode, FaFileInvoiceDollar, FaCalendarAlt, FaCreditCard, FaSearch } from 'react-icons/fa';
import QRCode from 'qrcode';
import { useReactToPrint } from 'react-to-print';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import QRScanner from '../../components/QRScanner/QRScanner';
import toast from 'react-hot-toast';

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

  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
  });

  const getStatusBadge = (status) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
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
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaFileInvoiceDollar className="text-[#CDA435]" />
          Invoices
        </div>
        <button
          onClick={() => setShowQRScanner(true)}
          className="bg-[#CDA435] text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-2 text-sm"
        >
          <FaQrcode /> Scan QR Code
        </button>
      </h2>

      {invoices.length === 0 ? (
        <div className="text-center py-12">
          <FaFileInvoiceDollar className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Invoices Yet</h3>
          <p className="text-gray-500">Your subscription invoices will appear here when you purchase plans.</p>
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
                className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-400"
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
                placeholder="Invoice number, plan name..."
                className="border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-[#D9CBAA] text-gray-800 text-sm">
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
                {currentEntries.map((invoice, index) => (
                  <tr key={invoice.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-700 font-mono">{invoice.invoice_number}</td>
                    <td className="p-3 text-sm text-gray-700">
                      <span className="font-semibold text-[#CDA435]">{invoice.plan_name}</span>
                    </td>
                    <td className="p-3 text-sm text-gray-700">
                      <span className="font-semibold text-green-600">{formatCurrency(invoice.total_amount)}</span>
                    </td>
                    <td className="p-3 text-sm text-gray-700">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="p-3 text-sm text-gray-700">{formatDate(invoice.created_at)}</td>
                    <td className="p-3 text-sm text-gray-700">{formatDate(invoice.due_date)}</td>
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
              <h3 className="text-lg font-bold text-gray-800">Invoice Details</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 flex items-center gap-1"
                >
                  <FaPrint size={12} /> Print
                </button>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="text-gray-500 hover:text-red-500 text-xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Invoice Content */}
            <div ref={invoiceRef} className="p-6">
              <div className="bg-white">
                {/* Invoice Header */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-[#CDA435] mb-2">INVOICE</h1>
                    <p className="text-gray-600">GSN Network Services</p>
                    <p className="text-sm text-gray-500">Freight Forwarding & Logistics</p>
                  </div>
                  <div className="text-right">
                    <div className="mb-4">
                      <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24 border" />
                      <p className="text-xs text-gray-500 mt-1">Scan for details</p>
                    </div>
                  </div>
                </div>

                {/* Invoice Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Bill To:</h3>
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">{selectedInvoice.company_name}</p>
                      <p>{selectedInvoice.company_email}</p>
                      {selectedInvoice.company_phone && <p>{selectedInvoice.company_phone}</p>}
                      {selectedInvoice.company_address && <p>{selectedInvoice.company_address}</p>}
                      {selectedInvoice.city && <p>{selectedInvoice.city}, {selectedInvoice.state}</p>}
                      {selectedInvoice.country && <p>{selectedInvoice.country}</p>}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm">
                      <div className="mb-2">
                        <span className="font-semibold">Invoice Number:</span>
                        <span className="ml-2 font-mono">{selectedInvoice.invoice_number}</span>
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold">Invoice Date:</span>
                        <span className="ml-2">{formatDate(selectedInvoice.created_at)}</span>
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold">Due Date:</span>
                        <span className="ml-2">{formatDate(selectedInvoice.due_date)}</span>
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold">Status:</span>
                        <span className="ml-2">{getStatusBadge(selectedInvoice.status)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Invoice Items */}
                <div className="mb-8">
                  <table className="w-full border border-gray-300">
                    <thead className="bg-[#D9CBAA]">
                      <tr>
                        <th className="border border-gray-300 p-3 text-left">Description</th>
                        <th className="border border-gray-300 p-3 text-center">Period</th>
                        <th className="border border-gray-300 p-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 p-3">
                          <div>
                            <p className="font-semibold">{selectedInvoice.plan_name} Subscription</p>
                            <p className="text-sm text-gray-600">{selectedInvoice.plan_description}</p>
                            {selectedInvoice.features && (
                              <ul className="text-xs text-gray-500 mt-1">
                                {selectedInvoice.features.slice(0, 3).map((feature, idx) => (
                                  <li key={idx}>• {feature}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </td>
                        <td className="border border-gray-300 p-3 text-center text-sm">
                          {formatDate(selectedInvoice.start_date)} - {formatDate(selectedInvoice.end_date)}
                        </td>
                        <td className="border border-gray-300 p-3 text-right font-semibold">
                          {formatCurrency(selectedInvoice.amount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Invoice Summary */}
                <div className="flex justify-end mb-8">
                  <div className="w-64">
                    <div className="flex justify-between py-2 border-b">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(selectedInvoice.amount)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Tax:</span>
                      <span>{formatCurrency(selectedInvoice.tax_amount || 0)}</span>
                    </div>
                    <div className="flex justify-between py-2 font-bold text-lg border-b-2 border-gray-800">
                      <span>Total:</span>
                      <span>{formatCurrency(selectedInvoice.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Payment Information</h4>
                  <div className="text-sm text-gray-600">
                    <p><strong>Payment Method:</strong> {selectedInvoice.payment_method}</p>
                    <p><strong>Payment Status:</strong> {selectedInvoice.payment_status}</p>
                    {selectedInvoice.transaction_id && (
                      <p><strong>Transaction ID:</strong> {selectedInvoice.transaction_id}</p>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-4 border-t text-center text-sm text-gray-500">
                  <p>Thank you for your business!</p>
                  <p>GSN Network - Connecting Global Trade</p>
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