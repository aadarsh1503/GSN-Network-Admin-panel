import db from './config/db.js';

async function checkDisputeStatus() {
    try {
        console.log('🔍 Checking current dispute statuses...\n');
        
        const [disputes] = await db.execute(`
            SELECT 
                id, 
                title, 
                status, 
                company_requested_status, 
                company_status_reason,
                company_status_requested_at,
                updated_at
            FROM disputes 
            ORDER BY updated_at DESC 
            LIMIT 5
        `);
        
        console.log('Recent disputes:');
        disputes.forEach(d => {
            console.log(`ID: ${d.id}`);
            console.log(`  Title: ${d.title}`);
            console.log(`  Current Status: ${d.status}`);
            console.log(`  Company Requested Status: ${d.company_requested_status || 'None'}`);
            console.log(`  Status Change Reason: ${d.company_status_reason ? 'Yes' : 'No'}`);
            console.log(`  Last Updated: ${d.updated_at}`);
            console.log('---');
        });
        
    } catch (error) {
        console.error('❌ Error checking dispute status:', error);
    } finally {
        process.exit(0);
    }
}

checkDisputeStatus();