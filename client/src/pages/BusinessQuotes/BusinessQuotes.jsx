import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaEye, 
  FaPlus, 
  FaQuoteLeft,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaChartLine
} from 'react-icons/fa';
import { 
  Calendar, 
  Package, 
  MapPin, 
  Truck, 
  ArrowUpRight,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';

const BusinessQuotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchQuotes();
  }, []);

  useEffect(() => {
    filterQuotes();
  }, [quotes, searchTerm, statusFilter]);

  const fetchQuotes = async () => {
    try {
      const data = await api.get('/api/business-quotes/my-quotes');
      setQuotes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      toast.error('Failed to fetch quotes');
    } finally {
      setLoading(false);
    }
  };

  const filterQuotes = () => {
    let filtered = Array.isArray(quotes) ? quotes : [];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(quote => quote.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(quote =>
        quote.product_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.departure_country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.arrival_country?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredQuotes(filtered);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FaClock className="text-[#bca142]" />;
      case 'running': return <FaSpinner className="text-[#bca142] animate-spin" />;
      case 'closed': return <FaCheckCircle className="text-[#bca142]" />;
      case 'rejected': return <FaTimesCircle className="text-black" />;
      case 'approved': return <FaCheckCircle className="text-[#bca142]" />;
      default: return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-gray-50 text-[#bca142] border-gray-200';
      case 'approved': return 'bg-gray-50 text-[#bca142] border-gray-200';
      case 'running': return 'bg-gray-50 text-[#bca142] border-gray-200';
      case 'closed': return 'bg-gray-50 text-[#bca142] border-gray-200';
      case 'rejected': return 'bg-gray-50 text-black border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getShippingModeIcon = (mode) => {
    switch (mode?.toLowerCase()) {
      case 'sea freight': return '🚢';
      case 'air freight': return '✈️';
      case 'road freight': return '🚛';
      case 'rail freight': return '🚂';
      default: return '📦';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const sortedQuotes = [...filteredQuotes].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'created_at') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#bca142] mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-black">Loading your quotes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#bca142] mb-2">
              My Quotes
            </h1>
            <p className="text-gray-600">Manage and track your quote requests and responses</p>
            <div className="flex items-center space-x-4 mt-3">
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-[#bca142] rounded-full animate-pulse"></div>
                <span className="text-sm text-[#bca142]">Live Updates</span>
              </div>
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1 rounded-full">
                <FaChartLine className="h-3 w-3 text-[#bca142]" />
                <span className="text-sm text-[#bca142]">{quotes.length} Total Quotes</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchQuotes}
              className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 text-black px-4 py-2 rounded-xl border border-gray-200 transition-all duration-300 hover:shadow-lg"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
            <Link
              to="/quote"
              className="flex items-center space-x-2 bg-[#bca142] hover:bg-black text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FaPlus className="h-4 w-4" />
              <span>New Quote</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['pending', 'running', 'closed', 'rejected'].map((status) => {
          const count = quotes.filter(q => q.status === status).length;
          const percentage = quotes.length > 0 ? ((count / quotes.length) * 100).toFixed(1) : 0;
          
          return (
            <div
              key={status}
              className={`bg-white rounded-xl p-5 border transition-all duration-300 hover:shadow-xl cursor-pointer transform hover:scale-105 ${
                statusFilter === status ? 'ring-2 ring-[#bca142] border-[#bca142]' : 'border-gray-200'
              }`}
              onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-3 rounded-xl ${status === 'rejected' ? 'bg-black' : 'bg-[#bca142]'} text-white`}>
                  {getStatusIcon(status)}
                </div>
                <span className="text-2xl font-bold text-black">{count}</span>
              </div>
              <h3 className="text-lg font-semibold text-black capitalize mb-1">{status}</h3>
              <p className="text-sm text-gray-600">{percentage}% of total</p>
            </div>
          );
        })}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search quotes, countries, products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Filter:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#bca142] transition-all duration-300"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="running">Running</option>
              <option value="closed">Closed</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#bca142] transition-all duration-300"
            >
              <option value="created_at">Sort by Date</option>
              <option value="status">Sort by Status</option>
              <option value="response_count">Sort by Responses</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all duration-300"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>


      {/* Quotes Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {sortedQuotes.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <FaQuoteLeft className="text-gray-400 h-16 w-16" />
            </div>
            <h3 className="text-2xl font-bold text-black mb-4">
              {searchTerm || statusFilter !== 'all' ? 'No quotes match your criteria' : 'No quotes yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Start by creating your first quote request'
              }
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <Link
                to="/quote"
                className="inline-flex items-center space-x-2 bg-[#bca142] hover:bg-black text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <FaPlus className="h-4 w-4" />
                <span>Create First Quote</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Quote</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Route</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Product</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Shipping Mode</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Delivery Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Responses</th>
                  {/* <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Created</th> */}
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50 transition-all duration-300">
                    {/* Quote Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getShippingModeIcon(quote.shipping_mode)}</span>
                        <div>
                          <div className="text-sm font-bold text-black">Quote #{quote.id}</div>
                          {quote.weight && (
                            <div className="text-xs text-gray-500">Weight: {quote.weight}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Route */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-[#bca142]" />
                          <span className="text-sm font-medium text-black">{quote.departure_country}</span>
                        </div>
                        <div className="text-gray-400">→</div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-[#bca142]" />
                          <span className="text-sm font-medium text-black">{quote.arrival_country}</span>
                        </div>
                      </div>
                    </td>

                    {/* Product */}
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-black truncate" title={quote.product_description}>
                          {quote.product_description}
                        </div>
                      </div>
                    </td>

                    {/* Shipping Mode */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Truck className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-black">{quote.shipping_mode}</span>
                      </div>
                    </td>

                    {/* Delivery Date */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-black">
                          {quote.arrival_date ? new Date(quote.arrival_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 'Not specified'}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(quote.status)}`}>
                        {getStatusIcon(quote.status)}
                        <span className="capitalize">{quote.status}</span>
                      </span>
                    </td>

                    {/* Responses */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <FaChartLine className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-black">{quote.response_count || 0}</span>
                            <span className="text-sm text-gray-600">companies</span>
                            {quote.response_count > 0 && (
                              <div className="w-2 h-2 bg-[#bca142] rounded-full animate-pulse"></div>
                            )}
                          </div>
                          {quote.lowest_price && (
                            <div className="text-sm text-[#bca142] font-medium">
                              From ${quote.lowest_price}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Created */}
                    {/* <td className="px-6 py-4">
                      <div className="text-sm text-black">
                        {formatDate(quote.created_at)}
                      </div>
                    </td> */}

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <Link
                        to={`/business/quotes/${quote.id}`}
                        className="inline-flex items-center space-x-1 text-[#bca142] hover:text-black font-medium hover:underline"
                      >
                        <FaEye className="h-4 w-4" />
                        <span>View</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {sortedQuotes.length > 0 && (
        <div className="flex justify-center">
          <div className="bg-white rounded-xl px-6 py-3 border border-gray-200">
            <span className="text-sm text-gray-600">
              Showing {sortedQuotes.length} of {quotes.length} quotes
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessQuotes;
