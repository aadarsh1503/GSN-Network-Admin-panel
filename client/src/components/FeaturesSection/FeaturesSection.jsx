import React from 'react';
import { 
  AiOutlineGlobal, 
  AiOutlineSearch, 
  AiOutlineTeam, 
  AiOutlineFlag, 
  AiOutlineCloudUpload, 
  AiOutlineApartment 
} from 'react-icons/ai';

// Data for the feature cards to keep the JSX clean and scalable
const featuresData = [
  {
    icon: <AiOutlineGlobal size={48} />,
    title: 'Global Freight Network',
    description: 'Discover and connect with a vast network of 28,000+ freight forwarders worldwide to meet your diverse cargo requirements.',
  },
  {
    icon: <AiOutlineSearch size={48} />,
    title: 'Comprehensive Search',
    description: 'Effortlessly locate the ideal freight partner for your specific logistics and cargo needs through our advanced search filters.',
  },
  {
    icon: <AiOutlineTeam size={48} />,
    title: 'Verified Partners',
    description: 'Access a reliable database of freight forwarders to ensure consistent and high-quality service for your shipping needs.',
  },
  {
    icon: <AiOutlineFlag size={48} />,
    title: 'Region-Specific Solutions',
    description: 'Easily find freight forwarders based on location or service specialty to suit your regional shipping demands.',
  },
  {
    icon: <AiOutlineCloudUpload size={48} />,
    title: 'Tailored Cargo Expertise',
    description: 'Identify partners with the expertise to handle your unique cargo requirements, ensuring safe and efficient delivery.',
  },
  {
    icon: <AiOutlineApartment size={48} />, // A good substitute for the custom network icon
    title: 'Collaborative Connections',
    description: 'Build long-term partnerships with freight forwarders who align with your logistics strategies and goals.',
  },
];

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-white p-8 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex flex-col items-center text-center">
    <div className="w-24 h-24 bg-[#CDA435] rounded-full flex items-center justify-center mb-6">
      <span className="text-white">{icon}</span>
    </div>
    <h3 className="text-xl font-bold text-gray-800 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

const FeaturesSection = () => {
  return (
    <section className="bg-[#f8f8f8] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-lg text-gray-600">Explore some of the best features</p>
          <h2 className="mt-2 text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
            What are you interested in?
          </h2>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {featuresData.map((feature, index) => (
            <FeatureCard 
              key={index} 
              icon={feature.icon} 
              title={feature.title} 
              description={feature.description} 
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;