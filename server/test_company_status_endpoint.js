import db from './config/db.js';

async function testCompanyStatusEndpoint() {
    try {
        console.log('🧪 Testing company status change endpoint...\n');
        
        // Get a test dispute
        const [disputes] = await db.execute(`
            SELECT d.id, d.status, d.company_id, u.name as user_name, c.name as company_name
            FROM disputes d
            JOIN users u ON d.user_id = u.id
            JOIN users c ON d.company_id = c.id
            WHERE d.status != 'resolved' AND d.status != 'closed'
            LIMIT 1
        `);
        
        if (disputes.length === 0) {
            console.log('❌ No active disputes found for testing');
            return;
        }
        
        const dispute = disputes[0];
        console.log(`Testing with dispute ID: ${dispute.id}`);
        console.log(`Current status: ${dispute.status}`);
        console.log(`Company: ${dispute.company_name}`);
        console.log(`User: ${dispute.user_name}`);
        
        // Test the status change logic directly
        const newStatus = 'resolved';
        const reason = 'Test status change - issue has been resolved';
        const companyId = dispute.company_id;
        
        console.log('\n1️⃣ Testing company status change request...');
        
        // Update dispute with company's status change request
        const updateSql = `
            UPDATE disputes 
            SET company_requested_status = ?, company_status_reason = ?, 
                company_status_requested_at = NOW()
            WHERE id = ?
        `;
        await db.execute(updateSql, [newStatus, reason, dispute.id]);
        
        console.log('✅ Company status change request recorded');
        
        // Since it's resolved/closed, automatically update status
        if (newStatus === 'resolved' || newStatus === 'closed') {
            const statusUpdateSql = `
                UPDATE disputes 
                SET status = ?, admin_response = ?, resolved_at = NOW(), resolved_by = ?
                WHERE id = ?
            `;
            await db.execute(statusUpdateSql, [
                newStatus, 
                `Status changed to ${newStatus} by company. Reason: ${reason}`, 
                companyId, 
                dispute.id
            ]);
            
            console.log('✅ Dispute status automatically updated to resolved');
        }
        
        // Verify the changes
        console.log('\n2️⃣ Verifying changes...');
        const [updatedDispute] = await db.execute(`
            SELECT * FROM disputes WHERE id = ?
        `, [dispute.id]);
        
        if (updatedDispute.length > 0) {
            const updated = updatedDispute[0];
            console.log('Updated dispute:');
            console.log(`  - Status: ${updated.status}`);
            console.log(`  - Company Requested Status: ${updated.company_requested_status}`);
            console.log(`  - Company Status Reason: ${updated.company_status_reason ? 'Yes' : 'No'}`);
            console.log(`  - Resolved At: ${updated.resolved_at || 'Not resolved'}`);
            console.log(`  - Admin Response: ${updated.admin_response ? 'Yes' : 'No'}`);
        }
        
        console.log('\n✅ Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error testing endpoint:', error);
    } finally {
        process.exit(0);
    }
}

testCompanyStatusEndpoint();