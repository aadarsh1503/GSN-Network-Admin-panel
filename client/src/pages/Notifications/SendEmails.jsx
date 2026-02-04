import React, { useState, useEffect, useRef } from "react";
import { FiSend, FiUsers, FiMail, FiEye, FiBarChart, FiFilter, FiCalendar, FiClock, FiX, FiUser } from "react-icons/fi";
import { api } from "../../utils/api";
import { adminToast } from "../../utils/adminToast";
import $ from "jquery";

const SendEmails = () => {
  const [formData, setFormData] = useState({
    userType: "",
    subject: "",
    emailMethod: "aws_ses" // Default to AWS SES as primary method
  });

  const [editorContent, setEditorContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailStats, setEmailStats] = useState(null);
  const [userCounts, setUserCounts] = useState({});
  const [sendySubscriberCount, setSendySubscriberCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignFilters, setCampaignFilters] = useState({
    method: 'all',
    userType: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [campaignPagination, setCampaignPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    pages: 0
  });
  const [showRecipientsModal, setShowRecipientsModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignRecipients, setCampaignRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const wrapperRef = useRef(null);

  // Fetch email statistics and user counts
  useEffect(() => {
    fetchEmailStats();
    if (showHistory) {
      fetchCampaigns();
    }
  }, [showHistory, campaignFilters, campaignPagination.page]);

  const fetchEmailStats = async () => {
    try {
      console.log('🔍 Fetching email stats...');
      const data = await api.get('/api/admin/email-stats');
      console.log('📊 Email stats response:', data);
      
      setEmailStats(data.emailStats);
      setUserCounts(data.userCounts);
      setSendySubscriberCount(data.sendySubscriberCount || 0);
      
      console.log('✅ User counts set:', data.userCounts);
    } catch (error) {
      console.error('❌ Error fetching email stats:', error);
      // Set fallback counts when API fails (database connection issues)
      setUserCounts({
        all: 0,
        users: 0,
        companies: 0,
        business_owners: 0,
        subscribers: 0
      });
      adminToast.error('Unable to fetch user counts. Database connection issue.');
    }
  };

  const fetchCampaigns = async () => {
    try {
      const params = new URLSearchParams({
        page: campaignPagination.page,
        limit: campaignPagination.limit,
        ...campaignFilters
      });
      
      const data = await api.get(`/api/admin/email-campaigns?${params}`);
      setCampaigns(data.campaigns);
      setCampaignPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        pages: data.pagination.pages
      }));
    } catch (error) {
      console.error('❌ Error fetching campaigns:', error);
      setCampaigns([]);
    }
  };

  const fetchCampaignRecipients = async (campaignId) => {
    setLoadingRecipients(true);
    try {
      const data = await api.get(`/api/admin/email-campaigns/${campaignId}/recipients`);
      setCampaignRecipients(data.recipients || []);
    } catch (error) {
      console.error('❌ Error fetching campaign recipients:', error);
      adminToast.error('Failed to load campaign recipients');
      setCampaignRecipients([]);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const handleViewRecipients = (campaign) => {
    setSelectedCampaign(campaign);
    setShowRecipientsModal(true);
    fetchCampaignRecipients(campaign.id);
  };

  // Helper function to format date consistently
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      timezone: date.toLocaleTimeString([], {timeZoneName: 'short'}).split(' ').pop()
    };
  };

  const handleFilterChange = (key, value) => {
    setCampaignFilters(prev => ({ ...prev, [key]: value }));
    setCampaignPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Prevent selecting sendy or smtp methods (upcoming events)
    if (name === 'emailMethod' && (value === 'sendy' || value === 'smtp')) {
      return; // Don't allow sendy or smtp selection
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    let shadow;

    // ✅ Attach Shadow DOM only once
    if (!wrapperRef.current.shadowRoot) {
      shadow = wrapperRef.current.attachShadow({ mode: "open" });
    } else {
      shadow = wrapperRef.current.shadowRoot;
    }

    // ✅ Inject Bootstrap & Summernote CSS inside the shadow
    const bootstrapLink = document.createElement("link");
    bootstrapLink.rel = "stylesheet";
    bootstrapLink.href =
      "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css";
    shadow.appendChild(bootstrapLink);

    const summernoteLink = document.createElement("link");
    summernoteLink.rel = "stylesheet";
    summernoteLink.href =
      "https://cdn.jsdelivr.net/npm/summernote@0.8.20/dist/summernote-lite.min.css";
    shadow.appendChild(summernoteLink);

    // ✅ Create a container for the Summernote editor
    const editorDiv = document.createElement("div");
    shadow.appendChild(editorDiv);

    // ✅ Load JS and initialize Summernote
    import("bootstrap/dist/js/bootstrap.bundle.min.js").then(() => {
      import("summernote/dist/summernote-lite.js").then(() => {
        $(editorDiv).summernote({
          height: 300,
          dialogsInBody: true,
          toolbar: [
            ["style", ["style"]],
            ["font", ["bold", "underline", "strikethrough", "clear"]],
            ["fontname", ["fontname"]],
            ["color", ["color"]],
            ["para", ["ul", "ol", "paragraph"]],
            ["table", ["table"]],
            ["insert", ["link", "picture", "video"]],
            ["view", ["fullscreen", "codeview", "help"]],
          ],
          callbacks: {
            onChange: (contents) => setEditorContent(contents),
          },
        });
      });
    });

    // ✅ Cleanup on unmount
    return () => {
      if (editorDiv && $(editorDiv).next(".note-editor").length) {
        $(editorDiv).summernote("destroy");
      }
      shadow.innerHTML = "";
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.userType || !formData.subject || !editorContent) {
      adminToast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      const emailData = {
        userType: formData.userType,
        subject: formData.subject,
        body: editorContent,
        emailMethod: formData.emailMethod
      };

      console.log('📧 Sending email request:', emailData);

      const result = await api.post('/api/admin/send-emails', emailData);
      
      console.log('✅ Email response:', result);
      
      if (formData.emailMethod === 'aws_ses') {
        adminToast.success(`📧 Emails sent immediately to ${result.successful} users via AWS SES!`);
        if (result.failed > 0) {
          adminToast.error(`❌ ${result.failed} emails failed to send`);
        }
      } else if (formData.emailMethod === 'sendy') {
        adminToast.success(result.message || 'Campaign sent successfully via Sendy!');
        
        // Show subscription results
        if (result.subscriptionResults) {
          const { successful, failed, alreadySubscribed } = result.subscriptionResults;
          if (successful > 0) {
            adminToast.success(`✅ Added ${successful} users to ${formData.userType} list AND All Users list`);
          }
          if (alreadySubscribed > 0) {
            adminToast.info(`ℹ️ ${alreadySubscribed} users were already in the lists`);
          }
          if (failed > 0) {
            adminToast.error(`❌ ${failed} users failed to be added to lists`);
          }
        }
        
        // Show specific list information with timing note
        if (result.userType && result.targetListId) {
          adminToast.success(`📧 Campaign created for ${result.userType} Sendy list (${result.targetListId})`);
          adminToast.info(`⏳ Campaign is now processing. Emails will start sending within 1-2 minutes.`);
        }
      } else {
        adminToast.success(`📧 Emails sent immediately to ${result.successful} users via SMTP!`);
        if (result.failed > 0) {
          adminToast.error(`❌ ${result.failed} emails failed to send`);
        }
      }

      // Reset form
      setFormData({ userType: "", subject: "", emailMethod: "aws_ses" });
      setEditorContent("");
      
      // Clear editor content
      if (wrapperRef.current?.shadowRoot) {
        const editorDiv = wrapperRef.current.shadowRoot.querySelector('div');
        if (editorDiv) {
          $(editorDiv).summernote('code', '');
        }
      }

      // Refresh stats and campaigns
      fetchEmailStats();
      if (showHistory) {
        fetchCampaigns();
      }

    } catch (error) {
      console.error('Error sending emails:', error);
      adminToast.error(error.response?.data?.message || 'Failed to send emails');
    } finally {
      setLoading(false);
    }
  };

  const getUserTypeLabel = (type) => {
    const labels = {
      all: 'All Users',
      users: 'Regular Users (Quote Requesters)',
      companies: 'Company Members',
      business_owners: 'Business Owners',
      subscribers: 'Active Subscribers'
    };
    return labels[type] || type;
  };

  const getUserTypeDescription = (type) => {
    const descriptions = {
      all: 'Send to all registered users on the platform',
      users: 'Send to users who request quotes from companies',
      companies: 'Send to company members who provide services',
      business_owners: 'Send to business owners and entrepreneurs',
      subscribers: 'Send to users with active subscription plans'
    };
    return descriptions[type] || '';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Send Email Notifications
              </h1>
              <p className="text-gray-600">
                Send personalized emails to different user groups on your platform
              </p>
            </div>
            <div className="flex items-center space-x-2 text-[#bca142]">
              <FiMail className="h-8 w-8" />
              <span className="text-sm font-medium">Bulk Email System</span>
            </div>
          </div>

          {/* User Statistics Cards */}
          {Object.keys(userCounts).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              {Object.entries(userCounts).map(([type, count]) => (
                <div key={type} className="bg-gradient-to-r from-[#bca142]/10 to-[#bca142]/20 p-4 rounded-lg border border-[#bca142]/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                        {getUserTypeLabel(type)}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">{count}</p>
                    </div>
                    <FiUsers className="h-8 w-8 text-[#bca142]" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Show message when all counts are 0 */}
          {Object.keys(userCounts).length > 0 && Object.values(userCounts).every(count => count === 0) && (
            <div className="bg-[#bca142]/10 border border-[#bca142]/30 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <FiUsers className="h-5 w-5 text-[#bca142] mr-2" />
                <p className="text-sm text-gray-800">
                  <strong>Note:</strong> All user counts show 0. This may be due to database connection issues or no active users in the system.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Email Form */}
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
          <form onSubmit={handleSubmit}>
            {/* Email Method Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Email Delivery Method *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.emailMethod === 'aws_ses' 
                      ? 'border-[#bca142] bg-[#bca142]/10' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, emailMethod: 'aws_ses' }))}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="emailMethod"
                      value="aws_ses"
                      checked={formData.emailMethod === 'aws_ses'}
                      onChange={handleChange}
                      className="mr-3"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">AWS SES (Primary)</h3>
                      <p className="text-sm text-gray-600">Professional direct sending via Amazon SES infrastructure</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Immediate</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Reliable</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Professional</span>
                        <span className="px-2 py-1 bg-[#bca142]/20 text-[#bca142] text-xs rounded">Recommended</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div 
                  className="p-4 border-2 rounded-lg relative opacity-60 cursor-not-allowed border-gray-300 bg-gray-50"
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="emailMethod"
                      value="smtp"
                      disabled
                      className="mr-3 cursor-not-allowed"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-500">SMTP (Upcoming Event)</h3>
                      <p className="text-sm text-gray-400">Direct server email sending - Available in next update</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-gray-200 text-gray-500 text-xs rounded">Direct Sending</span>
                        <span className="px-2 py-1 bg-gray-200 text-gray-500 text-xs rounded">Server SMTP</span>
                        <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded">Coming Soon</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div 
                  className="p-4 border-2 rounded-lg relative opacity-60 cursor-not-allowed border-gray-300 bg-gray-50"
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="emailMethod"
                      value="sendy"
                      disabled
                      className="mr-3 cursor-not-allowed"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-500">Sendy (Upcoming Event)</h3>
                      <p className="text-sm text-gray-400">Advanced targeted campaigns - Available in next update</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-gray-200 text-gray-500 text-xs rounded">Targeted Lists</span>
                        <span className="px-2 py-1 bg-gray-200 text-gray-500 text-xs rounded">Advanced Analytics</span>
                        <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded">Coming Soon</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Method Information */}
              {formData.emailMethod === 'aws_ses' && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    <strong>✅ Primary Email Method - AWS SES:</strong> 
                    <br />• Professional email delivery via Amazon's infrastructure
                    <br />• Immediate sending with instant success/failure feedback
                    <br />• High deliverability and reliability
                    <br />• Perfect for all types of email campaigns
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    <strong>Recommended:</strong> AWS SES is the primary method for all email campaigns
                  </p>
                </div>
              )}
              
              {/* Upcoming Features Notice */}
              {/* <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-orange-800">
                      🚀 Advanced Email Features - Coming Soon!
                    </h3>
                    <div className="mt-2 text-sm text-orange-700">
                      <p className="mb-2">We're working on exciting new email delivery options:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>Sendy Integration:</strong> Advanced targeted campaigns with detailed analytics and list management</li>
                        <li><strong>Direct SMTP:</strong> Alternative server-based email delivery for specific use cases</li>
                        <li><strong>Enhanced Analytics:</strong> Detailed open rates, click tracking, and engagement metrics</li>
                        <li><strong>Template Library:</strong> Pre-designed email templates for different campaign types</li>
                      </ul>
                      <p className="mt-2 font-medium">Stay tuned for the next update!</p>
                    </div>
                  </div>
                </div>
              </div> */}
            </div>

            {/* User Type and Subject */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              <div>
                <label
                  htmlFor="userType"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Select Recipients *
                </label>
                <select
                  id="userType"
                  name="userType"
                  value={formData.userType}
                  onChange={handleChange}
                  className="w-full px-3 py-3 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-[#bca142]"
                  required
                >
                  <option value="">Choose recipient group</option>
                  <option value="all">All Users ({userCounts.all || 0})</option>
                  <option value="users">Regular Users ({userCounts.users || 0})</option>
                  <option value="companies">Company Members ({userCounts.companies || 0})</option>
                  <option value="business_owners">Business Owners ({userCounts.business_owners || 0})</option>
                  <option value="subscribers">Active Subscribers ({userCounts.subscribers || 0})</option>
                </select>
                {formData.userType && (
                  <p className="mt-2 text-sm text-gray-600">
                    {getUserTypeDescription(formData.userType)}
                  </p>
                )}
              </div>
              
              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Subject *
                </label>
                <input 
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Enter email subject line"
                  className="w-full px-3 py-3 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#bca142] focus:border-[#bca142]"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Keep it clear and engaging to improve open rates
                </p>
              </div>
            </div>

            {/* Email Body Editor */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email Content *
                </label>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center text-sm text-[#bca142] hover:text-black"
                >
                  <FiEye className="mr-1" />
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </button>
              </div>
              
              <div className="bg-[#bca142]/10 p-3 rounded-md mb-3">
                <p className="text-sm text-gray-800">
                  <strong>Pro Tip:</strong> Use <code>{'{name}'}</code> in your content to personalize emails with recipient names.
                  Example: "Hello {'{name}'}, we have exciting news for you!"
                </p>
              </div>
              
              <div ref={wrapperRef}></div>
              
              {showPreview && editorContent && (
                <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Email Preview:</h4>
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: editorContent.replace(/\{name\}/g, '<strong>[Recipient Name]</strong>') 
                    }}
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {formData.userType && userCounts[formData.userType] && (
                  <span>
                    Ready to send to <strong>{userCounts[formData.userType]} recipients</strong>
                  </span>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ userType: "", subject: "", emailMethod: "aws_ses" });
                    setEditorContent("");
                    if (wrapperRef.current?.shadowRoot) {
                      const editorDiv = wrapperRef.current.shadowRoot.querySelector('div');
                      if (editorDiv) {
                        $(editorDiv).summernote('code', '');
                      }
                    }
                  }}
                  className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Clear Form
                </button>
                
                <button
                  type="submit"
                  disabled={loading || !formData.userType || !formData.subject || !editorContent}
                  className="flex items-center px-6 py-3 bg-[#bca142] text-white font-semibold rounded-md hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#bca142] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending via AWS SES...
                    </>
                  ) : (
                    <>
                      <FiSend className="mr-2" />
                      Send via AWS SES
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Email Campaign History */}
        <div className="bg-white p-4 rounded-lg shadow-md mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FiClock className="h-5 w-5 text-[#bca142] mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Campaign History</h3>
              <span className="ml-2 text-xs text-gray-500">
                (Times shown in your local timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone})
              </span>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center text-sm text-[#bca142] hover:text-black"
            >
              <FiEye className="mr-1" />
              {showHistory ? 'Hide History' : 'Show History'}
            </button>
          </div>

          {showHistory && (
            <>
              {/* Compact Filters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 bg-gray-50 rounded-md">
                <select
                  value={campaignFilters.method}
                  onChange={(e) => handleFilterChange('method', e.target.value)}
                  className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#bca142]"
                >
                  <option value="all">All Methods</option>
                  <option value="sendy">Sendy</option>
                  <option value="aws_ses">AWS SES</option>
                  <option value="smtp">SMTP</option>
                </select>

                <select
                  value={campaignFilters.userType}
                  onChange={(e) => handleFilterChange('userType', e.target.value)}
                  className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#bca142]"
                >
                  <option value="all">All User Types</option>
                  <option value="all">All Users</option>
                  <option value="users">Regular Users</option>
                  <option value="companies">Company Members</option>
                  <option value="business_owners">Business Owners</option>
                  <option value="subscribers">Active Subscribers</option>
                </select>

                <input
                  type="date"
                  value={campaignFilters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#bca142]"
                  placeholder="From Date"
                />

                <input
                  type="date"
                  value={campaignFilters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#bca142]"
                  placeholder="To Date"
                />
              </div>

              {/* Compact Campaign List */}
              <div className="space-y-2">
                {campaigns.length > 0 ? (
                  campaigns.map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md text-sm">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            campaign.method === 'sendy' 
                              ? 'bg-[#bca142]/20 text-[#bca142]' 
                              : campaign.method === 'aws_ses'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-200 text-gray-700'
                          }`}>
                            {campaign.method === 'aws_ses' ? 'AWS SES' : campaign.method.toUpperCase()}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {getUserTypeLabel(campaign.user_type)}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 mt-1 truncate">{campaign.subject}</p>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-600">
                        <div className="text-center">
                          <div className="font-medium text-gray-900">{campaign.total_users}</div>
                          <div>Total</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-green-600">{campaign.successful_users}</div>
                          <div>Sent</div>
                        </div>
                        {campaign.failed_users > 0 && (
                          <div className="text-center">
                            <div className="font-medium text-red-600">{campaign.failed_users}</div>
                            <div>Failed</div>
                          </div>
                        )}
                        <div className="text-center">
                          <div className="font-medium text-gray-900">
                            {formatDateTime(campaign.created_at).date}
                          </div>
                          <div>{formatDateTime(campaign.created_at).time}</div>
                        </div>
                        <button
                          onClick={() => handleViewRecipients(campaign)}
                          className="flex items-center px-3 py-1 bg-[#bca142] text-white rounded text-xs hover:bg-black transition-colors"
                          title="View Recipients"
                        >
                          <FiUsers className="mr-1" />
                          Recipients
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <FiMail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No campaigns found</p>
                  </div>
                )}
              </div>

              {/* Compact Pagination */}
              {campaignPagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm">
                  <span className="text-gray-600">
                    Page {campaignPagination.page} of {campaignPagination.pages} ({campaignPagination.total} total)
                  </span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setCampaignPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={campaignPagination.page === 1}
                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setCampaignPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                      disabled={campaignPagination.page === campaignPagination.pages}
                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Recipients Modal */}
        {showRecipientsModal && selectedCampaign && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Campaign Recipients</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedCampaign.subject} • {getUserTypeLabel(selectedCampaign.user_type)} • {formatDateTime(selectedCampaign.created_at).date} {formatDateTime(selectedCampaign.created_at).time}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowRecipientsModal(false);
                    setSelectedCampaign(null);
                    setCampaignRecipients([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {loadingRecipients ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#bca142] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading recipients...</p>
                  </div>
                ) : campaignRecipients.length > 0 ? (
                  <>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-gray-900">{campaignRecipients.length}</div>
                        <div className="text-sm text-gray-600">Total Recipients</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {campaignRecipients.filter(r => r.status === 'sent' || r.status === 'success').length}
                        </div>
                        <div className="text-sm text-gray-600">Successfully Sent</div>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {campaignRecipients.filter(r => r.status === 'failed' || r.status === 'error').length}
                        </div>
                        <div className="text-sm text-gray-600">Failed</div>
                      </div>
                    </div>

                    {/* Recipients List */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 mb-3">Recipient Details</h4>
                      {campaignRecipients.map((recipient, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <FiUser className="h-5 w-5 text-gray-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{recipient.name || 'N/A'}</p>
                              <p className="text-sm text-gray-600">{recipient.email}</p>
                              {recipient.role && (
                                <p className="text-xs text-gray-500 capitalize">{recipient.role}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              recipient.status === 'sent' || recipient.status === 'success'
                                ? 'bg-green-100 text-green-800'
                                : recipient.status === 'failed' || recipient.status === 'error'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {recipient.status === 'sent' || recipient.status === 'success' ? 'Sent' : 
                               recipient.status === 'failed' || recipient.status === 'error' ? 'Failed' : 
                               recipient.status || 'Unknown'}
                            </span>
                            {recipient.sent_at && (
                              <span className="text-xs text-gray-500">
                                {formatDateTime(recipient.sent_at).date} {formatDateTime(recipient.sent_at).time}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <FiUsers className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No recipient data available for this campaign</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-600">
                  Campaign sent via {selectedCampaign.method === 'aws_ses' ? 'AWS SES' : selectedCampaign.method.toUpperCase()}
                </div>
                <button
                  onClick={() => {
                    setShowRecipientsModal(false);
                    setSelectedCampaign(null);
                    setCampaignRecipients([]);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SendEmails;
