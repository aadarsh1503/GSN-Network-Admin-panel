import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaTimes
} from 'react-icons/fa';
import { 
  HelpCircle, 
  Mail, 
  Phone, 
  Clock, 
  Search, 
  ChevronDown, 
  ChevronUp,
  MessageSquare,
  Book,
  LifeBuoy,
  Send,
  CheckCircle,
  MapPin,
  User,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';

const UserHelp = () => {
  const [helpData, setHelpData] = useState({
    admin_logo: '',
    contact_email: '',
    contact_phone: '',
    company_name: '',
    support_hours: '',
    address: '',
    contact_details: '',
    faqs: []
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  useEffect(() => {
    fetchHelpData();
  }, []);

  const fetchHelpData = async () => {
    try {
      const response = await fetch('/api/general-settings/help/data');
      const result = await response.json();
      
      console.log('Help data API response:', result); // Debug log
      
      if (result.success) {
        // Cloudinary URLs are already full URLs, no need to process them
        const processedData = { ...result.data };
        
        console.log('Logo URL:', processedData.admin_logo); // Debug log
        setHelpData(prev => ({
          ...prev,
          ...processedData,
          faqs: [
            {
              id: 1,
              question: "How do I request a quote?",
              answer: "You can request a quote by navigating to the 'My Quotes' section and clicking on 'Request New Quote'. Fill in all the required details and submit your request."
            },
            {
              id: 2,
              question: "How do I track my quote status?",
              answer: "Go to 'My Quotes' section where you can see all your quotes with their current status. You'll also receive notifications when there are updates."
            },
            {
              id: 3,
              question: "How do I update my profile?",
              answer: "Click on 'Profile' in the sidebar menu to update your personal information, contact details, and preferences."
            },
            {
              id: 4,
              question: "How do I contact support?",
              answer: "You can reach us through email, phone, or by submitting a support ticket. Our support team is available during business hours to assist you."
            },
            {
              id: 5,
              question: "How do I accept or reject quote responses?",
              answer: "In your 'My Quotes' section, click on any quote to see responses from logistics providers. You can review and accept or reject each response."
            }
          ]
        }));
      }
    } catch (error) {
      console.error('Error fetching help data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFaqs = helpData?.faqs?.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-200 border-t-yellow-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-slate-700">Loading help center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        {helpData.admin_logo ? (
          <img 
            src={helpData.admin_logo} 
            alt="Company Logo" 
            className="h-16 mx-auto mb-4"
            onError={(e) => {
              console.error('Logo failed to load:', helpData.admin_logo);
              e.target.style.display = 'none';
              // Show fallback
              const fallback = document.createElement('div');
              fallback.className = 'h-16 w-32 mx-auto mb-4 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-sm';
              fallback.textContent = 'Logo not available';
              e.target.parentNode.insertBefore(fallback, e.target);
            }}
          />
        ) : (
          <div className="h-16 w-32 mx-auto mb-4 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-sm">
            No logo uploaded
          </div>
        )}
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {helpData.company_name || 'User Help & Support'}
        </h1>
        <p className="text-gray-600 mb-6">
          Get support for your logistics and shipping needs as a user.
        </p>
        
        {/* Search Bar */}
        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
          />
        </div>
      </div>

      {/* Contact Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Email Support */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center mb-4">
            <Mail className="text-yellow-600 text-2xl mr-3" />
            <h3 className="text-lg font-semibold text-gray-800">Email Support</h3>
          </div>
          <p className="text-gray-600 mb-2">Send us an email for detailed assistance</p>
          <a 
            href={`mailto:${helpData.contact_email}`}
            className="text-yellow-600 hover:text-yellow-700 font-medium"
          >
            {helpData.contact_email || 'support@gsn.com'}
          </a>
        </div>

        {/* Phone Support */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center mb-4">
            <Phone className="text-blue-600 text-2xl mr-3" />
            <h3 className="text-lg font-semibold text-gray-800">Phone Support</h3>
          </div>
          <p className="text-gray-600 mb-2">Call us for immediate assistance</p>
          <a 
            href={`tel:${helpData.contact_phone}`}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {helpData.contact_phone || '+1-800-GSN-HELP'}
          </a>
        </div>

        {/* Support Hours */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center mb-4">
            <Clock className="text-green-600 text-2xl mr-3" />
            <h3 className="text-lg font-semibold text-gray-800">Support Hours</h3>
          </div>
          <p className="text-gray-600 mb-2">We're available during these hours</p>
          <p className="text-green-600 font-medium">
            {helpData.support_hours || 'Monday - Friday: 9:00 AM - 6:00 PM EST'}
          </p>
        </div>
      </div>

      {/* Address */}
      {helpData.address && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <MapPin className="text-red-600 text-2xl mr-3" />
            <h3 className="text-lg font-semibold text-gray-800">Our Location</h3>
          </div>
          <p className="text-gray-600">{helpData.address}</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link 
          to="/user/tickets"
          className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500 hover:shadow-lg transition-all duration-300 cursor-pointer group"
        >
          <div className="flex items-center mb-4">
            <MessageSquare className="text-purple-600 text-2xl mr-3" />
            <h3 className="text-lg font-semibold text-gray-800">Support Tickets</h3>
          </div>
          <p className="text-gray-600 text-sm">Manage your support tickets and get help from our team</p>
        </Link>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
          <div className="flex items-center mb-4">
            <Book className="text-indigo-600 text-2xl mr-3" />
            <h3 className="text-lg font-semibold text-gray-800">User Guide</h3>
          </div>
          <p className="text-gray-600 text-sm">Learn how to use the platform effectively</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-teal-500">
          <div className="flex items-center mb-4">
            <LifeBuoy className="text-teal-600 text-2xl mr-3" />
            <h3 className="text-lg font-semibold text-gray-800">Live Support</h3>
          </div>
          <p className="text-gray-600 text-sm">Chat with our support team</p>
        </div>
      </div>

      {/* User FAQ Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center mb-6">
          <HelpCircle className="text-purple-600 text-2xl mr-3" />
          <h3 className="text-xl font-semibold text-gray-800">User FAQ</h3>
        </div>
        
        <div className="space-y-4">
          {filteredFaqs.map((faq, index) => (
            <div key={faq.id} className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleFaq(index)}
                className="w-full px-6 py-4 text-left bg-slate-50 hover:bg-slate-100 transition-colors duration-300 flex items-center justify-between"
              >
                <span className="font-semibold text-slate-800">{faq.question}</span>
                {expandedFaq === index ? (
                  <ChevronUp className="h-5 w-5 text-slate-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-500" />
                )}
              </button>
              
              {expandedFaq === index && (
                <div className="px-6 py-4 bg-white border-t border-slate-200">
                  <p className="text-slate-700 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredFaqs.length === 0 && searchTerm && (
          <div className="text-center py-8">
            <HelpCircle className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No FAQs found matching your search.</p>
          </div>
        )}
      </div>

      {/* User Services Guide */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center mb-6">
          <User className="text-indigo-600 text-2xl mr-3" />
          <h3 className="text-xl font-semibold text-gray-800">User Services Guide</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start">
            <FileText className="text-blue-500 text-xl mr-3 mt-1" />
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Quote Requests</h4>
              <p className="text-gray-600 text-sm">
                Submit quote requests for your logistics needs and receive responses from multiple providers.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <User className="text-green-500 text-xl mr-3 mt-1" />
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Profile Management</h4>
              <p className="text-gray-600 text-sm">
                Keep your profile updated to receive more accurate quotes and better service.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Details (Rich Text) */}
      {helpData.contact_details && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <MessageSquare className="text-indigo-600 text-2xl mr-3" />
            <h3 className="text-lg font-semibold text-gray-800">Additional Contact Information</h3>
          </div>
          <div 
            className="text-gray-600"
            dangerouslySetInnerHTML={{ __html: helpData.contact_details }}
          />
        </div>
      )}
    </div>
  );
};

export default UserHelp;