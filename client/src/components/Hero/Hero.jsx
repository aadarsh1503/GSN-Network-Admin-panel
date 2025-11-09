import React from 'react';
import FeaturesSection from '../FeaturesSection/FeaturesSection';
import DirectorySection from './DirectorySection';
import BusinessDirectory from './BusinessDirectory';

// A relevant placeholder image for the background. 
// You should replace this with your own image URL or import.
const heroBgImage = 'https://avatars.mds.yandex.net/get-altay/15386533/2a000001945dfe95a7a082b1d6c7a4ca74ee/orig';

/**
 * A React component that displays a call-to-action section with a background image.
 * Styled with Tailwind CSS for a modern, professional look.
 */
const Hero = () => {
  return (
    <>
      {/* Main container is now a relative parent for the background layers */}
      <div className="relative min-h-screen flex items-center justify-center font-sans p-4">
        
        {/* Layer 1: Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBgImage})` }}
        ></div>

        {/* Layer 2: Dark Overlay */}
        {/* This sits on top of the image to make the text readable. */}
        <div className="absolute inset-0 bg-black opacity-20"></div>

        {/* Content Layer (made relative to sit on top of the overlays) */}
        <div className="relative text-center">

          {/* Sub-heading text block */}
          <div className="text-white font-light">
            <p className="text-2xl font-semibold tracking-wide">
              Request a Freight quote from our Premium Qualified Members.
            </p>
            <p className="text-2xl font-semibold tracking-wide mt-2">
              Receive multiple quotations and compare prices.
            </p>
          </div>

          {/* Main Heading */}
          <h1 className="text-[80px] font-bold text-white my-6 tracking-tight">
            Free Freight Quotes
          </h1>

          {/* Call to Action Button */}
          <button 
            className="bg-[#bca142] text-white font-semibold text-lg px-10 py-4 rounded-md 
                       hover:bg-[#a98f3b] transition-colors duration-200"
          >
            Submit a FREE Freight Quote Request
          </button>
          
        </div>
      </div>
      <FeaturesSection />
      <DirectorySection />
      <BusinessDirectory />
    </>
  );
};

export default Hero;