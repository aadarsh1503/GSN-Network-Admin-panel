import { useState, useEffect } from 'react';
import { FiSend, FiClock, FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const SuggestionCompany = () => {
  const [formData, setFormData] = useState({
    subject: '',
    category: 'general',
    message: '',
  });
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);

  useEffect(() => {
    fetchMySuggestions();
  }, []);

  const fetchMySuggestions = async () => {
    try {
      const data = await api.get('/api/suggestions/my-suggestions');
      setSuggestions(data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setFetchingHistory(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/suggestions/submit', formData);

      toast.success('Suggestion submitted successfully!');
      setFormData({ subject: '', category: 'general', message: '' });
      fetchMySuggestions();
    } catch (error) {
      toast.error(error.message || 'Failed to submit suggestion');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FiClock className="text-[#bca142]" />;
      case 'reviewed': return <FiAlertCircle className="text-blue-500" />;
      case 'implemented': return <FiCheckCircle className="text-green-500" />;
      case 'rejected': return <FiXCircle className="text-red-500" />;
      default: return <FiClock className="text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      implemented: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const labelClasses = "block text-sm font-medium text-gray-700 mb-2";
  const inputClasses = "w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-[#bca142]";

  return (
    <div className="space-y-6">
      {/* Submit Form */}
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Submit Suggestion</h2>
        <div className="w-16 h-1 bg-[#bca142] rounded mb-6"></div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="subject" className={labelClasses}>Subject *</label>
              <input 
                type="text" 
                id="subject" 
                name="subject" 
                placeholder="Enter subject" 
                value={formData.subject} 
                onChange={handleChange} 
                className={inputClasses}
                required
              />
            </div>

            <div>
              <label htmlFor="category" className={labelClasses}>Category</label>
              <select 
                id="category" 
                name="category" 
                value={formData.category} 
                onChange={handleChange} 
                className={inputClasses}
              >
                <option value="general">General</option>
                <option value="feature">Feature Request</option>
                <option value="improvement">Improvement</option>
                <option value="bug">Bug Report</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="message" className={labelClasses}>Message *</label>
            <textarea 
              id="message" 
              name="message" 
              placeholder="Describe your suggestion in detail..." 
              rows="5" 
              value={formData.message} 
              onChange={handleChange} 
              className={inputClasses}
              required
            ></textarea>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="bg-[#bca142] text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSend />
            <span>{loading ? 'Submitting...' : 'Send Suggestion'}</span>
          </button>
        </form>
      </div>

      {/* Suggestions History */}
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">My Suggestions</h2>
        <div className="w-16 h-1 bg-[#bca142] rounded mb-6"></div>

        {fetchingHistory ? (
          <p className="text-gray-500 text-center py-8">Loading suggestions...</p>
        ) : suggestions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No suggestions submitted yet.</p>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(suggestion.status)}
                    <h3 className="font-semibold text-gray-800">{suggestion.subject}</h3>
                  </div>
                  {getStatusBadge(suggestion.status)}
                </div>
                <p className="text-sm text-gray-600 mb-2">{suggestion.message}</p>
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span className="capitalize">{suggestion.category}</span>
                  <span>{new Date(suggestion.created_at).toLocaleDateString()}</span>
                </div>
                {suggestion.admin_response && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Admin Response:</strong> {suggestion.admin_response}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuggestionCompany;
