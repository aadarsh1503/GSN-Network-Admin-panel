import React, { useState, useEffect, useRef } from "react";
import $ from "jquery";

// --- Reusable File Input Component ---
const FileInput = ({ label, dimensions, currentImage, onChange }) => (
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
    preview: "https://i.imgur.com/3Y1Dk6H.png",
    fileName: "current_logo.png",
  });
  const [favicon, setFavicon] = useState({
    preview: "https://i.imgur.com/sCEw22l.png",
    fileName: "current_favicon.png",
  });

  const initialContent = `<p>dinfo@gulfstarnetwork.com</p><p>+973 17491222</p>`;
  const [editorContent, setEditorContent] = useState(initialContent);
  const wrapperRef = useRef(null);

  const handleFileChange = (e, setFileState) => {
    const file = e.target.files[0];
    if (file) {
      setFileState({
        preview: URL.createObjectURL(file),
        fileName: file.name,
      });
    }
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
        $(editorDiv).summernote("code", initialContent);
      });
    });

    // ✅ Cleanup when component unmounts
    return () => {
      if (editorDiv && $(editorDiv).next(".note-editor").length) {
        $(editorDiv).summernote("destroy");
      }
      shadow.innerHTML = "";
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({
      logoFile: logo,
      faviconFile: favicon,
      contactDetails: editorContent,
    });
    alert("General settings updated! Check console.");
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
              onChange={(e) => handleFileChange(e, setLogo)}
            />
            <FileInput
              label="Favicon Icon"
              dimensions="50h X 50w"
              currentImage={favicon}
              onChange={(e) => handleFileChange(e, setFavicon)}
            />
          </div>

          {/* Shadow DOM Editor */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Details Data
            </label>
            <div ref={wrapperRef}></div>
          </div>

          <button
            type="submit"
            className="px-6 py-2 bg-[#D9B95B] text-white font-semibold rounded-md hover:bg-[#c8a84a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D9B95B]"
          >
            Update
          </button>
        </form>
      </div>
    </div>
  );
};

export default GeneralSettings;
