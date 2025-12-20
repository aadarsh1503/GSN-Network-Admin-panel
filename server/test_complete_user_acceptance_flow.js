// Test complete user acceptance flow
import db from './config/db.js';
import { 
    sendQuoteAcceptanceNotification, 
    sendUserAcceptanceThankYou,
    sendStatusUpdateNotification 
} from './services/emailService.js';

async function testCompleteFlow() {
    try {
        console.log('🧪 Testing complete user acceptance flow...\n');
        
        // Test parameters (using existing data from the system)
        const quoteId = 5;
        const userId = 1; // Assuming user ID 1 exists
        const companyId = 2; // Assuming company ID 2 exists
        
        // Get actual user and company details from database
        const [userRows] = await db.execute('SELECT name, email FROM users WHERE id = ?', [userId]);
        const [companyRows] = await db.execute('SELECT name, email, phone FROM users WHERE id = ?', [companyId]);
        
        if (userRows.length === 0 || companyRows.length === 0) {
            console.log('❌ User or company not found in database');
            return;
        }
        
        const user = userRows[0];
        const company = companyRows[0];
        
        console.log('📋 Test Data:');
        console.log(`Quote ID: ${quoteId}`);
        console.log(`User: ${user.name} (${user.email})`);
        console.log(`Company: ${company.name} (${company.email})`);
        console.log('');
        
        // Test 1: Send acceptance notification to company
        console.log('1️⃣ Testing acceptance notification to company...');
        const acceptanceResult = await sendQuoteAcceptanceNotification(
            company.email,
            company.name,
            user.name,
            quoteId
        );
        console.log('✅ Acceptance notification result:', acceptanceResult.success ? 'SUCCESS' : 'FAILED');
        
        // Test 2: Send thank you email to user
        console.log('2️⃣ Testing thank you email to user...');
        const thankYouResult = await sendUserAcceptanceThankYou(
            user.email,
            user.name,
            quoteId,
            company.name,
            company.email,
            company.phone
        );
        console.log('✅ Thank you email result:', thankYouResult.success ? 'SUCCESS' : 'FAILED');
        
        // Test 3: Send status update notification to user
        console.log('3️⃣ Testing status update notification to user...');
        const statusResult = await sendStatusUpdateNotification(
            user.email,
            user.name,
            quoteId,
            'running'
        );
        console.log('✅ Status update result:', statusResult.success ? 'SUCCESS' : 'FAILED');
        
        // Check email logs
        console.log('\n📧 Checking email logs...');
        const [emailLogs] = await db.execute(
            'SELECT type, status, recipient_email, subject FROM email_notifications WHERE quote_id = ? ORDER BY id DESC LIMIT 5',
            [quoteId]
        );
        
        console.log('Recent email logs:');
        emailLogs.forEach((log, index) => {
            console.log(`${index + 1}. ${log.type} - ${log.status} - ${log.recipient_email} - ${log.subject}`);
        });
        
        console.log('\n🎉 Complete flow test finished!');
        
    } catch (error) {
        console.error('❌ Error in complete flow test:', error);
    } finally {
        process.exit(0);
    }
}

testCompleteFlow();