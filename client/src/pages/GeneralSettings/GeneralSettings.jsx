import React, { useState, useEffect, useRef } from "react";
import $ from "jquery";
import { adminToast } from "../../utils/adminToast";

// --- Reusable File Input Component ---
const FileInput = ({ label, dimensions, currentImage, onChange, name }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">
      {label}
      <span className="text-gray-500 ml-1">({dimensions})</span>
    </label>
    <div className="mt-1 flex items-center">
      <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        <span>Choose File</span>
        <input
          type="file"
          name={name}
          className="sr-only"
          onChange={onChange}
          accept="image/*"
        />
      </label>
      <span className="ml-3 text-sm text-gray-500">
        {currentImage.fileName || "No file chosen"}
      </span>
    </div>
    {currentImage.preview && (
      <img
        src={currentImage.preview}
        alt="Preview"
        className="mt-2 h-16 w-auto object-contain border rounded-md"
      />
    )}
  </div>
);

const GeneralSettings = () => {
  const [logo, setLogo] = useState({
    preview: "",
    fileName: "",
    file: null
  });
  const [favicon, setFavicon] = useState({
    preview: "",
    fileName: "",
    file: null
  });
  const [formData, setFormData] = useState({
    contact_email: "",
    contact_phone: "",
    company_name: "",
    support_hours: "",
    address: ""
  });
  const [editorContent, setEditorContent] = useState("");
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  // Load existing settings
  useEffect(() => {
    fetchGeneralSettings();
  }, []);

  const fetchGeneralSettings = async () => {
    try {
      const response = await fetch('/api/general-settings');
      const result = await response.json();
      
      if (result.success) {
        const settings = result.data;
        
        // Set logo
        if (settings.admin_logo) {
          setLogo({
            preview: settings.admin_logo.value, // Cloudinary URL is already full URL
            fileName: "current_logo.png",
            file: null
          });
        }
        
        // Set favicon
        if (settings.favicon) {
          setFavicon({
            preview: settings.favicon.value, // Cloudinary URL is already full URL
            fileName: "current_favicon.png",
            file: null
          });
        }
        
        // Set form data
        setFormData({
          contact_email: settings.contact_email?.value || "",
          contact_phone: settings.contact_phone?.value || "",
          company_name: settings.company_name?.value || "",
          support_hours: settings.support_hours?.value || "",
          address: settings.address?.value || ""
        });
        
        // Set editor content
        if (settings.contact_details) {
          setEditorContent(settings.contact_details.value);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      adminToast.error('Failed to load settings');
    }
  };

  const handleFileChange = (e, setFileState) => {
    const file = e.target.files[0];
    if (file) {
      setFileState({
        preview: URL.createObjectURL(file),
        fileName: file.name,
        file: file
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    let shadow;

    // ✅ Attach Shadow DOM only once
    if (!wrapperRef.current.shadowRoot) {
      shadow = wrapperRef.current.attachShadow({ mode: "open" });
    } else {
      shadow = wrapperRef.current.shadowRoot;
    }

    // ✅ Create and attach styles inside Shadow DOM
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

    // ✅ Create container div inside shadow
    const editorDiv = document.createElement("div");
    shadow.appendChild(editorDiv);

    // ✅ Load Bootstrap JS and initialize Summernote
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
            onChange: function (contents) {
              setEditorContent(contents);
            },
          },
        });
        $(editorDiv).summernote("code", editorContent);
      });
    });

    // ✅ Cleanup when component unmounts
    return () => {
      if (editorDiv && $(editorDiv).next(".note-editor").length) {
        $(editorDiv).summernote("destroy");
      }
      shadow.innerHTML = "";
    };
  }, [editorContent]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const submitFormData = new FormData();
      
      // Add files
      if (logo.file) {
        submitFormData.append('admin_logo', logo.file);
      }
      if (favicon.file) {
        submitFormData.append('favicon', favicon.file);
      }
      
      // Add text data
      submitFormData.append('contact_details', editorContent);
      submitFormData.append('contact_email', formData.contact_email);
      submitFormData.append('contact_phone', formData.contact_phone);
      submitFormData.append('company_name', formData.company_name);
      submitFormData.append('support_hours', formData.support_hours);
      submitFormData.append('address', formData.address);
      
      const response = await fetch('/api/general-settings', {
        method: 'PUT',
        body: submitFormData
      });
      
      const result = await response.json();
      
      if (result.success) {
        adminToast.success('General settings updated successfully!');
        // Refresh the data
        fetchGeneralSettings();
      } else {
        adminToast.error(result.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      adminToast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          General Setting
        </h1>

        <form onSubmit={handleSubmit}>
          {/* File Inputs Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            <FileInput
              label="Logo"
              dimensions="100h X 200w"
              currentImage={logo}
              name="admin_logo"
              onChange={(e) => handleFileChange(e, setLogo)}
            />
            {/* <FileInput
              label="Favicon Icon"
              dimensions="50h X 50w"
              currentImage={favicon}
              name="favicon"
              onChange={(e) => handleFileChange(e, setFavicon)}
            /> */}
          </div>

          {/* Contact Information Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D9B95B]"
                placeholder="Enter company name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D9B95B]"
                placeholder="Enter contact email"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D9B95B]"
                placeholder="Enter contact phone"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Support Hours
              </label>
              <input
                type="text"
                name="support_hours"
                value={formData.support_hours}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D9B95B]"
                placeholder="e.g., Monday - Friday: 9:00 AM - 6:00 PM"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D9B95B]"
                placeholder="Enter company address"
              />
            </div>
          </div>

          {/* Shadow DOM Editor */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Details Data (Rich Text)
            </label>
            <div ref={wrapperRef}></div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-[#D9B95B] text-white font-semibold rounded-md hover:bg-[#c8a84a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D9B95B] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GeneralSettings;
