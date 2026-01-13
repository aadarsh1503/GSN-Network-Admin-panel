// Check for notification duplicates
import db from './config/db.js';

async function checkNotificationDuplicates() {
  try {
    console.log('Checking how notifications are being duplicated...');
    
    // Check if the same notification ID has multiple user_notification records
    const [duplicates] = await db.execute(`
      SELECT 
        n.id as notification_id,
        n.title,
        n.message,
        COUNT(un.user_id) as recipient_count,
        GROUP_CONCAT(CONCAT(un.user_id, ':', u.name) SEPARATOR ', ') as recipients
      FROM notifications n
      JOIN user_notifications un ON n.id = un.notification_id
      JOIN users u ON un.user_id = u.id
      WHERE n.title = 'Quote Accepted!'
      GROUP BY n.id, n.title, n.message
      HAVING COUNT(un.user_id) > 1
      ORDER BY n.created_at DESC
      LIMIT 5
    `);
    
    console.log('Notifications with multiple recipients:');
    console.table(duplicates);
    
    if (duplicates.length > 0) {
      console.log('\n❌ CONFIRMED: Same notifications are being sent to multiple companies!');
      console.log('Each notification should only have ONE recipient, but these have multiple.');
      
      // Show details of the first duplicate
      const firstDuplicate = duplicates[0];
      console.log(`\nExample: Notification ID ${firstDuplicate.notification_id} was sent to: ${firstDuplicate.recipients}`);
    } else {
      console.log('\n✅ No duplicate recipients found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkNotificationDuplicates();