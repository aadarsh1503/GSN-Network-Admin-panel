import React from 'react';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';

// --- Reusable Component for Table Headers ---
const TableHeader = ({ children }) => (
    <th className="p-3 text-left text-sm font-semibold text-gray-600 tracking-wider">
        <div className="flex items-center">
            <span>{children}</span>
            <div className="flex flex-col ml-auto">
                <FiChevronUp className="h-3 w-3 -mb-1 text-gray-400"/>
                <FiChevronDown className="h-3 w-3 -mt-1 text-gray-400"/>
            </div>
        </div>
    </th>
);

// --- Dummy Data as requested (replace with your API data) ---
// If you want to see the empty state, just make this array empty: const contactsData = [];
const contactsData = [
  { id: 1, name: 'John Doe', email: 'john.doe@example.com', phone: '123-456-7890', subject: 'Inquiry about service', message: 'Hello, I would like to know more about your services.' },
  { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', phone: '987-654-3210', subject: 'Support Request', message: 'I need help with my account.' },
  { id: 3, name: 'Peter Jones', email: 'peter.jones@example.com', phone: '555-555-5555', subject: 'Feedback', message: 'Great product! Just some feedback on a feature...' },
];

const ContactsList = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Contacts List</h1>

        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <div className="flex items-center text-sm text-gray-600">
            <span>Show</span>
            <select className="mx-2 border border-gray-300 rounded-md p-1">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <span>entries</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <label htmlFor="search" className="mr-2">Search:</label>
            <input 
              id="search"
              type="text" 
              className="border border-gray-300 rounded-md p-1.5"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#D9B95B]">
              <tr>
                <TableHeader>Sr. No</TableHeader>
                <TableHeader>Name</TableHeader>
                <TableHeader>Email</TableHeader>
                <TableHeader>Phone</TableHeader>
                <TableHeader>Subject</TableHeader>
                <TableHeader>Message</TableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contactsData.length > 0 ? (
                contactsData.map((contact, index) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="p-3 whitespace-nowrap text-gray-700">{index + 1}</td>
                    <td className="p-3 whitespace-nowrap text-gray-700">{contact.name}</td>
                    <td className="p-3 whitespace-nowrap text-gray-700">{contact.email}</td>
                    <td className="p-3 whitespace-nowrap text-gray-700">{contact.phone}</td>
                    <td className="p-3 whitespace-nowrap text-gray-700">{contact.subject}</td>
                    <td className="p-3 whitespace-nowrap text-gray-700 truncate max-w-xs">{contact.message}</td>
                  </tr>
                ))
              ) : (
                // This row is displayed only when contactsData is empty
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-500">
                    No data available in table
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-gray-600">
            <p>Showing {contactsData.length > 0 ? 1 : 0} to {contactsData.length} of {contactsData.length} entries</p>
            <div className="flex items-center mt-2 sm:mt-0">
                <button className="px-3 py-1 border border-[#D9B95B] text-[#D9B95B] rounded-l-md hover:bg-gray-50">Previous</button>
                <button className="px-3 py-1 border border-[#D9B95B] text-[#D9B95B] rounded-r-md hover:bg-gray-50">Next</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ContactsList;