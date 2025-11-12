import React, { useState, useEffect, useRef } from "react";
import $ from "jquery";

const SendEmails = () => {
  const [formData, setFormData] = useState({
    userType: "",
    subject: "",
  });

  const [editorContent, setEditorContent] = useState("");
  const wrapperRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    let shadow;

    // ✅ Attach Shadow DOM only once
    if (!wrapperRef.current.shadowRoot) {
      shadow = wrapperRef.current.attachShadow({ mode: "open" });
    } else {
      shadow = wrapperRef.current.shadowRoot;
    }

    // ✅ Inject Bootstrap & Summernote CSS inside the shadow
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

    // ✅ Create a container for the Summernote editor
    const editorDiv = document.createElement("div");
    shadow.appendChild(editorDiv);

    // ✅ Load JS and initialize Summernote
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
            onChange: (contents) => setEditorContent(contents),
          },
        });
      });
    });

    // ✅ Cleanup on unmount
    return () => {
      if (editorDiv && $(editorDiv).next(".note-editor").length) {
        $(editorDiv).summernote("destroy");
      }
      shadow.innerHTML = "";
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalData = {
      ...formData,
      body: editorContent,
    };
    console.log("Sending Email Notification:", finalData);
    alert("Email data logged in console!");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Email Notifications
        </h1>

        <form onSubmit={handleSubmit}>
          {/* --- User Type and Subject --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            <div>
              <label
                htmlFor="userType"
                className="block text-sm font-medium text-gray-600 mb-1"
              >
                User Type
              </label>
              <select
                id="userType"
                name="userType"
                value={formData.userType}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="">Select user role</option>
                <option value="all">All Users</option>
                <option value="business_owners">Business Owners</option>
                <option value="company_owners">Company Owners</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-gray-600 mb-1"
              >
                Subject
              </label>
              <input 
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Enter subject"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
          </div>

          {/* --- Shadow DOM Summernote Editor --- */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Body
            </label>
            <div ref={wrapperRef}></div>
          </div>

          {/* --- Submit Button --- */}
          <button
            type="submit"
            className="px-6 py-2 bg-[#D9B95B] text-white font-semibold rounded-md hover:bg-[#c8a84a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D9B95B]"
          >
            Send Notifications
          </button>
        </form>
      </div>
    </div>
  );
};

export default SendEmails;
