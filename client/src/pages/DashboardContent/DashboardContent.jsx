import React from 'react';

import { FiBarChart2, FiBriefcase, FiDollarSign, FiBox, FiArchive, FiMoreVertical } from 'react-icons/fi';
import StatsCard from '../StatsCard/StatsCard';
import { FaCube } from 'react-icons/fa';

// A simple placeholder for the line chart
const ProductFeedChart = () => (
    <div className="bg-white p-6 rounded-xl shadow-sm h-full">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">PRODUCT FEED DATA</h3>
            <FiMoreVertical className="text-gray-400" />
        </div>
        <div className="relative h-72">
            <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                <path d="M0,100 C50,80 100,120 150,100 C200,80 250,60 300,90 C350,120 400,50 450,80 L500,70 L500,200 L0,200 Z" className="fill-purple-100" />
                <path d="M0,100 C50,80 100,120 150,100 C200,80 250,60 300,90 C350,120 400,50 450,80 L500,70" fill="none" className="stroke-purple-500" strokeWidth="2" />
            </svg>
            <div className="absolute top-0 left-0 h-full flex flex-col justify-between text-xs text-gray-500 py-2">
                <span>$6400</span><span>$6380</span><span>$6360</span><span>$6340</span><span>$6320</span>
            </div>
        </div>
    </div>
);

// A simple placeholder for the donut chart
const AccountRetentionChart = () => (
    <div className="bg-white p-6 rounded-xl shadow-sm h-full">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">WORKING PROJECT REPORT</h3>
            <FiMoreVertical className="text-gray-400" />
        </div>
        <div>
            <h4 className="font-semibold text-gray-700">Account Retention</h4>
            <p className="text-sm text-gray-500">Number of customers with active subscription</p>
        </div>
        <div className="flex items-center justify-center mt-6">
            <div className="w-1/2">
                <ul>
                    <li className="flex items-center mb-2"><span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span><span className="text-gray-600">New</span></li>
                    <li className="flex items-center mb-2"><span className="w-3 h-3 bg-teal-400 rounded-full mr-2"></span><span className="text-gray-600">Old</span></li>
                    <li className="flex items-center"><span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span><span className="text-gray-600">Others</span></li>
                </ul>
            </div>
            <div className="w-1/2 flex items-center justify-center">
                <svg className="w-32 h-32" viewBox="0 0 36 36">
                    <path className="stroke-current text-gray-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="4" />
                    <path className="stroke-current text-purple-500" strokeDasharray="60, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="4" strokeLinecap="round" />
                    <path className="stroke-current text-teal-400" strokeDasharray="40, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="4" strokeLinecap="round" />
                    <path className="stroke-current text-blue-500" strokeDasharray="25, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="4" strokeLinecap="round" />
                </svg>
            </div>
        </div>
    </div>
);


const Dashboard = () => {
  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-6">
        <div className="lg:col-span-1 xl:col-span-1"><StatsCard title="NO OF USER" value="10" icon={<FiBarChart2 className="text-yellow-600" />} iconBgColor="bg-yellow-100" /></div>
        <div className="lg:col-span-1 xl:col-span-1"><StatsCard title="NO OF BUSINESS" value="3" icon={<FiBriefcase className="text-green-600" />} iconBgColor="bg-green-100" /></div>
        <div className="lg:col-span-1 xl:col-span-1"><StatsCard title="NO OF LOGISTICS" value="3" icon={<FiDollarSign className="text-pink-600" />} iconBgColor="bg-pink-100" /></div>
        <div className="lg:col-span-1 xl:col-span-1"><StatsCard title="NO OF QUOTES" value="13" icon={<FiBox className="text-orange-600" />} iconBgColor="bg-orange-100" /></div>
        <div className="lg:col-span-1 xl:col-span-1"><StatsCard title="NO OF COMPANY QUOTES" value="1" icon={<FaCube className="text-cyan-600" />} iconBgColor="bg-cyan-100" /></div>
        <div className="lg:col-span-1 xl:col-span-1"><StatsCard title="tbd" value="0" icon={<FiArchive className="text-purple-600" />} iconBgColor="bg-purple-100" /></div>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><ProductFeedChart /></div>
        <div><AccountRetentionChart /></div>
      </div>
    </div>
  );
};

export default Dashboard;