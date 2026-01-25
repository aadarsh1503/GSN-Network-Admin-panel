// Script to revert business users to pending approval status
import db from './config/db.js';

const revertBusinessUsers = async () => {
  try {
    console.log('🔄 Reverting business users to pending approval status...');
    
    // Update all business users to require admin approval (status = 0)
    // Except for any that might be blacklisted or have other issues
    const [result] = await db.execute(`
      UPDATE users 
      SET status = 0 
      WHERE role = 'business' 
      AND is_blacklisted = 0
      AND status = 1
    `);
    
    console.log(`✅ Updated ${result.affectedRows} business users to pending approval status`);
    
    // Check current status
    const [businessUsers] = await db.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_blacklisted = 1 THEN 1 ELSE 0 END) as blacklisted
      FROM users 
      WHERE role = 'business'
    `);
    
    const stats = businessUsers[0];
    console.log('📊 Business Users Status:');
    console.log(`   Total: ${stats.total}`);
    console.log(`   Pending Approval: ${stats.pending}`);
    console.log(`   Active: ${stats.active}`);
    console.log(`   Blacklisted: ${stats.blacklisted}`);
    
    console.log('✅ Business users reverted successfully!');
    console.log('ℹ️  Business users now require admin approval like company users');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to revert business users:', error);
    process.exit(1);
  }
};

revertBusinessUsers();