// src/components/Footer.jsx

import React from 'react';
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaFacebookF, FaTwitter, FaLinkedinIn, FaYoutube, FaInstagram, FaChevronUp } from 'react-icons/fa';
import footerBgImage from "./Footer.png";
import GSN from "./GSN.jpg"
const Footer = () => {
  return (
    <footer className="relative bg-[#212121] text-gray-300 pt-20 overflow-hidden">
      
      {/* --- BACKGROUND SECTION (applies to the whole footer) --- */}
      <div
        className="absolute inset-0 w-full h-full bg-no-repeat bg-center top-32"
        style={{ backgroundImage: `url(${footerBgImage})` }}
      ></div>
      <div className="absolute inset-0 w-full h-full bg-black opacity-5"></div> 
      {/* Increased opacity for a darker look, adjust as needed */}
      

      {/* --- UPPER FOOTER CONTENT --- */}
      {/* This container holds the 4 columns and IS NOT full-width */}
      <div className="relative container max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Column 1: Logo and Contact Info */}
          <div className="pr-8">
            <img src={GSN} alt="Logistics Logo" className="w-28 bg-white p-4" />
            <p className="mt-6 text-gray-400">
              Provide a freight quote from our select premium members 
            </p>
            <div className="mt-6 space-y-4">
              <div className="flex items-start">
                <FaMapMarkerAlt className="text-[#CDA435] mt-1 mr-3 flex-shrink-0" />
                <span>#22, Building 661, Road no 1208, Block 712 Salmabad, 973, Bahrain</span>
              </div>
              <div className="flex items-center">
                <FaPhoneAlt className="text-[#CDA435] mr-3 flex-shrink-0" />
                <span>+973 17491222</span>
              </div>
              <div className="flex items-center">
                <FaEnvelope className="text-[#CDA435] mr-3 flex-shrink-0" />
                <span>info@gulfstarnetwork.com</span>
              </div>
            </div>
          </div>

          {/* Column 2: Information */}
          <div>
            <h3 className="text-xl text-white font-semibold">Information</h3>
            <div className="w-16 h-1 bg-[#CDA435] mt-2 mb-6"></div>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-[#CDA435] transition-colors">Become Member</a></li>
              <li><a href="#" className="hover:text-[#CDA435] transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-[#CDA435] transition-colors">About us</a></li>
              <li><a href="#" className="hover:text-[#CDA435] transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[#CDA435] transition-colors">Terms&conditions</a></li>
              <li><a href="#" className="hover:text-[#CDA435] transition-colors">Disclaimer</a></li>
            </ul>
          </div>

          {/* Column 3: Main */}
          <div>
            <h3 className="text-xl text-white font-semibold">Main</h3>
            <div className="w-16 h-1 bg-[#CDA435] mt-2 mb-6"></div>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-[#CDA435] transition-colors">Member Directory</a></li>
              <li><a href="#" className="hover:text-[#CDA435] transition-colors">Quotes</a></li>
              <li><a href="#" className="hover:text-[#CDA435] transition-colors">Blacklist Directory</a></li>
              <li><a href="#" className="hover:text-[#CDA435] transition-colors">Register Today</a></li>
              <li><a href="#" className="hover:text-[#CDA435] transition-colors">Login</a></li>
              <li><a href="#" className="hover:text-[#CDA435] transition-colors">Due Delight</a></li>
            </ul>
          </div>

          {/* Column 4: Follow Us On */}
          <div>
            <h3 className="text-xl text-white font-semibold">Follow Us On</h3>
            <div className="w-16 h-1 bg-[#CDA435] mt-2 mb-6"></div>
            <div className="flex space-x-3">
              <a href="#" className="w-9 h-9 flex items-center justify-center bg-gray-700 hover:bg-[#CDA435] text-white rounded transition-colors"><FaFacebookF /></a>
              <a href="#" className="w-9 h-9 flex items-center justify-center bg-gray-700 hover:bg-[#CDA435] text-white rounded transition-colors"><FaTwitter /></a>
              <a href="#" className="w-9 h-9 flex items-center justify-center bg-gray-700 hover:bg-[#CDA435] text-white rounded transition-colors"><FaLinkedinIn /></a>
              <a href="#" className="w-9 h-9 flex items-center justify-center bg-gray-700 hover:bg-[#CDA435] text-white rounded transition-colors"><FaYoutube /></a>
              <a href="#" className="w-9 h-9 flex items-center justify-center bg-gray-700 hover:bg-[#CDA435] text-white rounded transition-colors"><FaInstagram /></a>
            </div>
          </div>
        </div>
      </div>

      {/* --- LOWER FOOTER / COPYRIGHT SECTION --- */}
      {/* This div is now OUTSIDE the container, so it will be full-width */}
      <div className="relative mt-16 bg-[#171717] py-6 text-center text-gray-400">
        <p>2025 Copyright © dsolutionstech.in</p>
      </div>

      {/* Scroll to top button (remains absolutely positioned to the footer) */}
      <a href="#" className="absolute bottom-8 right-8 w-12 h-12 bg-[#CDA435] rounded-full flex items-center justify-center text-white text-xl shadow-lg hover:bg-yellow-500 transition-colors">
        <FaChevronUp />
      </a>
    </footer>
  );
};

export default Footer;