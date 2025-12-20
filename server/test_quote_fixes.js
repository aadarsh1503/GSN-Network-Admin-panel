// Test script to verify quote status fixes
import db from './config/db.js';

async function testQuoteStatusFixes() {
    try {
        console.log('Testing quote status fixes...\n');
        
        // 1. Check if user_quote_status table exists and has proper structure
        console.log('1. Checking user_quote_status table structure...');
        const [tableInfo] = await db.execute(`
            DESCRIBE user_quote_status
        `);
        
        console.log('Table structure:');
        tableInfo.forEach(column => {
            console.log(`  - ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key ? `(${column.Key})` : ''}`);
        });
        
        // 2. Check for any existing inconsistent data
        console.log('\n2. Checking for inconsistent quote response data...');
        const [inconsistentData] = await db.execute(`
            SELECT 
                qr.quote_id,
                COUNT(CASE WHEN qr.status = 'accepted' THEN 1 END) as accepted_count,
                COUNT(CASE WHEN qr.status = 'rejected' THEN 1 END) as rejected_count,
                GROUP_CONCAT(CASE WHEN qr.status = 'accepted' THEN qr.company_id END) as accepted_companies,
                GROUP_CONCAT(CASE WHEN qr.status = 'rejected' THEN qr.company_id END) as rejected_companies
            FROM quote_responses qr
            WHERE qr.status IN ('accepted', 'rejected')
            GROUP BY qr.quote_id
            HAVING accepted_count > 1 OR (accepted_count > 0 AND rejected_count > 0)
        `);
        
        if (inconsistentData.length > 0) {
            console.log('Found inconsistent data:');
            inconsistentData.forEach(row => {
                console.log(`  Quote ${row.quote_id}: ${row.accepted_count} accepted, ${row.rejected_count} rejected`);
                if (row.accepted_companies) {
                    console.log(`    Accepted by companies: ${row.accepted_companies}`);
                }
                if (row.rejected_companies) {
                    console.log(`    Rejected by companies: ${row.rejected_companies}`);
                }
            });
        } else {
            console.log('No inconsistent data found.');
        }
        
        // 3. Check user_quote_status tracking
        console.log('\n3. Checking user_quote_status tracking...');
        const [userQuoteStatus] = await db.execute(`
            SELECT 
                uqs.quote_id,
                uqs.user_id,
                COUNT(*) as response_count,
                GROUP_CONCAT(uqs.status) as statuses,
                GROUP_CONCAT(uqs.company_id) as companies
            FROM user_quote_status uqs
            GROUP BY uqs.quote_id, uqs.user_id
            ORDER BY uqs.quote_id
        `);
        
        if (userQuoteStatus.length > 0) {
            console.log('User quote status tracking:');
            userQuoteStatus.forEach(row => {
                console.log(`  Quote ${row.quote_id}, User ${row.user_id}: ${row.response_count} responses (${row.statuses}) to companies (${row.companies})`);
            });
        } else {
            console.log('No user quote status records found.');
        }
        
        // 4. Check notifications table
        console.log('\n4. Checking recent notifications...');
        const [recentNotifications] = await db.execute(`
            SELECT 
                n.id,
                n.target_role,
                n.title,
                n.message,
                n.created_at,
                COUNT(un.id) as user_notification_count
            FROM notifications n
            LEFT JOIN user_notifications un ON n.id = un.notification_id
            WHERE n.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
            GROUP BY n.id
            ORDER BY n.created_at DESC
            LIMIT 10
        `);
        
        if (recentNotifications.length > 0) {
            console.log('Recent notifications (last 24 hours):');
            recentNotifications.forEach(notif => {
                console.log(`  ${notif.created_at}: "${notif.title}" for ${notif.target_role} (${notif.user_notification_count} user notifications)`);
            });
        } else {
            console.log('No recent notifications found.');
        }
        
        console.log('\n✅ Quote status fixes test completed!');
        
    } catch (error) {
        console.error('❌ Error testing quote status fixes:', error);
    } finally {
        process.exit(0);
    }
}

testQuoteStatusFixes();