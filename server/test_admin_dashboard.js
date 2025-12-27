// Test admin dashboard endpoint
import fetch from 'node-fetch';

async function testAdminDashboard() {
  try {
    // Login first
    const loginResponse = await fetch('http://localhost:5000/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@gmail.com',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginData.message);
      return;
    }

    const token = loginData.token;
    console.log('✅ Login successful');

    // Test admin dashboard stats
    console.log('\n🔍 Testing /api/admin-panel/dashboard-stats');
    const dashboardResponse = await fetch('http://localhost:5000/api/admin-panel/dashboard-stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const dashboardData = await dashboardResponse.json();
    console.log(`Status: ${dashboardResponse.status}`);
    
    if (dashboardResponse.ok) {
      console.log('✅ Dashboard stats retrieved successfully');
      
      console.log('\n📊 Dashboard Data:');
      console.log('Users:', dashboardData.users);
      console.log('Quotes:', dashboardData.quotes);
      console.log('Subscriptions:', dashboardData.subscriptions);
      console.log('Transactions:', dashboardData.transactions);
      console.log('Recent Activity:', dashboardData.recentActivity?.length || 0, 'items');
      
      // Calculate totals
      const totalUsers = dashboardData.users.reduce((sum, user) => sum + user.count, 0);
      const totalQuotes = dashboardData.quotes.reduce((sum, quote) => sum + quote.count, 0);
      const totalRevenue = dashboardData.subscriptions.reduce((sum, sub) => sum + (parseFloat(sub.total_revenue) || 0), 0) + 
                          dashboardData.transactions.reduce((sum, txn) => sum + (parseFloat(txn.total_amount) || 0), 0);
      
      console.log('\n📈 Summary:');
      console.log(`Total Users: ${totalUsers}`);
      console.log(`Total Quotes: ${totalQuotes}`);
      console.log(`Total Revenue: $${totalRevenue.toFixed(2)}`);
      
    } else {
      console.log('❌ Error:', dashboardData.message);
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testAdminDashboard();