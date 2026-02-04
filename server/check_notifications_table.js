// Check notifications table structure
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function checkNotificationsTable() {
  try {
    console.log('🔍 Checking notifications table structure...\n');

    // Check table structure
    const [structure] = await connection.execute('DESCRIBE notifications');
    
    console.log('📋 Current notifications table structure:');
    structure.forEach(col => {
      console.log(`   ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default}`);
    });

    // Check if we need to add missing columns
    const existingColumns = structure.map(col => col.Field);
    const requiredColumns = ['type', 'redirect_url', 'target_role', 'target_audience'];
    
    console.log('\n🔍 Required columns check:');
    const missingColumns = [];
    
    requiredColumns.forEach(col => {
      const exists = existingColumns.includes(col);
      console.log(`   ${exists ? '✅' : '❌'} ${col}: ${exists ? 'Present' : 'Missing'}`);
      if (!exists) {
        missingColumns.push(col);
      }
    });

    if (missingColumns.length > 0) {
      console.log(`\n⚠️ Missing columns detected: ${missingColumns.join(', ')}`);
      console.log('💡 Need to add these columns to support payment proof notifications');
      
      // Generate ALTER TABLE statements
      console.log('\n📝 SQL to add missing columns:');
      
      if (missingColumns.includes('type')) {
        console.log("ALTER TABLE notifications ADD COLUMN type VARCHAR(50) DEFAULT 'general' AFTER id;");
      }
      if (missingColumns.includes('redirect_url')) {
        console.log("ALTER TABLE notifications ADD COLUMN redirect_url VARCHAR(255) NULL AFTER message;");
      }
      if (missingColumns.includes('target_role')) {
        console.log("ALTER TABLE notifications ADD COLUMN target_role ENUM('user_specific', 'role_based', 'general') DEFAULT 'general' AFTER redirect_url;");
      }
      if (missingColumns.includes('target_audience')) {
        console.log("ALTER TABLE notifications ADD COLUMN target_audience ENUM('all', 'users', 'companies', 'businesses', 'admins') DEFAULT 'all' AFTER target_role;");
      }
    } else {
      console.log('\n✅ All required columns are present!');
    }

    // Check sample data
    console.log('\n📊 Sample notifications:');
    const [sampleData] = await connection.execute('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 3');
    
    if (sampleData.length > 0) {
      sampleData.forEach((notif, index) => {
        console.log(`${index + 1}. ID: ${notif.id} | Title: ${notif.title}`);
        console.log(`   Created: ${notif.created_at}`);
        if (notif.type) console.log(`   Type: ${notif.type}`);
        if (notif.redirect_url) console.log(`   Redirect: ${notif.redirect_url}`);
        console.log('');
      });
    } else {
      console.log('   No notifications found');
    }

  } catch (error) {
    console.error('❌ Error checking notifications table:', error);
  } finally {
    await connection.end();
  }
}

// Run the check
checkNotificationsTable();