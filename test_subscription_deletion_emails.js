import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const testSubscriptionDeletionEmails = async () => {
  try {
    console.log('🔐 Logging in as admin...');
    const adminLogin = await axios.post(`${API_BASE}/user/login`, {
      email: 'admin@gmail.com',
      password: 'admin123'
    });
    
    const adminToken = adminLogin.data.token;
    console.log('✅ Admin login successful');

    // Get list of active subscriptions
    console.log('\n📋 Fetching active subscriptions...');
    const subscriptions = await axios.get(`${API_BASE}/admin-panel/subscriptions`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log(`✅ Found ${subscriptions.data.length} active subscriptions`);
    
    if (subscriptions.data.length === 0) {
      console.log('❌ No active subscriptions found to test deletion');
      return;
    }
    
    // Find a test subscription (avoid deleting important ones)
    const testSubscription = subscriptions.data.find(sub => 
      sub.user_email && sub.user_email.includes('test')
    ) || subscriptions.data[0];
    
    console.log(`\n🧪 Testing subscription deletion for: ${testSubscription.user_name} (${testSubscription.user_email})`);
    console.log(`   Subscription ID: ${testSubscription.id}`);
    console.log(`   Plan: ${testSubscription.plan_name}`);
    
    // Delete the subscription with a reason
    console.log('\n🗑️ Deleting subscription with email notifications...');
    const deletionReason = 'Testing subscription deletion email system - automated test';
    
    const deleteResponse = await axios.delete(`${API_BASE}/admin-panel/subscriptions/${testSubscription.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { reason: deletionReason }
    });
    
    console.log('✅ Subscription deleted successfully');
    console.log('📊 Deletion Summary:');
    console.log(`   - Cancelled Invoices: ${deleteResponse.data.cancelledInvoices}`);
    console.log(`   - Deleted Transactions: ${deleteResponse.data.deletedTransactions}`);
    console.log(`   - Reason: ${deleteResponse.data.reason}`);
    
    console.log('\n📧 Email notifications should be sent to:');
    console.log(`   - User: ${testSubscription.user_email}`);
    console.log(`   - All admin users`);
    
    console.log('\n✅ Subscription deletion email test completed!');
    console.log('📝 Check server logs and email queue for processing status');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
};

testSubscriptionDeletionEmails();