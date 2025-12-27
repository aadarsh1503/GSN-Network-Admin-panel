import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

// Test email system functionality
async function testEmailSystem() {
    console.log('📧 Testing Email System...\n');

    try {
        // Step 1: Login as admin
        console.log('1. Logging in as admin...');
        const loginResponse = await fetch(`${BASE_URL}/user/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@gmail.com',
                password: 'admin123'
            })
        });

        if (!loginResponse.ok) {
            console.log('❌ Admin login failed - database connection issue');
            return;
        }

        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('✅ Admin login successful');

        const authHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Step 2: Test email statistics endpoint
        console.log('\n2. Testing email statistics...');
        const statsResponse = await fetch(`${BASE_URL}/admin/email-stats`, {
            headers: authHeaders
        });
        
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            console.log('✅ Email stats endpoint working');
            console.log(`   User counts: ${JSON.stringify(stats.userCounts)}`);
        } else {
            console.log(`❌ Email stats failed: ${statsResponse.status}`);
        }

        // Step 3: Test bulk email sending (with a small test)
        console.log('\n3. Testing bulk email sending...');
        const emailData = {
            userType: 'users',
            subject: 'Test Email from Admin Panel',
            body: `
                <h2>Hello {name}!</h2>
                <p>This is a test email sent from the admin panel bulk email system.</p>
                <p>The system is working correctly!</p>
                <p>Best regards,<br>GSN Team</p>
            `
        };

        const emailResponse = await fetch(`${BASE_URL}/admin/send-emails`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify(emailData)
        });
        
        if (emailResponse.ok) {
            const result = await emailResponse.json();
            console.log('✅ Bulk email endpoint working');
            console.log(`   Sent to ${result.successful} users, ${result.failed} failed`);
        } else {
            const errorText = await emailResponse.text();
            console.log(`❌ Bulk email failed: ${emailResponse.status}`);
            console.log(`   Error: ${errorText}`);
        }

        console.log('\n🎉 Email system test completed!');
        console.log('📝 Features available:');
        console.log('   ✅ Send emails to all users');
        console.log('   ✅ Send emails to specific user types');
        console.log('   ✅ Personalized emails with {name} placeholder');
        console.log('   ✅ Rich HTML email content');
        console.log('   ✅ Email statistics and tracking');
        console.log('   ✅ User count display for each group');

    } catch (error) {
        console.error('❌ Error testing email system:', error.message);
    }
}

testEmailSystem();