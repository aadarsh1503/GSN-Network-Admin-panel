import React from 'react';
import { FiFilter, FiEdit, FiEye } from 'react-icons/fi';
import { FaSort } from 'react-icons/fa';

const AllCompanyQuotesList = () => {
  // Mock data for the table row to match the image
  const quotes = [
    {
      srNo: 1,
      shippingMode: 'Air',
      arrivalDate: '25 January 2024',
      createdDate: '20 January 2024',
      approved: true,
    },
    // You can add more quote objects here to test pagination and sorting
  ];

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Filter Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-end">
            <div className="w-full">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="text"
                id="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div className="w-full">
              <label htmlFor="quote-type" className="block text-sm font-medium text-gray-700 mb-1">
                Quote Type
              </label>
              <select
                id="quote-type"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 bg-white"
              >
                <option>All</option>
                <option>Type 1</option>
                <option>Type 2</option>
              </select>
            </div>
            <div className="w-full sm:col-start-1 lg:col-start-3 xl:col-start-3">
               <button className="w-full sm:w-auto flex items-center justify-center px-6 py-2 bg-[#d4b46a] text-white font-semibold rounded-md shadow-sm hover:bg-[#c8a860] transition-colors">
                <FiFilter className="mr-2" />
                Filter
              </button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">All Company Quotes List</h2>
          
          {/* Table Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Show</span>
              <select className="border border-gray-300 rounded-md px-2 py-1 bg-white">
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
              <span>entries</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Search:</span>
              <input
                type="text"
                className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-1.5"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="bg-[#e6c98c] text-gray-700 uppercase text-xs">
                <tr>
                  <th scope="col" className="px-6 py-3 font-semibold">
                    <div className="flex items-center">
                      Sr.No
                      <a href="#"><FaSort className="ml-1.5 h-3 w-3 text-gray-500" /></a>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 font-semibold">
                    <div className="flex items-center">
                      Shipping Mode
                      <a href="#"><FaSort className="ml-1.5 h-3 w-3 text-gray-500" /></a>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 font-semibold">
                    <div className="flex items-center">
                      Arrival Date
                      <a href="#"><FaSort className="ml-1.5 h-3 w-3 text-gray-500" /></a>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 font-semibold">
                    <div className="flex items-center">
                      Created Date
                      <a href="#"><FaSort className="ml-1.5 h-3 w-3 text-gray-500" /></a>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 font-semibold">
                    <div className="flex items-center">
                      Approval
                      <a href="#"><FaSort className="ml-1.5 h-3 w-3 text-gray-500" /></a>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 font-semibold">
                    <div className="flex items-center">
                      Action
                      <a href="#"><FaSort className="ml-1.5 h-3 w-3 text-gray-500" /></a>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote) => (
                  <tr key={quote.srNo} className="bg-white border-b">
                    <td className="px-6 py-4">{quote.srNo}</td>
                    <td className="px-6 py-4">{quote.shippingMode}</td>
                    <td className="px-6 py-4">{quote.arrivalDate}</td>
                    <td className="px-6 py-4">{quote.createdDate}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={quote.approved}
                          readOnly
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                         <input
                          type="checkbox"
                          checked={!quote.approved}
                          readOnly
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600">
                          <FiEdit />
                        </button>
                        <button className="p-2 bg-pink-600 text-white rounded-md hover:bg-pink-700">
                          <FiEye />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-gray-600 gap-4">
            <div>
              Showing 1 to 1 of 1 entries
            </div>
            <div className="flex items-center">
              <button className="px-3 py-1 border border-gray-300 rounded-l-md hover:bg-gray-100 disabled:opacity-50" disabled>
                Previous
              </button>
              <button className="px-4 py-1 border-t border-b text-white bg-[#d4b46a]">
                1
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded-r-md hover:bg-gray-100">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllCompanyQuotesList;