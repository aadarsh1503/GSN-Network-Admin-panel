// Test enhanced dashboard queries individually
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

async function testEnhancedQueries() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Test monthly revenue query
    console.log('\n🔍 Testing monthly revenue query...');
    try {
      const monthlyRevenueSql = `
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          DATE_FORMAT(created_at, '%b') as month_name,
          SUM(CASE WHEN quote_response_id IS NOT NULL THEN amount ELSE 0 END) as quote_revenue,
          SUM(CASE WHEN subscription_id IS NOT NULL THEN amount ELSE 0 END) as subscription_revenue,
          SUM(amount) as total_revenue,
          COUNT(*) as transaction_count
        FROM transactions 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        AND status = 'completed'
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month ASC
      `;
      const [monthlyRevenue] = await connection.execute(monthlyRevenueSql);
      console.log('✅ Monthly revenue query successful:', monthlyRevenue.length, 'records');
    } catch (error) {
      console.log('❌ Monthly revenue query error:', error.message);
    }

    // Test monthly user growth query
    console.log('\n🔍 Testing monthly user growth query...');
    try {
      const monthlyUserGrowthSql = `
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          DATE_FORMAT(created_at, '%b') as month_name,
          COUNT(*) as new_users,
          SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as new_regular_users,
          SUM(CASE WHEN role = 'company' THEN 1 ELSE 0 END) as new_companies,
          SUM(CASE WHEN role = 'business' THEN 1 ELSE 0 END) as new_businesses
        FROM users 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        AND role != 'admin'
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month ASC
      `;
      const [monthlyUserGrowth] = await connection.execute(monthlyUserGrowthSql);
      console.log('✅ Monthly user growth query successful:', monthlyUserGrowth.length, 'records');
    } catch (error) {
      console.log('❌ Monthly user growth query error:', error.message);
    }

    // Test top metrics query
    console.log('\n🔍 Testing top metrics query...');
    try {
      const topMetricsSql = `
        SELECT 
          (SELECT COUNT(*) FROM quotes WHERE status = 'running') as active_quotes,
          (SELECT COUNT(*) FROM user_subscriptions WHERE status = 'active') as active_subscriptions,
          (SELECT COUNT(*) FROM users WHERE status = 1 AND role != 'admin') as active_users,
          (SELECT COUNT(*) FROM transactions WHERE status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as monthly_transactions,
          (SELECT AVG(amount) FROM transactions WHERE status = 'completed') as avg_transaction_value,
          (SELECT COUNT(*) FROM quotes WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as weekly_quotes
      `;
      const [topMetrics] = await connection.execute(topMetricsSql);
      console.log('✅ Top metrics query successful:', topMetrics[0]);
    } catch (error) {
      console.log('❌ Top metrics query error:', error.message);
    }

    // Test performance metrics query
    console.log('\n🔍 Testing performance metrics query...');
    try {
      const performanceMetricsSql = `
        SELECT 
          (SELECT COUNT(*) FROM quotes WHERE status = 'running') / NULLIF((SELECT COUNT(*) FROM quotes), 0) * 100 as quote_success_rate,
          (SELECT COUNT(*) FROM user_subscriptions WHERE status = 'active') / NULLIF((SELECT COUNT(*) FROM users WHERE role != 'admin'), 0) * 100 as subscription_rate,
          (SELECT COUNT(*) FROM transactions WHERE status = 'completed') / NULLIF((SELECT COUNT(*) FROM transactions), 0) * 100 as transaction_success_rate
      `;
      const [performanceMetrics] = await connection.execute(performanceMetricsSql);
      console.log('✅ Performance metrics query successful:', performanceMetrics[0]);
    } catch (error) {
      console.log('❌ Performance metrics query error:', error.message);
    }

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testEnhancedQueries();