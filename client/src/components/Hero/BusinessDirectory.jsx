import React from 'react';
import { BsCheckCircleFill } from 'react-icons/bs';
import { FaArrowRight } from 'react-icons/fa';

const BusinessDirectory = () => {
  return (
    <section className="bg-[#f7f7f7] py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-x-16 gap-y-20 items-center">
        
        {/* Left Column: Image Section */}
        <div className="relative w-full h-full flex items-center justify-center">
          
          {/* Rocket Icon: Absolutely positioned relative to the parent column */}
          <div className="absolute top-[-2rem] left-[-2rem] z-10 flex items-center justify-center bg-white rounded-3xl shadow-2xl w-40 h-40 animate-bounce-slow">
  <img 
    src="https://net4.hsdemo.co.in/assets/home/images/shapes/about-shape-1-1.png" 
    alt="Rocket Icon" 
    className="w-24 h-auto"
  />

  <style jsx>{`
    @keyframes bounce-slow {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-15px);
      }
    }
    .animate-bounce-slow {
      animation: bounce-slow 2s ease-in-out infinite;
    }
  `}</style>
</div>


          <div className="relative">
            {/* The image container with the custom shape.
                This uses different border-radius values on each corner to create the "blob" effect.
                'overflow-hidden' is crucial to ensure the inner <img> is clipped to this shape. */}
      
<div className="relative max-w-lg mx-auto p-1 bg-gray-200 rounded-tl-[60px] rounded-tr-[180px] rounded-bl-[180px] rounded-br-[60px]">
 
  <div className="p-2 bg-white rounded-tl-[60px] rounded-tr-[180px] rounded-bl-[180px] rounded-br-[60px]">


    <div className="relative rounded-tl-[60px] rounded-tr-[180px] rounded-bl-[180px] rounded-br-[60px] overflow-hidden shadow-2xl">
      <img 
        src="https://net4.hsdemo.co.in/img/banner2.png" 
        alt="Cargo plane over shipping containers" 
        className="w-full h-full object-cover block"
      />
    </div>

  </div>
</div>
            {/* Decorative purple line at the bottom */}
            <div className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 w-32 h-2 bg-[#6c47ff] rounded-full"></div>
          </div>
        </div>

        {/* Right Column: Content Section */}
        <div className="relative">
          {/* Decorative purple line on the left */}
          <div className="absolute left-[-8rem] top-[12rem] w-2 h-28 bg-[#6c47ff] rounded-full hidden lg:block"></div>

          <div>
            <p className="text-[#008001] font-bold tracking-widest text-sm mb-2">
              DIRECTORY
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-[#212121] leading-tight mb-5">
            Directory Of Business <br />Owners
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              Global directory of over 28,000 Freight Forwarders ready to service your freight and cargo transportation requirements.
            </p>
            <a href="#" className="flex items-center text-[#008001] font-bold tracking-wider text-sm mb-12 hover:underline">
              FREE MEMBERSHIP SIGN UP 
              <FaArrowRight className="ml-2" />
            </a>

            <h3 className="font-bold text-xl text-[#212121] mb-5">
              Latest Premium Members
            </h3>

            <div className="space-y-3">
              {/* Member Item 1 */}
              <div className="flex items-center space-x-3">
                <BsCheckCircleFill className="text-[#008001] text-2xl flex-shrink-0" />
                <div className="flex items-center space-x-3 bg-white border border-gray-200 rounded-lg px-4 py-2 w-full shadow-sm">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/2c/Flag_of_Bahrain.svg" alt="India flag" className="w-6" />
                  <span className="text-gray-800">Riyadh Shaheen</span>
                </div>
              </div>

              {/* Member Item 2 */}
              <div className="flex items-center space-x-3">
                <BsCheckCircleFill className="text-[#008001] text-2xl flex-shrink-0" />
                <div className="flex items-center space-x-3 bg-white border border-gray-200 rounded-lg px-4 py-2 w-full shadow-sm">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/2c/Flag_of_Bahrain.svg" alt="Australia flag" className="w-6" />
                  <span className="text-gray-800">company</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <BsCheckCircleFill className="text-[#008001] text-2xl flex-shrink-0" />
                <div className="flex items-center space-x-3 bg-white border border-gray-200 rounded-lg px-4 py-2 w-full shadow-sm">
                  <img src="data:image/jpeg;base64,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" alt="Australia flag" className="w-6" />
                  <span className="text-gray-800">Network Pro</span>
                </div>
              </div>
            </div>

            <button className="mt-10 relative overflow-hidden bg-black text-white font-bold py-4 px-10 rounded-full shadow-lg transition-transform duration-500 ease-in-out hover:scale-105 hover:-translate-y-1 group">
  <span className="relative z-10">Search the Freightnet Directory</span>
  
  {/* Animated gradient overlay */}
  <span className="absolute inset-0 bg-gradient-to-r from-[#008001] via-[#00ff6a] to-[#008001] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700 ease-in-out opacity-80"></span>
</button>

          </div>
        </div>
      </div>
    </section>
  );
};

export default BusinessDirectory;