import React, { useState, useEffect } from 'react';
import { FiCloud, FiSave, FiMail, FiKey, FiGlobe, FiUser, FiAlertCircle, FiCheckCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import { toast } from 'react-toastify';

const AWSSettings = () => {
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [formData, setFormData] = useState({
    access_key_id: '',
    secret_access_key: '',
    region: 'eu-north-1',
    ses_from_email: '',
    ses_from_name: 'GSN Network'
  });
  const [testEmail, setTestEmail] = useState('');
  const [showSecretKey, setShowSecretKey] = useState(false);

  // Fetch current AWS settings
  useEffect(() => {
    fetchAWSSettings();
  }, []);

  const fetchAWSSettings = async () => {
    try {
      const response = await fetch('/api/admin/aws-settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          access_key_id: data.access_key_id || '',
          secret_access_key: data.secret_access_key || '',
          region: data.region || 'eu-north-1',
          ses_from_email: data.ses_from_email || '',
          ses_from_name: data.ses_from_name || 'GSN Network'
        });
      } else {
        const errorData = await response.json();
        console.error('Error fetching AWS settings:', errorData);
        if (response.status === 404) {
          // No settings found, use defaults
          console.log('No AWS settings found, using defaults');
        } else if (response.status === 403) {
          toast.error('Access denied. Please check your admin permissions.');
        }
      }
    } catch (error) {
      console.error('Error fetching AWS settings:', error);
      toast.error('Failed to connect to server. Please check if backend is running.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/aws-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('AWS settings updated successfully!');
        fetchAWSSettings(); // Refresh to get masked secret key
      } else {
        toast.error(data.message || 'Failed to update AWS settings');
      }
    } catch (error) {
      console.error('Error updating AWS settings:', error);
      toast.error('Server error updating AWS settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }

    setTestingConnection(true);

    try {
      const response = await fetch('/api/admin/aws-settings/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ testEmail })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Test email sent successfully! Check your inbox.');
      } else {
        toast.error(data.message || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error('Server error testing connection');
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-[#bca142] rounded-lg flex items-center justify-center">
            <FiCloud className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">AWS Settings</h1>
            <p className="text-sm text-gray-600">Manage AWS SES credentials for email services</p>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
        <FiAlertCircle className="text-blue-500 text-xl flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-blue-900 mb-1">Important Information</h3>
          <p className="text-sm text-blue-800">
            These credentials are used for sending emails through AWS SES. Make sure your AWS account has SES configured 
            and the sender email is verified. Changes take effect immediately.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
              <FiKey className="mr-2 text-[#bca142]" />
              AWS Credentials
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Access Key ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiKey className="inline mr-2" />
                  AWS Access Key ID
                </label>
                <input
                  type="text"
                  name="access_key_id"
                  value={formData.access_key_id}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent"
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  required
                />
              </div>

              {/* Secret Access Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiKey className="inline mr-2" />
                  AWS Secret Access Key
                </label>
                <div className="relative">
                  <input
                    type={showSecretKey ? "text" : "password"}
                    name="secret_access_key"
                    value={formData.secret_access_key}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent pr-12"
                    placeholder="Enter new secret key to update"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    disabled={formData.secret_access_key && formData.secret_access_key.includes('•')}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                      formData.secret_access_key && formData.secret_access_key.includes('•')
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-500 hover:text-[#bca142] cursor-pointer'
                    }`}
                    title={
                      formData.secret_access_key && formData.secret_access_key.includes('•')
                        ? 'Cannot view stored secret key (security)'
                        : showSecretKey ? 'Hide secret key' : 'Show secret key'
                    }
                  >
                    {showSecretKey ? (
                      <FiEyeOff className="w-5 h-5" />
                    ) : (
                      <FiEye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.secret_access_key && formData.secret_access_key.includes('•') 
                    ? '🔒 Current secret key is hidden for security. Clear this field and enter a new key to update it.' 
                    : 'Enter a new secret key or leave empty to keep the current one'}
                </p>
              </div>

              {/* Region */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiGlobe className="inline mr-2" />
                  AWS Region
                </label>
                <input
                  type="text"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent"
                  placeholder="eu-north-1"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter AWS region code (e.g., us-east-1, eu-west-1, ap-south-1)
                </p>
              </div>

              {/* SES From Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiMail className="inline mr-2" />
                  SES From Email
                </label>
                <input
                  type="email"
                  name="ses_from_email"
                  value={formData.ses_from_email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent"
                  placeholder="info@promo.gulfstarnetwork.com"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This email must be verified in AWS SES
                </p>
              </div>

              {/* SES From Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiUser className="inline mr-2" />
                  SES From Name
                </label>
                <input
                  type="text"
                  name="ses_from_name"
                  value={formData.ses_from_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bca142] focus:border-transparent"
                  placeholder="GSN Network"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#bca142] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#a08935] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave className="mr-2" />
                    Save AWS Settings
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Test Connection Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FiCheckCircle className="mr-2 text-green-500" />
              Test Connection
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              Send a test email to verify your AWS SES configuration is working correctly.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Email Address
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection || !testEmail}
                className="w-full bg-green-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {testingConnection ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <FiMail className="mr-2" />
                    Send Test Email
                  </>
                )}
              </button>
            </div>

            {/* Current Configuration Display */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Current Configuration</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Region:</span>
                  <span className="font-medium text-gray-800">{formData.region}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">From Email:</span>
                  <span className="font-medium text-gray-800 truncate ml-2" title={formData.ses_from_email}>
                    {formData.ses_from_email || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">From Name:</span>
                  <span className="font-medium text-gray-800">{formData.ses_from_name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AWSSettings;
