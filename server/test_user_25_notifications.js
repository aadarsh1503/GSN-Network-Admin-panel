// Test notifications for user 25
import db from './config/db.js';

async function testUser25Notifications() {
  try {
    const userId = 25;
    const userRole = 'company';
    
    console.log('Testing notification query for user 25...');
    
    const sql = `
      SELECT DISTINCT n.*, 
             un.is_read, 
             un.read_at,
             CASE 
                 WHEN un.user_id IS NOT NULL THEN 1 
                 ELSE 0 
             END as is_user_specific
      FROM notifications n
      LEFT JOIN user_notifications un ON (n.id = un.notification_id AND un.user_id = ?)
      WHERE (
          -- User-specific notifications (only if there's a matching entry in user_notifications)
          (n.target_role = 'user_specific' AND un.user_id = ?)
          OR 
          -- General notifications for all users or their role (excluding user-specific ones)
          ((n.target_audience = 'all' OR 
           (n.target_audience = 'companies' AND ? = 'company') OR
           (n.target_audience = 'businesses' AND ? = 'business') OR
           (n.target_audience = 'users' AND ? = 'user'))
          AND n.target_role != 'user_specific')
      )
      ORDER BY n.created_at DESC
      LIMIT 50
    `;
    
    const [rows] = await db.execute(sql, [userId, userId, userRole, userRole, userRole]);
    
    console.log(`Found ${rows.length} notifications for user ${userId}:`);
    console.table(rows);
    
    // Also test a simpler query to see user-specific notifications
    console.log('\n--- Testing simpler query for user-specific notifications ---');
    const simpleSQL = `
      SELECT n.*, un.is_read, un.read_at
      FROM notifications n
      JOIN user_notifications un ON n.id = un.notification_id
      WHERE un.user_id = ? AND n.target_role = 'user_specific'
      ORDER BY n.created_at DESC
    `;
    
    const [simpleRows] = await db.execute(simpleSQL, [userId]);
    console.log(`Found ${simpleRows.length} user-specific notifications:`);
    console.table(simpleRows);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testUser25Notifications();