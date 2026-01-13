// Debug script to test MemberQuotesPage authentication issue

console.log('🔍 Debugging MemberQuotesPage authentication issue...');

// Check localStorage
const token = localStorage.getItem('token');
const user = localStorage.getItem('user');

console.log('📋 Current Authentication State:');
console.log('   Token exists:', !!token);
console.log('   Token preview:', token ? token.substring(0, 50) + '...' : 'None');
console.log('   User exists:', !!user);

if (user) {
  try {
    const userData = JSON.parse(user);
    console.log('   User data:', userData);
    console.log('   User role:', userData.role);
    console.log('   User ID:', userData.id);
  } catch (e) {
    console.log('   Error parsing user data:', e.message);
  }
}

// Test token validity
if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    const isExpired = payload.exp < currentTime;
    
    console.log('🕒 Token Analysis:');
    console.log('   Token payload:', payload);
    console.log('   Expires at:', new Date(payload.exp * 1000));
    console.log('   Current time:', new Date());
    console.log('   Is expired:', isExpired);
  } catch (e) {
    console.log('❌ Error parsing token:', e.message);
  }
}

// Test API call
async function testApiCall() {
  console.log('\n🧪 Testing API call to /api/quotes/available...');
  
  try {
    const response = await fetch('http://localhost:5000/api/quotes/available', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success! Data received:', data);
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log('❌ Error response:', errorData);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Run the test
testApiCall();

// Also test the quotesAPI method
console.log('\n🧪 Testing quotesAPI.getAvailableQuotes()...');

// Import the API utility (this would need to be adjusted based on your setup)
// For now, let's just show what the method does
const quotesAPI = {
  getAvailableQuotes: () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return fetch(`http://localhost:5000/api/quotes/available?t=${timestamp}&r=${random}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    }).then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    });
  }
};

quotesAPI.getAvailableQuotes()
  .then(data => {
    console.log('✅ quotesAPI.getAvailableQuotes() success:', data);
  })
  .catch(error => {
    console.log('❌ quotesAPI.getAvailableQuotes() error:', error.message);
  });