// Final cleanup of remaining duplicate
import db from './config/db.js';

async function finalCleanup() {
  try {
    console.log('Cleaning up the remaining duplicate for Quote #999...');
    
    // Remove the duplicate for user 25, keep it for user 10
    const [result] = await db.execute('DELETE FROM user_notifications WHERE notification_id = 36 AND user_id = 25');
    console.log(`Removed ${result.affectedRows} incorrect records for notification 36`);
    
    // Verify no more duplicates exist
    const [remaining] = await db.execute(`
      SELECT 
        n.id as notification_id,
        n.title,
        COUNT(un.user_id) as recipient_count,
        GROUP_CONCAT(CONCAT(un.user_id, ':', u.name) SEPARATOR ', ') as recipients
      FROM notifications n
      JOIN user_notifications un ON n.id = un.notification_id
      JOIN users u ON un.user_id = u.id
      WHERE n.title = 'Quote Accepted!'
      GROUP BY n.id, n.title
      HAVING COUNT(un.user_id) > 1
    `);
    
    if (remaining.length === 0) {
      console.log('✅ All duplicates cleaned up successfully!');
    } else {
      console.log('❌ Some duplicates still remain:');
      console.table(remaining);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

finalCleanup();