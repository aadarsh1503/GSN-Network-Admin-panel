import { useRef, useState, useEffect } from 'react';
import { FiDownload, FiAward, FiShield, FiStar, FiCheck, FiCalendar } from 'react-icons/fi';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { api, subscriptionAPI } from '../../utils/api';
import GSNLogo from '../../components/Navbar/GSN.jpg';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './Certificate.css';

const MyCertificatePage = () => {
  const { subscription } = useSubscription();
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const certificateRef = useRef(null);

  // Fetch company data with enhanced debugging
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        console.log('🔍 Fetching company data...');
        
        // Get user data from localStorage (same as UserCard)
        const userDataString = localStorage.getItem('user');
        let userData = null;
        if (userDataString) {
          try {
            userData = JSON.parse(userDataString);
          } catch (error) {
            console.error("Error parsing user JSON:", error);
          }
        }

        // Fetch subscription data (same as UserCard)
        let subscriptionData = null;
        try {
          const token = localStorage.getItem('token');
          if (token) {
            subscriptionData = await subscriptionAPI.getMySubscription();
            console.log('📊 Subscription data:', subscriptionData);
          }
        } catch (error) {
          console.error('Error fetching subscription:', error);
        }

        // Fetch company profile
        let companyProfile = null;
        try {
          companyProfile = await api.get('/api/company/profile');
          console.log('🏢 Company profile:', companyProfile);
        } catch (error) {
          console.error('Error fetching company profile:', error);
        }

        // Generate referral code
        const referralCode = companyProfile?.referral_code || `GSN${userData?.id || '0000'}${String(userData?.id || '0000').padStart(4, '0')}`;

        // Get plan name (same logic as UserCard)
        let planName = 'Free Plan';
        let validUntil = 'Lifetime';
        
        if (subscriptionData && !subscriptionData.is_guest) {
          planName = `${subscriptionData.plan_name} Plan`;
          validUntil = new Date(subscriptionData.end_date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        }

        console.log('📋 Final plan name:', planName);
        console.log('📅 Valid until:', validUntil);

        setCompanyData({
          name: companyProfile?.name || companyProfile?.company_name || userData?.name || 'Company Name',
          memberId: referralCode,
          subscriptionPlan: planName,
          memberType: planName,
          validUntil: validUntil,
          email: companyProfile?.email || userData?.email || '',
          phone: companyProfile?.phone || userData?.phone || '',
          isGuest: subscriptionData?.is_guest || false
        });
      } catch (error) {
        console.error('Error fetching company data:', error);
        const userDataString = localStorage.getItem('user');
        let userData = null;
        if (userDataString) {
          try {
            userData = JSON.parse(userDataString);
          } catch (error) {
            console.error("Error parsing user JSON:", error);
          }
        }
        
        const fallbackReferralCode = `GSN${userData?.id || '0000'}${String(userData?.id || '0000').padStart(4, '0')}`;
        
        setCompanyData({
          name: userData?.name || 'Company Name',
          memberId: fallbackReferralCode,
          subscriptionPlan: 'Free Plan',
          memberType: 'Free Plan',
          validUntil: 'Lifetime',
          email: userData?.email || '',
          phone: userData?.phone || '',
          isGuest: true
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, []);

  const handleDownloadPdf = () => {
    const input = certificateRef.current;

    if (input) {
      // Get the actual dimensions of the certificate
      const rect = input.getBoundingClientRect();
      const actualWidth = Math.max(1200, rect.width);
      const actualHeight = Math.max(1000, rect.height);

      // Temporarily set optimal dimensions for PDF generation
      const originalStyle = {
        width: input.style.width,
        height: input.style.height,
        maxWidth: input.style.maxWidth,
        transform: input.style.transform,
        overflow: input.style.overflow
      };

      // Set dimensions for PDF
      input.style.width = actualWidth + 'px';
      input.style.height = actualHeight + 'px';
      input.style.maxWidth = 'none';
      input.style.transform = 'scale(1)';
      input.style.overflow = 'visible';

      // Wait a moment for styles to apply
      setTimeout(() => {
        html2canvas(input, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          scrollX: 0,
          scrollY: 0,
          windowWidth: actualWidth,
          windowHeight: actualHeight,
          width: actualWidth,
          height: actualHeight
        })
        .then((canvas) => {
          // Restore original styles
          Object.keys(originalStyle).forEach(key => {
            input.style[key] = originalStyle[key];
          });

          const imgData = canvas.toDataURL('image/png', 1.0);
          const pdf = new jsPDF('l', 'mm', 'a4');
          
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          
          // Fill the entire PDF page without centering
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`GSN-Certificate-${companyData?.memberId || 'Member'}.pdf`);
        })
        .catch((error) => {
          // Restore original styles on error
          Object.keys(originalStyle).forEach(key => {
            input.style[key] = originalStyle[key];
          });
          console.error('Error generating PDF:', error);
          alert('Error generating PDF. Please try again.');
        });
      }, 100);
    }
  };

  if (loading) {
    return (
      <div className="cert-loading">
        <div className="cert-loading-content">
          <div className="cert-loading-spinner">
            <FiAward className="cert-loading-icon" />
          </div>
          <p className="cert-loading-text">Preparing your certificate...</p>
          <div className="cert-loading-dots">
            <div className="cert-loading-dot"></div>
            <div className="cert-loading-dot"></div>
            <div className="cert-loading-dot"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="certificate-page">
      <div className="certificate-container">
        
        {/* Header Section */}
        <div className="certificate-header">
          <h1 className="certificate-title">Digital Certificate</h1>
          <p className="certificate-subtitle">Your official Gulf Star Network membership certificate</p>
          
          <button onClick={handleDownloadPdf} className="download-button">
            <FiDownload />
            <span>Download Certificate</span>
          </button>
        </div>

        {/* Certificate Card */}
        <div className="certificate-card" ref={certificateRef}>
          
          {/* Background */}
          <div className="certificate-background"></div>
          <div className="certificate-pattern"></div>

          {/* Certificate Content */}
          <div className="certificate-content">
            
            {/* Header */}
            <div className="cert-header">
              <div className="cert-logo-section">
                <div className="cert-logo">
                  <img src={GSNLogo} alt="GSN" />
                </div>
                <div className="cert-company-info">
                  <h2>Gulf Star Network</h2>
                  <p className="tagline">Professional Logistics Network</p>
                  <p className="subtitle">Connecting Global Trade</p>
                </div>
              </div>
              
              <div className="cert-verification">
                <div className="verified-badge">VERIFIED MEMBER</div>
                <p className="cert-id">
                  Certificate ID: <span className="cert-id-number">{companyData?.memberId}</span>
                </p>
              </div>
            </div>

            {/* Main Certificate Content */}
            <div className="cert-main">
              
              {/* Certificate Title */}
              <div className="cert-title-section">
                <h1 className="cert-main-title">CERTIFICATE</h1>
                <div className="cert-divider">
                  <div className="cert-line"></div>
                  <div className="cert-award-icon">
                    <FiAward />
                  </div>
                  <div className="cert-line"></div>
                </div>
                <h2 className="cert-subtitle-main">of Membership</h2>
              </div>

              {/* Certification Text */}
              <div className="cert-text-section">
                <p className="cert-intro-text">This is to certify that</p>
                <div className="cert-name-container">
                  <div className="cert-name-box">
                    <h3 className="cert-company-name">{companyData?.name}</h3>
                  </div>
                </div>
                <p className="cert-member-text">
                  is a <span className="cert-member-type">{companyData?.memberType}</span> of the Gulf Star Network
                </p>
              </div>

              {/* Membership Benefits */}
              <div className="cert-benefits">
                <div className="cert-benefit">
                  <div className="cert-benefit-icon">
                    <FiShield />
                  </div>
                  <p className="cert-benefit-text">Verified Business</p>
                </div>
                <div className="cert-benefit">
                  <div className="cert-benefit-icon">
                    <FiStar />
                  </div>
                  <p className="cert-benefit-text">Premium Access</p>
                </div>
                <div className="cert-benefit">
                  <div className="cert-benefit-icon">
                    <FiCheck />
                  </div>
                  <p className="cert-benefit-text">Quality Assured</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="cert-footer">
              <div className="cert-validity">
                <p className="cert-validity-label">
                  <FiCalendar />
                  <span>Valid Until</span>
                </p>
                <p className="cert-validity-date">{companyData?.validUntil}</p>
              </div>
              
              <div className="cert-seal">
                <div className="cert-seal-icon">
                  <FiAward />
                </div>
                <p className="cert-seal-text">Official Seal</p>
              </div>
              
              <div className="cert-plan-info">
                <div className="cert-plan-section">
                  <p className="cert-plan-label">Plan Type</p>
                  <p className="cert-plan-value">{companyData?.subscriptionPlan}</p>
                </div>
                <div className="cert-status-section">
            
                  <p className="cert-status-text">
                    {companyData?.isGuest ? 'Free' : 'Active'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Borders */}
          <div className="cert-border"></div>
          <div className="cert-inner-border"></div>
        </div>

        {/* Additional Info */}
        <div className="cert-additional-info">
          <div className="cert-info-box">
            <p className="cert-info-text">
              This certificate is digitally generated and verified by Gulf Star Network. 
              For verification, visit our website with certificate ID: 
              <span className="cert-info-id">{companyData?.memberId}</span>
            </p>
            <div className="cert-info-footer">
              <div className="cert-info-dot"></div>
              <p className="cert-info-badges">Issued by Gulf Star Network • Digitally Verified • Blockchain Secured</p>
              <div className="cert-info-dot"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyCertificatePage;