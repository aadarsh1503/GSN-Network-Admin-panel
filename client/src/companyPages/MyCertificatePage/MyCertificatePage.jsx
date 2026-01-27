import { useRef, useState, useEffect } from 'react';
import { FiDownload, FiAward, FiShield, FiStar, FiGlobe, FiUsers, FiHexagon } from 'react-icons/fi';
import { api, subscriptionAPI } from '../../utils/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './Certificate.css';

const MyCertificatePage = () => {
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const certificateRef = useRef(null);

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const userDataString = localStorage.getItem('user');
        let userData = userDataString ? JSON.parse(userDataString) : null;
        let subscriptionData = null;
        try {
          const token = localStorage.getItem('token');
          if (token) subscriptionData = await subscriptionAPI.getMySubscription();
        } catch (e) { console.error(e); }

        let companyProfile = null;
        try {
          companyProfile = await api.get('/api/company/profile');
        } catch (e) { console.error(e); }

        const referralCode = companyProfile?.referral_code || `GSN${userData?.id || '0000'}`;
        let planName = subscriptionData && !subscriptionData.is_guest ? `${subscriptionData.plan_name} Plan` : 'Free Plan';
        let validUntil = subscriptionData && !subscriptionData.is_guest 
          ? new Date(subscriptionData.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          : 'Lifetime Membership';

        setCompanyData({
          name: companyProfile?.name || companyProfile?.company_name || userData?.name || 'Valued Member',
          memberId: referralCode,
          subscriptionPlan: planName,
          memberType: planName,
          validUntil: validUntil,
        });
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanyData();
  }, []);

  const handleDownloadPdf = async () => {
    const element = certificateRef.current;
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
    pdf.save(`GSN_Premium_Cert_${companyData?.memberId}.pdf`);
  };

  if (loading) return (
    <div className="sexy-loader-wrapper">
      <div className="pulsating-circle"></div>
      <p>Initializing Premium Certificate...</p>
    </div>
  );

  return (
    <div className="sexy-page-root">
      {/* Background Sexy Shapes */}
      <div className="aurora-bg"></div>
      <div className="floating-shape shape-gold-blob"></div>
      <div className="floating-shape shape-blue-ring"></div>
      <div className="floating-shape shape-glass-square"></div>

      <div className="sexy-main-container">
        <header className="sexy-header">
          <div className="header-text">
            <span className="premium-label">MEMBERSHIP EXCELLENCE</span>
            <h1>Digital Certificate</h1>
            <p>Official recognition of your professional status within the GSN network.</p>
          </div>
          <button onClick={handleDownloadPdf} className="sexy-download-btn">
            <FiDownload /> <span>Download Certificate</span>
          </button>
        </header>

        <div className="cert-canvas-area">
          {/* Certificate Design */}
          <div className="premium-cert-card" ref={certificateRef}>
            <div className="cert-inner-glow"></div>
            <div className="cert-pattern-overlay"></div>
            
            <div className="cert-content-frame">
              {/* Header */}
              <div className="cert-header-row">
                <div className="cert-brand">
                  <img src="https://res.cloudinary.com/ds1dt3qub/image/upload/v1769074782/subscription-payment-proofs/bjqpu3ymz19amvbu5ugq.jpg" alt="GSN" className="cert-logo-img" />
                  <div className="brand-titles">
                    <h3>GULF STAR NETWORK</h3>
                    <p>Global Logistics Excellence</p>
                  </div>
                </div>
                <div className="cert-meta">
                  <div className="id-tag">ID: {companyData?.memberId}</div>
                </div>
              </div>

              {/* Main Body */}
              <div className="cert-main-body">
                <p className="cert-proclamation">THIS IS TO OFFICIALLY CERTIFY THAT</p>
                <h2 className="cert-recipient-name">{companyData?.name}</h2>
                <div className="cert-divider-gold">
                  <FiAward className="divider-icon" />
                </div>
                <p className="cert-statement">
                  Is a recognized <strong>{companyData?.memberType}</strong> and an integral part of the 
                  Gulf Star Network. This organization has met all professional standards for 
                  global logistics collaboration.
                </p>
              </div>

              {/* Badges Row */}
              <div className="cert-badges-row">
                <div className="cert-badge-item"><FiShield /> <span>Security</span></div>
                <div className="cert-badge-item"><FiGlobe /> <span>Global</span></div>
                <div className="cert-badge-item"><FiUsers /> <span>Network</span></div>
              </div>

              {/* Footer */}
              <div className="cert-footer-row">
                <div className="footer-sign">
                  <span className="sign-label">Valid Until</span>
                  <span className="sign-value">{companyData?.validUntil}</span>
                </div>
                <div className="footer-seal">
                  <div className="gold-seal">
                    <FiHexagon className="seal-hex" />
                  </div>
                </div>
                <div className="footer-sign align-right">
                  <span className="sign-label">Issuing Authority</span>
                  <span className="sign-value signature-font">Gulf Star Network</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards - The "Gap" from bottom is handled in CSS */}
        <div className="bottom-info-grid">
          <div className="glass-info-card">
            <FiStar className="info-icon" />
            <h4>Authenticity</h4>
            <p>Every certificate is uniquely generated and stored on our secure servers for instant verification.</p>
          </div>
          <div className="glass-info-card">
            <FiShield className="info-icon" />
            <h4>Membership Perks</h4>
            <p>Display this certificate on your website to build trust with global logistics partners.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyCertificatePage;