// Check what status values are actually being used in the database
import db from './config/db.js';

async function checkQuoteStatuses() {
    console.log('🔍 Checking Quote Status Values in Database...\n');
    
    try {
        // Check user_quote_status table
        console.log('📊 Checking user_quote_status table...');
        const [userQuoteStatuses] = await db.execute(`
            SELECT DISTINCT status, COUNT(*) as count 
            FROM user_quote_status 
            GROUP BY status 
            ORDER BY count DESC
        `);
        
        console.log('User Quote Status values:');
        userQuoteStatuses.forEach(row => {
            console.log(`  - ${row.status}: ${row.count} records`);
        });
        
        // Check quote_responses table if it has a status column
        console.log('\n📊 Checking quote_responses table...');
        try {
            const [quoteResponseStatuses] = await db.execute(`
                SELECT DISTINCT status, COUNT(*) as count 
                FROM quote_responses 
                WHERE status IS NOT NULL
                GROUP BY status 
                ORDER BY count DESC
            `);
            
            if (quoteResponseStatuses.length > 0) {
                console.log('Quote Response Status values:');
                quoteResponseStatuses.forEach(row => {
                    console.log(`  - ${row.status}: ${row.count} records`);
                });
            } else {
                console.log('No status values found in quote_responses table');
            }
        } catch (error) {
            console.log('quote_responses table does not have a status column');
        }
        
        // Check quotes table
        console.log('\n📊 Checking quotes table...');
        const [quoteStatuses] = await db.execute(`
            SELECT DISTINCT status, COUNT(*) as count 
            FROM quotes 
            GROUP BY status 
            ORDER BY count DESC
        `);
        
        console.log('Quote Status values:');
        quoteStatuses.forEach(row => {
            console.log(`  - ${row.status}: ${row.count} records`);
        });
        
        // Check for recent entries to see what status is being used
        console.log('\n📊 Checking recent user_quote_status entries...');
        const [recentStatuses] = await db.execute(`
            SELECT uqs.status, uqs.created_at, q.id as quote_id, u.name as user_name
            FROM user_quote_status uqs
            JOIN quotes q ON uqs.quote_id = q.id
            LEFT JOIN users u ON q.user_id = u.id
            ORDER BY uqs.created_at DESC
            LIMIT 10
        `);
        
        console.log('Recent user_quote_status entries:');
        recentStatuses.forEach((row, index) => {
            console.log(`  ${index + 1}. Quote ${row.quote_id} (${row.user_name}): ${row.status} - ${new Date(row.created_at).toLocaleDateString()}`);
        });
        
        // Check if there are any 'approved' status entries
        const [approvedCount] = await db.execute(`
            SELECT COUNT(*) as count FROM user_quote_status WHERE status = 'approved'
        `);
        
        const [acceptedCount] = await db.execute(`
            SELECT COUNT(*) as count FROM user_quote_status WHERE status = 'accepted'
        `);
        
        console.log('\n📈 Status Comparison:');
        console.log(`✅ 'accepted' status: ${acceptedCount[0].count} records`);
        console.log(`🔄 'approved' status: ${approvedCount[0].count} records`);
        
        if (approvedCount[0].count > 0 && acceptedCount[0].count === 0) {
            console.log('\n💡 RECOMMENDATION: Use "approved" status in queries');
        } else if (acceptedCount[0].count > 0 && approvedCount[0].count === 0) {
            console.log('\n💡 RECOMMENDATION: Use "accepted" status in queries');
        } else if (approvedCount[0].count > 0 && acceptedCount[0].count > 0) {
            console.log('\n⚠️ WARNING: Both "approved" and "accepted" statuses exist!');
            console.log('Need to determine which one is currently being used.');
        } else {
            console.log('\n❌ No approved or accepted statuses found');
        }
        
    } catch (error) {
        console.error('❌ Error checking statuses:', error);
    } finally {
        process.exit(0);
    }
}

checkQuoteStatuses();