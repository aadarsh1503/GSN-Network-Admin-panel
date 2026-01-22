import { useState, useEffect } from 'react';
import { 
  FaEye,
  FaEyeSlash,
} from 'react-icons/fa';
import { 
  User, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Building, 
  Edit3, 
  Save, 
  X,
  Shield,
  Calendar,
  CheckCircle,
  AlertCircle,
  Upload,
  Trash2,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';
import { fetchCountries, fetchStates, fetchCities } from '../../utils/locationData';

const BusinessProfile = () => {
  const [profile, setProfile] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    category: [],
    country: '',
    state: '',
    city: '',
    owner_name: '',
    owner_phone: '',
    incharge_name: '',
    incharge_phone: '',
    skype: '',
    website: '',
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: '',
    services: [],
    map_location: '',
    company_address: '',
    about_company: '',
    logo: '',
    created_at: '',
    updated_at: ''
  });
  
  const [originalProfile, setOriginalProfile] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [businessCategories, setBusinessCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  
  // Location data states
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [locationLoading, setLocationLoading] = useState({
    countries: false,
    states: false,
    cities: false
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    fetchProfile();
    fetchBusinessCategories();
    loadCountries();
  }, []);

  // Load countries on component mount
  const loadCountries = async () => {
    try {
      setLocationLoading(prev => ({ ...prev, countries: true }));
      const countriesData = await fetchCountries();
      setCountries(countriesData);
    } catch (error) {
      console.error('Error loading countries:', error);
      toast.error('Failed to load countries');
    } finally {
      setLocationLoading(prev => ({ ...prev, countries: false }));
    }
  };

  // Load states when country changes
  const loadStates = async (countryName) => {
    if (!countryName) {
      setStates([]);
      setCities([]);
      return;
    }

    try {
      setLocationLoading(prev => ({ ...prev, states: true }));
      const statesData = await fetchStates(countryName);
      setStates(statesData);
      setCities([]); // Clear cities when country changes
      
      // Clear state and city in profile if country changed
      if (profile.country !== countryName) {
        setProfile(prev => ({
          ...prev,
          state: '',
          city: ''
        }));
      }
    } catch (error) {
      console.error('Error loading states:', error);
      toast.error('Failed to load states');
      setStates([]);
    } finally {
      setLocationLoading(prev => ({ ...prev, states: false }));
    }
  };

  // Load cities when state changes
  const loadCities = async (countryName, stateName) => {
    if (!countryName || !stateName) {
      setCities([]);
      return;
    }

    try {
      setLocationLoading(prev => ({ ...prev, cities: true }));
      const citiesData = await fetchCities(countryName, stateName);
      setCities(citiesData);
      
      // Clear city in profile if state changed
      if (profile.state !== stateName) {
        setProfile(prev => ({
          ...prev,
          city: ''
        }));
      }
    } catch (error) {
      console.error('Error loading cities:', error);
      toast.error('Failed to load cities');
      setCities([]);
    } finally {
      setLocationLoading(prev => ({ ...prev, cities: false }));
    }
  };

  // Load states and cities when profile is loaded or country changes
  useEffect(() => {
    if (profile.country) {
      loadStates(profile.country);
    }
  }, [profile.country]);

  // Load cities when state changes
  useEffect(() => {
    if (profile.country && profile.state) {
      loadCities(profile.country, profile.state);
    }
  }, [profile.country, profile.state]);

  const fetchBusinessCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await api.get('/api/business-categories');
      setBusinessCategories(response.map(cat => cat.name));
    } catch (error) {
      console.error('Error fetching business categories:', error);
      toast.error('Failed to load business categories');
      // Fallback to default categories
      setBusinessCategories([
        'Manufacturing',
        'Trading',
        'Import/Export',
        'E-commerce',
        'Retail',
        'Wholesale',
        'Agriculture',
        'Textiles',
        'Electronics',
        'Automotive',
        'Healthcare',
        'Food & Beverages',
        'Other'
      ]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/business/profile');
      
      // Ensure services is an array
      const profileData = {
        ...response,
        services: Array.isArray(response.services) ? response.services : 
                 (response.services ? JSON.parse(response.services) : []),
        // Handle category as array (for multiple categories) or convert string to array
        category: Array.isArray(response.category) ? response.category :
                 (response.category ? response.category.split(',').map(c => c.trim()).filter(c => c) : [])
      };
      
      setProfile(profileData);
      setOriginalProfile(profileData);
      console.log('Profile loaded:', profileData);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error(error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Enhanced location change handlers
  const handleCountryChange = (e) => {
    const selectedCountry = e.target.value;
    setProfile(prev => ({
      ...prev,
      country: selectedCountry,
      state: '', // Reset state when country changes
      city: ''   // Reset city when country changes
    }));
  };

  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    setProfile(prev => ({
      ...prev,
      state: selectedState,
      city: '' // Reset city when state changes
    }));
  };

  const handleCityChange = (e) => {
    const selectedCity = e.target.value;
    setProfile(prev => ({
      ...prev,
      city: selectedCity
    }));
  };

  const handleCategoryToggle = (category) => {
    setProfile(prev => ({
      ...prev,
      category: prev.category.includes(category)
        ? prev.category.filter(c => c !== category)
        : [...prev.category, category]
    }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

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

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append('image', file); // Changed from 'logo' to 'image' to match backend

      const response = await api.post('/api/upload/image', formData, { // Changed from '/api/upload/logo' to '/api/upload/image'
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const logoUrl = response.url; // Changed from response.logoUrl to response.url to match backend response
      
      // Update local state
      setProfile(prev => ({
        ...prev,
        logo: logoUrl
      }));

      // Automatically save the logo to database
      const profileToSave = {
        ...profile,
        logo: logoUrl,
        category: Array.isArray(profile.category) ? profile.category.join(',') : profile.category,
        services: Array.isArray(profile.services) ? JSON.stringify(profile.services) : profile.services
      };

      await api.put('/api/business/profile', profileToSave);

      toast.success('Logo uploaded and saved successfully');
      
      // Update original profile to reflect the change
      setOriginalProfile(prev => ({
        ...prev,
        logo: logoUrl
      }));
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('businessProfileUpdated'));
      
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error(error.response?.data?.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate required fields
      if (!profile.name || !profile.email) {
        toast.error('Name and email are required');
        return;
      }

      if (!profile.category || profile.category.length === 0) {
        toast.error('Please select at least one business category');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profile.email)) {
        toast.error('Please enter a valid email address');
        return;
      }

      // Prepare data for API - convert arrays to strings for backend compatibility
      const profileToSave = {
        ...profile,
        category: Array.isArray(profile.category) ? profile.category.join(',') : profile.category,
        services: Array.isArray(profile.services) ? JSON.stringify(profile.services) : profile.services
      };

      console.log('Saving profile data:', profileToSave);

      await api.put('/api/business/profile', profileToSave);
      toast.success('Profile updated successfully');
      setIsEditing(false);
      setOriginalProfile(profile);
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('businessProfileUpdated'));
    } catch (error) {
      console.error('Error updating profile:', error);
      console.error('Error details:', error.response);
      toast.error(error.response?.data?.message || error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setProfile(originalProfile); // Reset to original data
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      await api.put('/api/business/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const calculateProfileCompletion = () => {
    const requiredFields = [
      'name', 'email', 'phone', 'country', 'about_company'
    ];
    
    const optionalFields = [
      'state', 'city', 'website', 'logo', 'owner_name', 'owner_phone', 
      'incharge_name', 'incharge_phone', 'skype', 'company_address',
      'services', 'facebook', 'twitter', 'instagram', 'linkedin'
    ];

    const filledRequired = requiredFields.filter(field => 
      profile[field] && profile[field].toString().trim() !== ''
    ).length;
    
    const filledOptional = optionalFields.filter(field => 
      profile[field] && profile[field].toString().trim() !== ''
    ).length;

    // Check if categories are selected
    const categoriesCount = profile.category && profile.category.length > 0 ? 1 : 0;

    const totalFields = requiredFields.length + optionalFields.length + 1; // +1 for categories
    const filledFields = filledRequired + filledOptional + categoriesCount;

    return Math.round((filledFields / totalFields) * 100);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-200 border-t-[#CDA435] mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-slate-700">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-50 via-yellow-100 to-yellow-50 rounded-2xl p-8 border border-yellow-200/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#CDA435] to-[#B8941F] bg-clip-text text-transparent mb-2">
              Business Profile
            </h1>
            <p className="text-slate-600 text-lg">Manage your business information for requesting logistics quotes</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center space-x-2 bg-white/80 hover:bg-white text-slate-700 px-4 py-2 rounded-xl border border-slate-200 transition-all duration-300 hover:shadow-lg"
            >
              <Shield className="h-4 w-4" />
              <span>Change Password</span>
            </button>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-[#CDA435] to-[#B8941F] hover:from-[#B8941F] hover:to-[#CDA435] text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-xl transition-all duration-300"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Logo Section */}
        <div className="lg:col-span-3">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              <Building className="h-6 w-6 mr-3 text-[#CDA435]" />
              Company Logo
            </h2>
            
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                  {profile.logo ? (
                    <img 
                      src={profile.logo} 
                      alt="Company Logo" 
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <Building className="h-8 w-8 text-slate-400" />
                  )}
                </div>
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Upload Company Logo</h3>
                <p className="text-slate-600 text-sm mb-4">
                  Upload your company logo to build trust with logistics providers. Recommended size: 200x200px, Max size: 5MB
                </p>
                
                <div className="flex space-x-3">
                  {isEditing && (
                    <>
                      <label className="flex items-center space-x-2 bg-gradient-to-r from-[#CDA435] to-[#B8941F] hover:from-[#B8941F] hover:to-[#CDA435] text-white px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer">
                        <Upload className="h-4 w-4" />
                        <span>Upload Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          disabled={uploadingLogo}
                        />
                      </label>
                      
                      {profile.logo && (
                        <button
                          onClick={() => setProfile(prev => ({ ...prev, logo: '' }))}
                          className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition-all duration-300"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Remove</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              <Building className="h-6 w-6 mr-3 text-[#CDA435]" />
              Business Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Business Name *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-300 disabled:bg-slate-100 disabled:text-slate-600"
                    placeholder="Enter business name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-300 disabled:bg-slate-100 disabled:text-slate-600"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-300 disabled:bg-slate-100 disabled:text-slate-600"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Business Categories *
                </label>
                {categoriesLoading ? (
                  <div className="flex items-center justify-center p-4 bg-slate-50 rounded-xl">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#CDA435] border-t-transparent"></div>
                    <span className="ml-2 text-slate-600">Loading categories...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {businessCategories.map(category => (
                      <label
                        key={category}
                        className={`flex items-center space-x-2 p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                          profile.category.includes(category)
                            ? 'border-[#CDA435] bg-yellow-50 text-[#CDA435]'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        } ${!isEditing ? 'cursor-not-allowed opacity-60' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={profile.category.includes(category)}
                          onChange={() => handleCategoryToggle(category)}
                          disabled={!isEditing}
                          className="hidden"
                        />
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          profile.category.includes(category)
                            ? 'border-[#CDA435] bg-[#CDA435]'
                            : 'border-slate-300'
                        }`}>
                          {profile.category.includes(category) && (
                            <CheckCircle className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <span className="text-sm font-medium">{category}</span>
                      </label>
                    ))}
                  </div>
                )}
                {profile.category.length > 0 && (
                  <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-200">
                    <p className="text-sm text-green-700">
                      <CheckCircle className="inline h-4 w-4 mr-1" />
                      {profile.category.length} categor{profile.category.length !== 1 ? 'ies' : 'y'} selected: {profile.category.join(', ')}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Country *
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 z-10" />
                  <select
                    name="country"
                    value={profile.country}
                    onChange={handleCountryChange}
                    disabled={!isEditing || locationLoading.countries}
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-300 disabled:bg-slate-100 disabled:text-slate-600 appearance-none"
                  >
                    <option value="">
                      {locationLoading.countries ? 'Loading countries...' : 'Select Country'}
                    </option>
                    {countries.map(country => (
                      <option key={country.code} value={country.name}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
                  {locationLoading.countries && (
                    <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#CDA435] border-t-transparent"></div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  State/Province
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 z-10" />
                  <select
                    name="state"
                    value={profile.state}
                    onChange={handleStateChange}
                    disabled={!isEditing || !profile.country || locationLoading.states}
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-300 disabled:bg-slate-100 disabled:text-slate-600 appearance-none"
                  >
                    <option value="">
                      {!profile.country 
                        ? 'Select country first' 
                        : locationLoading.states 
                        ? 'Loading states...' 
                        : states.length === 0 
                        ? 'No states available'
                        : 'Select State/Province'
                      }
                    </option>
                    {states.map(state => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
                  {locationLoading.states && (
                    <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#CDA435] border-t-transparent"></div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  City
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 z-10" />
                  <select
                    name="city"
                    value={profile.city}
                    onChange={handleCityChange}
                    disabled={!isEditing || !profile.state || locationLoading.cities}
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-300 disabled:bg-slate-100 disabled:text-slate-600 appearance-none"
                  >
                    <option value="">
                      {!profile.state 
                        ? 'Select state first' 
                        : locationLoading.cities 
                        ? 'Loading cities...' 
                        : cities.length === 0 
                        ? 'No cities available'
                        : 'Select City'
                      }
                    </option>
                    {cities.map(city => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
                  {locationLoading.cities && (
                    <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#CDA435] border-t-transparent"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                About Business *
              </label>
              <textarea
                name="about_company"
                value={profile.about_company}
                onChange={handleInputChange}
                disabled={!isEditing}
                rows={4}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-300 disabled:bg-slate-100 disabled:text-slate-600"
                placeholder="Describe your business and what products/services you need logistics for..."
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              <User className="h-6 w-6 mr-3 text-[#CDA435]" />
              Contact Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Owner Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    name="owner_name"
                    value={profile.owner_name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-300 disabled:bg-slate-100 disabled:text-slate-600"
                    placeholder="Enter owner name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Owner Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="tel"
                    name="owner_phone"
                    value={profile.owner_phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-300 disabled:bg-slate-100 disabled:text-slate-600"
                    placeholder="Enter owner phone"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Incharge Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    name="incharge_name"
                    value={profile.incharge_name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-300 disabled:bg-slate-100 disabled:text-slate-600"
                    placeholder="Enter incharge name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Incharge Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="tel"
                    name="incharge_phone"
                    value={profile.incharge_phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-300 disabled:bg-slate-100 disabled:text-slate-600"
                    placeholder="Enter incharge phone"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              <Globe className="h-6 w-6 mr-3 text-[#CDA435]" />
              Additional Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Website (Optional)
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="url"
                    name="website"
                    value={profile.website}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-300 disabled:bg-slate-100 disabled:text-slate-600"
                    placeholder="https://www.example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Skype ID (Optional)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    name="skype"
                    value={profile.skype}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-300 disabled:bg-slate-100 disabled:text-slate-600"
                    placeholder="Enter Skype ID"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Company Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    name="company_address"
                    value={profile.company_address}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-300 disabled:bg-slate-100 disabled:text-slate-600"
                    placeholder="Enter company address"
                  />
                </div>
              </div>
            </div>

            {/* <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Services Offered (Optional)
              </label>
              <textarea
                name="services"
                value={Array.isArray(profile.services) ? profile.services.join(', ') : profile.services || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, services: e.target.value }))}
                disabled={!isEditing}
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-300 disabled:bg-slate-100 disabled:text-slate-600"
                placeholder="Describe the services your business offers..."
              />
            </div> */}
          </div>

          {/* Social Media & Online Presence */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              <Globe className="h-6 w-6 mr-3 text-[#CDA435]" />
              Social Media & Online Presence
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Facebook (Optional)
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="url"
                    name="facebook"
                    value={profile.facebook}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-300 disabled:bg-slate-100 disabled:text-slate-600"
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Twitter (Optional)
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="url"
                    name="twitter"
                    value={profile.twitter}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-300 disabled:bg-slate-100 disabled:text-slate-600"
                    placeholder="https://twitter.com/yourhandle"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Instagram (Optional)
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="url"
                    name="instagram"
                    value={profile.instagram}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-300 disabled:bg-slate-100 disabled:text-slate-600"
                    placeholder="https://instagram.com/yourprofile"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  LinkedIn (Optional)
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="url"
                    name="linkedin"
                    value={profile.linkedin}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-300 disabled:bg-slate-100 disabled:text-slate-600"
                    placeholder="https://linkedin.com/company/yourcompany"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Summary */}
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Profile Summary</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-600">Profile Completion</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#CDA435] to-[#B8941F] rounded-full transition-all duration-500" 
                      style={{ width: `${calculateProfileCompletion()}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-[#CDA435]">{calculateProfileCompletion()}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Account Status</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Member Since</span>
                  <span className="text-slate-800 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(profile.created_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Last Updated</span>
                  <span className="text-slate-800">{formatDate(profile.updated_at)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Business Categories</span>
                  <span className="text-slate-800">{profile.category?.length || 0} selected</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 border border-yellow-200/50">
            <h3 className="text-lg font-bold text-[#CDA435] mb-3 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Profile Tips
            </h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start">
                <div className="w-2 h-2 bg-[#CDA435] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                Complete your profile to get better quote responses
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-[#CDA435] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                Add detailed business description for accurate quotes
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-[#CDA435] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                Keep contact information updated for communication
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-[#CDA435] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                Upload a company logo to build trust with logistics providers
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-800">Change Password</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-4 py-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-300"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-4 py-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-300"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-4 py-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CDA435] focus:border-transparent transition-all duration-300"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#CDA435] to-[#B8941F] hover:from-[#B8941F] hover:to-[#CDA435] text-white rounded-xl transition-all duration-300"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessProfile;