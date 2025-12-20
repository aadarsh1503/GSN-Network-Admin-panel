import db from './config/db.js';

async function checkEmailLogs() {
    try {
        console.log('Checking email logs...\n');
        
        // Check if email_notifications table exists
        const [tables] = await db.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'GSN' AND TABLE_NAME = 'email_notifications'
        `);
        
        if (tables.length > 0) {
            console.log('Email notifications table exists. Checking recent emails...');
            
            const [emails] = await db.execute(`
                SELECT * FROM email_notifications 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
                ORDER BY created_at DESC
                LIMIT 10
            `);
            
            console.log(`Found ${emails.length} recent emails:`);
            emails.forEach((email, index) => {
                console.log(`${index + 1}. To: ${email.recipient_email}`);
                console.log(`   Subject: ${email.subject}`);
                console.log(`   Type: ${email.type}`);
                console.log(`   Status: ${email.status}`);
                console.log(`   Time: ${email.created_at}`);
                console.log('---');
            });
        } else {
            console.log('Email notifications table does not exist.');
            console.log('Emails are being sent but not logged to database.');
        }
        
        // Check recent user acceptances to see if thank you emails should have been sent
        console.log('\nChecking recent user acceptances...');
        const [recentAcceptances] = await db.execute(`
            SELECT 
                uqs.quote_id,
                uqs.user_id,
                uqs.company_id,
                uqs.accepted_at,
                u.name as user_name,
                u.email as user_email,
                c.name as company_name,
                c.email as company_email,
                c.phone as company_phone
            FROM user_quote_status uqs
            LEFT JOIN users u ON uqs.user_id = u.id
            LEFT JOIN users c ON uqs.company_id = c.id
            WHERE uqs.status = 'accepted'
            AND uqs.accepted_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
            ORDER BY uqs.accepted_at DESC
        `);
        
        console.log(`Found ${recentAcceptances.length} recent acceptances:`);
        recentAcceptances.forEach((acceptance, index) => {
            console.log(`${index + 1}. Quote #${acceptance.quote_id}`);
            console.log(`   User: ${acceptance.user_name} (${acceptance.user_email})`);
            console.log(`   Company: ${acceptance.company_name} (${acceptance.company_email})`);
            console.log(`   Phone: ${acceptance.company_phone || 'N/A'}`);
            console.log(`   Accepted: ${acceptance.accepted_at}`);
            console.log(`   → Thank you email should have been sent to: ${acceptance.user_email}`);
            console.log('---');
        });
        
    } catch (error) {
        console.error('Error checking email logs:', error);
    } finally {
        process.exit(0);
    }
}

checkEmailLogs();