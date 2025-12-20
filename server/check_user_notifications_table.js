// Check user_notifications table structure
import db from './config/db.js';

async function checkUserNotificationsTable() {
    try {
        console.log('Checking user_notifications table structure...\n');
        
        const [rows] = await db.execute('DESCRIBE user_notifications');
        console.log('user_notifications table structure:');
        rows.forEach(row => {
            console.log(`${row.Field}: ${row.Type} ${row.Null === 'YES' ? '(nullable)' : '(not null)'} ${row.Key ? `[${row.Key}]` : ''}`);
        });
        
    } catch (error) {
        console.error('Error checking user_notifications table:', error);
    } finally {
        process.exit(0);
    }
}

checkUserNotificationsTable();