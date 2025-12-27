// Debug data mismatch between dashboard stats and individual endpoints
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function debugDataMismatch() {
    try {
        console.log('🔐 Testing admin login...');
        
        // Login as admin
        const loginResponse = await fetch(`${BASE_URL}/api/user/login`, {
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
        const token = loginData.token;
        console.log('✅ Admin login successful');

        // Get dashboard stats
        console.log('\n📊 Dashboard Stats API:');
        const statsResponse = await fetch(`${BASE_URL}/api/admin-panel/dashboard-stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const stats = await statsResponse.json();
        
        console.log('Dashboard Stats Results:');
        console.log(`   Total Users: ${stats.users.reduce((sum, user) => sum + user.count, 0)}`);
        console.log(`   Total Quotes: ${stats.quotes.reduce((sum, quote) => sum + quote.count, 0)}`);
        console.log(`   Total Subscriptions: ${stats.subscriptions.reduce((sum, sub) => sum + sub.count, 0)}`);
        console.log(`   Total Transactions: ${stats.transactions.reduce((sum, txn) => sum + txn.count, 0)}`);
        console.log(`   Active Users: ${stats.topMetrics?.active_users || 0}`);
        console.log(`   Active Quotes: ${stats.topMetrics?.active_quotes || 0}`);
        console.log(`   Active Subscriptions: ${stats.topMetrics?.active_subscriptions || 0}`);
        console.log(`   Avg Transaction Value: $${stats.topMetrics?.avg_transaction_value || 0}`);
        console.log(`   Weekly Quotes: ${stats.topMetrics?.weekly_quotes || 0}`);

        // Get individual endpoints
        console.log('\n📋 Individual Endpoints:');
        
        // Users
        const usersResponse = await fetch(`${BASE_URL}/api/user/all`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await usersResponse.json();
        const activeUsers = users.filter(user => user.status === 1 || user.status === true);
        console.log(`   All Users: ${users.length}`);
        console.log(`   Active Users: ${activeUsers.length}`);
        
        // Quotes
        const quotesResponse = await fetch(`${BASE_URL}/api/admin-panel/quotes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const quotes = await quotesResponse.json();
        const activeQuotes = quotes.filter(q => q.status === 'running');
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weeklyQuotes = quotes.filter(quote => new Date(quote.created_at) >= oneWeekAgo);
        console.log(`   All Quotes: ${quotes.length}`);
        console.log(`   Active Quotes: ${activeQuotes.length}`);
        console.log(`   Weekly Quotes: ${weeklyQuotes.length}`);
        
        // Subscriptions
        const subsResponse = await fetch(`${BASE_URL}/api/admin-panel/subscriptions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const subscriptions = await subsResponse.json();
        const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
        console.log(`   All Subscriptions: ${subscriptions.length}`);
        console.log(`   Active Subscriptions: ${activeSubscriptions.length}`);
        
        // Transactions
        const txnResponse = await fetch(`${BASE_URL}/api/admin-panel/transactions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const transactions = await txnResponse.json();
        const avgTransactionValue = transactions.length > 0 ? 
            transactions.reduce((sum, txn) => sum + parseFloat(txn.amount), 0) / transactions.length : 0;
        console.log(`   Quote Transactions: ${transactions.length}`);
        console.log(`   Avg Transaction Value: $${avgTransactionValue.toFixed(2)}`);
        
        // Compare results
        console.log('\n🔍 Comparison (Dashboard vs Individual):');
        console.log(`   Users: ${stats.users.reduce((sum, user) => sum + user.count, 0)} vs ${users.length}`);
        console.log(`   Active Users: ${stats.topMetrics?.active_users || 0} vs ${activeUsers.length}`);
        console.log(`   Quotes: ${stats.quotes.reduce((sum, quote) => sum + quote.count, 0)} vs ${quotes.length}`);
        console.log(`   Active Quotes: ${stats.topMetrics?.active_quotes || 0} vs ${activeQuotes.length}`);
        console.log(`   Subscriptions: ${stats.subscriptions.reduce((sum, sub) => sum + sub.count, 0)} vs ${subscriptions.length}`);
        console.log(`   Active Subscriptions: ${stats.topMetrics?.active_subscriptions || 0} vs ${activeSubscriptions.length}`);
        console.log(`   Transactions: ${stats.transactions.reduce((sum, txn) => sum + txn.count, 0)} vs ${transactions.length}`);
        console.log(`   Avg Transaction: $${stats.topMetrics?.avg_transaction_value || 0} vs $${avgTransactionValue.toFixed(2)}`);
        console.log(`   Weekly Quotes: ${stats.topMetrics?.weekly_quotes || 0} vs ${weeklyQuotes.length}`);

    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

debugDataMismatch();