import db from './config/db.js';

async function testUpdatedStatus() {
    try {
        console.log('🧪 Testing updated status functionality...\n');
        
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
        
        // Test valid status changes
        console.log('\n1️⃣ Testing valid status changes...');
        const validStatuses = ['pending', 'resolved', 'closed'];
        
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
        
        // Test invalid status (investigating)
        console.log('\n2️⃣ Testing invalid status (investigating)...');
        try {
            await db.execute(`
                UPDATE disputes 
                SET company_requested_status = 'investigating'
                WHERE id = ?
            `, [dispute.id]);
            console.log('❌ investigating - Should have failed but succeeded');
        } catch (error) {
            console.log('✅ investigating - Correctly rejected:', error.message);
        }
        
        // Test status change to resolved
        console.log('\n3️⃣ Testing status change to resolved...');
        try {
            const [result] = await db.execute(`
                UPDATE disputes 
                SET status = 'resolved', 
                    company_requested_status = 'resolved',
                    company_status_reason = 'Test resolved status',
                    resolved_at = NOW()
                WHERE id = ?
            `, [dispute.id]);
            
            console.log(`✅ Resolved status update successful, affected rows: ${result.affectedRows}`);
            
            // Verify the change
            const [updated] = await db.execute(`
                SELECT status, company_requested_status, resolved_at
                FROM disputes 
                WHERE id = ?
            `, [dispute.id]);
            
            if (updated.length > 0) {
                console.log(`   Status: ${updated[0].status}`);
                console.log(`   Company requested: ${updated[0].company_requested_status}`);
                console.log(`   Resolved at: ${updated[0].resolved_at}`);
            }
        } catch (error) {
            console.log('❌ Resolved status update failed:', error.message);
        }
        
        console.log('\n✅ All tests completed!');
        
    } catch (error) {
        console.error('❌ Error testing updated status:', error);
    } finally {
        process.exit(0);
    }
}

testUpdatedStatus();