import { useState, useEffect, useMemo, useRef } from 'react';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { FaEye, FaDownload, FaFileInvoiceDollar, FaUser, FaCalendar } from 'react-icons/fa';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { api } from '../../utils/api';
import { adminToast } from '../../utils/adminToast';

// --- Reusable Component for Sortable Table Headers ---
const SortableHeader = ({ children, sortKey, sortConfig, onSort }) => {
    const isSorted = sortConfig.key === sortKey;
    return (
        <th 
            className="p-3 text-left text-sm font-semibold text-white tracking-wider cursor-pointer hover:bg-gray-100"
            onClick={() => onSort(sortKey)}
        >
            <div className="flex items-center">
                <span>{children}</span>
                <div className="flex flex-col ml-auto">
                    <FiChevronUp className={`h-3 w-3 -mb-1 ${isSorted && sortConfig.direction === 'asc' ? 'text-white' : 'text-gray-400'}`}/>
                    <FiChevronDown className={`h-3 w-3 -mt-1 ${isSorted && sortConfig.direction === 'desc' ? 'text-white' : 'text-gray-400'}`}/>
                </div>
            </div>
        </th>
    );
};

const AdminInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [activeTab, setActiveTab] = useState('subscription'); // 'subscription' or 'transaction'
  
  const invoiceRef = useRef();

  useEffect(() => {
    fetchInvoices();
  }, [activeTab]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'subscription' 
        ? '/api/admin-panel/invoices' 
        : '/api/admin-panel/transaction-invoices';
      const data = await api.get(endpoint);
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      adminToast.error('Failed to load invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = async (invoiceId) => {
    try {
      const endpoint = activeTab === 'subscription' 
        ? `/api/admin-panel/invoices/${invoiceId}` 
        : `/api/admin-panel/transaction-invoices/${invoiceId}`;
      const invoice = await api.get(endpoint);
      setSelectedInvoice(invoice);
      
      // Generate QR code
      const qrData = activeTab === 'subscription' 
        ? (invoice.qr_data || JSON.stringify({
            invoiceNumber: invoice.invoice_number,
            amount: invoice.total_amount,
            company: invoice.company_name,
            plan: invoice.plan_name,
            status: invoice.status
          }))
        : JSON.stringify({
            invoiceNumber: invoice.invoice_number,
            quoteId: invoice.quote_id,
            amount: invoice.total_amount,
            company: invoice.company_name,
            user: invoice.user_name,
            status: invoice.status,
            date: invoice.created_at
          });
      
      const qrUrl = await QRCode.toDataURL(qrData);
      setQrCodeUrl(qrUrl);
      
      setShowInvoiceModal(true);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      adminToast.error('Failed to load invoice details');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const element = invoiceRef.current;
      if (!element) {
        adminToast.error('Invoice content not found');
        return;
      }

      // Show loading toast
      const loadingToast = adminToast.loading('Generating PDF...');

      // Temporarily modify the element for better PDF rendering
      const originalStyle = element.style.cssText;
      element.style.width = '794px';
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
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: element.scrollHeight,
        logging: false,
        letterRendering: true,
        onclone: (clonedDoc) => {
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
            .text-xs p {
              display: block !important;
              margin-bottom: 3px !important;
              line-height: 1.4 !important;
            }
            p {
              margin-bottom: 3px !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        }
      });

      // Restore original styles
      element.style.cssText = originalStyle;

      // Create PDF with better positioning
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
      
      const fileName = activeTab === 'subscription' 
        ? `Invoice_${selectedInvoice.invoice_number}_Admin.pdf`
        : `Transaction_Invoice_${selectedInvoice.invoice_number}_Admin.pdf`;
      pdf.save(fileName);
      
      adminToast.dismiss(loadingToast);
      adminToast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      adminToast.error('Failed to generate PDF. Please try again.');
    }
  };

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getStatusBadge = (status) => {
    const colors = {
      paid: 'bg-[#bca142] text-white',
      pending: 'bg-yellow-100 text-[#bca142]',
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

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = [...invoices];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice => {
        const term = searchTerm.toLowerCase();
        if (activeTab === 'subscription') {
          return (
            invoice.invoice_number?.toLowerCase().includes(term) ||
            invoice.company_name?.toLowerCase().includes(term) ||
            invoice.plan_name?.toLowerCase().includes(term) ||
            invoice.status?.toLowerCase().includes(term)
          );
        } else {
          return (
            invoice.invoice_number?.toLowerCase().includes(term) ||
            invoice.company_name?.toLowerCase().includes(term) ||
            invoice.user_name?.toLowerCase().includes(term) ||
            invoice.quote_id?.toString().includes(term) ||
            invoice.status?.toLowerCase().includes(term)
          );
        }
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [invoices, searchTerm, sortConfig, activeTab]);

  // Pagination
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredAndSortedData.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredAndSortedData.length / entriesPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bca142]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FaFileInvoiceDollar className="text-[#bca142]" />
              Admin Invoices
            </h1>
            <p className="text-gray-500 text-sm mt-1">Manage and download all system invoices</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-yellow-50 text-[#bca142] px-4 py-2 rounded-lg">
              <span className="font-semibold">{invoices.length}</span> Total Invoices
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('subscription')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'subscription'
                ? 'border-[#bca142] text-[#bca142]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Subscription Invoices
          </button>
          <button
            onClick={() => setActiveTab('transaction')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'transaction'
                ? 'border-[#bca142] text-[#bca142]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Transaction Invoices
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <div className="flex items-center text-sm text-gray-600">
            <span>Show</span>
            <select 
              className="mx-2 border border-gray-300 rounded-md p-1"
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <span>entries</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <label htmlFor="search" className="mr-2">Search:</label>
            <input 
              id="search"
              type="text" 
              className="border border-gray-300 rounded-md p-1.5"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={activeTab === 'subscription' 
                ? "Invoice number, company, plan..." 
                : "Invoice number, company, user, quote ID..."
              }
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#bca142]">
              <tr>
                <SortableHeader sortKey="invoice_number" sortConfig={sortConfig} onSort={handleSort}>Invoice #</SortableHeader>
                {activeTab === 'subscription' ? (
                  <>
                    <SortableHeader sortKey="company_name" sortConfig={sortConfig} onSort={handleSort}>Company</SortableHeader>
                    <SortableHeader sortKey="plan_name" sortConfig={sortConfig} onSort={handleSort}>Plan</SortableHeader>
                  </>
                ) : (
                  <>
                    <SortableHeader sortKey="quote_id" sortConfig={sortConfig} onSort={handleSort}>Quote ID</SortableHeader>
                    <SortableHeader sortKey="user_name" sortConfig={sortConfig} onSort={handleSort}>User</SortableHeader>
                    <SortableHeader sortKey="company_name" sortConfig={sortConfig} onSort={handleSort}>Company</SortableHeader>
                  </>
                )}
                <SortableHeader sortKey="total_amount" sortConfig={sortConfig} onSort={handleSort}>Amount</SortableHeader>
                <SortableHeader sortKey="status" sortConfig={sortConfig} onSort={handleSort}>Status</SortableHeader>
                <SortableHeader sortKey="created_at" sortConfig={sortConfig} onSort={handleSort}>Date</SortableHeader>
                <th className="p-3 text-left text-sm font-semibold text-white tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentEntries.length > 0 ? (
                currentEntries.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="p-3 whitespace-nowrap text-gray-600 font-mono">{invoice.invoice_number}</td>
                    {activeTab === 'subscription' ? (
                      <>
                        <td className="p-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mr-3">
                              <FaUser className="text-blue-500 text-sm" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{invoice.company_name}</div>
                              <div className="text-xs text-gray-500">{invoice.company_email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="font-semibold text-[#bca142]">{invoice.plan_name}</span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 whitespace-nowrap">
                          <span className="font-semibold text-[#bca142]">#{invoice.quote_id}</span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center mr-3">
                              <FaUser className="text-green-500 text-sm" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{invoice.user_name}</div>
                              <div className="text-xs text-gray-500">{invoice.user_email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mr-3">
                              <FaUser className="text-blue-500 text-sm" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{invoice.company_name}</div>
                              <div className="text-xs text-gray-500">{invoice.company_email}</div>
                            </div>
                          </div>
                        </td>
                      </>
                    )}
                    <td className="p-3 whitespace-nowrap">
                      <span className="font-semibold text-[#bca142]">{formatCurrency(invoice.total_amount)}</span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="p-3 whitespace-nowrap text-gray-600">
                      <div className="flex items-center">
                        <FaCalendar className="text-gray-400 mr-1" />
                        {formatDate(invoice.created_at)}
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewInvoice(invoice.id)}
                          className="p-2 bg-[#bca142] text-white rounded hover:bg-[#B8941F] transition-colors"
                          title="View Invoice"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => handleViewInvoice(invoice.id)}
                          className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                          title="Download PDF"
                        >
                          <FaDownload />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={activeTab === 'subscription' ? "7" : "8"} className="text-center p-8">
                    <div className="text-gray-500">
                      <FaFileInvoiceDollar className="mx-auto text-4xl mb-2 opacity-50" />
                      <p>No {activeTab} invoices found</p>
                      {searchTerm && <p className="text-sm">Try adjusting your search criteria</p>}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-gray-600">
          <p>
            Showing {filteredAndSortedData.length > 0 ? indexOfFirstEntry + 1 : 0} to{' '}
            {Math.min(indexOfLastEntry, filteredAndSortedData.length)} of{' '}
            {filteredAndSortedData.length} entries
          </p>
          <div className="flex items-center mt-2 sm:mt-0">
            <button 
              className="px-3 py-1 border border-[#bca142] text-[#bca142] rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="px-3 py-1 border-y border-[#bca142] bg-[#bca142] text-white">
              {currentPage}
            </span>
            <button 
              className="px-3 py-1 border border-[#bca142] text-[#bca142] rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-800">
                {activeTab === 'subscription' ? 'Subscription Invoice Details (Admin View)' : 'Transaction Invoice Details (Admin View)'}
              </h3>
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

            {/* Invoice Content - Same as company invoice but with admin branding */}
            <div ref={invoiceRef} className="p-4" style={{ backgroundColor: '#ffffff', color: '#000000', maxWidth: '794px', margin: '0 auto', fontFamily: 'Arial, sans-serif', lineHeight: '1.5', wordSpacing: 'normal', letterSpacing: 'normal' }}>
              <div className="bg-white" style={{ backgroundColor: '#ffffff' }}>
                {/* Invoice Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <img 
                      src="https://res.cloudinary.com/ds1dt3qub/image/upload/v1767724966/GSN_vebkrv.jpg"
                      alt="GSN Logo" 
                      className="w-12 h-12 object-contain"
                      style={{ maxWidth: '48px', maxHeight: '48px' }}
                    />
                    <div>
                      <h1 className="text-2xl font-bold mb-1" style={{ color: '#bca142', fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                        {activeTab === 'subscription' ? 'INVOICE' : 'TRANSACTION INVOICE'}
                      </h1>
                      <p className="font-semibold" style={{ color: '#4B5563', fontSize: '14px', fontWeight: '600', marginBottom: '2px' }}>GSN Network Services</p>
                      <p className="text-xs" style={{ color: '#6B7280', fontSize: '12px', margin: '0' }}>Freight Forwarding & Logistics</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mb-3">
                      <img src={qrCodeUrl} alt="QR Code" className="w-20 h-20 border" style={{ width: '80px', height: '80px', border: '1px solid #D1D5DB' }} />
                      <p className="text-xs mt-1" style={{ color: '#6B7280', fontSize: '10px', marginTop: '4px' }}>Scan for details</p>
                    </div>
                  </div>
                </div>

                {/* Invoice Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: '#1F2937', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                      {activeTab === 'subscription' ? 'Bill To:' : 'Service Provider:'}
                    </h3>
                    <div className="text-xs" style={{ color: '#4B5563', fontSize: '12px', lineHeight: '1.5' }}>
                      {activeTab === 'subscription' ? (
                        <>
                          <p className="font-medium" style={{ fontWeight: '500', marginBottom: '2px' }}>{selectedInvoice.company_name}</p>
                          <p style={{ marginBottom: '2px' }}>{selectedInvoice.company_email}</p>
                          {selectedInvoice.company_phone && <p style={{ marginBottom: '2px' }}>{selectedInvoice.company_phone}</p>}
                          {selectedInvoice.company_address && <p style={{ marginBottom: '2px' }}>{selectedInvoice.company_address}</p>}
                          {selectedInvoice.city && <p style={{ marginBottom: '2px' }}>{selectedInvoice.city}, {selectedInvoice.state}</p>}
                          {selectedInvoice.country && <p style={{ margin: '0' }}>{selectedInvoice.country}</p>}
                        </>
                      ) : (
                        <>
                          <p className="font-medium">{selectedInvoice.company_name}</p>
                          <p>{selectedInvoice.company_email}</p>
                          {selectedInvoice.company_phone && <p>{selectedInvoice.company_phone}</p>}
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ fontSize: '12px', lineHeight: '1.5' }}>
                      <div className="mb-1" style={{ marginBottom: '4px' }}>
                        <span className="font-semibold" style={{ fontWeight: '600' }}>Invoice Number: </span>
                        <span className="ml-2 font-mono">{selectedInvoice.invoice_number}</span>
                      </div>
                      {activeTab === 'transaction' && (
                        <div className="mb-1" style={{ marginBottom: '4px' }}>
                          <span className="font-semibold" style={{ fontWeight: '600' }}>Quote ID: </span>
                          <span className="ml-2">#{selectedInvoice.quote_id}</span>
                        </div>
                      )}
                      <div className="mb-1" style={{ marginBottom: '4px' }}>
                        <span className="font-semibold" style={{ fontWeight: '600' }}>Invoice Date: </span>
                        <span className="ml-2">{formatDate(selectedInvoice.created_at)}</span>
                      </div>
                      {activeTab === 'subscription' && (
                        <div className="mb-1" style={{ marginBottom: '4px' }}>
                          <span className="font-semibold" style={{ fontWeight: '600' }}>Due Date: </span>
                          <span className="ml-2">{formatDate(selectedInvoice.due_date)}</span>
                        </div>
                      )}
                      <div className="mb-1" style={{ marginBottom: '4px' }}>
                        <span className="font-semibold" style={{ fontWeight: '600' }}>Status: </span>
                        <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium" style={{ 
                          backgroundColor: selectedInvoice.status === 'paid' ? '#DCFCE7' : 
                                         selectedInvoice.status === 'pending' ? '#FEF3C7' : 
                                         selectedInvoice.status === 'overdue' ? '#FEE2E2' : 
                                         selectedInvoice.status === 'completed' ? '#DBEAFE' : '#F3F4F6',
                          color: selectedInvoice.status === 'paid' ? '#166534' : 
                                selectedInvoice.status === 'pending' ? '#92400E' : 
                                selectedInvoice.status === 'overdue' ? '#991B1B' : 
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

                {/* Invoice Items */}
                <div className="mb-6">
                  <table className="w-full" style={{ border: '1px solid #D1D5DB', borderCollapse: 'collapse', width: '100%' }}>
                    <thead style={{ backgroundColor: '#D9CBAA' }}>
                      <tr>
                        <th className="p-2 text-left" style={{ border: '1px solid #D1D5DB', padding: '8px', textAlign: 'left', fontWeight: '600', fontSize: '12px' }}>Description</th>
                        <th className="p-2 text-center" style={{ border: '1px solid #D1D5DB', padding: '8px', textAlign: 'center', fontWeight: '600', fontSize: '12px' }}>
                          {activeTab === 'subscription' ? 'Period' : 'Route'}
                        </th>
                        <th className="p-2 text-right" style={{ border: '1px solid #D1D5DB', padding: '8px', textAlign: 'right', fontWeight: '600', fontSize: '12px' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2" style={{ border: '1px solid #D1D5DB', padding: '8px', verticalAlign: 'top' }}>
                          <div>
                            {activeTab === 'subscription' ? (
                              <>
                                <p className="font-semibold" style={{ fontWeight: '600', fontSize: '12px', marginBottom: '4px' }}>{selectedInvoice.plan_name} Subscription</p>
                                <p className="text-xs" style={{ color: '#4B5563', fontSize: '11px', marginBottom: '4px', wordWrap: 'break-word', whiteSpace: 'normal' }}>{selectedInvoice.plan_description}</p>
                              </>
                            ) : (
                              <>
                                <p className="font-semibold" style={{ fontWeight: '600', fontSize: '12px', marginBottom: '4px' }}>Freight Forwarding Service</p>
                                <p className="text-xs" style={{ color: '#4B5563', fontSize: '11px', marginBottom: '4px' }}>Quote #{selectedInvoice.quote_id} - Shipping Service</p>
                                <p className="text-xs" style={{ color: '#6B7280', fontSize: '10px' }}>Payment verified and service approved</p>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="p-2 text-center text-xs" style={{ border: '1px solid #D1D5DB', padding: '8px', textAlign: 'center', fontSize: '11px', verticalAlign: 'top' }}>
                          {activeTab === 'subscription' ? (
                            selectedInvoice.start_date && selectedInvoice.end_date ? 
                              `${formatDate(selectedInvoice.start_date)} - ${formatDate(selectedInvoice.end_date)}` : 
                              'Subscription Period (Cancelled)'
                          ) : (
                            selectedInvoice.departure_city && selectedInvoice.arrival_city ? 
                              `${selectedInvoice.departure_city} → ${selectedInvoice.arrival_city}` : 
                              'Shipping Route'
                          )}
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
                      <span>{activeTab === 'subscription' ? 'Tax:' : 'Service Fee:'}</span>
                      <span>{formatCurrency(activeTab === 'subscription' ? (selectedInvoice.tax_amount || 0) : (selectedInvoice.service_fee || 0))}</span>
                    </div>
                    <div className="flex justify-between py-1 font-bold" style={{ borderBottom: '2px solid #1F2937', paddingTop: '4px', paddingBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
                      <span>Total:</span>
                      <span>{formatCurrency(selectedInvoice.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Information for Transaction Invoices */}
                {activeTab === 'transaction' && (
                  <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: '#F0FDF4', padding: '12px', borderRadius: '6px', border: '1px solid #BBF7D0' }}>
                    <h4 className="font-semibold mb-2" style={{ fontWeight: '600', marginBottom: '6px', fontSize: '12px', color: '#166534' }}>Payment Information</h4>
                    <div className="text-xs" style={{ color: '#15803D', fontSize: '11px', lineHeight: '1.5' }}>
                      <p style={{ marginBottom: '2px' }}><strong>Payment Status:</strong> Verified and Approved</p>
                      <p style={{ marginBottom: '2px' }}><strong>Payment Date:</strong> {formatDate(selectedInvoice.payment_date || selectedInvoice.created_at)}</p>
                      <p style={{ margin: '0' }}><strong>Service Status:</strong> Ready to Begin</p>
                    </div>
                  </div>
                )}

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
                  <p style={{ marginBottom: '2px' }}>
                    {activeTab === 'subscription' ? 'Thank you for your business!' : 'Thank you for choosing GSN Network!'}
                  </p>
                  <p style={{ margin: '0' }}>
                    {activeTab === 'subscription' ? 'GSN Network - Connecting Global Trade' : 'Your freight forwarding service will begin as scheduled.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInvoices;
