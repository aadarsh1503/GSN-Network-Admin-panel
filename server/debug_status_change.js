import db from './config/db.js';

async function debugStatusChange() {
    try {
        console.log('🔍 Debugging status change issue...\n');
        
        // Check current disputes
        console.log('1️⃣ Current disputes:');
        const [disputes] = await db.execute(`
            SELECT id, title, status, company_id, user_id, 
                   company_requested_status, company_status_reason,
                   company_status_requested_at
            FROM disputes 
            ORDER BY updated_at DESC 
            LIMIT 3
        `);
        
        disputes.forEach(d => {
            console.log(`ID: ${d.id}, Status: ${d.status}, Company: ${d.company_id}`);
            console.log(`  Requested: ${d.company_requested_status || 'None'}`);
            console.log(`  Reason: ${d.company_status_reason || 'None'}`);
            console.log(`  Requested At: ${d.company_status_requested_at || 'None'}`);
            console.log('---');
        });
        
        if (disputes.length === 0) {
            console.log('❌ No disputes found');
            return;
        }
        
        // Test the status change logic manually
        const testDispute = disputes[0];
        console.log(`\n2️⃣ Testing status change for dispute ${testDispute.id}:`);
        console.log(`Current status: ${testDispute.status}`);
        
        // Simulate the API call logic
        const newStatus = 'running';
        const reason = 'Debug test - starting work on dispute';
        const companyId = testDispute.company_id;
        
        console.log(`Attempting to change to: ${newStatus}`);
        console.log(`Company ID: ${companyId}`);
        
        // Check if company owns this dispute
        const [checkResult] = await db.execute(`
            SELECT d.*, u.name as user_name, c.name as company_name
            FROM disputes d
            JOIN users u ON d.user_id = u.id
            JOIN users c ON d.company_id = c.id
            WHERE d.id = ? AND d.company_id = ?
        `, [testDispute.id, companyId]);
        
        if (checkResult.length === 0) {
            console.log('❌ Company authorization check failed');
            return;
        }
        
        console.log('✅ Company authorization check passed');
        
        // Test workflow validation
        const currentStatus = testDispute.status;
        let canTransition = false;
        
        switch (currentStatus) {
            case 'pending':
                canTransition = ['running', 'resolved'].includes(newStatus);
                break;
            case 'running':
                canTransition = ['resolved', 'pending'].includes(newStatus);
                break;
            case 'resolved':
                canTransition = ['running'].includes(newStatus);
                break;
            case 'closed':
                canTransition = ['running'].includes(newStatus);
                break;
        }
        
        console.log(`Workflow validation: ${canTransition ? 'PASS' : 'FAIL'}`);
        
        if (!canTransition) {
            console.log(`❌ Cannot transition from ${currentStatus} to ${newStatus}`);
            return;
        }
        
        // Test the database updates
        console.log('\n3️⃣ Testing database updates...');
        
        // Update company request
        console.log('Updating company request...');
        const [updateResult1] = await db.execute(`
            UPDATE disputes 
            SET company_requested_status = ?, company_status_reason = ?, 
                company_status_requested_at = NOW()
            WHERE id = ?
        `, [newStatus, reason, testDispute.id]);
        
        console.log(`Company request update: ${updateResult1.affectedRows} rows affected`);
        
        // Update actual status
        console.log('Updating actual status...');
        const [updateResult2] = await db.execute(`
            UPDATE disputes 
            SET status = ?, admin_response = ?
            WHERE id = ?
        `, [newStatus, `Status changed to ${newStatus} by company. Reason: ${reason}`, testDispute.id]);
        
        console.log(`Status update: ${updateResult2.affectedRows} rows affected`);
        
        // Verify the changes
        console.log('\n4️⃣ Verifying changes...');
        const [verifyResult] = await db.execute(`
            SELECT id, status, company_requested_status, company_status_reason, admin_response
            FROM disputes 
            WHERE id = ?
        `, [testDispute.id]);
        
        if (verifyResult.length > 0) {
            const v = verifyResult[0];
            console.log(`Final status: ${v.status}`);
            console.log(`Company requested: ${v.company_requested_status}`);
            console.log(`Company reason: ${v.company_status_reason ? 'Yes' : 'No'}`);
            console.log(`Admin response: ${v.admin_response ? 'Yes' : 'No'}`);
        }
        
        console.log('\n✅ Debug test completed!');
        
    } catch (error) {
        console.error('❌ Error during debug:', error);
    } finally {
        process.exit(0);
    }
}

debugStatusChange();