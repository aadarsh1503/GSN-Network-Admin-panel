import { useState, useEffect } from 'react';
import { FaPaperPlane, FaTimes } from 'react-icons/fa';
import { FiEye, FiStar } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const data = await api.get('/api/wishlist');
      setWishlistItems(data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (companyId) => {
    try {
      await api.delete(`/api/wishlist/${companyId}`);
      setWishlistItems(wishlistItems.filter(item => item.company_id !== companyId));
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error(error.message || 'Failed to remove from wishlist');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading wishlist...</div>;
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Wishlist</h2>

      {wishlistItems.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          <p className="mb-4">Your wishlist is empty.</p>
          <a href="/company/member-directory" className="text-[#CDA435] hover:underline">
            Browse Members Directory
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlistItems.map((item) => (
            <div 
              key={item.id} 
              className="bg-gray-50 border border-gray-200 rounded-lg p-6 relative text-center transition-shadow hover:shadow-lg"
            >
              {/* Remove Button */}
              <button 
                onClick={() => handleRemove(item.company_id)}
                className="absolute top-4 right-4 text-[#C0A76E] hover:text-red-500 transition-colors"
                aria-label="Remove from wishlist"
              >
                <FaTimes size={18} />
              </button>
              
              {/* Avatar */}
              <div className="flex justify-center">
                {item.logo ? (
                  <img 
                    src={item.logo} 
                    alt={item.company_name} 
                    className="w-24 h-24 rounded-full object-cover" 
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[#CDA435] flex items-center justify-center text-white text-3xl font-bold">
                    {item.company_name?.charAt(0)}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-800 capitalize">
                  {item.company_name}
                </h3>
                {item.average_rating > 0 && (
                  <div className="flex items-center justify-center text-yellow-500 text-sm mt-1">
                    <FiStar className="fill-current" />
                    <span className="ml-1">{item.average_rating}</span>
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-1">{item.category}</p>
                <p className="flex items-center justify-center gap-2 text-sm text-[#C0A76E] mt-2">
                  <FaPaperPlane />
                  <span>{item.city && `${item.city}, `}{item.country}</span>
                </p>
              </div>

              {/* View Profile Button */}
              <a 
                href={`/company/member-directory`}
                className="mt-4 inline-flex items-center gap-2 text-sm text-[#CDA435] hover:underline"
              >
                <FiEye /> View Profile
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
