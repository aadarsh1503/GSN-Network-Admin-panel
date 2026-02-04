// src/components/Footer.jsx

import React, { useState } from 'react'; // Added useState
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaFacebookF, FaTwitter, FaLinkedinIn, FaYoutube, FaInstagram, FaChevronUp, FaArrowRight } from 'react-icons/fa'; // Added FaArrowRight
import footerBgImage from "./Footer.png";
import GSN from "./GSN.jpg";
import VersionDisplay from '../VersionDisplay/VersionDisplay';
import i1 from "./i1.png"

const Footer = () => {
  // --- NEWSLETTER LOGIC ---
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setMessage('Please enter a valid email address.');
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('email', email);
      formData.append('list', 'AoyrHgk92Us892ZPK9FnN3Jg'); 
      formData.append('subform', 'yes');
      formData.append('hp', '');

      await fetch('https://send.alzyara.com/subscribe', {
        method: 'POST', body: formData, mode: 'no-cors'
      });
      setMessage('Thank you! Your subscription is confirmed.');
      setEmail('');
      setTimeout(() => setMessage(''), 4000);
    } catch (error) {
      console.error('Error:', error);
      setMessage('Subscription failed. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer id="contact-us" className="relative bg-[#212121] text-gray-300 pt-20 overflow-hidden">
      
      <div
        className="absolute inset-0 w-full h-full bg-no-repeat bg-center top-64"
        style={{ backgroundImage: `url(${footerBgImage})` }}
      ></div>
      <div className="absolute inset-0 w-full h-full bg-black opacity-5"></div> 
  
      <div className="relative container max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* --- NEWSLETTER SECTION --- */}
        <div className="mb-20 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                Stay Ahead of the Curve
            </h2>
            <p className="mt-3 text-gray-400 max-w-2xl mx-auto">
                Get exclusive logistics insights and market trends delivered to your inbox.
            </p>
            
            <div className="mt-8 max-w-lg mx-auto p-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl">
                <form onSubmit={handleSubscribe} className="flex items-center">
                    <input 
    type="email"
    placeholder="Enter your email"
    className="flex-grow bg-transparent text-white rounded-2xl placeholder-gray-500 px-5 py-2"
    value={email}
    autoComplete="off"
    onChange={(e) => setEmail(e.target.value)}
    required
/>

                    <button 
                        type="submit" 
                        className="flex-shrink-0 bg-[#bca142] text-white p-3 rounded-full hover:bg-yellow-600 transition-all duration-300 shadow-md" 
                        disabled={loading}
                    >
                        {loading ? ( 
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> 
                        ) : ( 
                          <FaArrowRight className="text-xl"/> 
                        )}
                    </button>
                </form>
            </div>
            {message && <p className="mt-4 text-sm text-[#bca142]">{message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Column 1: Logo & Info */}
          <div className="ml-8">
            <img src={i1} alt="Logistics Logo" className="w-44" />
            <p className="mt-2 text-gray-400">
              Provide a freight quote from our select premium members 
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex items-start">
                <FaMapMarkerAlt className="text-[#bca142] mt-1 mr-3 flex-shrink-0" />
                <span>#22, Building 661, Road no 1208, Block 712 Salmabad, 973, Bahrain</span>
              </div>
              <div className="flex items-center">
                <FaPhoneAlt className="text-[#bca142] mr-3 flex-shrink-0" />
                <span>+973 17491222</span>
              </div>
              <div className="flex items-center">
                <FaEnvelope className="text-[#bca142] mr-3 flex-shrink-0" />
                <span>info@gulfstarnetwork.com</span>
              </div>
            </div>
          </div>

          {/* Column 2: Information */}
          <div>
            <h3 className="text-xl text-white font-semibold">Information</h3>
            <div className="w-16 h-1 bg-[#bca142] mt-2 mb-6"></div>
            <ul className="space-y-3">
              <li><a href="/register" className="hover:text-[#bca142] transition-colors">Become Member</a></li>
              <li><a href="#" className="hover:text-[#bca142] transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-[#bca142] transition-colors">About us</a></li>
              <li><a href="#" className="hover:text-[#bca142] transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[#bca142] transition-colors">Terms&conditions</a></li>
              <li><a href="#" className="hover:text-[#bca142] transition-colors">Disclaimer</a></li>
            </ul>
          </div>

          {/* Column 3: Main */}
          <div>
            <h3 className="text-xl text-white font-semibold">Main</h3>
            <div className="w-16 h-1 bg-[#bca142] mt-2 mb-6"></div>
            <ul className="space-y-3">
              <li><a href="/company-directory" className="hover:text-[#bca142] transition-colors">Member Directory</a></li>
              <li><a href="/quote" className="hover:text-[#bca142] transition-colors">Quotes</a></li>
              {/* <li><a href="#" className="hover:text-[#bca142] transition-colors">Blacklist Directory</a></li> */}
              <li><a href="/register" className="hover:text-[#bca142] transition-colors">Register Today</a></li>
              <li><a href="/login" className="hover:text-[#bca142] transition-colors">Login</a></li>
              {/* <li><a href="#" className="hover:text-[#bca142] transition-colors">Due Delight</a></li> */}
            </ul>
          </div>

          {/* Column 4: Follow Us On */}
          <div>
            <h3 className="text-xl text-white font-semibold">Follow Us On</h3>
            <div className="w-16 h-1 bg-[#bca142] mt-2 mb-6"></div>
            <div className="flex space-x-3">
              <a href="#" className="w-9 h-9 flex items-center justify-center bg-gray-700 hover:bg-[#bca142] text-white rounded transition-colors"><FaFacebookF /></a>
              <a href="#" className="w-9 h-9 flex items-center justify-center bg-gray-700 hover:bg-[#bca142] text-white rounded transition-colors"><FaTwitter /></a>
              <a href="#" className="w-9 h-9 flex items-center justify-center bg-gray-700 hover:bg-[#bca142] text-white rounded transition-colors"><FaLinkedinIn /></a>
              <a href="#" className="w-9 h-9 flex items-center justify-center bg-gray-700 hover:bg-[#bca142] text-white rounded transition-colors"><FaYoutube /></a>
              <a href="#" className="w-9 h-9 flex items-center justify-center bg-gray-700 hover:bg-[#bca142] text-white rounded transition-colors"><FaInstagram /></a>
            </div>
          </div>
        </div>
      </div>

      {/* --- LOWER FOOTER / COPYRIGHT SECTION --- */}
      <div className="relative mt-1 bg-[#171717] py-6 text-center text-gray-400">
        <div className="flex items-center justify-center space-x-4">
         <p>{new Date().getFullYear()} Copyright © GSN</p>
          <span>|</span>
          <VersionDisplay />
        </div>
      </div>

      {/* Scroll to top button */}
      <a href="#" className="absolute bottom-8 right-8 w-12 h-12 bg-[#bca142] rounded-full flex items-center justify-center text-white text-xl shadow-lg hover:bg-yellow-500 transition-colors">
        <FaChevronUp />
      </a>
    </footer>
  );
};

export default Footer;