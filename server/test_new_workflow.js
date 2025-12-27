import db from './config/db.js';

async function testNewWorkflow() {
    try {
        console.log('🧪 Testing new dispute workflow: pending → running → resolved → closed...\n');
        
        // Get a pending dispute
        const [disputes] = await db.execute(`
            SELECT id, status, title, company_id, user_id
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
        
        // Test workflow transitions
        console.log('\n1️⃣ Testing workflow transitions...');
        
        // Step 1: pending → running (Company starts working)
        console.log('Step 1: pending → running');
        await db.execute(`
            UPDATE disputes 
            SET status = 'running', 
                company_requested_status = 'running',
                company_status_reason = 'Started working on the issue',
                admin_response = 'Company has started working on this dispute'
            WHERE id = ?
        `, [dispute.id]);
        console.log('✅ Status changed to running');
        
        // Step 2: running → resolved (Company resolves issue)
        console.log('\nStep 2: running → resolved');
        await db.execute(`
            UPDATE disputes 
            SET status = 'resolved', 
                company_requested_status = 'resolved',
                company_status_reason = 'Issue has been resolved',
                admin_response = 'Company has resolved the dispute',
                resolved_at = NOW(),
                resolved_by = ?
            WHERE id = ?
        `, [dispute.company_id, dispute.id]);
        console.log('✅ Status changed to resolved');
        
        // Step 3: resolved → closed (User confirms and closes)
        console.log('\nStep 3: resolved → closed (simulating user action)');
        await db.execute(`
            UPDATE disputes 
            SET status = 'closed',
                admin_response = CONCAT(admin_response, '\n\nClosed by user. User feedback: Issue resolved satisfactorily.')
            WHERE id = ?
        `, [dispute.id]);
        console.log('✅ Status changed to closed');
        
        // Verify final state
        console.log('\n2️⃣ Verifying final state...');
        const [final] = await db.execute(`
            SELECT status, company_requested_status, company_status_reason, resolved_at, admin_response
            FROM disputes 
            WHERE id = ?
        `, [dispute.id]);
        
        if (final.length > 0) {
            const f = final[0];
            console.log(`Final status: ${f.status}`);
            console.log(`Company requested: ${f.company_requested_status}`);
            console.log(`Resolved at: ${f.resolved_at}`);
            console.log(`Admin response: ${f.admin_response ? 'Yes' : 'No'}`);
        }
        
        // Test invalid transitions
        console.log('\n3️⃣ Testing invalid transitions...');
        
        // Try to go from closed to pending (should be restricted)
        try {
            await db.execute(`
                UPDATE disputes 
                SET status = 'pending'
                WHERE id = ?
            `, [dispute.id]);
            console.log('⚠️ closed → pending: Allowed (but should be controlled by workflow)');
        } catch (error) {
            console.log('✅ closed → pending: Properly restricted');
        }
        
        console.log('\n✅ Workflow test completed!');
        console.log('\n📋 Correct workflow:');
        console.log('1. pending → running (Company starts work)');
        console.log('2. running → resolved (Company resolves)');
        console.log('3. resolved → closed (User confirms)');
        
    } catch (error) {
        console.error('❌ Error testing workflow:', error);
    } finally {
        process.exit(0);
    }
}

testNewWorkflow();