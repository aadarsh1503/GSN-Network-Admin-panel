// Update existing quotes with verified payments to approved status
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

async function updateQuotes() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    console.log('🔄 Updating quotes with verified payments to approved status...');
    
    // Update quotes with verified payments to approved status
    const [result] = await connection.execute(`
      UPDATE quotes q
      JOIN payment_verifications pv ON q.id = pv.quote_id
      SET q.status = 'approved'
      WHERE pv.verification_status = 'verified' 
      AND q.status != 'approved'
    `);
    
    console.log(`✅ Updated ${result.affectedRows} quotes to approved status`);
    
    // Verify the updates
    const [verify] = await connection.execute(`
      SELECT q.id, q.status, u.name as customer_name, u.role as customer_role
      FROM quotes q
      JOIN payment_verifications pv ON q.id = pv.quote_id
      JOIN users u ON q.user_id = u.id
      WHERE pv.verification_status = 'verified'
      ORDER BY q.id DESC
    `);
    
    console.log('\n📊 Current status of verified quotes:');
    verify.forEach(quote => {
      const roleIcon = quote.customer_role === 'business' ? '🏢' : '👤';
      const statusIcon = quote.status === 'approved' ? '✅' : '⚠️';
      console.log(`   ${statusIcon} Quote #${quote.id}: ${quote.status} (${roleIcon} ${quote.customer_name})`);
    });
    
    console.log(`\n📈 Summary: ${result.affectedRows} quotes updated, ${verify.length} total verified quotes`);
    
  } catch (error) {
    console.error('❌ Error updating quotes:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

updateQuotes();