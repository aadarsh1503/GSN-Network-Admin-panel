// Check notifications table structure
import db from './config/db.js';

async function checkNotificationsTable() {
    try {
        console.log('Checking notifications table structure...\n');
        
        const [rows] = await db.execute('DESCRIBE notifications');
        console.log('Notifications table structure:');
        rows.forEach(row => {
            console.log(`${row.Field}: ${row.Type} ${row.Null === 'YES' ? '(nullable)' : '(not null)'} ${row.Key ? `[${row.Key}]` : ''}`);
        });
        
        console.log('\nSample notifications:');
        const [notifications] = await db.execute('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5');
        notifications.forEach(notif => {
            console.log(`ID: ${notif.id}, Title: ${notif.title}, Target: ${notif.target_audience || notif.target_role || 'N/A'}`);
        });
        
        console.log('\nUser notifications sample:');
        const [userNotifs] = await db.execute('SELECT * FROM user_notifications LIMIT 5');
        userNotifs.forEach(un => {
            console.log(`User: ${un.user_id}, Notification: ${un.notification_id}, Read: ${un.is_read}`);
        });
        
    } catch (error) {
        console.error('Error checking notifications table:', error);
    } finally {
        process.exit(0);
    }
}

checkNotificationsTable();