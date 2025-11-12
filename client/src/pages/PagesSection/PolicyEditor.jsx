import React, { useState, useRef } from 'react';
import { FiBold, FiUnderline, FiLink, FiList } from 'react-icons/fi'; // Using icons for the toolbar

const PolicyEditor = () => {
  // State to hold the raw HTML content of the editor
  const [htmlContent, setHtmlContent] = useState('<p>privacy policy</p>');
  
  // A ref to the editable div to help with focus management
  const editorRef = useRef(null);

  // Function to apply formatting using the browser's execCommand
  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus(); // Keep the editor focused after clicking a button
  };

  // Special handler for creating links
  const createLink = () => {
    const url = prompt('Enter the URL:');
    if (url) {
      applyFormat('createLink', url);
    }
  };

  // When the user types, update our React state with the new HTML
  const handleInput = (e) => {
    setHtmlContent(e.target.innerHTML);
  };
  
  // Handler for form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitted HTML Content:', htmlContent);
    alert('Policy submitted! Check the console for the HTML content.');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Policy</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Policy
            </label>
            
            <div className="border border-gray-300 rounded-lg">
              {/* --- The Custom Toolbar --- */}
              <div className="flex items-center p-2 border-b border-gray-300 bg-gray-50 rounded-t-lg">
                <button type="button" onClick={() => applyFormat('bold')} className="p-2 rounded hover:bg-gray-200" title="Bold">
                  <FiBold className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => applyFormat('underline')} className="p-2 rounded hover:bg-gray-200" title="Underline">
                  <FiUnderline className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => applyFormat('insertOrderedList')} className="p-2 rounded hover:bg-gray-200" title="Ordered List">
                  <FiList className="h-5 w-5" />
                </button>
                <button type="button" onClick={createLink} className="p-2 rounded hover:bg-gray-200" title="Add Link">
                  <FiLink className="h-5 w-5" />
                </button>
              </div>

              {/* --- The Editable Content Area --- */}
              <div
                ref={editorRef}
                contentEditable={true}
                onInput={handleInput}
                className="p-4 h-64 overflow-y-auto focus:outline-none"
                // This is necessary to render the initial HTML from state
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-2 bg-[#D9B95B] text-white font-semibold rounded-md hover:bg-[#c8a84a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D9B95B]"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default PolicyEditor;