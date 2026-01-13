// Simple test to verify the notification system is working
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

async function testNotificationSystem() {
  console.log('🧪 Testing Real-Time Notification System...\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connection...');
    const healthResponse = await fetch(`${API_BASE}/api/notifications/connections`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    if (healthResponse.status === 401) {
      console.log('✅ Server is running and auth middleware is working');
    } else {
      console.log('❌ Unexpected response:', healthResponse.status);
    }

    // Test 2: Check if SSE endpoint exists
    console.log('\n2. Testing SSE endpoint availability...');
    try {
      const sseResponse = await fetch(`${API_BASE}/api/notifications/stream?token=invalid`, {
        method: 'GET'
      });
      
      if (sseResponse.status === 401) {
        console.log('✅ SSE endpoint is available and requires authentication');
      } else {
        console.log('❌ SSE endpoint response:', sseResponse.status);
      }
    } catch (error) {
      console.log('❌ SSE endpoint error:', error.message);
    }

    // Test 3: Check if routes are properly registered
    console.log('\n3. Testing route registration...');
    const routeResponse = await fetch(`${API_BASE}/api/notifications/test-trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token'
      },
      body: JSON.stringify({
        eventType: 'test',
        data: { test: true }
      })
    });

    if (routeResponse.status === 401) {
      console.log('✅ Test trigger endpoint is available and secured');
    } else {
      console.log('❌ Test trigger endpoint response:', routeResponse.status);
    }

    console.log('\n🎉 Basic notification system tests completed!');
    console.log('\nNext steps:');
    console.log('1. Open the client at http://localhost:5173');
    console.log('2. Log in as an admin');
    console.log('3. Navigate to /admin/notification-test');
    console.log('4. Test the real-time notifications');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNotificationSystem();