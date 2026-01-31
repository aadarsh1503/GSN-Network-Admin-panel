import { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaGlobe, FaEdit, FaSave, FaTimes, FaCamera, FaUpload } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: ''
  });

  useEffect(() => {
    fetchUserProfile('useEffect-mount');
  }, []);

  const fetchUserProfile = async (source = 'unknown') => {
    try {
      const data = await api.get('/api/user/me');
      setUser(data.user); // The API returns { user: {...} }
      setFormData({
        name: data.user?.name || '',
        email: data.user?.email || '',
        phone: data.user?.phone || '',
        country: data.user?.country || ''
      });
    } catch (error) {
      console.error(`Error fetching profile from ${source}:`, error);
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Include the current logo to prevent overwriting it
      const saveData = {
        ...formData,
        logo: user?.logo // Preserve the current logo
      };
      
      await api.put('/api/user/update-profile', saveData);
      toast.success('Profile updated successfully');
      setEditing(false);
      fetchUserProfile('handleSave'); // Refresh profile data
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    // Reset form data to original values
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      country: user?.country || ''
    });
    // Reset logo upload states
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleLogoSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      // Auto-upload the logo immediately
      setUploadingLogo(true);
      try {
        const uploadFormData = new FormData();
        uploadFormData.append('image', file);
        
        const response = await api.post('/api/upload/image', uploadFormData);
        
        if (response.url) {
          // Get the current user data to ensure we don't lose any fields
          const currentProfileData = {
            name: user?.name || formData.name,
            email: user?.email || formData.email,
            phone: user?.phone || formData.phone,
            country: user?.country || formData.country,
            logo: response.url
          };
          
          // Update user profile with new logo
          await api.put('/api/user/update-profile', currentProfileData);
          
          toast.success('Logo uploaded successfully');
          
          // Add a small delay to ensure database has been updated
          setTimeout(() => {
            fetchUserProfile('logo-upload'); // Refresh profile data
          }, 500);
        }
      } catch (error) {
        console.error('Error uploading logo:', error);
        toast.error('Failed to upload logo');
      } finally {
        setUploadingLogo(false);
      }
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;
    
    setUploadingLogo(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', logoFile);
      
      const response = await api.post('/api/upload/image', uploadFormData);
      
      if (response.url) {
        // Update user profile with new logo
        await api.put('/api/user/update-profile', {
          ...formData,
          logo: response.url
        });
        
        toast.success('Logo uploaded successfully');
        setLogoFile(null);
        setLogoPreview(null);
        fetchUserProfile('handleLogoUpload'); // Refresh profile data
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeLogo = async () => {
    try {
      // Get the current user data to ensure we don't lose any fields
      const currentProfileData = {
        name: user?.name || formData.name,
        email: user?.email || formData.email,
        phone: user?.phone || formData.phone,
        country: user?.country || formData.country,
        logo: null
      };
      
      await api.put('/api/user/update-profile', currentProfileData);
      
      toast.success('Logo removed successfully');
      fetchUserProfile('removeLogo'); // Refresh profile data
    } catch (error) {
      console.error('Error removing logo:', error);
      toast.error('Failed to remove logo');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-12 w-12 border-4 border-gray-200 rounded-full animate-spin">
              <div className="h-12 w-12 border-4 border-transparent border-t-[#bca142] rounded-full animate-spin"></div>
            </div>
          </div>
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600 mt-1">Manage your account information</p>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="bg-[#bca142] text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors duration-200 flex items-center"
            >
              <FaEdit className="mr-2" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center overflow-hidden border-2 border-yellow-200">
              {user?.logo ? (
                <>
                  <img 
                    src={user.logo} 
                    alt="User Logo" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden w-full h-full bg-yellow-50 items-center justify-center">
                    <FaUser className="text-[#bca142] text-2xl" />
                  </div>
                </>
              ) : (
                <FaUser className="text-[#bca142] text-2xl" />
              )}
            </div>
            
            {editing && (
              <div className="absolute -bottom-2 -right-2">
                {uploadingLogo ? (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  </div>
                ) : (
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    <div className="w-8 h-8 bg-[#bca142] rounded-full flex items-center justify-center hover:bg-yellow-600 transition-colors duration-200 shadow-lg">
                      <FaCamera className="text-white text-sm" />
                    </div>
                  </label>
                )}
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoSelect}
                  disabled={uploadingLogo}
                  className="hidden"
                />
              </div>
            )}
          </div>
          
          <div className="ml-6 flex-1">
            <h2 className="text-xl font-semibold text-gray-900">
              {user?.name || 'User'}
            </h2>
            <p className="text-gray-600">{user?.email}</p>
            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mt-1">
              Active User
            </span>
            
            {/* Logo Upload Status */}
            {editing && uploadingLogo && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Uploading logo...
                    </p>
                    <p className="text-xs text-blue-700">
                      Please wait while we upload your image
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Remove Logo Option */}
            {editing && user?.logo && !uploadingLogo && (
              <div className="mt-3">
                <button
                  onClick={removeLogo}
                  className="text-red-600 hover:text-red-800 text-sm flex items-center"
                >
                  <FaTimes className="mr-1" />
                  Remove Logo
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaUser className="inline mr-2" />
              Full Name
            </label>
            {editing ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                {user?.name || 'Not provided'}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaEnvelope className="inline mr-2" />
              Email Address
            </label>
            {editing ? (
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                {user?.email || 'Not provided'}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaPhone className="inline mr-2" />
              Phone Number
            </label>
            {editing ? (
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                {user?.phone || 'Not provided'}
              </p>
            )}
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaGlobe className="inline mr-2" />
              Country
            </label>
            {editing ? (
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                {user?.country || 'Not provided'}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {editing && (
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200 flex items-center"
            >
              <FaTimes className="mr-2" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-[#bca142] text-white rounded-md hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
            >
              {saving ? (
                <>
                  <div className="relative mr-2">
                    <div className="h-4 w-4 border-2 border-gray-200 rounded-full animate-spin">
                      <div className="h-4 w-4 border-2 border-transparent border-t-white rounded-full animate-spin"></div>
                    </div>
                  </div>
                  Saving...
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
              Quote Requester
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Not available'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;