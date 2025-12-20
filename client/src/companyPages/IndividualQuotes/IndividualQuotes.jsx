import React from 'react';

const IndividualQuotes = () => {
  // In a real application, you would fetch your quotes data here.
  // We'll keep the array empty to display the message from the screenshot.
  const quotes = []; 

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
        My Individual Quotes
      </h2>

      {/* 
        This is where the conditional logic lives.
        If the quotes array is empty, it shows the message.
        Otherwise, it would render the list of quotes.
      */}
      {quotes.length === 0 ? (
        // The empty state message, exactly as shown in the image
        <div className="text-gray-600">
          You Not Requested Any quotes
        </div>
      ) : (
        <div>
          {/* This is where your table or list of quotes would be rendered */}
          <p>Your list of individual quotes would be displayed here.</p>
        </div>
      )}
    </div>
  );
};

export default IndividualQuotes;