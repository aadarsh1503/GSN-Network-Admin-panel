import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const testDisputeEmailSystem = async () => {
  try {
    console.log('🔐 Logging in as admin user...');
    
    // Login as admin user to create a dispute
    const adminLogin = await axios.post(`${API_BASE}/user/login`, {
      email: 'admin@gmail.com',
      password: 'admin123'
    });
    
    const adminToken = adminLogin.data.token;
    console.log('✅ Admin user login successful');

    // Get available companies to file dispute against
    console.log('\n📋 Fetching available companies...');
    const companies = await axios.get(`${API_BASE}/disputes/user-companies`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log(`✅ Found ${companies.data.length} companies`);
    
    if (companies.data.length === 0) {
      console.log('❌ No companies found to test dispute creation');
      return;
    }
    
    const targetCompany = companies.data[0];
    console.log(`🎯 Target company: ${targetCompany.name} (${targetCompany.email})`);

    // Get dispute reasons
    console.log('\n📋 Fetching dispute reasons...');
    const reasons = await axios.get(`${API_BASE}/disputes/reasons`);
    
    if (reasons.data.length === 0) {
      console.log('❌ No dispute reasons found');
      return;
    }
    
    const disputeReason = reasons.data[0];
    console.log(`📝 Using reason: ${disputeReason.title}`);

    // Create a comprehensive dispute
    console.log('\n🚨 Creating dispute with email notifications...');
    const disputeData = {
      company_id: targetCompany.id,
      dispute_reason_id: disputeReason.id,
      title: 'Test Dispute - Email System Verification',
      description: 'This is a comprehensive test dispute created to verify the email notification system. The dispute includes detailed information about service quality issues, delayed delivery, and poor communication from the company. This test ensures that all parties (admin, creator, and target) receive appropriate email notifications with complete dispute information.',
      priority: 'high',
      images: [
        {
          url: 'https://example.com/evidence1.jpg',
          type: 'evidence'
        },
        {
          url: 'https://example.com/evidence2.jpg',
          type: 'evidence'
        }
      ]
    };

    const disputeResponse = await axios.post(`${API_BASE}/disputes/create`, disputeData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Dispute created successfully');
    console.log(`📊 Dispute ID: ${disputeResponse.data.disputeId}`);
    
    console.log('\n📧 Email notifications should be sent to:');
    console.log(`   - Creator (Admin User): admin@gmail.com`);
    console.log(`   - Target (Company): ${targetCompany.email}`);
    console.log(`   - All admin users`);
    
    console.log('\n✅ Dispute email system test completed!');
    console.log('📝 Check server logs and email queue for processing status');
    console.log('📧 Verify that all three types of emails are sent:');
    console.log('   1. Admin notification (🚨 New Dispute Filed)');
    console.log('   2. Creator confirmation (✅ Dispute Filed Successfully)');
    console.log('   3. Target notification (⚠️ Dispute Filed Against You)');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
};

testDisputeEmailSystem();