import { useState } from 'react';
import { FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const SupportTicket = () => {
  const [formData, setFormData] = useState({
    subject: '',
    category: 'general',
    priority: 'medium',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api('/api/tickets/create', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      toast.success(`Ticket created successfully! Ticket #: ${response.ticketNumber}`);
      setFormData({
        subject: '',
        category: 'general',
        priority: 'medium',
        description: '',
      });
    } catch (error) {
      toast.error(error.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const labelClasses = "block text-sm font-medium text-gray-700 mb-2";
  const inputClasses = "w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition duration-150 ease-in-out";

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Support Ticket</h2>
      <div className="w-16 h-1 bg-[#CDA435] rounded mb-6"></div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-6">
          {/* Subject Field */}
          <div>
            <label htmlFor="subject" className={labelClasses}>Subject *</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Brief description of your issue"
              className={inputClasses}
              required
            />
          </div>
          
          {/* Category Field */}
          <div>
            <label htmlFor="category" className={labelClasses}>Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={inputClasses}
            >
              <option value="general">General Inquiry</option>
              <option value="technical">Technical Issue</option>
              <option value="billing">Billing</option>
              <option value="account">Account</option>
              <option value="feature">Feature Request</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Priority Field */}
          <div className="md:col-span-2">
            <label htmlFor="priority" className={labelClasses}>Priority</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className={inputClasses}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Description Field */}
        <div className="mb-6">
          <label htmlFor="description" className={labelClasses}>Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Please describe your issue in detail..."
            rows="6"
            className={inputClasses}
            required
          ></textarea>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#CDA435] text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSend />
            <span>{loading ? 'Submitting...' : 'Submit Ticket'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SupportTicket;
