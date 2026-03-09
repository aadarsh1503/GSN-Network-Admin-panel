import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config({ path: './.env' });

async function clearAdminNotifications() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to database successfully\n');

    // Check current count
    const [countBefore] = await connection.query('SELECT COUNT(*) as count FROM admin_notifications');
    console.log(`📊 Current rows in admin_notifications: ${countBefore[0].count}\n`);

    // Clear the table
    const [result] = await connection.query('DELETE FROM admin_notifications');
    
    console.log('✅ admin_notifications table cleared successfully!');
    console.log(`🗑️  Deleted ${result.affectedRows} rows\n`);

    // Verify
    const [countAfter] = await connection.query('SELECT COUNT(*) as count FROM admin_notifications');
    console.log(`📊 Remaining rows: ${countAfter[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

clearAdminNotifications();
