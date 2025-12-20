import React, { useState } from 'react';
import axios from 'axios';

const SendNotifications = () => {
  const [formData, setFormData] = useState({
    userType: '',
    title: '',
    message: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // General handler for text inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Handler for the file input
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Create FormData object to send file + text
    const data = new FormData();
    data.append('userType', formData.userType);
    data.append('title', formData.title);
    data.append('message', formData.message);
    
    // Key 'imageUpload' must match the backend upload.single('imageUpload')
    if (imageFile) {
      data.append('imageUpload', imageFile); 
    }

    try {
      const token = localStorage.getItem('token'); // Get Admin Token
      
      const response = await axios.post('/api/notifications/send', data, {
        headers: {
          'Content-Type': 'multipart/form-data', // Important for files
          Authorization: `Bearer ${token}`,
        },
      });

      alert('Notification sent successfully!');
      // Reset Form
      setFormData({ userType: '', title: '', message: '' });
      setImageFile(null);
      // Reset file input visually
      document.getElementById('imageUpload').value = ""; 

    } catch (error) {
      console.error(error);
      alert('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
          Send Notifications
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Type */}
          <div>
            <label htmlFor="userType" className="block text-sm font-medium text-gray-600 mb-1">
              User Type
            </label>
            <select
              id="userType"
              name="userType"
              value={formData.userType}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
            >
              <option value="">Select user role</option>
              <option value="all">All</option>
              <option value="users">Users</option>
              <option value="business_owners">Business Owners</option>
              <option value="company_owners">Company Owners</option>
            </select>
          </div>

          {/* Title and Image Upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-600 mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Notification Title"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div>
              <label htmlFor="imageUpload" className="block text-sm font-medium text-gray-600 mb-1">
                Image upload
              </label>
              <div className="mt-1 flex items-center border border-gray-300 rounded-md p-2">
                <label className="cursor-pointer bg-white py-1 px-3 border border-gray-400 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <span>Choose File</span>
                  <input id="imageUpload" name="imageUpload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                </label>
                <span className="ml-3 text-sm text-gray-500 truncate">
                  {imageFile ? imageFile.name : 'No file chosen'}
                </span>
              </div>
            </div>
          </div>

          {/* Textarea */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-600 mb-1">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows="8"
              value={formData.message}
              onChange={handleChange}
              required
              placeholder="Enter notification details..."
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
            ></textarea>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 bg-[#D9B95B] text-white font-semibold rounded-md hover:bg-[#c8a84a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D9B95B] ${loading ? 'opacity-50' : ''}`}
            >
              {loading ? 'Sending...' : 'Send Notifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendNotifications;