// Simple test script for forgot password API
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api/user';

async function testForgotPassword() {
    console.log('🔧 Testing Forgot Password API...\n');
    
    // Test 1: Valid email request
    console.log('1. Testing with valid email format:');
    try {
        const response = await fetch(`${API_BASE}/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: 'test@example.com' })
        });
        
        const data = await response.json();
        console.log(`   Status: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
        console.log(`   Error: ${error.message}`);
    }
    
    console.log('\n2. Testing with missing email:');
    try {
        const response = await fetch(`${API_BASE}/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        
        const data = await response.json();
        console.log(`   Status: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
        console.log(`   Error: ${error.message}`);
    }
    
    console.log('\n3. Testing token verification (with dummy token):');
    try {
        const response = await fetch(`${API_BASE}/verify-reset-token/dummy-token-123`);
        const data = await response.json();
        console.log(`   Status: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
        console.log(`   Error: ${error.message}`);
    }
    
    console.log('\n✅ API tests completed!');
}

testForgotPassword();