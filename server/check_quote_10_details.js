// Check Quote #10 details and notification issue
import db from './config/db.js';

async function checkQuote10Details() {
    try {
        console.log('🔍 Checking Quote #10 details and notifications...\n');
        
        // 1. Get all responses for Quote #10
        console.log('1️⃣ All responses for Quote #10:');
        const [responses] = await db.execute(`
            SELECT qr.*, u.name as company_name, u.email as company_email
            FROM quote_responses qr
            JOIN users u ON qr.company_id = u.id
            WHERE qr.quote_id = 10
            ORDER BY qr.created_at
        `);
        
        responses.forEach(resp => {
            console.log(`  - Company: ${resp.company_name} (ID: ${resp.company_id})`);
            console.log(`    Price: $${resp.price}, Status: ${resp.status}`);
            console.log(`    Email: ${resp.company_email}`);
            console.log('');
        });
        
        // 2. Check user_quote_status for Quote #10
        console.log('2️⃣ User acceptance status for Quote #10:');
        const [userStatus] = await db.execute(`
            SELECT uqs.*, qr.company_id, u.name as company_name
            FROM user_quote_status uqs
            JOIN quote_responses qr ON uqs.quote_response_id = qr.id
            JOIN users u ON qr.company_id = u.id
            WHERE uqs.quote_id = 10
        `);
        
        if (userStatus.length > 0) {
            userStatus.forEach(status => {
                console.log(`  - User ${status.user_id} ${status.status} company ${status.company_id} (${status.company_name})`);
                console.log(`    Response ID: ${status.quote_response_id}`);
                console.log(`    ${status.status === 'accepted' ? 'Accepted' : 'Rejected'} at: ${status.accepted_at || status.rejected_at}`);
            });
        } else {
            console.log('  - No user acceptance/rejection records found');
        }
        
        // 3. Check recent notifications for Quote #10
        console.log('\n3️⃣ Recent notifications for Quote #10:');
        const [notifications] = await db.execute(`
            SELECT n.*, un.user_id as target_user_id, u.name as target_company_name
            FROM notifications n
            LEFT JOIN user_notifications un ON n.id = un.notification_id
            LEFT JOIN users u ON un.user_id = u.id
            WHERE n.message LIKE '%Quote #10%'
            ORDER BY n.created_at DESC
        `);
        
        if (notifications.length > 0) {
            notifications.forEach(notif => {
                console.log(`  - "${notif.title}"`);
                console.log(`    Target: ${notif.target_company_name || 'All'} (ID: ${notif.target_user_id || 'N/A'})`);
                console.log(`    Created: ${notif.created_at}`);
                console.log(`    Message: ${notif.message.substring(0, 100)}...`);
                console.log('');
            });
        } else {
            console.log('  - No notifications found for Quote #10');
        }
        
        // 4. Check which company should have gotten the notification
        console.log('4️⃣ Who should have received the acceptance notification:');
        const [acceptedResponse] = await db.execute(`
            SELECT qr.company_id, u.name as company_name, u.email as company_email
            FROM quote_responses qr
            JOIN user_quote_status uqs ON qr.id = uqs.quote_response_id
            JOIN users u ON qr.company_id = u.id
            WHERE qr.quote_id = 10 AND uqs.status = 'accepted'
        `);
        
        if (acceptedResponse.length > 0) {
            const company = acceptedResponse[0];
            console.log(`  - Company ${company.company_id} (${company.company_name}) should have received the notification`);
            console.log(`  - Email: ${company.company_email}`);
        } else {
            console.log('  - No accepted response found for Quote #10');
        }
        
        // 5. Summary
        console.log('\n📋 SUMMARY:');
        console.log(`- Quote #10 has ${responses.length} responses`);
        console.log(`- User acceptance records: ${userStatus.length}`);
        console.log(`- Notifications sent: ${notifications.length}`);
        
        if (acceptedResponse.length > 0) {
            console.log(`- ✅ Company ${acceptedResponse[0].company_id} (${acceptedResponse[0].company_name}) got their quote accepted`);
            console.log(`- ❌ If you're company 8, you should NOT see this quote in "My Accepted Quotes"`);
        }
        
    } catch (error) {
        console.error('❌ Error checking Quote #10 details:', error);
    } finally {
        process.exit(0);
    }
}

checkQuote10Details();