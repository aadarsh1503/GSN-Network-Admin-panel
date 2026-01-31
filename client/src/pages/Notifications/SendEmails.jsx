import React, { useState, useEffect, useRef } from "react";
import { FiSend, FiUsers, FiMail, FiEye, FiBarChart } from "react-icons/fi";
import { api } from "../../utils/api";
import { adminToast } from "../../utils/adminToast";
import $ from "jquery";

const SendEmails = () => {
  const [formData, setFormData] = useState({
    userType: "",
    subject: "",
    emailMethod: "sendy" // Default to Sendy
  });

  const [editorContent, setEditorContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailStats, setEmailStats] = useState(null);
  const [userCounts, setUserCounts] = useState({});
  const [sendySubscriberCount, setSendySubscriberCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const wrapperRef = useRef(null);

  // Fetch email statistics and user counts
  useEffect(() => {
    fetchEmailStats();
  }, []);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
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
      
      if (formData.emailMethod === 'sendy') {
        adminToast.success(result.message || 'Campaign sent successfully via Sendy!');
        
        if (result.subscriptionResults) {
          const { successful, failed } = result.subscriptionResults;
          if (successful > 0) {
            adminToast.success(`✅ Added ${successful} users to Sendy list`);
          }
          if (failed > 0) {
            adminToast.error(`❌ ${failed} users failed to be added to list`);
          }
        }
      } else {
        adminToast.success(`Email sent successfully to ${result.successful} users!`);
        if (result.failed > 0) {
          adminToast.error(`${result.failed} emails failed to send`);
        }
      }

      // Reset form
      setFormData({ userType: "", subject: "", emailMethod: "sendy" });
      setEditorContent("");
      
      // Clear editor content
      if (wrapperRef.current?.shadowRoot) {
        const editorDiv = wrapperRef.current.shadowRoot.querySelector('div');
        if (editorDiv) {
          $(editorDiv).summernote('code', '');
        }
      }

      // Refresh stats
      fetchEmailStats();

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
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
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
              
              {/* Sendy Subscriber Count */}
              <div className="bg-gradient-to-r from-[#bca142]/10 to-[#bca142]/20 p-4 rounded-lg border border-[#bca142]/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Sendy Subscribers
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{sendySubscriberCount}</p>
                  </div>
                  <FiMail className="h-8 w-8 text-[#bca142]" />
                </div>
              </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.emailMethod === 'sendy' 
                      ? 'border-[#bca142] bg-[#bca142]/10' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, emailMethod: 'sendy' }))}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="emailMethod"
                      value="sendy"
                      checked={formData.emailMethod === 'sendy'}
                      onChange={handleChange}
                      className="mr-3"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">Sendy (Recommended)</h3>
                      <p className="text-sm text-gray-600">Professional email campaigns with analytics</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-[#bca142]/20 text-[#bca142] text-xs rounded">Better Deliverability</span>
                        <span className="px-2 py-1 bg-[#bca142]/20 text-[#bca142] text-xs rounded">Analytics</span>
                        <span className="px-2 py-1 bg-[#bca142]/20 text-[#bca142] text-xs rounded">Cost Effective</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.emailMethod === 'smtp' 
                      ? 'border-[#bca142] bg-[#bca142]/10' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, emailMethod: 'smtp' }))}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="emailMethod"
                      value="smtp"
                      checked={formData.emailMethod === 'smtp'}
                      onChange={handleChange}
                      className="mr-3"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">SMTP (Direct)</h3>
                      <p className="text-sm text-gray-600">Direct email sending via server</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-[#bca142]/20 text-[#bca142] text-xs rounded">Immediate</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">Basic</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {formData.emailMethod === 'sendy' && (
                <div className="mt-3 p-3 bg-[#bca142]/10 border border-[#bca142]/30 rounded-md">
                  <p className="text-sm text-gray-800">
                    <strong>Sendy Campaign Process:</strong> 
                    <br />1. Selected users will be added to your Sendy subscriber list
                    <br />2. A professional email campaign will be created and sent
                    <br />3. You'll get detailed analytics in your Sendy dashboard
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    Current Sendy subscribers: {sendySubscriberCount} | 
                    This method provides better deliverability and professional analytics.
                  </p>
                </div>
              )}
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
                    setFormData({ userType: "", subject: "", emailMethod: "sendy" });
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
                      {formData.emailMethod === 'sendy' ? 'Sending via Sendy...' : 'Sending via SMTP...'}
                    </>
                  ) : (
                    <>
                      <FiSend className="mr-2" />
                      {formData.emailMethod === 'sendy' ? 'Send via Sendy' : 'Send via SMTP'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Email Statistics */}
        {emailStats && emailStats.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md mt-6">
            <div className="flex items-center mb-4">
              <FiBarChart className="h-5 w-5 text-[#bca142] mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Recent Email Activity</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-800">Emails Sent (Last 30 Days)</p>
                <p className="text-2xl font-bold text-green-900">
                  {emailStats.filter(stat => stat.status === 'sent').reduce((sum, stat) => sum + stat.count, 0)}
                </p>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-red-800">Failed Emails</p>
                <p className="text-2xl font-bold text-red-900">
                  {emailStats.filter(stat => stat.status === 'failed').reduce((sum, stat) => sum + stat.count, 0)}
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-800">Success Rate</p>
                <p className="text-2xl font-bold text-blue-900">
                  {(() => {
                    const sent = emailStats.filter(stat => stat.status === 'sent').reduce((sum, stat) => sum + stat.count, 0);
                    const failed = emailStats.filter(stat => stat.status === 'failed').reduce((sum, stat) => sum + stat.count, 0);
                    const total = sent + failed;
                    return total > 0 ? Math.round((sent / total) * 100) : 0;
                  })()}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SendEmails;
