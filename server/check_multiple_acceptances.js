// Check for multiple acceptances in the database
import db from './config/db.js';

async function checkMultipleAcceptances() {
    try {
        console.log('🔍 Checking for Multiple Quote Acceptances...\n');
        
        // Check for quotes where users have accepted multiple responses
        const [multipleAcceptances] = await db.execute(`
            SELECT 
                q.id as quote_id,
                q.user_id,
                u.name as user_name,
                u.email as user_email,
                u.role as user_role,
                COUNT(uqs.id) as acceptance_count,
                GROUP_CONCAT(CONCAT('Response #', uqs.quote_response_id, ' (Company: ', c.name, ')') SEPARATOR ', ') as accepted_responses
            FROM quotes q
            JOIN users u ON q.user_id = u.id
            JOIN user_quote_status uqs ON q.id = uqs.quote_id AND uqs.user_id = u.id
            JOIN quote_responses qr ON uqs.quote_response_id = qr.id
            JOIN users c ON qr.company_id = c.id
            WHERE uqs.status = 'accepted'
            GROUP BY q.id, q.user_id
            HAVING acceptance_count > 1
            ORDER BY acceptance_count DESC, q.created_at DESC
        `);
        
        if (multipleAcceptances.length > 0) {
            console.log(`❌ Found ${multipleAcceptances.length} quotes with multiple acceptances:\n`);
            
            multipleAcceptances.forEach((item, index) => {
                console.log(`${index + 1}. Quote #${item.quote_id}`);
                console.log(`   User: ${item.user_name} (${item.user_email}) - Role: ${item.user_role}`);
                console.log(`   Acceptances: ${item.acceptance_count}`);
                console.log(`   Accepted Responses: ${item.accepted_responses}`);
                console.log('');
            });
            
            // Show detailed breakdown for the first problematic quote
            if (multipleAcceptances.length > 0) {
                const firstProblem = multipleAcceptances[0];
                console.log(`📋 Detailed Analysis for Quote #${firstProblem.quote_id}:\n`);
                
                const [details] = await db.execute(`
                    SELECT 
                        uqs.id as status_id,
                        uqs.quote_response_id,
                        uqs.status,
                        uqs.accepted_at,
                        uqs.rejected_at,
                        qr.company_id,
                        c.name as company_name,
                        qr.price,
                        qr.created_at as response_created_at
                    FROM user_quote_status uqs
                    JOIN quote_responses qr ON uqs.quote_response_id = qr.id
                    JOIN users c ON qr.company_id = c.id
                    WHERE uqs.quote_id = ? AND uqs.user_id = ?
                    ORDER BY uqs.accepted_at ASC
                `, [firstProblem.quote_id, firstProblem.user_id]);
                
                details.forEach((detail, index) => {
                    console.log(`Response ${index + 1}:`);
                    console.log(`  Response ID: ${detail.quote_response_id}`);
                    console.log(`  Company: ${detail.company_name} (ID: ${detail.company_id})`);
                    console.log(`  Price: $${detail.price}`);
                    console.log(`  Status: ${detail.status}`);
                    console.log(`  Accepted At: ${detail.accepted_at}`);
                    console.log(`  Response Created: ${detail.response_created_at}`);
                    console.log('');
                });
            }
            
        } else {
            console.log('✅ No multiple acceptances found - prevention is working correctly!\n');
        }
        
        // Check recent quote acceptance activity
        console.log('📊 Recent Quote Acceptance Activity:\n');
        
        const [recentAcceptances] = await db.execute(`
            SELECT 
                q.id as quote_id,
                u.name as user_name,
                u.email as user_email,
                u.role as user_role,
                c.name as company_name,
                uqs.accepted_at,
                qr.price
            FROM user_quote_status uqs
            JOIN quotes q ON uqs.quote_id = q.id
            JOIN users u ON q.user_id = u.id
            JOIN quote_responses qr ON uqs.quote_response_id = qr.id
            JOIN users c ON qr.company_id = c.id
            WHERE uqs.status = 'accepted'
            ORDER BY uqs.accepted_at DESC
            LIMIT 10
        `);
        
        recentAcceptances.forEach((acceptance, index) => {
            console.log(`${index + 1}. Quote #${acceptance.quote_id} - ${acceptance.user_name} (${acceptance.user_role})`);
            console.log(`   Company: ${acceptance.company_name}`);
            console.log(`   Price: $${acceptance.price}`);
            console.log(`   Accepted: ${acceptance.accepted_at}`);
            console.log('');
        });
        
        // Check if there are any quotes with responses but no acceptances
        console.log('🔍 Quotes with Responses but No Acceptances:\n');
        
        const [noAcceptances] = await db.execute(`
            SELECT 
                q.id as quote_id,
                u.name as user_name,
                u.email as user_email,
                u.role as user_role,
                COUNT(qr.id) as response_count,
                COUNT(uqs.id) as acceptance_count
            FROM quotes q
            JOIN users u ON q.user_id = u.id
            LEFT JOIN quote_responses qr ON q.id = qr.quote_id
            LEFT JOIN user_quote_status uqs ON (q.id = uqs.quote_id AND uqs.status = 'accepted')
            WHERE q.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY q.id
            HAVING response_count > 0 AND acceptance_count = 0
            ORDER BY q.created_at DESC
            LIMIT 5
        `);
        
        noAcceptances.forEach((quote, index) => {
            console.log(`${index + 1}. Quote #${quote.quote_id} - ${quote.user_name} (${quote.user_role})`);
            console.log(`   Responses: ${quote.response_count}, Acceptances: ${quote.acceptance_count}`);
            console.log('');
        });
        
        // Summary
        console.log('📈 SUMMARY:');
        console.log(`   - Quotes with multiple acceptances: ${multipleAcceptances.length}`);
        console.log(`   - Recent acceptances: ${recentAcceptances.length}`);
        console.log(`   - Quotes awaiting acceptance: ${noAcceptances.length}`);
        
        if (multipleAcceptances.length > 0) {
            console.log('\n🚨 ACTION REQUIRED:');
            console.log('   Multiple acceptances detected! The prevention logic needs to be fixed.');
            console.log('   This could be due to:');
            console.log('   1. Frontend not checking existing acceptances');
            console.log('   2. Race conditions in the backend');
            console.log('   3. Different user roles (user vs business) not being handled consistently');
        }
        
    } catch (error) {
        console.error('❌ Error checking multiple acceptances:', error);
    } finally {
        process.exit(0);
    }
}

checkMultipleAcceptances();