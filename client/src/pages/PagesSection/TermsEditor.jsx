import React, { useState, useRef } from 'react';
// Importing a few representative icons for the toolbar
import { 
  FiBold, FiUnderline, FiItalic, FiLink, FiList, FiTrendingUp 
} from 'react-icons/fi';

const TermsEditor = () => {
  // State to hold the raw HTML content of the editor
  const [htmlContent, setHtmlContent] = useState('<p>terms page</p>');
  
  // A ref to the editable div to manage focus
  const editorRef = useRef(null);

  // Function to apply formatting commands to the selected text
  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus(); // Return focus to the editor
  };

  // Special handler for creating links, which requires a prompt
  const createLink = () => {
    const url = prompt('Enter the URL:');
    if (url) {
      applyFormat('createLink', url);
    }
  };

  // Update our React state with the new HTML content as the user types
  const handleInput = (e) => {
    setHtmlContent(e.target.innerHTML);
  };
  
  // Handler for form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitted HTML Content:', htmlContent);
    alert('Terms page submitted! Check the console for the HTML content.');
  };

  // A simple toolbar button component to reduce repetition
  const ToolbarButton = ({ onClick, title, children }) => (
    <button type="button" onClick={onClick} className="p-2 rounded hover:bg-gray-200" title={title}>
      {children}
    </button>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Terms</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Terms
            </label>
            
            <div className="border border-gray-300 rounded-lg">
              {/* --- The Custom Toolbar --- */}
              <div className="flex items-center p-1 border-b border-gray-300 bg-gray-50 rounded-t-lg flex-wrap">
                <ToolbarButton onClick={() => applyFormat('bold')} title="Bold">
                  <FiBold className="h-5 w-5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => applyFormat('underline')} title="Underline">
                  <FiUnderline className="h-5 w-5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => applyFormat('italic')} title="Italic">
                  <FiItalic className="h-5 w-5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => applyFormat('strikeThrough')} title="Strikethrough">
                  <FiTrendingUp className="h-5 w-5 -rotate-45" />
                </ToolbarButton>
                <ToolbarButton onClick={() => applyFormat('insertOrderedList')} title="Ordered List">
                  <FiList className="h-5 w-5" />
                </ToolbarButton>
                <ToolbarButton onClick={createLink} title="Add Link">
                  <FiLink className="h-5 w-5" />
                </ToolbarButton>
              </div>

              {/* --- The Editable Content Area --- */}
              <div
                ref={editorRef}
                contentEditable={true}
                onInput={handleInput}
                className="p-4 h-72 overflow-y-auto focus:outline-none"
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

export default TermsEditor;