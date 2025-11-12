import React from 'react';
import { FiX, FiCornerUpLeft, FiTrash2 } from 'react-icons/fi';

const ReplyTicket = ({ ticketId, onClose }) => {
  // In a real application, you would fetch ticket details based on the ticketId prop.
  // For this example, we'll use static data that matches the screenshot.
  const ticket = {
    id: '17057236529313',
    subject: 'Modification of Downlines',
    reply: {
      author: 'Admin',
      date: 'Saturday, 20th January 2024 @ 09:37',
      message: 'safscfsd'
    }
  };

  const handleReplySubmit = (e) => {
    e.preventDefault();
    console.log('Submitting reply...');
    // Add your API call logic for submitting a reply here
  };

  const handleDeleteReply = () => {
    console.log('Deleting reply...');
    // Add your API call logic for deleting a reply here
  };

  const handleCloseTicket = () => {
    console.log('Closing ticket...');
     // Add your API call logic for closing the ticket here
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Back button to return to the list view */}
      <div className="max-w-6xl mx-auto">
        <button onClick={onClose} className="mb-4 text-sm text-blue-600 hover:underline">
            &larr; Back to All Tickets
        </button>
      </div>
      
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Reply Ticket</h1>

        {/* Ticket Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-gray-50 p-4 rounded-md mb-6 gap-2">
          <h2 className="text-gray-700 font-semibold">
            [Ticket#{ticket.id}] {ticket.subject}
          </h2>
          <button 
            onClick={handleCloseTicket}
            className="flex items-center justify-center bg-[#e63273] text-white px-4 py-2 rounded-md hover:bg-[#d12c66] transition-colors text-sm font-semibold self-start"
          >
            <FiX className="mr-2" />
            Closed Ticket
          </button>
        </div>

        {/* Reply Form */}
        <form onSubmit={handleReplySubmit} className="mb-8">
          <div className="mb-6">
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
              File
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                    <div className="flex text-sm text-gray-600">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                            <span>Choose File</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">No file chosen</p>
                </div>
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              rows="6"
              className="w-full border border-gray-300 rounded-md p-3 focus:ring-yellow-500 focus:border-yellow-500 shadow-sm"
              placeholder="Enter your reply..."
            ></textarea>
          </div>

          <button 
            type="submit"
            className="flex items-center bg-[#D9B95B] text-white px-5 py-2 rounded-md hover:bg-[#c8a84a] transition-colors font-semibold"
          >
            <FiCornerUpLeft className="mr-2" />
            Reply
          </button>
        </form>

        {/* Previous Replies Section */}
        <div className="border-t pt-6">
          <div className="bg-gray-50 p-5 rounded-lg">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2">
              <h3 className="text-lg font-semibold text-gray-800">Reply By admin</h3>
              <p className="text-xs text-gray-500">Posted on {ticket.reply.date}</p>
            </div>
            <div className="flex flex-col sm:flex-row">
                <div className="w-full sm:w-1/4 mb-4 sm:mb-0">
                    <p className="font-semibold text-gray-700">@{ticket.reply.author}</p>
                    <button 
                        onClick={handleDeleteReply}
                        className="flex items-center mt-4 bg-[#e63273] text-white px-4 py-1.5 rounded-md hover:bg-[#d12c66] transition-colors text-sm"
                    >
                        <FiTrash2 size={14} className="mr-2" />
                        Delete
                    </button>
                </div>
                <div className="w-full sm:w-3/4">
                    <p className="text-gray-600">{ticket.reply.message}</p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplyTicket;