// Debug script to test company authentication for available quotes
// Run this in browser console on the company panel

console.log('🔍 DEBUGGING COMPANY AUTHENTICATION ISSUE');
console.log('==========================================');

// Check localStorage data
const token = localStorage.getItem('token');
const user = localStorage.getItem('user');

console.log('\n📋 STEP 1: Check Local Storage');
console.log('Token exists:', !!token);
console.log('User exists:', !!user);

if (token) {
    console.log('Token preview:', token.substring(0, 50) + '...');
    
    // Decode JWT token to check expiry
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        const isExpired = payload.exp < currentTime;
        
        console.log('Token payload:', {
            id: payload.id,
            role: payload.role,
            exp: new Date(payload.exp * 1000).toISOString(),
            isExpired: isExpired
        });
    } catch (e) {
        console.log('❌ Error decoding token:', e.message);
    }
}

if (user) {
    try {
        const userData = JSON.parse(user);
        console.log('User data:', {
            id: userData.id,
            role: userData.role,
            email: userData.email
        });
    } catch (e) {
        console.log('❌ Error parsing user data:', e.message);
    }
}

console.log('\n📋 STEP 2: Test API Request');

// Test the API request manually
const testApiRequest = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/quotes/available?t=' + Date.now(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.log('❌ Error response:', errorData);
        } else {
            const data = await response.json();
            console.log('✅ Success response:', {
                quotesCount: data.quotes?.length || 0,
                hasActiveSubscription: data.hasActiveSubscription,
                canRespond: data.canRespond
            });
        }
    } catch (error) {
        console.log('❌ Network error:', error.message);
    }
};

testApiRequest();

console.log('\n📋 STEP 3: Check Current URL and Route');
console.log('Current URL:', window.location.href);
console.log('Current pathname:', window.location.pathname);

console.log('\n📋 STEP 4: Check if user is on correct route');
const isOnCompanyRoute = window.location.pathname.startsWith('/company');
console.log('Is on company route:', isOnCompanyRoute);

console.log('\n📋 STEP 5: Manual token refresh test');
console.log('Try logging out and logging back in to get a fresh token');
console.log('Or run: localStorage.clear(); window.location.reload();');