import React from 'react';
import { BsCheckCircleFill } from 'react-icons/bs';
import { FaArrowRight } from 'react-icons/fa';

const DirectorySection = () => {
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
        src="https://net4.hsdemo.co.in/img/banner1.png" 
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
          <div className="absolute left-[-8rem] top-[8rem] w-2 h-28 bg-[#6c47ff] rounded-full hidden lg:block"></div>

          <div>
            <p className="text-[#008001] font-bold tracking-widest text-sm mb-2">
              DIRECTORY
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-[#212121] leading-tight mb-5">
              Directory of Freight<br />Forwarders
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
                  <img src="data:image/jpeg;base64,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" alt="India flag" className="w-6" />
                  <span className="text-gray-800">johndue1</span>
                </div>
              </div>

              {/* Member Item 2 */}
              <div className="flex items-center space-x-3">
                <BsCheckCircleFill className="text-[#008001] text-2xl flex-shrink-0" />
                <div className="flex items-center space-x-3 bg-white border border-gray-200 rounded-lg px-4 py-2 w-full shadow-sm">
                  <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQQAAACCCAMAAACXSEZJAAAAsVBMVEUAJH3////MFCvKAB3MECnMGSjIAAAAIXwAHXvLACEAAHMAGHnJAAzvycp2fapud6bacnrKzt4VJHsAEngaKn8ADnfceX/KABb19vkACHYAAG789PX13t+jp8Sws8ywuNDtsrPXYmo5RouGi7JFU5Tfio7eg4j56uvCxdfz09Xrubvs7fPVWGDZaXGTmLooOIZjbKDV3OnPLTvQOEQdMYNPWpflmZrTTVLooqXSQk0vP4lb9w+rAAAHKUlEQVR4nO2de1+yPBiAuYGX4cTygEEI5SHPecDUrO//wV4m9uQJ2Iak1K4/CvtxGJf3YGz3SOrCPuM7pyYlgnSybrkg/8MoBX+oYIpNcdGzARpddbtdQXsdLlHyZhmjaN3Gvga7k6yBWwLC+lOwYqOnKaGClgtgXl+CLLNr4JRwouDVJfu5CQnsGrgkIIxOo+BGJGgFdg0cEiIV3IQE95VdA7OEs9eCG5IAwK6BUUJMFNyIhAHEacBnNTBJQFiKUwCenu0J0oDbFWYNDBIQrhIF/UgFtcfszzEZnV0DtQSEzSQF168LIV8aWl8aegkaKCV8KXi4fQWEk2iI10AlIVDwnCMFhEDDgDoaKCScRMHk5hUQGCpFooScKiBQR0OChJOKkB8FBB1/0miIlYDw8mejAJkX3Z1EGQ0xEgIFPxwFqD2l6AJhhEJDpISfVyBJtemYojOHmeRKgc9LcH5egSQ5PmTTN4V2Gib/NPQPNZyV4F/jjoBm4KauD8Xz1J3ZLhqUQqGgGNrDgYazEoiCsmZsNzhSYE8xrkUcKl35a9Nhz09bH+4imXfGREPvYUt5MkqWMJqUw7V7h1FQub+PPg5nwZG+xfG7KpjF7TJ3pB1/v/SciwQe+PoTUHv1QljBQnO9drjMayG3EmY+ALlgDw1lN2xgz3m7JvIqQUJOB9ZaALlwa9p7Y/DIfXnJrQRJevwcu4vtrUjVmnCH+W8+CjfqtwNZLXDvplDlLruOn7dfhfrWH8/q3LuRJJUb+QD+3fBLIC2ljRLs4wNwqp5K+cqkkoAQvCnyu6X171I1N3ItoXjXD66I0NU2NIPBv1QCrqzXMH2xhx9QTNMmz7MEVAPXbuPi46ABqepDniUU72BArogId6iSI36lBDz4ahzUP/1qivqQZwlo9u8ZWtdn/A5yLUG6VAdFriVcigu1GFPs5gYk/MfN4ffJv5vsJCDa6nL1p0g7syQNtPqk3PXVJWSXqVLzaHtgf7EEZ0zbA/t7JaAZAOVN9D6Secc+KGypHDIpDxMlNLqtSbj2mvQDVu7n0cfJRgHpjC8NO3T1IXLcYTsYt6fgQytsBxSUDVUklN41i2xgKUSDPa1lNO5wDr1OcPxe13e2i1w9LrvxyL1TetNIu0C1VKIgYgSq8nSwzTDMe1FDDeAh7hEo6lvdrvRzbwsUFhD8mnoeRzd0pAJDbkLsWOQsQoPVDTXw9YXqK8aTqHnQaI5KG8tojkZBkafM/Y+7jJVvRscK4kalozQoKTTUvQHjczJe2SVDs2TZ0qyh/cL6lH2i4DsKNkCXn3BxDXhssyY7FmsVaAXHLUxgUGe86uj4JUpBE9gyVaIrhcSoQW83YMVaqZHz1DdUVWt4DuPRjhWcVoTdEZJylhKigU1DcKtrPjP3G2F/rb1/sPbAJigYs2WvXUQD2uKMH15tHC5TywuKqPQAHhbAUJOoo4BKQowGZVcpqoka0NIkJ623Qba29QGhKnX3Ua3jjmA1h2b/nvaSwBAFlBIuoEFfjcEOgKFhjMIlm/qMcAUqxWJN8oHyzsKogCG3OUrDrlKY8RqK1QqUF29vC1WVg5+vDX9Gm5eDEEzJzhGeAk0jgVkBU5Z7QjTEayCnsNYKKhnw1brg0V9P9flqVxg8p7izsCtgnO+QqCG+dLb7RiQsSvaK5Tqv66dL0Rw2kEeLZAXMM18SNMQWUsf2WgkC4QGyeNL64qyCRZwCjjlQZpyG2P4EtIRFgeTDQTvDaUL7CgwqBVyz4ZZelIZ+bCpmcKvTFm7/Qyt5abIwEjhREFaEu2gFnPMij6OhtdMQn6mC/e4EnjzoTTJJ3t1xNgpiFXDPkDXPRUP8uAMyoQT3mDwVAm3XMQfsClLMlT7W0CL3vzgJtQ74ZlCaol7h6BWgJlRAMBYjKgXfEr5HkahnzR9pcFuGGicB+7vGAcIdP7vJg4GC8MukjIJtiU4iwaJ/f4Lp2YfREHfVN78bB48vS4rT4cNB1ZDlzDTNOl27FAWrmtV9yB/o+s4R1s09lvFVXT+7mB1MT6rH67I856JDWMooEAgEAoFAIBAIBAKBQCAQCAQCgUAgyBoxfENmuAgL+irLHJacUPeyzGHJCc44yxyWfIDaMPzz9aHmlcp/vj44454Ff/X+oD9uwTNQteHUCT9d/j2lN40+f356eg7wh4bSs8li8HmaYervLVLvAGyaAa2CuiC/Ny4M/lzuT/1z7MqaZRW2c8yMlK+gyys6foIHLXyhh5X2FXT5Bc+hJBMLCpkRcgP/LOMq1D9hQSRo7tS5dlmuRq3jGrJlqMo69Qt78wv215a2cVVrQfu6iN8HMkGW3fEAJlqf8nURv49ix23BM3buoNn9s/UBVxpwH5x8fTluAP+rq3MNksIZIaTJ4KV7IWN+KXa+p4vi+eAm/qHUz7PcayP+zTgQCAQCgUAgEAgEAoFAcC3+B8o49JDvcpQxAAAAAElFTkSuQmCC" alt="Australia flag" className="w-6" />
                  <span className="text-gray-800">company logistics</span>
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

export default DirectorySection;