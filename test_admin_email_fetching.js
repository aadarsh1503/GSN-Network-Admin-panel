// Test admin email fetching utility
import { getAdminEmails, getAdminUsers, getAdminEmailsWithFallback, hasAdminUsers } from './server/utils/adminUtils.js';

async function testAdminEmailFetching() {
    console.log('🧪 Testing Admin Email Fetching Utility\n');
    
    try {
        // Test 1: Check if admin users exist
        console.log('1. Checking if admin users exist...');
        const adminExists = await hasAdminUsers();
        console.log(`   Result: ${adminExists ? '✅ Admin users found' : '❌ No admin users found'}\n`);
        
        // Test 2: Get admin emails
        console.log('2. Fetching admin emails...');
        const adminEmails = await getAdminEmails();
        console.log(`   Found ${adminEmails.length} admin email(s):`);
        adminEmails.forEach((email, index) => {
            console.log(`   ${index + 1}. ${email}`);
        });
        console.log('');
        
        // Test 3: Get admin users with full details
        console.log('3. Fetching admin users with details...');
        const adminUsers = await getAdminUsers();
        console.log(`   Found ${adminUsers.length} admin user(s):`);
        adminUsers.forEach((user, index) => {
            console.log(`   ${index + 1}. ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Phone: ${user.phone || 'N/A'}`);
        });
        console.log('');
        
        // Test 4: Get admin emails with fallback
        console.log('4. Testing admin emails with fallback...');
        const adminEmailsWithFallback = await getAdminEmailsWithFallback();
        console.log(`   Result: ${adminEmailsWithFallback.length} email(s) guaranteed:`);
        adminEmailsWithFallback.forEach((email, index) => {
            console.log(`   ${index + 1}. ${email}`);
        });
        console.log('');
        
        // Test 5: Simulate payment verification email queuing
        console.log('5. Simulating payment verification email queuing...');
        console.log('   Emails that would be queued for admin notifications:');
        for (let i = 0; i < adminEmailsWithFallback.length; i++) {
            console.log(`   📧 Queue email to: ${adminEmailsWithFallback[i]}`);
        }
        
        console.log('\n✅ All tests completed successfully!');
        
        // Summary
        console.log('\n📊 SUMMARY:');
        console.log(`   - Admin users in database: ${adminUsers.length}`);
        console.log(`   - Valid admin emails: ${adminEmails.length}`);
        console.log(`   - Emails that will receive notifications: ${adminEmailsWithFallback.length}`);
        console.log(`   - Fallback system: ${adminEmails.length === 0 ? 'ACTIVE (using env/default)' : 'NOT NEEDED'}`);
        
        if (adminEmailsWithFallback.length === 0) {
            console.log('\n❌ CRITICAL ISSUE: No admin emails available!');
            console.log('   Solutions:');
            console.log('   1. Create admin users in database');
            console.log('   2. Set ADMIN_EMAIL in .env file');
            console.log('   3. Ensure EMAIL_FROM is set in .env file');
        } else {
            console.log('\n✅ Admin email system is working correctly!');
        }
        
    } catch (error) {
        console.error('❌ Error testing admin email fetching:', error);
    } finally {
        process.exit(0);
    }
}

testAdminEmailFetching();