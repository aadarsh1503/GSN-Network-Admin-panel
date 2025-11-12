import React from 'react';

const StatsCard = ({ title, value, icon, iconBgColor }) => {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm flex justify-between items-center">
      <div>
        <p className="text-gray-500 text-sm font-medium uppercase">{title}</p>
        <p className="text-2xl font-bold text-amber-500">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${iconBgColor}`}>
        {icon}
      </div>
    </div>
  );
};

export default StatsCard;