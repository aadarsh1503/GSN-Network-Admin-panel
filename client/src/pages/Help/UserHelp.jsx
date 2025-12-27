import React, { useState, useEffect } from 'react';
import { FiMail, FiPhone, FiMapPin, FiClock, FiHelpCircle, FiMessageSquare, FiUser } from 'react-icons/fi';

const UserHelp = () => {
  const [helpData, setHelpData] = useState({
    admin_logo: '',
    contact_email: '',
    contact_phone: '',
    company_name: '',
    support_hours: '',
    address: '',
    contact_details: ''
  });
  const [loading, setLoading] = useState(true);

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
        setHelpData(processedData);
      }
    } catch (error) {
      console.error('Error fetching help data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-600"></div>
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
          {helpData.company_name || 'Help & Support'}
        </h1>
        <p className="text-gray-600">
          We're here to help you with any questions or issues you may have.
        </p>
      </div>

      {/* Contact Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Email Support */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center mb-4">
            <FiMail className="text-yellow-600 text-2xl mr-3" />
            <h3 className="text-lg font-semibold text-gray-800">Email Support</h3>
          </div>
          <p className="text-gray-600 mb-2">Send us an email for detailed assistance</p>
          <a 
            href={`mailto:${helpData.contact_email}`}
            className="text-yellow-600 hover:text-yellow-700 font-medium"
          >
            {helpData.contact_email}
          </a>
        </div>

        {/* Phone Support */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center mb-4">
            <FiPhone className="text-blue-600 text-2xl mr-3" />
            <h3 className="text-lg font-semibold text-gray-800">Phone Support</h3>
          </div>
          <p className="text-gray-600 mb-2">Call us for immediate assistance</p>
          <a 
            href={`tel:${helpData.contact_phone}`}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {helpData.contact_phone}
          </a>
        </div>

        {/* Support Hours */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center mb-4">
            <FiClock className="text-green-600 text-2xl mr-3" />
            <h3 className="text-lg font-semibold text-gray-800">Support Hours</h3>
          </div>
          <p className="text-gray-600 mb-2">We're available during these hours</p>
          <p className="text-green-600 font-medium">
            {helpData.support_hours || 'Monday - Friday: 9:00 AM - 6:00 PM'}
          </p>
        </div>
      </div>

      {/* Address */}
      {helpData.address && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <FiMapPin className="text-red-600 text-2xl mr-3" />
            <h3 className="text-lg font-semibold text-gray-800">Our Location</h3>
          </div>
          <p className="text-gray-600">{helpData.address}</p>
        </div>
      )}

      {/* FAQ Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center mb-6">
          <FiHelpCircle className="text-purple-600 text-2xl mr-3" />
          <h3 className="text-xl font-semibold text-gray-800">Frequently Asked Questions</h3>
        </div>
        
        <div className="space-y-4">
          <div className="border-b pb-4">
            <h4 className="font-medium text-gray-800 mb-2">How do I request a quote?</h4>
            <p className="text-gray-600">
              You can request a quote by navigating to the "My Quotes" section and clicking on "Request New Quote". 
              Fill in all the required details and submit your request.
            </p>
          </div>
          
          <div className="border-b pb-4">
            <h4 className="font-medium text-gray-800 mb-2">How do I track my quote status?</h4>
            <p className="text-gray-600">
              Go to "My Quotes" section where you can see all your quotes with their current status. 
              You'll also receive notifications when there are updates.
            </p>
          </div>
          
          <div className="border-b pb-4">
            <h4 className="font-medium text-gray-800 mb-2">How do I update my profile?</h4>
            <p className="text-gray-600">
              Click on "Profile" in the sidebar menu to update your personal information, 
              contact details, and preferences.
            </p>
          </div>
          
          <div className="pb-4">
            <h4 className="font-medium text-gray-800 mb-2">How do I contact support?</h4>
            <p className="text-gray-600">
              You can reach us through email, phone, or by using the messaging system within the platform. 
              Our support team is available during business hours to assist you.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Details (Rich Text) */}
      {helpData.contact_details && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <FiMessageSquare className="text-indigo-600 text-2xl mr-3" />
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