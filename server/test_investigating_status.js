import db from './config/db.js';

async function testInvestigatingStatus() {
    try {
        console.log('🧪 Testing investigating status...\n');
        
        // Get a pending dispute
        const [disputes] = await db.execute(`
            SELECT id, status, title 
            FROM disputes 
            WHERE status = 'pending' 
            LIMIT 1
        `);
        
        if (disputes.length === 0) {
            console.log('❌ No pending disputes found');
            return;
        }
        
        const dispute = disputes[0];
        console.log(`Testing with dispute ID: ${dispute.id}, current status: ${dispute.status}`);
        
        // Try to update to investigating
        console.log('\n1️⃣ Trying to update status to investigating...');
        try {
            const [result] = await db.execute(`
                UPDATE disputes 
                SET status = 'investigating', 
                    company_requested_status = 'investigating',
                    company_status_reason = 'Test investigating status'
                WHERE id = ?
            `, [dispute.id]);
            
            console.log(`✅ Update successful, affected rows: ${result.affectedRows}`);
        } catch (error) {
            console.log('❌ Update failed:', error.message);
        }
        
        // Check current status
        console.log('\n2️⃣ Checking current status...');
        const [updated] = await db.execute(`
            SELECT status, company_requested_status 
            FROM disputes 
            WHERE id = ?
        `, [dispute.id]);
        
        if (updated.length > 0) {
            console.log(`Current status: ${updated[0].status}`);
            console.log(`Company requested status: ${updated[0].company_requested_status}`);
        }
        
        // Test all enum values
        console.log('\n3️⃣ Testing all enum values...');
        const validStatuses = ['pending', 'investigating', 'resolved', 'closed'];
        
        for (const status of validStatuses) {
            try {
                await db.execute(`
                    UPDATE disputes 
                    SET company_requested_status = ?
                    WHERE id = ?
                `, [status, dispute.id]);
                console.log(`✅ ${status} - OK`);
            } catch (error) {
                console.log(`❌ ${status} - FAILED: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error testing investigating status:', error);
    } finally {
        process.exit(0);
    }
}

testInvestigatingStatus();