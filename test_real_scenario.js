import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// Test with real scenario
const testRealScenario = async () => {
  try {
    console.log('🔐 Logging in as admin...');
    const adminLogin = await axios.post(`${API_BASE}/user/login`, {
      email: 'admin@gmail.com',
      password: 'admin123'
    });
    
    const adminToken = adminLogin.data.token;
    console.log('✅ Admin login successful');

    // Submit a comprehensive quote request
    console.log('\n📝 Submitting comprehensive quote request...');
    const quoteData = {
      shippingMode: 'Sea',
      arrivalDate: '2026-02-15',
      departureCountry: 'India',
      departureState: 'Maharashtra',
      departureCity: 'Mumbai',
      departureType: 'Port',
      arrivalCountry: 'Bangladesh',
      arrivalState: 'Dhaka',
      arrivalCity: 'Dhaka',
      arrivalType: 'Port',
      productDescription: 'Electronics - Smartphones and Tablets',
      packing: 'Cartons',
      incoterms: 'FOB',
      quantity: '500 units',
      weight: '2000 kg',
      type: 'General Cargo',
      length: '120',
      width: '80',
      height: '100',
      dimensionUnit: 'cm',
      isStackable: true,
      isHazardous: false,
      hasInsurance: true,
      notes: 'Fragile items, handle with care. Temperature controlled shipping preferred.',
      contactName: 'John Smith',
      contactEmail: 'john.smith@example.com',
      contactPhone: '+1-555-123-4567'
    };

    const quoteResponse = await axios.post(`${API_BASE}/quotes/submit`, quoteData);
    console.log(`✅ Quote submitted successfully (ID: ${quoteResponse.data.quoteId})`);

    // Check email queue
    console.log('\n📊 Checking email queue...');
    const queueStatus = await axios.get(`${API_BASE}/admin/email-queue-status`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('Email Queue:', JSON.stringify(queueStatus.data, null, 2));

    console.log('\n✅ Real scenario test completed!');
    console.log('📧 Check your email for the comprehensive quote request notification');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
};

testRealScenario();