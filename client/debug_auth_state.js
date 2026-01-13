// Debug authentication state
console.log('🔍 Debugging Authentication State');
console.log('=' .repeat(50));

// Check localStorage
const token = localStorage.getItem('token');
const user = localStorage.getItem('user');

console.log('📋 LocalStorage State:');
console.log(`Token exists: ${token ? 'Yes' : 'No'}`);
console.log(`User exists: ${user ? 'Yes' : 'No'}`);

if (token) {
    console.log(`Token (first 50 chars): ${token.substring(0, 50)}...`);
    
    // Try to decode token
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        const isExpired = payload.exp < currentTime;
        
        console.log('🔓 Token Details:');
        console.log(`User ID: ${payload.id}`);
        console.log(`User Role: ${payload.role}`);
        console.log(`Expires at: ${new Date(payload.exp * 1000)}`);
        console.log(`Current time: ${new Date()}`);
        console.log(`Is expired: ${isExpired ? 'Yes' : 'No'}`);
        
        if (isExpired) {
            console.log('❌ TOKEN IS EXPIRED - User needs to login again');
        } else {
            console.log('✅ Token is valid');
        }
    } catch (error) {
        console.log('❌ Error decoding token:', error.message);
    }
}

if (user) {
    try {
        const userData = JSON.parse(user);
        console.log('👤 User Data:');
        console.log(`Name: ${userData.name}`);
        console.log(`Email: ${userData.email}`);
        console.log(`Role: ${userData.role}`);
    } catch (error) {
        console.log('❌ Error parsing user data:', error.message);
    }
}

// Test API call
if (token) {
    console.log('\n🔄 Testing API Call...');
    
    fetch('http://localhost:5000/api/quotes/available', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        console.log(`Response status: ${response.status}`);
        console.log(`Response ok: ${response.ok}`);
        return response.text();
    })
    .then(data => {
        console.log(`Response data: ${data.substring(0, 200)}...`);
    })
    .catch(error => {
        console.log(`API call error: ${error.message}`);
    });
} else {
    console.log('\n❌ No token found - cannot test API call');
    console.log('💡 User needs to login first');
}