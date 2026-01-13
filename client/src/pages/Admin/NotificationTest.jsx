import React from 'react';
import NotificationTester from '../../components/Notifications/NotificationTester';

const NotificationTest = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Real-Time Notification System Test</h1>
            <p className="mt-2 text-gray-600">
              Test the global real-time notification system across Admin, Member, and User panels.
            </p>
          </div>
          
          <NotificationTester />
          
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-blue-900">Admin Panel</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Receives notifications for new registrations, quote requests, disputes, and system events.
                </p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-green-900">Member Panel</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Receives notifications for new quotes, user responses, and admin actions affecting them.
                </p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-purple-900">User Panel</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Receives notifications for quote status changes, member responses, and work updates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationTest;