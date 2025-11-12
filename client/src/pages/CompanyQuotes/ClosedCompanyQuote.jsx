import React from 'react';
import { FaSort } from 'react-icons/fa';

const ClosedCompanyQuote = () => {
  // Dummy data to populate the table, matching the provided image
  const closedQuotes = [
    {
      srNo: 1,
      shippingMode: 'Air',
      departureCountry: 'Andorra',
      departureState: 'Les Escaldes',
      departureType: 'Commercial address',
      arrivalCountry: 'Aruba',
      arrivalState: '', // This column is empty in the image
      arrivalType: 'Commercial address',
      arrivalDate: '2024-01-25\n00:00:00',
      productDescription: '100',
      packageType: 'Pallet ISO\n43.30 x\n43.30',
      incoterms: 'CIF',
      quantity: 10,
      weight: '10Tons',
      size: 'L10*W10*H10 inches',
      additionalItems: 'stackable,',
      additionalNote: 'testing',
    },
    // You can add more quote objects here to test the component
  ];

  // Reusable component for table headers with sorting icons
  const TableHeader = ({ children }) => (
    <th scope="col" className="px-4 py-3 font-semibold">
      <div className="flex items-center">
        {children}
        <a href="#"><FaSort className="ml-1.5 h-3 w-3 text-gray-400" /></a>
      </div>
    </th>
  );
  
  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Closed Quotes List</h2>
        
        {/* Table Controls: Show entries & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Show</span>
            <select className="border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-yellow-500">
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
              className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-yellow-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="bg-[#e6c98c] text-gray-700 uppercase text-xs whitespace-nowrap">
              <tr>
                <TableHeader>Sr.No</TableHeader>
                <TableHeader>Shipping Mode</TableHeader>
                <TableHeader>Departure Country</TableHeader>
                <TableHeader>Departure State</TableHeader>
                <TableHeader>Departure Type</TableHeader>
                <TableHeader>Arrival Country</TableHeader>
                <TableHeader>Arrival State</TableHeader>
                <TableHeader>Arrival Type</TableHeader>
                <TableHeader>Arrival Date</TableHeader>
                <TableHeader>Product Description</TableHeader>
                <TableHeader>Package Type</TableHeader>
                <TableHeader>Incoterms</TableHeader>
                <TableHeader>Quantity</TableHeader>
                <TableHeader>Weight</TableHeader>
                <TableHeader>Size</TableHeader>
                <TableHeader>Additional Items</TableHeader>
                <TableHeader>Additional Note</TableHeader>
              </tr>
            </thead>
            <tbody>
              {closedQuotes.map((quote) => (
                <tr key={quote.srNo} className="bg-white border-b">
                  <td className="px-4 py-4">{quote.srNo}</td>
                  <td className="px-4 py-4">{quote.shippingMode}</td>
                  <td className="px-4 py-4">{quote.departureCountry}</td>
                  <td className="px-4 py-4">{quote.departureState}</td>
                  <td className="px-4 py-4">{quote.departureType}</td>
                  <td className="px-4 py-4">{quote.arrivalCountry}</td>
                  <td className="px-4 py-4">{quote.arrivalState}</td>
                  <td className="px-4 py-4">{quote.arrivalType}</td>
                  <td className="px-4 py-4 whitespace-pre-line">{quote.arrivalDate}</td>
                  <td className="px-4 py-4">{quote.productDescription}</td>
                  <td className="px-4 py-4 whitespace-pre-line">{quote.packageType}</td>
                  <td className="px-4 py-4">{quote.incoterms}</td>
                  <td className="px-4 py-4">{quote.quantity}</td>
                  <td className="px-4 py-4">{quote.weight}</td>
                  <td className="px-4 py-4">{quote.size}</td>
                  <td className="px-4 py-4">{quote.additionalItems}</td>
                  <td className="px-4 py-4">{quote.additionalNote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer: Entry count & Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-gray-600 gap-4">
          <div>
            Showing 1 to 1 of 1 entries
          </div>
          <div className="flex items-center">
            <button className="px-3 py-1 border border-[#d4b46a] text-gray-400 rounded-l-md" disabled>
              Previous
            </button>
            <button className="px-4 py-1 border-t border-b border-[#d4b46a] text-white bg-[#d4b46a]">
              1
            </button>
            <button className="px-3 py-1 border border-[#d4b46a] text-[#d4b46a] rounded-r-md hover:bg-gray-100">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClosedCompanyQuote;