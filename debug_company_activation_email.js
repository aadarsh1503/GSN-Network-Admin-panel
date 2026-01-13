// Debug script to test company activation email
import db from './server/config/db.js';
import { queueSubscriptionEmails } from './server/services/emailQueue.js';

async function testCompanyActivationEmail() {
    try {
        console.log('🔍 Testing company activation email...');
        
        // Find a company user to test with
        const [companies] = await db.execute(`
            SELECT id, name, email, role, status 
            FROM users 
            WHERE role = 'company' 
            LIMIT 1
        `);
        
        if (companies.length === 0) {
            console.log('❌ No company users found in database');
            return;
        }
        
        const company = companies[0];
        console.log('📋 Testing with company:', {
            id: company.id,
            name: company.name,
            email: company.email,
            status: company.status
        });
        
        // Test queuing the approval email
        console.log('📧 Queuing company approval email...');
        const jobId = await queueSubscriptionEmails.companyApproval({
            userId: company.id,
            userName: company.name,
            userEmail: company.email
        });
        
        console.log(`✅ Company approval email queued with Job ID: ${jobId}`);
        
        // Check queue status
        setTimeout(() => {
            const queueStatus = queueSubscriptionEmails.getQueueStatus();
            console.log('📊 Queue Status:', queueStatus);
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error testing company activation email:', error);
    }
}

testCompanyActivationEmail();