import db from './config/db.js';

async function checkAcceptedQuotesData() {
    try {
        console.log('🔍 Checking accepted quotes data...\n');
        
        // Check user_quote_status table
        const [acceptedCount] = await db.execute('SELECT COUNT(*) as count FROM user_quote_status WHERE status = "accepted"');
        console.log(`📊 Accepted quotes in user_quote_status: ${acceptedCount[0].count}`);
        
        if (acceptedCount[0].count > 0) {
            const [acceptedDetails] = await db.execute(`
                SELECT 
                    uqs.id,
                    uqs.quote_id,
                    uqs.user_id,
                    uqs.company_id,
                    uqs.quote_response_id,
                    uqs.accepted_at,
                    qr.price,
                    u.name as user_name,
                    u.email as user_email,
                    c.name as company_name,
                    c.email as company_email,
                    q.product_description
                FROM user_quote_status uqs 
                LEFT JOIN quote_responses qr ON uqs.quote_response_id = qr.id
                LEFT JOIN users u ON uqs.user_id = u.id
                LEFT JOIN users c ON uqs.company_id = c.id
                LEFT JOIN quotes q ON uqs.quote_id = q.id
                WHERE uqs.status = 'accepted'
                ORDER BY uqs.accepted_at DESC
            `);
            
            console.log('\n✅ Accepted quote details:');
            acceptedDetails.forEach((quote, index) => {
                console.log(`${index + 1}. Quote #${quote.quote_id}`);
                console.log(`   User: ${quote.user_name} (${quote.user_email})`);
                console.log(`   Company: ${quote.company_name} (${quote.company_email})`);
                console.log(`   Product: ${quote.product_description}`);
                console.log(`   Price: $${quote.price}`);
                console.log(`   Accepted: ${quote.accepted_at}`);
                console.log('---');
            });
        }
        
        // Check transactions table
        const [transactionCount] = await db.execute('SELECT COUNT(*) as count FROM transactions');
        console.log(`\n💳 Transactions in transactions table: ${transactionCount[0].count}`);
        
        if (transactionCount[0].count > 0) {
            const [transactionDetails] = await db.execute('SELECT * FROM transactions LIMIT 5');
            console.log('\n💰 Transaction details:');
            transactionDetails.forEach((txn, index) => {
                console.log(`${index + 1}. ID: ${txn.id}, Amount: $${txn.amount}, Status: ${txn.status}`);
            });
        }
        
        // Test the new endpoint query
        console.log('\n🧪 Testing accepted quote transactions query...');
        const [testQuery] = await db.execute(`
            SELECT 
                uqs.id,
                uqs.user_id,
                u.name as user_name,
                u.email as user_email,
                uqs.company_id,
                c.name as company_name,
                c.email as company_email,
                uqs.quote_response_id,
                uqs.quote_id,
                q.product_description,
                qr.price as amount,
                'accepted_quote' as payment_method,
                CONCAT('QUOTE-', uqs.quote_id, '-', uqs.quote_response_id) as transaction_reference,
                'completed' as status,
                'Payment for accepted shipping quote' as description,
                uqs.accepted_at as created_at
            FROM user_quote_status uqs
            JOIN users u ON uqs.user_id = u.id
            LEFT JOIN users c ON uqs.company_id = c.id
            LEFT JOIN quote_responses qr ON uqs.quote_response_id = qr.id
            LEFT JOIN quotes q ON uqs.quote_id = q.id
            WHERE uqs.status = 'accepted'
            ORDER BY uqs.accepted_at DESC
        `);
        
        console.log(`🎯 Query result count: ${testQuery.length}`);
        if (testQuery.length > 0) {
            console.log('✅ Sample result:');
            console.log(JSON.stringify(testQuery[0], null, 2));
        }
        
    } catch (error) {
        console.error('❌ Error checking data:', error);
    } finally {
        process.exit(0);
    }
}

checkAcceptedQuotesData();