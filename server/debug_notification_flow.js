// Debug the notification flow to see why wrong companies are getting notifications
import db from './config/db.js';

async function debugNotificationFlow() {
  try {
    console.log('🔍 Debugging notification flow...\n');
    
    // Get the most recent quote acceptance
    const [recentAcceptance] = await db.execute(`
      SELECT 
        uqs.*,
        qr.company_id as quote_response_company_id,
        q.user_id as quote_user_id,
        u1.name as accepting_user_name,
        u2.name as company_name
      FROM user_quote_status uqs
      JOIN quote_responses qr ON uqs.quote_response_id = qr.id
      JOIN quotes q ON uqs.quote_id = q.id
      JOIN users u1 ON q.user_id = u1.id
      JOIN users u2 ON qr.company_id = u2.id
      WHERE uqs.status = 'accepted'
      ORDER BY uqs.accepted_at DESC
      LIMIT 1
    `);
    
    if (recentAcceptance.length === 0) {
      console.log('No accepted quotes found');
      return;
    }
    
    const acceptance = recentAcceptance[0];
    console.log('Most recent quote acceptance:');
    console.table([acceptance]);
    
    // Check what notification was created for this acceptance
    console.log('\n🔍 Checking notifications created around this time...');
    const [notifications] = await db.execute(`
      SELECT n.*, un.user_id as recipient_user_id, u.name as recipient_name
      FROM notifications n
      LEFT JOIN user_notifications un ON n.id = un.notification_id
      LEFT JOIN users u ON un.user_id = u.id
      WHERE n.title = 'Quote Accepted!' 
      AND n.message LIKE ?
      ORDER BY n.created_at DESC
      LIMIT 5
    `, [`%Quote #${acceptance.quote_id}%`]);
    
    console.log('Notifications for this quote:');
    console.table(notifications);
    
    // The issue analysis
    console.log('\n📊 ANALYSIS:');
    console.log(`Quote #${acceptance.quote_id} was accepted by user: ${acceptance.accepting_user_name}`);
    console.log(`Quote response was provided by company: ${acceptance.company_name} (ID: ${acceptance.quote_response_company_id})`);
    console.log(`But notification was sent to user ID: ${notifications[0]?.recipient_user_id} (${notifications[0]?.recipient_name})`);
    
    if (acceptance.quote_response_company_id !== notifications[0]?.recipient_user_id) {
      console.log('\n❌ MISMATCH CONFIRMED!');
      console.log(`Should send to: Company ID ${acceptance.quote_response_company_id} (${acceptance.company_name})`);
      console.log(`Actually sent to: User ID ${notifications[0]?.recipient_user_id} (${notifications[0]?.recipient_name})`);
    } else {
      console.log('\n✅ Notification sent to correct company');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugNotificationFlow();