// Clean up duplicate user_notifications records
import db from './config/db.js';

async function cleanupDuplicateNotifications() {
  try {
    console.log('🧹 Cleaning up duplicate notification records...\n');
    
    // First, let's see what we're dealing with
    console.log('Before cleanup - Notifications with multiple recipients:');
    const [beforeCleanup] = await db.execute(`
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
      ORDER BY n.created_at DESC
    `);
    
    console.table(beforeCleanup);
    
    if (beforeCleanup.length === 0) {
      console.log('✅ No duplicate notifications found');
      process.exit(0);
    }
    
    console.log(`\n🔍 Found ${beforeCleanup.length} notifications with duplicate recipients`);
    
    // For each duplicate notification, we need to determine which user should actually receive it
    // and remove the incorrect recipients
    
    for (const duplicate of beforeCleanup) {
      console.log(`\n🔧 Processing notification ID ${duplicate.notification_id}...`);
      
      // Get the notification details to determine the correct recipient
      const [notificationDetails] = await db.execute(`
        SELECT n.*, n.message
        FROM notifications n
        WHERE n.id = ?
      `, [duplicate.notification_id]);
      
      if (notificationDetails.length === 0) continue;
      
      const notification = notificationDetails[0];
      
      // Extract quote ID from the message
      const quoteIdMatch = notification.message.match(/Quote #(\d+)/);
      if (!quoteIdMatch) {
        console.log(`❌ Could not extract quote ID from message: ${notification.message}`);
        continue;
      }
      
      const quoteId = parseInt(quoteIdMatch[1]);
      console.log(`📋 Quote ID: ${quoteId}`);
      
      // Find the correct company that should receive this notification
      const [correctRecipient] = await db.execute(`
        SELECT qr.company_id as correct_company_id, u.name as correct_company_name
        FROM user_quote_status uqs
        JOIN quote_responses qr ON uqs.quote_response_id = qr.id
        JOIN users u ON qr.company_id = u.id
        WHERE uqs.quote_id = ? AND uqs.status = 'accepted'
        LIMIT 1
      `, [quoteId]);
      
      if (correctRecipient.length === 0) {
        console.log(`❌ Could not find correct recipient for quote ${quoteId}`);
        continue;
      }
      
      const correctCompanyId = correctRecipient[0].correct_company_id;
      const correctCompanyName = correctRecipient[0].correct_company_name;
      
      console.log(`✅ Correct recipient: ${correctCompanyName} (ID: ${correctCompanyId})`);
      
      // Remove incorrect user_notification records (keep only the correct one)
      const [deleteResult] = await db.execute(`
        DELETE FROM user_notifications 
        WHERE notification_id = ? AND user_id != ?
      `, [duplicate.notification_id, correctCompanyId]);
      
      console.log(`🗑️  Removed ${deleteResult.affectedRows} incorrect notification records`);
    }
    
    // Verify cleanup
    console.log('\n🔍 After cleanup - Checking for remaining duplicates:');
    const [afterCleanup] = await db.execute(`
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
      ORDER BY n.created_at DESC
    `);
    
    if (afterCleanup.length === 0) {
      console.log('✅ All duplicates cleaned up successfully!');
    } else {
      console.log('❌ Some duplicates remain:');
      console.table(afterCleanup);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanupDuplicateNotifications();