// Test script to verify the complete quote acceptance flow
import db from './config/db.js';

async function testCompleteFlow() {
    try {
        console.log('Testing complete quote acceptance flow...\n');
        
        // 1. Check if there are any accepted quotes
        console.log('1. Checking accepted quotes in database...');
        const [acceptedQuotes] = await db.execute(`
            SELECT 
                q.id as quote_id,
                q.status as quote_status,
                qr.id as response_id,
                qr.company_id,
                qr.status as response_status,
                uqs.status as user_response_status,
                uqs.accepted_at,
                u.name as user_name,
                u.email as user_email,
                c.name as company_name,
                c.email as company_email
            FROM quotes q
            JOIN quote_responses qr ON q.id = qr.quote_id
            LEFT JOIN user_quote_status uqs ON qr.id = uqs.quote_response_id
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN users c ON qr.company_id = c.id
            WHERE uqs.status = 'accepted'
            ORDER BY uqs.accepted_at DESC
            LIMIT 5
        `);
        
        console.log(`Found ${acceptedQuotes.length} accepted quotes:\n`);
        
        acceptedQuotes.forEach((quote, index) => {
            console.log(`=== Accepted Quote ${index + 1} ===`);
            console.log(`Quote ID: ${quote.quote_id}`);
            console.log(`Quote Status: ${quote.quote_status}`);
            console.log(`Response Status: ${quote.response_status}`);
            console.log(`User Response: ${quote.user_response_status}`);
            console.log(`Accepted At: ${quote.accepted_at}`);
            console.log(`User: ${quote.user_name} (${quote.user_email})`);
            console.log(`Company: ${quote.company_name} (${quote.company_email})`);
            console.log('---\n');
        });
        
        // 2. Test the API query that MyQuotes page will use
        console.log('2. Testing company accepted quotes API query...');
        const companyId = 8; // Use a company ID that has accepted quotes
        
        const [apiResult] = await db.execute(`
            SELECT q.*, 
                   qr.price, qr.transit_time, qr.created_at as response_date,
                   uqs.accepted_at, uqs.status as user_response_status,
                   u.name as user_name, u.email as user_email, u.phone as user_phone,
                   COUNT(qr2.id) as total_responses
            FROM quotes q
            JOIN quote_responses qr ON q.id = qr.quote_id
            JOIN user_quote_status uqs ON (qr.id = uqs.quote_response_id AND uqs.status = 'accepted')
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN quote_responses qr2 ON q.id = qr2.quote_id
            WHERE qr.company_id = ?
            GROUP BY q.id, qr.id, uqs.id
            ORDER BY uqs.accepted_at DESC
        `, [companyId]);
        
        console.log(`API would return ${apiResult.length} quotes for company ${companyId}:\n`);
        
        apiResult.forEach((quote, index) => {
            console.log(`Quote ${index + 1}:`);
            console.log(`  ID: ${quote.id}`);
            console.log(`  Status: ${quote.status}`);
            console.log(`  Price: $${quote.price}`);
            console.log(`  Customer: ${quote.user_name || 'N/A'}`);
            console.log(`  Accepted: ${quote.accepted_at}`);
            console.log('---');
        });
        
        // 3. Check recent messages for thank you confirmations
        console.log('\n3. Checking recent messages for thank you confirmations...');
        const [recentMessages] = await db.execute(`
            SELECT 
                m.id,
                m.subject,
                m.message,
                m.created_at,
                sender.name as sender_name,
                receiver.name as receiver_name
            FROM messages m
            LEFT JOIN users sender ON m.sender_id = sender.id
            LEFT JOIN users receiver ON m.receiver_id = receiver.id
            WHERE m.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
            AND (m.subject LIKE '%Thank%' OR m.subject LIKE '%Accept%' OR m.subject LIKE '%Status%')
            ORDER BY m.created_at DESC
            LIMIT 10
        `);
        
        console.log(`Found ${recentMessages.length} recent messages:\n`);
        
        recentMessages.forEach((msg, index) => {
            console.log(`Message ${index + 1}:`);
            console.log(`  Subject: ${msg.subject}`);
            console.log(`  From: ${msg.sender_name || 'System'} To: ${msg.receiver_name}`);
            console.log(`  Time: ${msg.created_at}`);
            console.log(`  Preview: ${msg.message.substring(0, 100)}...`);
            console.log('---');
        });
        
        console.log('\n✅ Complete flow test completed!');
        
    } catch (error) {
        console.error('❌ Error testing complete flow:', error);
    } finally {
        process.exit(0);
    }
}

testCompleteFlow();