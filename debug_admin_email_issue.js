// Debug admin email issue for payment verification
import db from './server/config/db.js';

async function debugAdminEmailIssue() {
    try {
        console.log('🔍 Debugging admin email issue for payment verification...\n');
        
        // Check if there are admin users in the database
        console.log('1. Checking admin users in database:');
        const [adminUsers] = await db.execute('SELECT id, name, email, role FROM users WHERE role = "admin"');
        
        if (adminUsers.length === 0) {
            console.log('❌ No admin users found in database!');
            console.log('   This is why admin emails are not being sent.');
            console.log('   Solution: Create an admin user or use a fallback email.');
        } else {
            console.log(`✅ Found ${adminUsers.length} admin user(s):`);
            adminUsers.forEach(admin => {
                console.log(`   - ID: ${admin.id}, Name: ${admin.name}, Email: ${admin.email}`);
            });
        }
        
        // Check environment variables
        console.log('\n2. Checking environment variables:');
        console.log(`   ADMIN_EMAIL: ${process.env.ADMIN_EMAIL || 'NOT SET'}`);
        console.log(`   EMAIL_FROM: ${process.env.EMAIL_FROM || 'NOT SET'}`);
        console.log(`   EMAIL_HOST: ${process.env.EMAIL_HOST || 'NOT SET'}`);
        
        // Check recent payment verifications
        console.log('\n3. Checking recent payment verifications:');
        const [recentVerifications] = await db.execute(`
            SELECT pv.id, pv.quote_id, pv.verification_status, pv.verification_date,
                   u.name as customer_name, u.email as customer_email,
                   c.name as company_name, c.email as company_email
            FROM payment_verifications pv
            JOIN users u ON pv.user_id = u.id
            JOIN users c ON pv.company_id = c.id
            ORDER BY pv.verification_date DESC
            LIMIT 5
        `);
        
        if (recentVerifications.length === 0) {
            console.log('   No recent payment verifications found.');
        } else {
            console.log(`   Found ${recentVerifications.length} recent verification(s):`);
            recentVerifications.forEach(v => {
                console.log(`   - ID: ${v.id}, Quote: ${v.quote_id}, Status: ${v.verification_status}`);
                console.log(`     Customer: ${v.customer_email}, Company: ${v.company_email}`);
                console.log(`     Date: ${v.verification_date}`);
            });
        }
        
        // Suggest solutions
        console.log('\n🔧 SOLUTIONS:');
        
        if (adminUsers.length === 0) {
            console.log('1. Create an admin user:');
            console.log('   INSERT INTO users (name, email, password, role) VALUES ("Admin", "admin@gsnnetwork.com", "hashed_password", "admin");');
            console.log('');
            console.log('2. Or add ADMIN_EMAIL to .env file:');
            console.log('   ADMIN_EMAIL=admin@gsnnetwork.com');
        } else {
            console.log('1. Use first admin email as fallback:');
            console.log(`   const adminEmail = "${adminUsers[0].email}";`);
            console.log('');
            console.log('2. Or send to all admin users:');
            console.log('   adminUsers.forEach(admin => sendEmail(admin.email));');
        }
        
        console.log('\n3. Update payment verification endpoint to:');
        console.log('   - Get admin emails from database instead of environment');
        console.log('   - Send to all admin users, not just one');
        console.log('   - Add proper error handling for missing admin emails');
        
    } catch (error) {
        console.error('❌ Error debugging admin email issue:', error);
    } finally {
        process.exit(0);
    }
}

debugAdminEmailIssue();