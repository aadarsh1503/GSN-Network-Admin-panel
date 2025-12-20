import React, { useRef } from 'react';
import { FiDownload } from 'react-icons/fi';

// Import the libraries we just installed
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const MyCertificatePage = () => {
  // In a real app, this data would likely come from props or a user context
  const memberName = "MB Logistics – Multisara Bahteramandiri";
  const memberId = "#24392";
  const memberType = "Elite";

  // Create a ref to target the certificate div
  const certificateRef = useRef(null);

  const backgroundPattern = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCI+CjxyZWN0IHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgZmlsbD0iI2ZmZmZmZiI+PC9yZWN0Pgo8cGF0aCBkPSJNIDAgNTAgTCA1MCAwIE0gMjUgNTAgTCA1MCAyNSBNIC0yNSA1MCBMIDUwIC0yNSBNIDAgMjUgTCAyNSAwIiBzdHJva2U9IiNlYWVhZWEiIHN0cm9rZS13aWR0aD0iMSI+PC9wYXRoPgo8L3N2Zz4=";

  // --- THIS IS THE NEW FUNCTION FOR DOWNLOADING ---
  const handleDownloadPdf = () => {
    const input = certificateRef.current; // Target the div using the ref

    if (input) {
      html2canvas(input, { scale: 2 }) // Use scale for better quality
        .then((canvas) => {
          const imgData = canvas.toDataURL('image/png');
          
          // Create a new PDF document (A4 size, portrait)
          const pdf = new jsPDF('p', 'mm', 'a4');
          
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          
          const canvasWidth = canvas.width;
          const canvasHeight = canvas.height;
          
          // Calculate the aspect ratio to fit the image on the PDF
          const ratio = canvasWidth / canvasHeight;
          const imgWidth = pdfWidth;
          const imgHeight = imgWidth / ratio;

          // Check if the image height is greater than PDF height
          // (This is unlikely for this component but good practice)
          let finalHeight = imgHeight;
          if (imgHeight > pdfHeight) {
            finalHeight = pdfHeight;
          }
          
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, finalHeight);
          pdf.save(`Certificate-${memberId}.pdf`); // Save the file
        });
    }
  };

  return (
    <div className="bg-slate-100 p-4 sm:p-8 flex flex-col items-center w-full">
      <div className="w-full max-w-4xl">
        
        {/* The button now calls our new download function */}
        <div className="mb-4">
          <button 
            onClick={handleDownloadPdf} 
            className="bg-[#D9CBAA] text-gray-800 font-semibold px-4 py-2 rounded-md flex items-center gap-2 hover:bg-opacity-90 transition-colors"
          >
            <FiDownload />
            <span>Download as Pdf</span>
          </button>
        </div>

        {/* --- ADD THE REF TO THIS DIV --- */}
        <div ref={certificateRef} className="bg-white rounded-lg shadow-2xl overflow-hidden relative">
          <div 
            className="absolute inset-0 opacity-40" 
            style={{ 
              backgroundImage: `url(${backgroundPattern})`,
              backgroundSize: '40px 40px'
            }}
          ></div>
          <div className="relative z-10 p-8 sm:p-16">
            <h1 className="font-serif text-5xl sm:text-7xl font-bold text-gray-800">
              Certificate
            </h1>
            <h2 className="font-serif text-5xl sm:text-7xl font-bold text-gray-800 mt-2">
              of {memberType} Member
            </h2>
            <div className="mt-12 space-y-6">
              <p className="text-gray-600">This is to Certify that</p>
              <p className="font-semibold text-lg text-gray-900 border-b border-gray-800 pb-1 inline-block">
                {memberName} is a
              </p>
              <div>
                <span className="bg-green-600 text-white font-bold text-lg px-8 py-3 rounded-full inline-block">
                  Verified member of the .com
                </span>
              </div>
              <p className="text-gray-700 pt-2">Power By .com</p>
              <p className="text-gray-600">Member Id.{memberId}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyCertificatePage;