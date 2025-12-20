import React from 'react';

const Invoices = () => {
  // In a real application, you would get your invoices data here.
  // For example: const invoices = []; or fetched from an API.
  const invoices = []; // Keeping it empty to show the message

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
        Invoices
      </h2>

      {/* 
        This is where you would add logic.
        If the invoices array is empty, show the message.
        Otherwise, map over the array and render a table of invoices.
      */}
      {invoices.length === 0 ? (
        // This is the empty state message from your screenshot
        <div className="text-gray-600">
          No Services Rendered: Invoice is Empty
        </div>
      ) : (
        <div>
          {/* This is where your table of invoices would go */}
          <p>Your list of invoices would be displayed here.</p>
        </div>
      )}
    </div>
  );
};

export default Invoices;