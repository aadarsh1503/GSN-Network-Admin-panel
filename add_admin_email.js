// Add Admin Email to Database
import db from './server/config/db.js';

async function addAdminEmail() {
    try {
        console.log('🔧 Adding/updating admin email in database...\n');
        
        // First check if there are any admin users
        const [admins] = await db.execute(
            'SELECT id, name, email, role FROM users WHERE role = "admin"'
        );
        
        console.log(`Found ${admins.length} admin users:`);
        admins.forEach((admin, index) => {
            console.log(`${index + 1}. ID: ${admin.id}, Name: ${admin.name}, Email: ${admin.email}`);
        });
        
        if (admins.length === 0) {
            console.log('❌ No admin users found in database!');
            console.log('💡 You need to create an admin user first');
            return;
        }
        
        // Update the first admin user with a valid email
        const validAdminEmail = 'root@khaleeji.app'; // Using the email from .env
        const adminToUpdate = admins[0];
        
        console.log(`\n🔄 Updating admin user ID ${adminToUpdate.id} with email: ${validAdminEmail}`);
        
        await db.execute(
            'UPDATE users SET email = ? WHERE id = ? AND role = "admin"',
            [validAdminEmail, adminToUpdate.id]
        );
        
        console.log('✅ Admin email updated successfully!');
        
        // Verify the update
        const [updatedAdmins] = await db.execute(
            'SELECT id, name, email, role FROM users WHERE role = "admin"'
        );
        
        console.log('\n📧 Updated admin users:');
        updatedAdmins.forEach((admin, index) => {
            console.log(`${index + 1}. ID: ${admin.id}, Name: ${admin.name}, Email: ${admin.email}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating admin email:', error);
        process.exit(1);
    }
}

addAdminEmail();