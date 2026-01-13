// Check for company users to test with
import dotenv from 'dotenv';
dotenv.config();

import db from './config/db.js';

async function checkCompanyUsers() {
  try {
    console.log('🔍 Checking for company users...');
    
    // Get company users
    const [companyUsers] = await db.execute(`
      SELECT id, name, email, role, created_at 
      FROM users 
      WHERE role = 'company'
      ORDER BY created_at ASC
      LIMIT 5
    `);
    
    console.log(`📊 Found ${companyUsers.length} company users:`);
    
    if (companyUsers.length === 0) {
      console.log('❌ No company users found!');
    } else {
      companyUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user.id}, Name: ${user.name || 'No name'}, Email: ${user.email}`);
      });
      
      // Check if any have existing bank details
      const [bankDetails] = await db.execute(`
        SELECT company_id, COUNT(*) as count 
        FROM company_bank_details 
        GROUP BY company_id
      `);
      
      console.log('\n📋 Company bank details count:');
      bankDetails.forEach(detail => {
        const user = companyUsers.find(u => u.id === detail.company_id);
        console.log(`  - Company ID ${detail.company_id} (${user?.email || 'Unknown'}): ${detail.count} bank details`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking company users:', error);
  } finally {
    await db.end();
  }
}

checkCompanyUsers();