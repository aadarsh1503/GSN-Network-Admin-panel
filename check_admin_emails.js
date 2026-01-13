// Check Admin Emails in Database
import db from './server/config/db.js';

async function checkAdminEmails() {
    try {
        console.log('🔍 Checking admin emails in database...\n');
        
        const [admins] = await db.execute(
            'SELECT id, name, email, role FROM users WHERE role = "admin"'
        );
        
        console.log(`Found ${admins.length} admin users:`);
        admins.forEach((admin, index) => {
            console.log(`${index + 1}. ID: ${admin.id}, Name: ${admin.name}, Email: ${admin.email}, Role: ${admin.role}`);
        });
        
        console.log('\n📧 Valid admin emails for notifications:');
        const validEmails = admins.filter(admin => admin.email && admin.email.trim()).map(admin => admin.email);
        validEmails.forEach((email, index) => {
            console.log(`${index + 1}. ${email}`);
        });
        
        if (validEmails.length === 0) {
            console.log('❌ No valid admin emails found!');
            console.log('💡 Suggestion: Update admin user emails in the database or use fallback email');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error checking admin emails:', error);
        process.exit(1);
    }
}

checkAdminEmails();