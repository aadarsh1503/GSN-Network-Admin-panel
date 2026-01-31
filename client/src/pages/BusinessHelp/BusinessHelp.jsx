import { useState, useEffect } from 'react';
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
  FileText,
  Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';

const BusinessHelp = () => {
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

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  useEffect(() => {
    fetchHelpData();
  }, []);

  const fetchHelpData = async () => {
    try {
      // Fetch general help data (same as other panels)
      const generalResponse = await fetch('/api/general-settings/help/data');
      const generalResult = await generalResponse.json();
      
      if (generalResult.success) {
        setHelpData(prev => ({
          ...prev,
          ...generalResult.data
        }));
      }

      // Fetch business-specific help data
      const businessResponse = await api.get('/api/business/help');
      if (businessResponse && businessResponse.faqs) {
        setHelpData(prev => ({
          ...prev,
          faqs: businessResponse.faqs
        }));
      }
    } catch (error) {
      console.error('Error fetching help data:', error);
      // Set default business FAQs if API fails
      setHelpData(prev => ({
        ...prev,
        faqs: [
          {
            id: 1,
            question: "How do I request a logistics quote?",
            answer: "Navigate to the 'Request Quote' section, fill in your shipment details including origin, destination, cargo type, and requirements. Submit the form and you'll receive quotes from logistics providers."
          },
          {
            id: 2,
            question: "How do I track my quote requests?",
            answer: "Go to 'My Quotes' section to see all your quote requests with their current status. You'll also receive notifications when providers respond to your quotes."
          },
          {
            id: 3,
            question: "How do I compare different quote responses?",
            answer: "In the 'My Quotes' section, click on any quote to see all responses from different logistics providers. You can compare prices, transit times, and terms to choose the best option."
          },
          {
            id: 4,
            question: "How do I accept a quote?",
            answer: "Once you've reviewed the quote responses, click 'Accept' on your preferred option. This will initiate the booking process with the selected logistics provider."
          },
          {
            id: 5,
            question: "What information do I need to provide for accurate quotes?",
            answer: "Provide detailed information including cargo type, dimensions, weight, origin and destination addresses, preferred shipping dates, and any special requirements like temperature control or insurance."
          },
          {
            id: 6,
            question: "How do I update my business profile?",
            answer: "Go to 'Profile' section where you can update your business information, contact details, and business categories to help logistics providers understand your needs better."
          }
        ]
      }));
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
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-200 border-t-[#bca142] mx-auto mb-4"></div>
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
          {helpData.company_name || 'Business Help & Support'}
        </h1>
        <p className="text-gray-600 mb-6">
          Get support for your logistics and shipping needs as a business user.
        </p>
        
        {/* Search Bar */}
        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-transparent transition-all duration-300"
          />
        </div>
      </div>

      {/* Contact Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Email Support */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-[#bca142]">
          <div className="flex items-center mb-4">
            <Mail className="text-[#bca142] text-2xl mr-3" />
            <h3 className="text-lg font-semibold text-gray-800">Email Support</h3>
          </div>
          <p className="text-gray-600 mb-2">Send us an email for detailed assistance</p>
          <a 
            href={`mailto:${helpData.contact_email}`}
            className="text-[#bca142] hover:text-black font-medium"
          >
            {helpData.contact_email || 'support@gsn.com'}
          </a>
        </div>

        {/* Phone Support */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-[#bca142]">
          <div className="flex items-center mb-4">
            <Phone className="text-[#bca142] text-2xl mr-3" />
            <h3 className="text-lg font-semibold text-gray-800">Phone Support</h3>
          </div>
          <p className="text-gray-600 mb-2">Call us for immediate assistance</p>
          <a 
            href={`tel:${helpData.contact_phone}`}
            className="text-[#bca142] hover:text-black font-medium"
          >
            {helpData.contact_phone || '+1-800-GSN-HELP'}
          </a>
        </div>

        {/* Support Hours */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-[#bca142]">
          <div className="flex items-center mb-4">
            <Clock className="text-[#bca142] text-2xl mr-3" />
            <h3 className="text-lg font-semibold text-gray-800">Support Hours</h3>
          </div>
          <p className="text-gray-600 mb-2">We're available during these hours</p>
          <p className="text-[#bca142] font-medium">
            {helpData.support_hours || 'Monday - Friday: 9:00 AM - 6:00 PM EST'}
          </p>
        </div>
      </div>

      {/* Address */}
      {helpData.address && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <MapPin className="text-[#bca142] text-2xl mr-3" />
            <h3 className="text-lg font-semibold text-gray-800">Our Location</h3>
          </div>
          <p className="text-gray-600">{helpData.address}</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link 
          to="/business/tickets"
          className="bg-white rounded-lg shadow-md p-6 border-l-4 border-[#bca142] hover:shadow-lg transition-all duration-300 cursor-pointer group"
        >
          <div className="flex items-center mb-4">
            <MessageSquare className="text-[#bca142] text-2xl mr-3" />
            <h3 className="text-lg font-semibold text-gray-800">Support Tickets</h3>
          </div>
          <p className="text-gray-600 text-sm">Manage your support tickets and get help from our team</p>
        </Link>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-[#bca142]">
          <div className="flex items-center mb-4">
            <Book className="text-[#bca142] text-2xl mr-3" />
            <h3 className="text-lg font-semibold text-gray-800">User Guide</h3>
          </div>
          <p className="text-gray-600 text-sm">Learn how to use the platform effectively</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-[#bca142]">
          <div className="flex items-center mb-4">
            <LifeBuoy className="text-[#bca142] text-2xl mr-3" />
            <h3 className="text-lg font-semibold text-gray-800">Live Support</h3>
          </div>
          <p className="text-gray-600 text-sm">Chat with our support team</p>
        </div>
      </div>

      {/* Business-specific FAQ Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center mb-6">
          <HelpCircle className="text-[#bca142] text-2xl mr-3" />
          <h3 className="text-xl font-semibold text-gray-800">Business User FAQ</h3>
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

      {/* Business Services Guide */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center mb-6">
          <Briefcase className="text-[#bca142] text-2xl mr-3" />
          <h3 className="text-xl font-semibold text-gray-800">Business Services Guide</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start">
            <FileText className="text-[#bca142] text-xl mr-3 mt-1" />
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Quote Management</h4>
              <p className="text-gray-600 text-sm">
                Request quotes for your logistics needs and manage responses from multiple providers.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <User className="text-[#bca142] text-xl mr-3 mt-1" />
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Profile Management</h4>
              <p className="text-gray-600 text-sm">
                Keep your business profile updated to receive more accurate quotes from logistics providers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Details (Rich Text) */}
      {helpData.contact_details && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <MessageSquare className="text-[#bca142] text-2xl mr-3" />
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

export default BusinessHelp;