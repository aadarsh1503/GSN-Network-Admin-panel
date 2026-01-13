// Simple test to verify quote email system is working
import axios from 'axios';

async function testSimpleQuoteEmail() {
  try {
    console.log('🔐 Testing with admin credentials...');
    
    // Login as admin first to check system
    const adminLogin = await axios.post('http://localhost:5000/api/user/login', {
      email: 'admin@gmail.com',
      password: 'admin123'
    });
    
    console.log('✅ Admin login successful');
    
    // Get users to see what accounts exist
    const usersResponse = await axios.get('http://localhost:5000/api/user/regular-users', {
      headers: { 'Authorization': `Bearer ${adminLogin.data.token}` }
    });
    
    console.log(`📋 Found ${usersResponse.data.length} regular users`);
    
    if (usersResponse.data.length > 0) {
      const testUser = usersResponse.data[0];
      console.log(`🧪 Test user: ${testUser.name} (${testUser.email})`);
      
      // Try to submit a quote as guest (no login required)
      console.log('\n📝 Submitting quote as guest...');
      
      const quoteData = {
        shippingMode: 'sea',
        arrivalDate: '2024-02-15',
        departureCountry: 'United Arab Emirates',
        arrivalCountry: 'United States',
        productDescription: 'Test Electronics',
        contactName: 'Test User',
        contactEmail: 'test@example.com',
        contactPhone: '+1234567890'
      };
      
      const quoteResponse = await axios.post('http://localhost:5000/api/quotes/submit', quoteData);
      
      console.log(`✅ Quote submitted successfully (ID: ${quoteResponse.data.quoteId})`);
      console.log('📧 Check server logs for email processing...');
      
      // Wait for email processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check email queue status
      try {
        const queueResponse = await axios.get('http://localhost:5000/api/email-queue/status', {
          headers: { 'Authorization': `Bearer ${adminLogin.data.token}` }
        });
        console.log('📊 Email Queue Status:', queueResponse.data);
      } catch (error) {
        console.log('ℹ️ Email queue status not available');
      }
    }
    
    console.log('\n✅ Simple quote email test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testSimpleQuoteEmail();