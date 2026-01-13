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
      case 'pending': return <FaClock className="text-amber-500" />;
      case 'running': return <FaSpinner className="text-yellow-500 animate-spin" />;
      case 'closed': return <FaCheckCircle className="text-green-500" />;
      case 'rejected': return <FaTimesCircle className="text-red-500" />;
      case 'approved': return <FaCheckCircle className="text-green-500" />;
      default: return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'running': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'closed': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
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
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-200 border-t-yellow-500 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-slate-700">Loading your quotes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 rounded-2xl p-8 border border-yellow-200/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent mb-2">
              My Quotes
            </h1>
            <p className="text-slate-600 text-lg">Manage and track your quote requests and responses</p>
            <div className="flex items-center space-x-4 mt-4">
              <div className="flex items-center space-x-2 bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600">Live Updates</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full">
                <FaChartLine className="h-3 w-3 text-yellow-500" />
                <span className="text-sm text-yellow-600">{quotes.length} Total Quotes</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchQuotes}
              className="flex items-center space-x-2 bg-white/80 hover:bg-white text-slate-700 px-4 py-2 rounded-xl border border-slate-200 transition-all duration-300 hover:shadow-lg"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
            <Link
              to="/quote"
              className="flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FaPlus className="h-4 w-4" />
              <span>New Quote</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {['pending', 'running', 'closed', 'rejected'].map((status) => {
          const count = quotes.filter(q => q.status === status).length;
          const percentage = quotes.length > 0 ? ((count / quotes.length) * 100).toFixed(1) : 0;
          
          return (
            <div
              key={status}
              className={`bg-white/80 backdrop-blur-lg rounded-2xl p-6 border transition-all duration-300 hover:shadow-xl cursor-pointer transform hover:scale-105 ${
                statusFilter === status ? 'ring-2 ring-yellow-500 border-yellow-200' : 'border-white/20'
              }`}
              onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${getStatusColor(status).replace('text-', 'bg-').replace('bg-', 'bg-').replace('-800', '-100').replace('-100', '-500')} text-white`}>
                  {getStatusIcon(status)}
                </div>
                <span className="text-2xl font-bold text-slate-800">{count}</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 capitalize mb-1">{status}</h3>
              <p className="text-sm text-slate-600">{percentage}% of total</p>
            </div>
          );
        })}
      </div>

      {/* Filters and Search */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search quotes, countries, products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-600">Filter:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300"
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
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300"
            >
              <option value="created_at">Sort by Date</option>
              <option value="status">Sort by Status</option>
              <option value="response_count">Sort by Responses</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all duration-300"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>


      {/* Quotes List */}
      <div className="space-y-4">
        {sortedQuotes.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-12 text-center border border-white/20">
            <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <FaQuoteLeft className="text-slate-400 h-16 w-16" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">
              {searchTerm || statusFilter !== 'all' ? 'No quotes match your criteria' : 'No quotes yet'}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Start by creating your first quote request'
              }
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <Link
                to="/quote"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <FaPlus className="h-4 w-4" />
                <span>Create First Quote</span>
              </Link>
            )}
          </div>
        ) : (
          sortedQuotes.map((quote) => (
            <div
              key={quote.id}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:shadow-xl transition-all duration-300 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getShippingModeIcon(quote.shipping_mode)}</span>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">Quote #{quote.id}</h3>
                        <p className="text-sm text-slate-600">{quote.shipping_mode}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(quote.status)}`}>
                        {getStatusIcon(quote.status)}
                        <span className="capitalize">{quote.status}</span>
                      </span>
                      <Link
                        to={`/business/quotes/${quote.id}`}
                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors duration-300"
                      >
                        <FaEye className="h-4 w-4 text-slate-600" />
                      </Link>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="flex items-center space-x-4 mb-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-yellow-500" />
                      <span className="font-semibold text-slate-800">{quote.departure_country}</span>
                    </div>
                    <div className="flex-1 border-t-2 border-dashed border-slate-300 relative">
                      <Truck className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-1 h-6 w-6 text-yellow-500" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-amber-500" />
                      <span className="font-semibold text-slate-800">{quote.arrival_country}</span>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Package className="h-4 w-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-600">Product</span>
                      </div>
                      <p className="text-sm text-slate-800 font-medium">{quote.product_description}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-600">Delivery Date</span>
                      </div>
                      <p className="text-sm text-slate-800 font-medium">
                        {quote.arrival_date ? new Date(quote.arrival_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'Not specified'}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <FaChartLine className="h-4 w-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-600">Responses</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-slate-800">{quote.response_count || 0}</span>
                        <span className="text-sm text-slate-600">companies</span>
                        {quote.response_count > 0 && (
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        )}
                      </div>
                      {quote.lowest_price && (
                        <p className="text-sm text-green-600 font-medium mt-1">
                          From ${quote.lowest_price}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <div className="flex items-center space-x-4">
                      <span>Created: {formatDate(quote.created_at)}</span>
                      <span>•</span>
                      <span>Mode: {quote.shipping_mode}</span>
                      {quote.weight && (
                        <>
                          <span>•</span>
                          <span>Weight: {quote.weight}</span>
                        </>
                      )}
                    </div>
                    <Link
                      to={`/business/quotes/${quote.id}`}
                      className="flex items-center space-x-1 text-yellow-600 hover:text-yellow-700 font-medium group-hover:underline"
                    >
                      <span>View Details</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination would go here if needed */}
      {sortedQuotes.length > 0 && (
        <div className="flex justify-center">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl px-6 py-3 border border-white/20">
            <span className="text-sm text-slate-600">
              Showing {sortedQuotes.length} of {quotes.length} quotes
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessQuotes;
