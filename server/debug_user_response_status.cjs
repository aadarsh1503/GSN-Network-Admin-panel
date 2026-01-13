const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function debugUserResponseStatus() {
    try {
        console.log('🔍 DEBUGGING USER RESPONSE STATUS ISSUE');
        console.log('======================================\n');

        // Test with known quote and user
        const testQuoteId = 52; // Known quote with issues
        const testUserId = 11;  // Testing-user (subodhchauhan1309@gmail.com)

        console.log(`Testing Quote ID: ${testQuoteId}, User ID: ${testUserId}`);

        // Check user_quote_status table directly
        console.log('\n1️⃣ CHECKING user_quote_status TABLE:');
        const [userQuoteStatus] = await db.execute(`
            SELECT uqs.*, c.name as company_name
            FROM user_quote_status uqs
            LEFT JOIN users c ON uqs.company_id = c.id
            WHERE uqs.quote_id = ? AND uqs.user_id = ?
        `, [testQuoteId, testUserId]);

        if (userQuoteStatus.length === 0) {
            console.log('❌ No records found in user_quote_status table');
            console.log('   This means the user has not accepted any responses yet');
        } else {
            console.log(`✅ Found ${userQuoteStatus.length} records in user_quote_status:`);
            userQuoteStatus.forEach((record, index) => {
                console.log(`\n   Record ${index + 1}:`);
                console.log(`   - Quote Response ID: ${record.quote_response_id}`);
                console.log(`   - Company: ${record.company_name} (ID: ${record.company_id})`);
                console.log(`   - Status: ${record.status}`);
                console.log(`   - Accepted At: ${record.accepted_at || 'NULL'}`);
                console.log(`   - Rejected At: ${record.rejected_at || 'NULL'}`);
            });
        }

        // Check the API query (same as frontend uses)
        console.log('\n2️⃣ CHECKING API QUERY RESULT:');
        const [apiResult] = await db.execute(`
            SELECT qr.id, qr.company_id, qr.price,
                   u.name as company_name, 
                   u.email as company_email,
                   uqs.status as user_response_status,
                   uqs.accepted_at,
                   uqs.rejected_at
            FROM quote_responses qr
            JOIN users u ON qr.company_id = u.id
            LEFT JOIN user_quote_status uqs ON (qr.id = uqs.quote_response_id AND uqs.user_id = ?)
            WHERE qr.quote_id = ?
            ORDER BY qr.created_at DESC
        `, [testUserId, testQuoteId]);

        console.log(`Found ${apiResult.length} quote responses:`);
        apiResult.forEach((response, index) => {
            console.log(`\n   Response ${index + 1}:`);
            console.log(`   - Response ID: ${response.id}`);
            console.log(`   - Company: ${response.company_name} (${response.company_email})`);
            console.log(`   - Price: $${response.price}`);
            console.log(`   - User Response Status: ${response.user_response_status || 'NULL'}`);
            console.log(`   - Accepted At: ${response.accepted_at || 'NULL'}`);
            console.log(`   - Rejected At: ${response.rejected_at || 'NULL'}`);
        });

        // Check if there are any accepted responses
        const acceptedResponses = apiResult.filter(r => r.user_response_status === 'accepted');
        console.log(`\n✅ ACCEPTED RESPONSES: ${acceptedResponses.length}`);

        if (acceptedResponses.length === 0) {
            console.log('\n⚠️  ISSUE IDENTIFIED: No accepted responses found');
            console.log('   This means either:');
            console.log('   1. User has not actually accepted any quotes yet');
            console.log('   2. The acceptance process is not working correctly');
            console.log('   3. Data is not being inserted into user_quote_status table');
        } else {
            console.log('\n✅ ACCEPTED RESPONSES FOUND:');
            acceptedResponses.forEach((response, index) => {
                console.log(`   ${index + 1}. Company: ${response.company_name}`);
                console.log(`      Accepted At: ${response.accepted_at}`);
            });
        }

        // Check quote status
        console.log('\n3️⃣ CHECKING QUOTE STATUS:');
        const [quoteStatus] = await db.execute(
            'SELECT id, status, product_description FROM quotes WHERE id = ?',
            [testQuoteId]
        );

        if (quoteStatus.length > 0) {
            console.log(`Quote Status: ${quoteStatus[0].status}`);
            console.log(`Product: ${quoteStatus[0].product_description}`);
        }

        console.log('\n🎯 DIAGNOSIS:');
        console.log('=' .repeat(40));
        if (userQuoteStatus.length === 0) {
            console.log('❌ PROBLEM: No user_quote_status records found');
            console.log('   SOLUTION: User needs to actually accept a quote response');
        } else if (acceptedResponses.length === 0) {
            console.log('❌ PROBLEM: user_quote_status records exist but none are "accepted"');
            console.log('   SOLUTION: Check the acceptance process');
        } else {
            console.log('✅ GOOD: Accepted responses found');
            console.log('   The frontend should show these as accepted');
        }

    } catch (error) {
        console.error('❌ Error debugging user response status:', error);
    } finally {
        await db.end();
    }
}

debugUserResponseStatus();