import axios from 'axios';

async function testQuotesOnly() {
    try {
        // Login first
        const loginResponse = await axios.post('http://localhost:5000/api/user/login', {
            email: 'ksacargo@gvscargo.com',
            password: 'test123'
        });

        const token = loginResponse.data.token;
        const headers = { 'Authorization': `Bearer ${token}` };

        // Test quotes endpoint
        console.log('Testing business quotes endpoint...');
        const quotesResponse = await axios.get('http://localhost:5000/api/business/quotes', { headers });
        console.log('✅ Success! Found', quotesResponse.data.length, 'quotes');
        console.log('Sample quote:', quotesResponse.data[0]);

    } catch (error) {
        console.log('❌ Error:', error.response?.data?.message || error.message);
        if (error.response?.data) {
            console.log('Response data:', error.response.data);
        }
    }
}

testQuotesOnly();