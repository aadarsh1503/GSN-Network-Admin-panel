// Test to verify only one email is sent for quote responses
const axios = require('axios');

const testSingleQuoteResponseEmail = async () => {
    try {
        console.log('🧪 Testing single quote response email...');
        
        // Test quote response submission
        const quoteResponseData = {
            quote_id: 83,
            price: 2000,
            transit_time: '2026-02-04',
            valid_until: '2026-02-04',
            notes: 'Test quote response - should send only ONE email',
            bank_details: {
                bank_name: 'Test Bank',
                account_holder_name: 'Test Account Holder',
                account_number: '1234567890',
                ifsc_code: 'TEST0001234',
                swift_code: 'TESTSWIFT'
            }
        };

        const response = await axios.post('http://localhost:5000/api/quote-responses', quoteResponseData, {
            headers: {
                'Authorization': 'Bearer YOUR_COMPANY_TOKEN_HERE',
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Quote response submitted successfully');
        console.log('📧 Check your email - you should receive ONLY ONE email now');
        console.log('📧 The email should be the enhanced version with proper bank details');
        
        return response.data;
        
    } catch (error) {
        console.error('❌ Error testing quote response email:', error.response?.data || error.message);
    }
};

// Run the test
testSingleQuoteResponseEmail();