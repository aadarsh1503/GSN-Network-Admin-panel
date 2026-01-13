// Check if admin user exists and what the credentials are
import dotenv from 'dotenv';
dotenv.config();

import db from './config/db.js';

async function checkAdminUser() {
  try {
    console.log('🔍 Checking for admin users...');
    
    // Get all admin users
    const [adminUsers] = await db.execute(`
      SELECT id, name, email, role, created_at 
      FROM users 
      WHERE role = 'admin'
      ORDER BY created_at ASC
    `);
    
    console.log(`📊 Found ${adminUsers.length} admin users:`);
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found!');
      console.log('💡 You may need to create an admin user first');
    } else {
      adminUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
      });
    }
    
    // Check if there are any users at all
    const [allUsers] = await db.execute('SELECT COUNT(*) as count, role FROM users GROUP BY role');
    console.log('\n📋 User count by role:');
    allUsers.forEach(roleCount => {
      console.log(`  - ${roleCount.role}: ${roleCount.count} users`);
    });
    
  } catch (error) {
    console.error('❌ Error checking admin users:', error);
  } finally {
    await db.end();
  }
}

checkAdminUser();