import React, { useRef, useState, useEffect } from 'react';
import { FiDownload } from 'react-icons/fi';
import { useSubscription } from '../../contexts/SubscriptionContext';
import api from '../../utils/api';
import GSNLogo from '../../components/Navbar/GSN.jpg';

// Import the libraries we just installed
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const MyCertificatePage = () => {
  const { subscription } = useSubscription();
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Create a ref to target the certificate div
  const certificateRef = useRef(null);

  // Fetch company data
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const [companyProfile, userData] = await Promise.all([
          api.get('/api/company/profile'),
          api.get('/api/user/me')
        ]);

        // Generate referral code same as dashboard
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const referralCode = companyProfile?.referral_code || `GSN${user.id}${String(user.id).padStart(4, '0')}`;

        setCompanyData({
          name: companyProfile.name || 'Company Name',
          memberId: referralCode,
          subscriptionPlan: subscription?.plan_name || 'Guest Member',
          memberType: subscription?.plan_name || 'Guest Member'
        });
      } catch (error) {
        console.error('Error fetching company data:', error);
        // Fallback data with referral code
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const fallbackReferralCode = `GSN${user.id || '0000'}${String(user.id || '0000').padStart(4, '0')}`;
        
        setCompanyData({
          name: 'Company Name',
          memberId: fallbackReferralCode,
          subscriptionPlan: 'Guest Member',
          memberType: 'Guest Member'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [subscription]);

  // --- THIS IS THE NEW FUNCTION FOR DOWNLOADING ---
  const handleDownloadPdf = () => {
    const input = certificateRef.current; // Target the div using the ref

    if (input) {
      // Configure html2canvas options to handle modern CSS
      const options = {
        scale: 2, // Use scale for better quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        ignoreElements: (element) => {
          // Skip elements that might cause issues
          return element.classList?.contains('ignore-pdf');
        },
        onclone: (clonedDoc) => {
          // Remove any problematic CSS that html2canvas can't handle
          const clonedElement = clonedDoc.querySelector('[data-certificate]');
          if (clonedElement) {
            // Force standard colors instead of modern CSS functions
            clonedElement.style.setProperty('background-color', '#ffffff', 'important');
          }
        }
      };

      html2canvas(input, options)
        .then((canvas) => {
          const imgData = canvas.toDataURL('image/png');
          
          // Create a new PDF document (A4 size, landscape for better certificate layout)
          const pdf = new jsPDF('l', 'mm', 'a4');
          
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          
          const canvasWidth = canvas.width;
          const canvasHeight = canvas.height;
          
          // Calculate the aspect ratio to fit the image on the PDF
          const ratio = canvasWidth / canvasHeight;
          const imgWidth = pdfWidth;
          const imgHeight = imgWidth / ratio;

          // Check if the image height is greater than PDF height
          let finalHeight = imgHeight;
          if (imgHeight > pdfHeight) {
            finalHeight = pdfHeight;
          }
          
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, finalHeight);
          pdf.save(`Certificate-${companyData?.memberId || 'Member'}.pdf`); // Save the file
        })
        .catch((error) => {
          console.error('Error generating PDF:', error);
          alert('Error generating PDF. Please try again.');
        });
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-100 p-4 sm:p-8 flex flex-col items-center w-full min-h-screen justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading certificate...</p>
        </div>
      </div>
    );
  }

  const backgroundPattern = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCI+CjxyZWN0IHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgZmlsbD0iI2ZmZmZmZiI+PC9yZWN0Pgo8cGF0aCBkPSJNIDAgNTAgTCA1MCAwIE0gMjUgNTAgTCA1MCAyNSBNIC0yNSA1MCBMIDUwIC0yNSBNIDAgMjUgTCAyNSAwIiBzdHJva2U9IiNlYWVhZWEiIHN0cm9rZS13aWR0aD0iMSI+PC9wYXRoPgo8L3N2Zz4=";

  return (
    <div className="bg-slate-100 p-4 sm:p-8 flex flex-col items-center w-full">
      <div className="w-full max-w-6xl">
        
        {/* The button now calls our new download function */}
        <div className="mb-4">
          <button 
            onClick={handleDownloadPdf} 
            className="bg-[#CDA435] text-white font-semibold px-6 py-3 rounded-md flex items-center gap-2 hover:bg-yellow-600 transition-colors shadow-md"
          >
            <FiDownload />
            <span>Download Certificate as PDF</span>
          </button>
        </div>

        {/* --- ADD THE REF TO THIS DIV --- */}
        <div ref={certificateRef} data-certificate className="bg-white rounded-lg shadow-2xl overflow-hidden relative" style={{ backgroundColor: '#ffffff' }}>
          <div 
            className="absolute inset-0 opacity-30" 
            style={{ 
              backgroundImage: `url(${backgroundPattern})`,
              backgroundSize: '40px 40px'
            }}
          ></div>
          <div className="relative z-10 p-8 sm:p-16">
            {/* Header with logo */}
            <div className="flex justify-center items-center mb-12">
              <div className="flex items-center">
                <img src={GSNLogo} alt="Gulf Star Network Logo" className="h-24 w-auto" />
                <div className="ml-6">
                  <h3 className="text-2xl font-bold" style={{ color: '#1f2937' }}>Gulf Star Network</h3>
                  <p className="text-lg" style={{ color: '#6b7280' }}>(GSN)</p>
                </div>
              </div>
            </div>

            <h1 className="font-serif text-4xl sm:text-6xl font-bold text-center mb-4" style={{ color: '#1f2937' }}>
              Certificate
            </h1>
            <h2 className="font-serif text-4xl sm:text-6xl font-bold text-center mb-12" style={{ color: '#1f2937' }}>
              of membership
            </h2>
            
            <div className="mt-12 space-y-8 text-center">
              <p className="text-lg" style={{ color: '#6b7280' }}>This is to certify that</p>
              <p className="font-semibold text-2xl border-b-2 pb-2 inline-block" style={{ color: '#111827', borderColor: '#1f2937' }}>
                {companyData?.name || 'Company Name'} is a
              </p>
              <div>
                <span className="text-white font-bold text-xl px-10 py-4 rounded-full inline-block shadow-lg" style={{ backgroundColor: '#2563eb' }}>
                  Verified member of Gulf Star Network
                </span>
              </div>
              <p className="pt-4 text-lg" style={{ color: '#374151' }}>powered by Gulf Star Network (GSN)</p>
              
              <div className="flex justify-between items-center mt-16 pt-8 border-t" style={{ borderColor: '#e5e7eb' }}>
                <div className="text-left">
                  <p className="font-medium" style={{ color: '#6b7280' }}>Member's ID: <span className="font-bold" style={{ color: '#1f2937' }}>{companyData?.memberId || 'GSN00000000'}</span></p>
                  <p className="font-medium mt-2" style={{ color: '#6b7280' }}>Plan: <span className="font-bold" style={{ color: '#CDA435' }}>{companyData?.subscriptionPlan || 'Guest Member'}</span></p>
                </div>
                
                {/* Verification Badge */}
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center border-4 shadow-lg" style={{ backgroundColor: '#2563eb', borderColor: '#bfdbfe' }}>
                      <div className="text-center text-white">
                        <div className="text-xs font-bold">VERIFIED</div>
                        <div className="text-xs">MEMBER</div>
                        <div className="text-xs font-bold">GSN</div>
                        <div className="text-xs">NETWORK</div>
                      </div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#fbbf24' }}>
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyCertificatePage;