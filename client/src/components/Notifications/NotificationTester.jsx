import React, { useState } from 'react';
import { useGlobalNotifications } from '../../contexts/GlobalNotificationContext';

const NotificationTester = () => {
  const { triggerTestNotification, NOTIFICATION_EVENTS, isConnected } = useGlobalNotifications();
  const [isLoading, setIsLoading] = useState(false);

  const testNotifications = [
    {
      name: 'New User Registration',
      event: NOTIFICATION_EVENTS.ADMIN.NEW_USER_REGISTRATION,
      data: {
        id: 123,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        created_at: new Date().toISOString()
      }
    },
    {
      name: 'New Company Registration',
      event: NOTIFICATION_EVENTS.ADMIN.NEW_COMPANY_REGISTRATION,
      data: {
        id: 456,
        name: 'Jane Smith',
        email: 'jane@company.com',
        role: 'company',
        created_at: new Date().toISOString()
      }
    },
    {
      name: 'New Quote Request',
      event: NOTIFICATION_EVENTS.ADMIN.NEW_QUOTE_REQUEST,
      data: {
        quote_id: 789,
        user_id: 123,
        user_name: 'John Doe',
        service_type: 'Air Freight',
        pickup_location: 'New York',
        delivery_location: 'Los Angeles',
        budget: 5000,
        created_at: new Date().toISOString()
      }
    },
    {
      name: 'Quote Approved (User)',
      event: NOTIFICATION_EVENTS.USER.QUOTE_STATUS_APPROVED,
      data: {
        quote_id: 789,
        user_id: 123,
        company_id: 456,
        company_name: 'ABC Logistics',
        amount: 4500
      }
    },
    {
      name: 'Quote Accepted (Member)',
      event: NOTIFICATION_EVENTS.MEMBER.USER_ACCEPTS_QUOTE,
      data: {
        quote_id: 789,
        user_id: 123,
        company_id: 456,
        user_name: 'John Doe',
        company_name: 'ABC Logistics',
        amount: 4500,
        service_type: 'Air Freight'
      }
    },
    {
      name: 'Work Started (User)',
      event: NOTIFICATION_EVENTS.USER.QUOTE_STATUS_RUNNING,
      data: {
        quote_id: 789,
        user_id: 123,
        company_id: 456,
        company_name: 'ABC Logistics'
      }
    },
    {
      name: 'Work Completed (User)',
      event: NOTIFICATION_EVENTS.USER.QUOTE_STATUS_CLOSED,
      data: {
        quote_id: 789,
        user_id: 123,
        company_id: 456,
        company_name: 'ABC Logistics'
      }
    },
    {
      name: 'Dispute Raised',
      event: NOTIFICATION_EVENTS.ADMIN.DISPUTE_RAISED,
      data: {
        dispute_id: 101,
        quote_id: 789,
        raised_by: 'John Doe',
        reason: 'Delivery delay'
      }
    }
  ];

  const handleTestNotification = async (testCase) => {
    setIsLoading(true);
    try {
      await triggerTestNotification(testCase.event, testCase.data);
      console.log(`✅ Test notification sent: ${testCase.name}`);
    } catch (error) {
      console.error(`❌ Failed to send test notification: ${testCase.name}`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentUser = () => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  };

  const user = getCurrentUser();

  if (!user.id) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-4">
        <p className="text-yellow-800">Please log in to test notifications</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 m-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Real-Time Notification Tester</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={`text-sm font-medium ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Current User:</strong> {user.name} ({user.role}) - ID: {user.id}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Notifications will be filtered based on your role and user ID
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {testNotifications.map((testCase, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">{testCase.name}</h3>
            <p className="text-xs text-gray-500 mb-3">Event: {testCase.event}</p>
            <button
              onClick={() => handleTestNotification(testCase)}
              disabled={isLoading || !isConnected}
              className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isLoading || !isConnected
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'Sending...' : 'Test Notification'}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Instructions:</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Make sure you're logged in with the appropriate role</li>
          <li>• Check that the connection status shows "Connected"</li>
          <li>• Click any test button to trigger a notification</li>
          <li>• Notifications will only appear if they match your user role and ID</li>
          <li>• Open browser console to see detailed logs</li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationTester;