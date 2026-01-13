// Test the delete subscription API endpoint
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

async function testDeleteSubscriptionAPI() {
  try {
    console.log('🔐 Step 1: Admin Login...');
    
    // Login as admin
    const loginResponse = await fetch(`${API_BASE}/api/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@gmail.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.error('❌ Admin login failed:', loginData.message);
      return;
    }
    
    const token = loginData.token;
    console.log('✅ Admin login successful');
    
    console.log('\n📋 Step 2: Get all subscriptions...');
    
    // Get all subscriptions
    const subscriptionsResponse = await fetch(`${API_BASE}/api/admin-panel/subscriptions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const subscriptions = await subscriptionsResponse.json();
    
    if (!subscriptionsResponse.ok) {
      console.error('❌ Failed to get subscriptions:', subscriptions);
      return;
    }
    
    console.log(`✅ Found ${Array.isArray(subscriptions) ? subscriptions.length : 0} subscriptions`);
    
    if (Array.isArray(subscriptions) && subscriptions.length > 0) {
      // Show current subscriptions
      console.log('\n📋 Current subscriptions:');
      subscriptions.forEach((sub, index) => {
        console.log(`  ${index + 1}. ID: ${sub.id}, User: ${sub.user_name} (${sub.user_email}), Plan: ${sub.plan_name}, Status: ${sub.status}`);
      });
      
      // Find a subscription to test with (preferably not the first one to be safe)
      const testSubscription = subscriptions.find(sub => sub.status === 'active' && sub.user_role === 'company') || subscriptions[subscriptions.length - 1];
      
      if (testSubscription) {
        console.log(`\n🎯 Testing deletion with subscription ID: ${testSubscription.id}`);
        console.log(`   User: ${testSubscription.user_name} (${testSubscription.user_email})`);
        console.log(`   Plan: ${testSubscription.plan_name}`);
        console.log(`   Status: ${testSubscription.status}`);
        
        console.log('\n🗑️ Step 3: Delete subscription...');
        
        // Test the delete endpoint
        const deleteResponse = await fetch(`${API_BASE}/api/admin-panel/subscriptions/${testSubscription.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const deleteResult = await deleteResponse.json();
        
        console.log(`Delete response status: ${deleteResponse.status}`);
        console.log('Delete response:', deleteResult);
        
        if (deleteResponse.ok) {
          console.log('✅ Subscription deleted successfully!');
          
          // Verify the subscription was deleted and user was reverted to basic plan
          console.log('\n🔍 Step 4: Verify deletion and basic plan assignment...');
          
          const verifyResponse = await fetch(`${API_BASE}/api/admin-panel/subscriptions`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          const updatedSubscriptions = await verifyResponse.json();
          
          if (Array.isArray(updatedSubscriptions)) {
            const userSubscriptions = updatedSubscriptions.filter(sub => sub.user_id === testSubscription.user_id);
            
            console.log(`📊 User ${testSubscription.user_name} now has ${userSubscriptions.length} subscription(s):`);
            userSubscriptions.forEach(sub => {
              console.log(`  - Plan: ${sub.plan_name}, Status: ${sub.status}, Price: $${sub.plan_price}`);
            });
            
            const hasBasicPlan = userSubscriptions.some(sub => 
              sub.plan_name.toLowerCase().includes('basic') || 
              sub.plan_name.toLowerCase().includes('free') || 
              sub.plan_price === 0
            );
            
            if (hasBasicPlan) {
              console.log('✅ SUCCESS: User has been reverted to basic plan!');
            } else if (userSubscriptions.length === 0) {
              console.log('⚠️ User has no subscriptions (no basic plan available)');
            } else {
              console.log('⚠️ User has subscription but not basic plan');
            }
          }
          
        } else {
          console.log('❌ Failed to delete subscription');
          console.log('Error details:', deleteResult);
        }
        
      } else {
        console.log('❌ No suitable subscription found for testing');
      }
      
    } else {
      console.log('❌ No subscriptions found to test with');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testDeleteSubscriptionAPI();