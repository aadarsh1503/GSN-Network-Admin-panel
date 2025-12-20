// Test the fixed notification system
import { 
    sendQuoteAcceptanceNotificationToCompany,
    sendQuoteRejectionNotificationToCompany 
} from './services/notificationService.js';
import db from './config/db.js';

async function testNotificationFix() {
    try {
        console.log('🧪 Testing fixed notification system...\n');
        
        // Test parameters
        const companyId1 = 8; // First company
        const companyId2 = 2; // Second company (different)
        const userName = 'Test User';
        const quoteId = 999; // Test quote ID
        
        console.log('1️⃣ Sending acceptance notification to company 8...');
        await sendQuoteAcceptanceNotificationToCompany(companyId1, userName, quoteId);
        
        console.log('2️⃣ Sending rejection notification to company 2...');
        await sendQuoteRejectionNotificationToCompany(companyId2, userName, quoteId + 1);
        
        // Check what was created
        console.log('\n📊 Checking created notifications...');
        
        const [notifications] = await db.execute(`
            SELECT n.*, un.user_id as target_user_id 
            FROM notifications n 
            LEFT JOIN user_notifications un ON n.id = un.notification_id 
            WHERE n.created_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)
            ORDER BY n.created_at DESC
        `);
        
        console.log('Recent notifications:');
        notifications.forEach(notif => {
            console.log(`- ID: ${notif.id}, Title: "${notif.title}", Target User: ${notif.target_user_id}, Target Role: ${notif.target_role}`);
        });
        
        // Test fetching notifications for each company
        console.log('\n🔍 Testing notification fetching...');
        
        // Simulate API call for company 8
        console.log('\nNotifications for Company 8:');
        const [company8Notifs] = await db.execute(`
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
                un.user_id = ?
                OR 
                (n.target_audience = 'all' OR 
                 (n.target_audience = 'companies' AND 'company' = 'company'))
                AND n.target_role != 'user_specific'
            )
            ORDER BY n.created_at DESC
            LIMIT 10
        `, [8, 8]);
        
        company8Notifs.forEach(notif => {
            console.log(`  - "${notif.title}" (User-specific: ${notif.is_user_specific ? 'Yes' : 'No'})`);
        });
        
        // Simulate API call for company 2
        console.log('\nNotifications for Company 2:');
        const [company2Notifs] = await db.execute(`
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
                un.user_id = ?
                OR 
                (n.target_audience = 'all' OR 
                 (n.target_audience = 'companies' AND 'company' = 'company'))
                AND n.target_role != 'user_specific'
            )
            ORDER BY n.created_at DESC
            LIMIT 10
        `, [2, 2]);
        
        company2Notifs.forEach(notif => {
            console.log(`  - "${notif.title}" (User-specific: ${notif.is_user_specific ? 'Yes' : 'No'})`);
        });
        
        console.log('\n✅ Notification fix test completed!');
        console.log('\n📋 Summary:');
        console.log(`- Company 8 should see acceptance notification: ${company8Notifs.some(n => n.title.includes('Accepted')) ? '✅' : '❌'}`);
        console.log(`- Company 2 should see rejection notification: ${company2Notifs.some(n => n.title.includes('Not Selected')) ? '✅' : '❌'}`);
        console.log(`- Company 8 should NOT see rejection notification: ${!company8Notifs.some(n => n.title.includes('Not Selected') && n.is_user_specific) ? '✅' : '❌'}`);
        console.log(`- Company 2 should NOT see acceptance notification: ${!company2Notifs.some(n => n.title.includes('Accepted') && n.is_user_specific) ? '✅' : '❌'}`);
        
    } catch (error) {
        console.error('❌ Error testing notification fix:', error);
    } finally {
        process.exit(0);
    }
}

testNotificationFix();