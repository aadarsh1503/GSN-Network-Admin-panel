import { useState } from 'react';
import { 
  FiGlobe, FiHeart, FiMapPin, FiPhone, FiMail, FiStar, FiMessageSquare,
  FiUsers, FiGrid, FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaWhatsapp, FaInstagram, FaSkype } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const CompanyProfile = ({ member, onClose }) => {
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageData, setMessageData] = useState({ subject: '', message: '' });
  const [sendingMessage, setSendingMessage] = useState(false);
  const [expandedBranch, setExpandedBranch] = useState(null);

  const company = member.company || member;
  const branches = member.branches || [];
  const members = member.members || [];
  const reviews = member.reviews || [];

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageData.subject || !messageData.message) {
      toast.error('Please fill in all fields');
      return;
    }

    setSendingMessage(true);
    try {
      await api('/api/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          receiverId: company.id,
          subject: messageData.subject,
          message: messageData.message
        })
      });
      toast.success('Message sent successfully!');
      setMessageData({ subject: '', message: '' });
      setShowMessageForm(false);
    } catch (error) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAddToWishlist = async () => {
    try {
      await api('/api/wishlist/add', {
        method: 'POST',
        body: JSON.stringify({ companyId: company.id })
      });
      toast.success('Added to wishlist!');
    } catch (error) {
      toast.error(error.message || 'Failed to add to wishlist');
    }
  };

  const services = company.services || [];

  return (
    <div className="p-4 sm:p-6 mt-32 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <button onClick={onClose} className="text-sm text-yellow-600 hover:underline mb-4">
          &larr; Back to Members Directory
        </button>

        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="flex items-center">
              {company.logo ? (
                <img src={company.logo} alt={company.name} className="w-16 h-16 rounded-full mr-4 object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full mr-4 bg-[#CDA435] flex items-center justify-center text-white text-2xl font-bold">
                  {company.name?.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{company.name}</h1>
                <p className="text-gray-500 text-sm">{company.category}</p>
                {company.average_rating > 0 && (
                  <div className="flex items-center text-yellow-500 text-sm mt-1">
                    <FiStar className="fill-current" />
                    <span className="ml-1">{company.average_rating} ({company.total_reviews} reviews)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 items-center">
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-yellow-600">
                  <FiGlobe className="mr-2 text-yellow-500" /> Website
                </a>
              )}
              <button onClick={handleAddToWishlist} className="flex items-center hover:text-red-500">
                <FiHeart className="mr-2 text-gray-400" /> Wishlist
              </button>
              <p className="flex items-center">
                <FiMapPin className="mr-2 text-yellow-500" /> 
                {company.city && `${company.city}, `}{company.state && `${company.state}, `}{company.country}
              </p>
            </div>

            <div className="flex items-center justify-start md:justify-end gap-4">
              <div className="flex space-x-2">
                {company.facebook && <a href={company.facebook} target="_blank" rel="noopener noreferrer" className="h-8 w-8 flex items-center justify-center border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100"><FaFacebookF /></a>}
                {company.twitter && <a href={company.twitter} target="_blank" rel="noopener noreferrer" className="h-8 w-8 flex items-center justify-center border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100"><FaTwitter /></a>}
                {company.linkedin && <a href={company.linkedin} target="_blank" rel="noopener noreferrer" className="h-8 w-8 flex items-center justify-center border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100"><FaLinkedinIn /></a>}
                {company.instagram && <a href={company.instagram} target="_blank" rel="noopener noreferrer" className="h-8 w-8 flex items-center justify-center border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100"><FaInstagram /></a>}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* About Company */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">About Company</h3>
              <p className="text-gray-600">{company.about_company || 'No description available.'}</p>
            </div>

            {/* Services */}
            {services.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Services</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {services.map((service, idx) => (
                    <div key={idx} className="text-center p-4 bg-gray-50 rounded-lg">
                      <FiGrid className="mx-auto text-[#CDA435] mb-2" size={24} />
                      <p className="text-sm text-gray-600">{service}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Branches */}
            {branches.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Branch Locations</h3>
                <div className="space-y-4">
                  {branches.map((branch) => (
                    <div key={branch.id} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => setExpandedBranch(expandedBranch === branch.id ? null : branch.id)}
                        className="w-full p-4 flex justify-between items-center hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          <FiMapPin className="text-[#CDA435] mr-3" />
                          <span className="font-medium">{branch.branch_name}</span>
                          <span className="text-gray-500 text-sm ml-2">
                            {branch.city && `${branch.city}, `}{branch.country}
                          </span>
                        </div>
                        {expandedBranch === branch.id ? <FiChevronUp /> : <FiChevronDown />}
                      </button>
                      {expandedBranch === branch.id && (
                        <div className="p-4 border-t border-gray-200 bg-gray-50">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {branch.branch_phone && <p><strong>Phone:</strong> {branch.branch_phone}</p>}
                            {branch.branch_email && <p><strong>Email:</strong> {branch.branch_email}</p>}
                            {branch.address && <p className="col-span-2"><strong>Address:</strong> {branch.address}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Staff */}
            {members.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Key Staff / Directors</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center p-4 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 rounded-full bg-[#CDA435] flex items-center justify-center text-white font-bold mr-4">
                        {m.member_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{m.member_name}</p>
                        <p className="text-sm text-gray-500">{m.member_role || 'Staff'}</p>
                        {m.member_email && <p className="text-xs text-gray-400">{m.member_email}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Client Reviews</h3>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{review.reviewer_name}</p>
                          <div className="flex items-center text-yellow-500">
                            {[...Array(5)].map((_, i) => (
                              <FiStar key={i} className={i < review.rating ? 'fill-current' : ''} size={14} />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{review.review_text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Contact */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Contact Information</h3>
              
              {company.incharge_name && (
                <div className="text-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-[#CDA435] flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2">
                    {company.incharge_name?.charAt(0)}
                  </div>
                  <p className="font-medium">{company.incharge_name}</p>
                  <p className="text-sm text-gray-500">Incharge</p>
                </div>
              )}

              <div className="space-y-3 text-sm">
                {company.phone && (
                  <div className="flex items-center text-gray-600">
                    <FiPhone className="mr-3 text-[#CDA435]" />
                    <span>{company.phone}</span>
                  </div>
                )}
                {company.email && (
                  <div className="flex items-center text-gray-600">
                    <FiMail className="mr-3 text-[#CDA435]" />
                    <span>{company.email}</span>
                  </div>
                )}
                {company.skype && (
                  <div className="flex items-center text-gray-600">
                    <FaSkype className="mr-3 text-[#CDA435]" />
                    <span>{company.skype}</span>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setShowMessageForm(!showMessageForm)}
                className="w-full mt-6 bg-[#CDA435] text-white font-bold py-3 rounded-lg shadow-md hover:bg-opacity-90 transition-colors flex items-center justify-center"
              >
                <FiMessageSquare className="mr-2" />
                Send Message
              </button>

              {showMessageForm && (
                <form onSubmit={handleSendMessage} className="mt-4 space-y-4">
                  <input
                    type="text"
                    placeholder="Subject"
                    value={messageData.subject}
                    onChange={(e) => setMessageData({...messageData, subject: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CDA435]"
                    required
                  />
                  <textarea
                    placeholder="Your message..."
                    value={messageData.message}
                    onChange={(e) => setMessageData({...messageData, message: e.target.value})}
                    rows="4"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CDA435]"
                    required
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage}
                    className="w-full bg-green-600 text-white font-bold py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {sendingMessage ? 'Sending...' : 'Send'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;
