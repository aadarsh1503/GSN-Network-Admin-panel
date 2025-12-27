// Test the exact subscription query from the controller
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

async function testSubscriptionQuery() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // First, check the structure of membership_plans
    console.log('\n📋 membership_plans structure:');
    const [planStructure] = await connection.execute('DESCRIBE membership_plans');
    planStructure.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type}`);
    });

    // Check user_subscriptions structure
    console.log('\n📋 user_subscriptions structure:');
    const [subStructure] = await connection.execute('DESCRIBE user_subscriptions');
    subStructure.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type}`);
    });

    // Test the original query (with potential issue)
    console.log('\n🔍 Testing original query...');
    try {
      const originalSql = `
        SELECT 
            us.id,
            us.user_id,
            u.name as user_name,
            u.email as user_email,
            u.phone as user_phone,
            u.role as user_role,
            us.plan_id,
            mp.name as plan_name,
            mp.price as plan_price,
            mp.duration_days,
            us.start_date,
            us.end_date,
            us.status,
            us.payment_status,
            us.transaction_id,
            us.amount_paid,
            us.created_at
        FROM user_subscriptions us
        JOIN users u ON us.user_id = u.id
        JOIN membership_plans mp ON us.plan_id = mp.id
        ORDER BY us.created_at DESC
      `;
      
      const [originalResult] = await connection.execute(originalSql);
      console.log('❌ Original query failed as expected');
    } catch (error) {
      console.log(`❌ Original query error: ${error.message}`);
    }

    // Test corrected query
    console.log('\n✅ Testing corrected query...');
    const correctedSql = `
      SELECT 
          us.id,
          us.user_id,
          u.name as user_name,
          u.email as user_email,
          u.phone as user_phone,
          u.role as user_role,
          us.plan_id,
          mp.name as plan_name,
          mp.price as plan_price,
          mp.duration_months,
          us.start_date,
          us.end_date,
          us.status,
          us.payment_status,
          us.transaction_id,
          us.amount_paid,
          us.created_at
      FROM user_subscriptions us
      JOIN users u ON us.user_id = u.id
      JOIN membership_plans mp ON us.plan_id = mp.id
      ORDER BY us.created_at DESC
    `;
    
    const [correctedResult] = await connection.execute(correctedSql);
    console.log(`✅ Corrected query success: ${correctedResult.length} records`);
    
    if (correctedResult.length > 0) {
      console.log('Sample record:', JSON.stringify(correctedResult[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testSubscriptionQuery();