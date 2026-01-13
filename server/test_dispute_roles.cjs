const mysql = require('mysql2/promise');
require('dotenv').config();

async function testDisputeRoles() {
  const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('🔍 Testing dispute query with user roles...\n');
    
    const sql = `
      SELECT 
        d.id,
        d.title,
        d.status,
        d.priority,
        d.created_at,
        u.name as user_name,
        u.email as user_email,
        u.role as user_role,
        c.name as company_name,
        c.email as company_email,
        c.role as company_role,
        dr.title as reason_title
      FROM disputes d
      JOIN users u ON d.user_id = u.id
      JOIN users c ON d.company_id = c.id
      JOIN dispute_reasons dr ON d.dispute_reason_id = dr.id
      ORDER BY d.created_at DESC
      LIMIT 5
    `;
    
    const [disputes] = await db.execute(sql);
    
    if (disputes.length === 0) {
      console.log('ℹ️ No disputes found in the database');
    } else {
      console.log(`✅ Found ${disputes.length} disputes with user roles:`);
      console.log('');
      
      disputes.forEach((dispute, index) => {
        console.log(`${index + 1}. Dispute #${dispute.id}: "${dispute.title}"`);
        console.log(`   Filed by: ${dispute.user_name} (${dispute.user_role}) - ${dispute.user_email}`);
        console.log(`   Against: ${dispute.company_name} (${dispute.company_role}) - ${dispute.company_email}`);
        console.log(`   Reason: ${dispute.reason_title}`);
        console.log(`   Status: ${dispute.status} | Priority: ${dispute.priority}`);
        console.log(`   Created: ${dispute.created_at}`);
        console.log('');
      });
    }
    
    // Test user role distribution
    console.log('📊 User Role Distribution:');
    const [roleStats] = await db.execute(`
      SELECT 
        role,
        COUNT(*) as count
      FROM users 
      WHERE role != 'admin'
      GROUP BY role
      ORDER BY count DESC
    `);
    
    roleStats.forEach(stat => {
      console.log(`   ${stat.role}: ${stat.count} users`);
    });
    
    await db.end();
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testDisputeRoles();