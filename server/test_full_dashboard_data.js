// Test full dashboard data
import fetch from 'node-fetch';

async function testFullDashboardData() {
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
    const token = loginData.token;

    // Test enhanced dashboard stats
    const dashboardResponse = await fetch('http://localhost:5000/api/admin-panel/dashboard-stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await dashboardResponse.json();
    
    console.log('✅ Enhanced Dashboard Data:');
    console.log('\n📊 Basic Stats:');
    console.log('Users:', data.users);
    console.log('Quotes:', data.quotes);
    console.log('Subscriptions:', data.subscriptions);
    console.log('Transactions:', data.transactions);
    
    console.log('\n📈 Monthly Revenue:', data.monthlyRevenue);
    console.log('\n👥 Monthly User Growth:', data.monthlyUserGrowth);
    console.log('\n🎯 Top Metrics:', data.topMetrics);
    console.log('\n⚡ Performance Metrics:', data.performanceMetrics);
    console.log('\n🔔 Recent Activity:', data.recentActivity?.length || 0, 'items');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFullDashboardData();