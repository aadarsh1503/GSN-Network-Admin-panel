// Test Business Ticket Email System
console.log('🎫 Testing Business Ticket Email System...\n');

async function testBusinessTicketCreation() {
    try {
        // First login as a business user
        console.log('🔐 Step 1: Login as business user...');
        const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'aadi@gmail.com',
                password: '222333'
            })
        });

        const loginData = await loginResponse.json();
        
        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginData.message}`);
        }

        console.log(`✅ Login successful: ${loginData.user.name} (${loginData.user.role})`);
        const token = loginData.token;

        // Test 1: Create Admin Ticket
        console.log('\n📧 Step 2: Create Admin Ticket...');
        const adminTicketData = {
            subject: 'Test Admin Ticket - Email Verification',
            message: 'This is a test ticket to verify that admin tickets send emails to admin users only and are NOT shared with company members.',
            priority: 'medium',
            category: 'technical',
            recipient_type: 'admin'
        };

        const adminTicketResponse = await fetch('http://localhost:5000/api/business/help/ticket', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(adminTicketData)
        });

        const adminTicketResult = await adminTicketResponse.json();
        
        if (adminTicketResponse.ok) {
            console.log(`✅ Admin ticket created: ${adminTicketResult.ticketNumber}`);
            console.log(`   Expected: Email sent to admin users only`);
        } else {
            console.log(`❌ Admin ticket failed: ${adminTicketResult.message}`);
        }

        // Test 2: Create Company Ticket
        console.log('\n🏢 Step 3: Create Company Ticket...');
        const companyTicketData = {
            subject: 'Test Company Ticket - Email Verification',
            message: 'This is a test ticket to verify that company tickets send emails to both the target company AND admin users.',
            priority: 'high',
            category: 'billing',
            recipient_type: 'company',
            recipient_id: 10 // Assuming company ID 10 exists
        };

        const companyTicketResponse = await fetch('http://localhost:5000/api/business/help/ticket', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(companyTicketData)
        });

        const companyTicketResult = await companyTicketResponse.json();
        
        if (companyTicketResponse.ok) {
            console.log(`✅ Company ticket created: ${companyTicketResult.ticketNumber}`);
            console.log(`   Expected: Email sent to company (ID: 10) AND admin users`);
        } else {
            console.log(`❌ Company ticket failed: ${companyTicketResult.message}`);
        }

        console.log('\n🎯 Test Complete!');
        console.log('\n📋 What to Check:');
        console.log('1. Server console for email sending logs');
        console.log('2. Admin panel at http://localhost:5173/admin/all-tickets');
        console.log('3. Email delivery (if SMTP is configured)');
        console.log('4. Database email_notifications table');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testBusinessTicketCreation();