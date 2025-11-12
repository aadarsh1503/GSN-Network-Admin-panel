import React, { useEffect, useRef, useState } from "react";
import $ from "jquery";
import "summernote/dist/summernote-lite.js";
import "summernote/dist/summernote-lite.css";

const BankDetailEditor = () => {
  const initialContent = `
    <p><strong>Bank Name:</strong> Indian Bank</p>
    <p><strong>Branch:</strong> XYZ</p>
    <p><strong>Branch Address:</strong> XYZ</p>
    <p><strong>IFSC Code:</strong> 048356</p>
    <p><strong>Account Number:</strong> 89798765463498</p>
    <p><br></p>
    <p><strong style="color:red;">Instructions:</strong></p>
    <p>Ensure to enter the correct branch name where the account is held to avoid any confusion.</p>
  `;

  const [editorContent, setEditorContent] = useState(initialContent);
  const wrapperRef = useRef(null);

  useEffect(() => {
    let shadow;

    // ✅ Attach shadow root only once
    if (!wrapperRef.current.shadowRoot) {
      shadow = wrapperRef.current.attachShadow({ mode: "open" });
    } else {
      shadow = wrapperRef.current.shadowRoot;
    }

    // ✅ Add isolated stylesheet links
    const bootstrapCSS = document.createElement("link");
    bootstrapCSS.rel = "stylesheet";
    bootstrapCSS.href =
      "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css";
    shadow.appendChild(bootstrapCSS);

    const summernoteCSS = document.createElement("link");
    summernoteCSS.rel = "stylesheet";
    summernoteCSS.href =
      "https://cdn.jsdelivr.net/npm/summernote/dist/summernote-lite.css";
    shadow.appendChild(summernoteCSS);

    // ✅ Add editor div inside shadow DOM
    const editorDiv = document.createElement("div");
    shadow.appendChild(editorDiv);

    // ✅ Load bootstrap JS + init Summernote inside shadow
    import("bootstrap/dist/js/bootstrap.bundle.min.js").then(() => {
      $(editorDiv).summernote({
        height: 350,
        dialogsInBody: true,
        toolbar: [
          ["style", ["style"]],
          ["font", ["bold", "underline", "clear"]],
          ["fontname", ["fontname"]],
          ["para", ["ul", "ol", "paragraph"]],
          ["table", ["table"]],
          ["insert", ["link", "picture", "video"]],
          ["view", ["fullscreen", "codeview"]],
        ],
        callbacks: {
          onChange: function (contents) {
            setEditorContent(contents);
          },
        },
      });
      $(editorDiv).summernote("code", initialContent);
    });

    // ✅ Cleanup on unmount
    return () => {
      if (editorDiv && $(editorDiv).next(".note-editor").length) {
        $(editorDiv).summernote("destroy");
      }
      shadow.innerHTML = ""; // remove shadow content safely
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitted Bank Details (HTML):", editorContent);
    alert("Bank details submitted! Check the console.");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Bank Transfer Detail
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bank Detail
            </label>
            {/* Shadow DOM container */}
            <div ref={wrapperRef}></div>
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

export default BankDetailEditor;
