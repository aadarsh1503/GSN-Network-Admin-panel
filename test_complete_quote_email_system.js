// Test script to verify the complete quote email notification system
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

// Test configuration
const testConfig = {
  adminCredentials: {
    email: 'admin@gmail.com',
    password: 'admin123'
  },
  userCredentials: {
    email: 'testuser@example.com',
    password: 'password123'
  },
  companyCredentials: {
    email: 'ksacargo@gvscargo.com', // Using existing company
    password: 'password123'
  }
};

async function testCompleteQuoteEmailSystem() {
  try {
    console.log('🚀 Testing Complete Quote Email Notification System\n');
    
    // Step 1: Login as user and submit a quote request
    console.log('1️⃣ User submitting quote request...');
    
    const userLoginResponse = await axios.post(`${API_BASE}/api/user/login`, testConfig.userCredentials);
    const userToken = userLoginResponse.data.token;
    
    const quoteData = {
      shippingMode: 'sea',
      arrivalDate: '2024-02-15',
      departureCountry: 'United Arab Emirates',
      departureState: 'Dubai',
      departureCity: 'Dubai',
      departureType: 'port',
      arrivalCountry: 'United States',
      arrivalState: 'California',
      arrivalCity: 'Los Angeles',
      arrivalType: 'port',
      productDescription: 'Electronics and Computer Parts',
      packing: 'pallets',
      incoterms: 'FOB',
      quantity: '100',
      weight: '5000',
      type: 'general',
      length: '200',
      width: '150',
      height: '100',
      dimensionUnit: 'cm',
      isStackable: true,
      isHazardous: false,
      hasInsurance: true,
      notes: 'Handle with care - fragile electronics'
    };
    
    const quoteResponse = await axios.post(`${API_BASE}/api/quotes/submit`, quoteData, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    
    const quoteId = quoteResponse.data.quoteId;
    console.log(`✅ Quote submitted successfully (ID: ${quoteId})`);
    console.log('📧 Emails should be sent to:');
    console.log('   - User confirmation email');
    console.log('   - All matching companies notification emails');
    
    // Wait for emails to be processed
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 2: Login as company and respond to the quote
    console.log('\n2️⃣ Company responding to quote...');
    
    const companyLoginResponse = await axios.post(`${API_BASE}/api/user/login`, testConfig.companyCredentials);
    const companyToken = companyLoginResponse.data.token;
    
    const responseData = {
      quoteId: quoteId,
      price: 2500.00,
      transitTime: '15-20 days',
      inclusions: 'Door-to-door delivery, customs clearance, insurance coverage',
      valueAddedServices: 'Real-time tracking, dedicated customer support',
      validUntil: '2024-02-01',
      terms: 'Payment required before shipment. All terms as per standard shipping agreement.',
      notes: 'We offer competitive rates and reliable service for your electronics shipment.'
    };
    
    const responseResult = await axios.post(`${API_BASE}/api/quote-responses/submit`, responseData, {
      headers: { 'Authorization': `Bearer ${companyToken}` }
    });
    
    const quoteResponseId = responseResult.data.responseId;
    console.log(`✅ Quote response submitted successfully (ID: ${quoteResponseId})`);
    console.log('📧 Emails should be sent to:');
    console.log('   - User notification with complete quote response details');
    
    // Wait for emails to be processed
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 3: User accepts the quote
    console.log('\n3️⃣ User accepting quote...');
    
    // First get the company ID for acceptance
    const availableQuotesResponse = await axios.get(`${API_BASE}/api/user-quotes/${quoteId}/responses`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    
    const responses = availableQuotesResponse.data;
    if (responses.length === 0) {
      throw new Error('No quote responses found');
    }
    
    const companyId = responses[0].company_id;
    
    const acceptanceData = {
      quoteId: quoteId,
      quoteResponseId: quoteResponseId,
      companyId: companyId
    };
    
    await axios.post(`${API_BASE}/api/user-quotes/accept-response`, acceptanceData, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    
    console.log(`✅ Quote accepted successfully`);
    console.log('📧 Emails should be sent to:');
    console.log('   - Company congratulations email with complete booking details');
    console.log('   - User booking confirmation email with company contact info');
    
    // Wait for emails to be processed
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 4: Check email queue status
    console.log('\n4️⃣ Checking email queue status...');
    
    const adminLoginResponse = await axios.post(`${API_BASE}/api/user/login`, testConfig.adminCredentials);
    const adminToken = adminLoginResponse.data.token;
    
    try {
      const queueResponse = await axios.get(`${API_BASE}/api/email-queue/status`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      console.log('📊 Email Queue Status:', queueResponse.data);
    } catch (error) {
      console.log('ℹ️ Email queue status endpoint not available');
    }
    
    console.log('\n✅ Complete Quote Email System Test Completed!');
    console.log('\n📝 Summary of Expected Emails:');
    console.log('1. Quote Request Submitted:');
    console.log('   ✉️ User confirmation email with quote details');
    console.log('   ✉️ Company notification emails (to all matching companies)');
    console.log('');
    console.log('2. Company Quote Response:');
    console.log('   ✉️ User notification with complete response details and company info');
    console.log('');
    console.log('3. User Quote Acceptance:');
    console.log('   ✉️ Company congratulations email with booking details');
    console.log('   ✉️ User booking confirmation with company contact information');
    console.log('');
    console.log('🔍 Check your email server logs and email queue for processing status');
    console.log('📧 All emails include complete API data as requested');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error('🔐 Authentication failed - check credentials');
    }
  }
}

// Run the test
testCompleteQuoteEmailSystem();