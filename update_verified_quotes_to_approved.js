// Script to update existing quotes with verified payments to approved status
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gsn_network',
  port: process.env.DB_PORT || 3306
};

async function updateVerifiedQuotesToApproved() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ Connected to database');
    
    // First, let's check current status of quotes with verified payments
    console.log('\n📊 Checking current quote statuses...');
    
    const [currentStatus] = await connection.execute(`
      SELECT 
        q.id as quote_id,
        q.status as current_quote_status,
        pv.verification_status,
        pv.verification_date,
        u.name as customer_name,
        c.name as company_name
      FROM quotes q
      JOIN payment_verifications pv ON q.id = pv.quote_id
      JOIN users u ON q.user_id = u.id
      JOIN users c ON pv.company_id = c.id
      WHERE pv.verification_status = 'verified'
      ORDER BY pv.verification_date DESC
    `);
    
    console.log(`\n📋 Found ${currentStatus.length} quotes with verified payments:`);
    currentStatus.forEach(quote => {
      console.log(`   Quote #${quote.quote_id}: ${quote.current_quote_status} (${quote.customer_name} → ${quote.company_name})`);
    });
    
    if (currentStatus.length === 0) {
      console.log('ℹ️  No quotes with verified payments found. Nothing to update.');
      return;
    }
    
    // Update quotes with verified payments to approved status
    console.log('\n🔄 Updating quotes with verified payments to approved status...');
    
    const [updateResult] = await connection.execute(`
      UPDATE quotes q
      JOIN payment_verifications pv ON q.id = pv.quote_id
      SET q.status = 'approved'
      WHERE pv.verification_status = 'verified' 
      AND q.status != 'approved'
    `);
    
    console.log(`✅ Updated ${updateResult.affectedRows} quotes to approved status`);
    
    // Also update user_quote_status table
    console.log('\n🔄 Updating user quote status records...');
    
    const [userStatusUpdate] = await connection.execute(`
      UPDATE user_quote_status uqs
      JOIN payment_verifications pv ON uqs.quote_id = pv.quote_id AND uqs.user_id = pv.user_id
      SET uqs.payment_verification_status = 'verified'
      WHERE pv.verification_status = 'verified'
      AND uqs.status = 'accepted'
    `);
    
    console.log(`✅ Updated ${userStatusUpdate.affectedRows} user quote status records`);
    
    // Verify the updates
    console.log('\n🔍 Verifying updates...');
    
    const [verifyResult] = await connection.execute(`
      SELECT 
        q.id as quote_id,
        q.status as new_quote_status,
        pv.verification_status,
        pv.verification_date,
        u.name as customer_name,
        c.name as company_name
      FROM quotes q
      JOIN payment_verifications pv ON q.id = pv.quote_id
      JOIN users u ON q.user_id = u.id
      JOIN users c ON pv.company_id = c.id
      WHERE pv.verification_status = 'verified'
      ORDER BY pv.verification_date DESC
    `);
    
    console.log(`\n✅ Verification complete - ${verifyResult.length} quotes now have correct status:`);
    verifyResult.forEach(quote => {
      const statusIcon = quote.new_quote_status === 'approved' ? '✅' : '⚠️';
      console.log(`   ${statusIcon} Quote #${quote.quote_id}: ${quote.new_quote_status} (${quote.customer_name} → ${quote.company_name})`);
    });
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`   • Total quotes with verified payments: ${currentStatus.length}`);
    console.log(`   • Quotes updated to approved: ${updateResult.affectedRows}`);
    console.log(`   • User status records updated: ${userStatusUpdate.affectedRows}`);
    
    console.log('\n🎉 Database update completed successfully!');
    console.log('💡 All existing quotes with verified payments are now marked as approved');
    
  } catch (error) {
    console.error('❌ Error updating quotes:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the update
updateVerifiedQuotesToApproved()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });