import React, { useState } from 'react';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';

// --- Reusable Sub-Components for each Tab ---

// 1. Personal Info Tab Content --- MODIFIED ---
const PersonalInfo = () => {
  const InfoRow = ({ label, value, isLink = false }) => (
    <div className="flex flex-col sm:flex-row py-4 border-b border-gray-200">
      <p className="w-full sm:w-1/3 font-semibold text-gray-700">{label}</p>
      <p className={`w-full sm:w-2/3 text-gray-600 ${isLink ? 'text-yellow-600 hover:underline' : ''}`}>
        {isLink ? <a href={`mailto:${value}`}>{value}</a> : value}
      </p>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-bold text-gray-800 border-b pb-4 mb-4">ABOUT ME</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        <div>
          <InfoRow label="Full Name" value="David Jhon" />
          <InfoRow label="Gender" value="Male" />
          <InfoRow label="Birth Date" value="April 12, 1990" />
          <InfoRow label="Marital Status" value="Single" />
          <InfoRow label="Location" value="London, UK" />
        </div>
        <div>
          <InfoRow label="Email" value="example@example.com" isLink={true} />
          <InfoRow label="Mobile Number" value="(4479) - 9876567" />
          <InfoRow label="Twitter" value="@test" />
          <InfoRow label="Skype" value="test.skype" />
          <InfoRow label="Website" value="www.example.com" isLink={true} />
        </div>
      </div>
      
      {/* --- MODIFICATION 1: Added Description Box --- */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Description About Me</h3>
        <hr className="mb-4"/>
        <p className="text-gray-600 leading-relaxed">
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aspernatur nostrum placeat quis ratione similique. A alias culpa debitis deserunt dicta earum eius excepturi, facere maiores quia quos saepe ullam ut!
        </p>
      </div>
      {/* --- END OF MODIFICATION --- */}
    </div>
  );
};

// 2. User Gallery Tab Content
const UserGallery = () => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-lg font-bold text-gray-800 mb-4">User Gallery</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-lg overflow-hidden shadow-sm">
          <img src={`https://picsum.photos/500/400?random=${i}`} alt={`Gallery item ${i + 1}`} className="w-full h-full object-cover" />
        </div>
      ))}
    </div>
  </div>
);

// 3. User Activity Tab Content --- MODIFIED ---
const UserActivity = () => {
    const TableHeader = ({ children }) => (
        <th className="p-3 text-left text-sm font-semibold text-gray-600 tracking-wider">
            <div className="flex items-center">
                <span>{children}</span>
                <div className="flex flex-col ml-auto"><FiChevronUp className="h-3 w-3 -mb-1 text-gray-400"/><FiChevronDown className="h-3 w-3 -mt-1 text-gray-400"/></div>
            </div>
        </th>
    );

    // --- MODIFICATION 2: Updated data to have 11 entries ---
    const fullActivityData = [
        { name: 'Airi Satou', position: 'Accountant', office: 'Tokyo', age: 33, startDate: '2008/11/28', salary: '$162,700' },
        { name: 'Angelica Ramos', position: 'Chief Executive Officer (CEO)', office: 'London', age: 47, startDate: '2009/10/09', salary: '$1,200,000' },
        { name: 'Ashton Cox', position: 'Junior Technical Author', office: 'San Francisco', age: 66, startDate: '2009/01/12', salary: '$86,000' },
        { name: 'Bradley Greer', position: 'Software Engineer', office: 'London', age: 41, startDate: '2012/10/13', salary: '$132,000' },
        { name: 'Brenden Wagner', position: 'Software Engineer', office: 'San Francisco', age: 28, startDate: '2011/06/07', salary: '$206,850' },
        { name: 'Bruno Nash', position: 'Software Engineer', office: 'London', age: 38, startDate: '2011/05/03', salary: '$163,500' },
        { name: 'Caesar Vance', position: 'Pre-Sales Support', office: 'New York', age: 21, startDate: '2011/12/12', salary: '$106,450' },
        { name: 'Cara Stevens', position: 'Sales Assistant', office: 'New York', age: 46, startDate: '2011/12/06', salary: '$145,600' },
        { name: 'Cedric Kelly', position: 'Senior Javascript Developer', office: 'Edinburgh', age: 22, startDate: '2012/03/29', salary: '$433,060' },
        { name: 'Charde Marshall', position: 'Regional Director', office: 'San Francisco', age: 36, startDate: '2008/10/16', salary: '$470,600' },
        { name: 'Colleen Hurst', position: 'Javascript Developer', office: 'San Francisco', age: 39, startDate: '2009/09/15', salary: '$205,500' },
    ];
    // We only show 10 items per page as per the screenshot
    const itemsToShow = fullActivityData.slice(0, 10);
    // --- END OF DATA MODIFICATION ---

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Left Sidebar */}
      <div className="flex-shrink-0 md:w-1/4 space-y-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="font-bold mb-3">John Doe</h3>
            <ul className="space-y-1">
                <li className="bg-[#D9B95B] text-white font-semibold p-2 rounded-md cursor-pointer">All Activities</li>
                <li className="p-2 rounded-md cursor-pointer hover:bg-gray-100">Recent Activities</li>
                <li className="p-2 rounded-md cursor-pointer hover:bg-gray-100">Favourites</li>
            </ul>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="font-bold mb-3">BUTTON GROUPS</h3>
            <ul className="space-y-3">
                <li className="flex justify-between items-center"><span className="text-gray-600">Project</span><span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">30</span></li>
                <li className="flex justify-between items-center"><span className="text-gray-600">Notes</span><span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full">20</span></li>
                <li className="flex justify-between items-center"><span className="text-gray-600">Activity</span><span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">100</span></li>
                <li className="flex justify-between items-center"><span className="text-gray-600">Schedule</span><span className="bg-pink-100 text-pink-700 text-xs font-bold px-2 py-1 rounded-full">50</span></li>
            </ul>
        </div>
      </div>
      {/* Main Content Table */}
      <div className="flex-grow bg-white p-6 rounded-lg shadow-md">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-[#D9B95B]">
                        <tr>
                            <TableHeader>Name</TableHeader><TableHeader>Position</TableHeader><TableHeader>Office</TableHeader><TableHeader>Age</TableHeader><TableHeader>Start Date</TableHeader><TableHeader>Salary</TableHeader>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {itemsToShow.map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50"><td className="p-3">{row.name}</td><td className="p-3">{row.position}</td><td className="p-3">{row.office}</td><td className="p-3">{row.age}</td><td className="p-3">{row.startDate}</td><td className="p-3">{row.salary}</td></tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* --- MODIFICATION 2: Updated Footer with Pagination --- */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-gray-600">
                <p>Showing 1 to {itemsToShow.length} of {fullActivityData.length} entries</p>
                <div className="flex items-center mt-2 sm:mt-0">
                    <button className="px-3 py-1 border border-[#D9B95B] text-[#D9B95B] rounded-l-md hover:bg-gray-50">Previous</button>
                    <button className="px-3 py-1 border-y border-[#D9B95B] bg-[#D9B95B] text-white">1</button>
                    <button className="px-3 py-1 border-y border-r border-[#D9B95B] text-[#D9B95B] hover:bg-gray-50">2</button>
                    <button className="px-3 py-1 border border-[#D9B95B] text-[#D9B95B] rounded-r-md hover:bg-gray-50">Next</button>
                </div>
            </div>
            {/* --- END OF MODIFICATION --- */}
      </div>
    </div>
  );
};

// 4. Setting Tab Content
const Setting = () => {
    const InputField = ({ label, name, type = 'text', value, placeholder }) => (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input type={type} id={name} name={name} defaultValue={value} placeholder={placeholder} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500" />
        </div>
    );
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <form className="space-y-6">
            <InputField label="Full Name" name="fullName" value="Johnathan Doe" />
            <InputField label="Email" name="email" type="email" value="johnathan@admin.com" />
            <InputField label="Password" name="password" type="password" value="***********" />
            <InputField label="Phone No" name="phone" value="123 456 7890" />
            <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea id="message" name="message" rows="5" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"></textarea>
            </div>
            <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Select Country</label>
                <select id="country" name="country" defaultValue="london" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500">
                    <option value="london">London</option><option value="usa">USA</option><option value="india">India</option>
                </select>
            </div>
            <button type="submit" className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700">Update Profile</button>
        </form>
    </div>
  );
};


// --- The Main Profile Page Component ---
const UserProfile = () => {
  const [activeTab, setActiveTab] = useState('personalInfo');

  const TabButton = ({ id, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-6 py-3 font-semibold text-sm rounded-t-lg focus:outline-none 
        ${activeTab === id ? 'bg-[#D9B95B] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* --- MODIFIED BANNER SECTION --- */}
        <div className="rounded-lg shadow-md overflow-hidden mb-6">
          
          {/* We have combined the two divs into one single div */}
          <div 
            className="h-56 bg-cover bg-center p-4 sm:p-6 flex flex-col sm:flex-row items-center sm:items-end"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1549880338-65ddcdfd017b?q=80&w=2070&auto-format&fit=crop')" }}
          >
            <img 
              src="https://net4.hsdemo.co.in/admin/assets/images/team/member2.jpg" 
              alt="Profile" 
              className="w-32 h-32  border-4 border-white object-cover" 
            />
            <div className="text-center sm:text-left sm:ml-6 mt-4 sm:mt-0">
              {/* Added text-white and a shadow for readability */}
              <h1 
                className="text-2xl font-bold text-white" 
                style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.6)' }}
              >
                Jhon Roy
              </h1>
              <p 
                className="text-gray-200" 
                style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.6)' }}
              >
                Web Developer
              </p>
            </div>
            <div className="flex space-x-2 mt-4 sm:mt-0 sm:ml-auto">
              {/* Updated button style to look better on an image */}
              <button className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-800 font-semibold rounded-md text-sm hover:bg-white">Follow</button>
              <button className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-800 font-semibold rounded-md text-sm hover:bg-white">Message</button>
            </div>
          </div>
          
          {/* Tab Navigation (No changes here) */}
          <nav className="bg-white border-t border-gray-200 mt-2 flex">
            <TabButton id="personalInfo" label="Personal Info" />
            <TabButton id="userGallery" label="User's Gallery" />
            <TabButton id="userActivity" label="User Activity" />
            <TabButton id="setting" label="Setting" />
          </nav>
        </div>
        {/* --- END OF MODIFIED SECTION --- */}

        {/* Tab Content Area (No changes here) */}
        <div>
          {activeTab === 'personalInfo' && <PersonalInfo />}
          {activeTab === 'userGallery' && <UserGallery />}
          {activeTab === 'userActivity' && <UserActivity />}
          {activeTab === 'setting' && <Setting />}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;