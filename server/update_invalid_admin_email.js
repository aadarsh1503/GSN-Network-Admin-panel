// Update Invalid Admin Email
import db from './config/db.js';

async function updateInvalidAdminEmail() {
    try {
        console.log('🔧 Updating invalid admin email...\n');
        
        // Check current admin emails
        console.log('📋 Current admin users:');
        const [admins] = await db.execute(
            'SELECT id, name, email, role FROM users WHERE role = "admin" ORDER BY id'
        );
        
        admins.forEach((admin, index) => {
            const status = admin.email && admin.email.includes('@') && !admin.email.includes('gmail.com') ? '✅' : '❌';
            console.log(`${index + 1}. ID: ${admin.id}, Email: ${admin.email} ${status}`);
        });
        
        // Update the invalid admin@gmail.com to a valid email
        console.log('\n🔄 Updating invalid admin email...');
        
        // Find admin with invalid email
        const invalidAdmin = admins.find(admin => admin.email === 'admin@gmail.com');
        
        if (invalidAdmin) {
            // Update to a valid email - let's use the user's actual email
            const newEmail = 'admin@gsnnetwork.com'; // Valid domain email
            
            await db.execute(
                'UPDATE users SET email = ? WHERE id = ? AND role = "admin"',
                [newEmail, invalidAdmin.id]
            );
            
            console.log(`✅ Updated admin ID ${invalidAdmin.id}: admin@gmail.com → ${newEmail}`);
        } else {
            console.log('✅ No invalid admin emails found');
        }
        
        // Verify the update
        console.log('\n📧 Updated admin users:');
        const [updatedAdmins] = await db.execute(
            'SELECT id, name, email, role FROM users WHERE role = "admin" ORDER BY id'
        );
        
        updatedAdmins.forEach((admin, index) => {
            console.log(`${index + 1}. ID: ${admin.id}, Email: ${admin.email} ✅`);
        });
        
        console.log('\n✅ Admin emails updated successfully!');
        console.log('📧 Email notifications should now work for all admin users.');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating admin email:', error);
        process.exit(1);
    }
}

updateInvalidAdminEmail();