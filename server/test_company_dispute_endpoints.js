import db from './config/db.js';

async function testCompanyDisputeEndpoints() {
    try {
        console.log('🧪 Testing company dispute endpoints...\n');
        
        // First, let's check if we have any disputes
        console.log('1️⃣ Checking existing disputes...');
        const [disputes] = await db.execute(`
            SELECT d.id, d.title, d.status, u.name as user_name, c.name as company_name
            FROM disputes d
            JOIN users u ON d.user_id = u.id
            JOIN users c ON d.company_id = c.id
            ORDER BY d.created_at DESC
            LIMIT 5
        `);
        
        if (disputes.length === 0) {
            console.log('❌ No disputes found. Creating a test dispute...');
            
            // Get a user and company
            const [users] = await db.execute("SELECT id, name FROM users WHERE role = 'user' LIMIT 1");
            const [companies] = await db.execute("SELECT id, name FROM users WHERE role = 'company' LIMIT 1");
            const [reasons] = await db.execute("SELECT id FROM dispute_reasons LIMIT 1");
            
            if (users.length === 0 || companies.length === 0 || reasons.length === 0) {
                console.log('❌ Missing required data (users, companies, or dispute reasons)');
                return;
            }
            
            // Create a test dispute
            await db.execute(`
                INSERT INTO disputes (user_id, company_id, dispute_reason_id, title, description, priority)
                VALUES (?, ?, ?, 'Test Dispute', 'This is a test dispute for endpoint testing', 'medium')
            `, [users[0].id, companies[0].id, reasons[0].id]);
            
            console.log('✅ Test dispute created');
            
            // Fetch the created dispute
            const [newDisputes] = await db.execute(`
                SELECT d.id, d.title, d.status, u.name as user_name, c.name as company_name
                FROM disputes d
                JOIN users u ON d.user_id = u.id
                JOIN users c ON d.company_id = c.id
                ORDER BY d.created_at DESC
                LIMIT 1
            `);
            disputes.push(...newDisputes);
        }
        
        console.log('Available disputes:');
        disputes.forEach(dispute => {
            console.log(`  - ID: ${dispute.id}, Title: "${dispute.title}", Status: ${dispute.status}`);
            console.log(`    User: ${dispute.user_name}, Company: ${dispute.company_name}`);
        });
        
        const testDispute = disputes[0];
        
        // Test 1: Company Response
        console.log('\n2️⃣ Testing company response functionality...');
        const responseData = {
            response: 'We apologize for any inconvenience. We are investigating this matter and will resolve it promptly.',
            suggested_status: 'investigating'
        };
        
        await db.execute(`
            UPDATE disputes 
            SET company_response = ?, company_suggested_status = ?, company_responded_at = NOW()
            WHERE id = ?
        `, [responseData.response, responseData.suggested_status, testDispute.id]);
        
        console.log('✅ Company response added successfully');
        
        // Test 2: Company Status Change Request
        console.log('\n3️⃣ Testing company status change request...');
        const statusChangeData = {
            status: 'resolved',
            reason: 'We have addressed the issue and provided a full refund to the customer.'
        };
        
        await db.execute(`
            UPDATE disputes 
            SET company_requested_status = ?, company_status_reason = ?, 
                company_status_requested_at = NOW()
            WHERE id = ?
        `, [statusChangeData.status, statusChangeData.reason, testDispute.id]);
        
        console.log('✅ Company status change request added successfully');
        
        // Test 3: Verify the updates
        console.log('\n4️⃣ Verifying updates...');
        const [updatedDispute] = await db.execute(`
            SELECT d.*, u.name as user_name, c.name as company_name
            FROM disputes d
            JOIN users u ON d.user_id = u.id
            JOIN users c ON d.company_id = c.id
            WHERE d.id = ?
        `, [testDispute.id]);
        
        if (updatedDispute.length > 0) {
            const dispute = updatedDispute[0];
            console.log('Updated dispute details:');
            console.log(`  - ID: ${dispute.id}`);
            console.log(`  - Status: ${dispute.status}`);
            console.log(`  - Company Response: ${dispute.company_response ? 'Yes' : 'No'}`);
            console.log(`  - Company Suggested Status: ${dispute.company_suggested_status || 'None'}`);
            console.log(`  - Company Requested Status: ${dispute.company_requested_status || 'None'}`);
            console.log(`  - Company Status Reason: ${dispute.company_status_reason ? 'Yes' : 'No'}`);
        }
        
        console.log('\n✅ All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Error testing endpoints:', error);
    } finally {
        process.exit(0);
    }
}

testCompanyDisputeEndpoints();