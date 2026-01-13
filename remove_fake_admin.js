// Remove fake admin account to prevent email failures
import db from './server/config/db.js';

async function removeFakeAdmin() {
    try {
        console.log('🔍 Checking admin accounts...');
        
        // Get all admin accounts
        const [admins] = await db.execute('SELECT id, email, name FROM users WHERE role = "admin"');
        
        console.log('📋 Current admin accounts:');
        admins.forEach(admin => {
            console.log(`  - ID: ${admin.id}, Email: ${admin.email}, Name: ${admin.name}`);
        });
        
        // Find the fake admin account
        const fakeAdmin = admins.find(admin => admin.email === 'admin@gmail.com');
        
        if (fakeAdmin) {
            console.log(`🗑️ Removing fake admin account: ${fakeAdmin.email} (ID: ${fakeAdmin.id})`);
            
            // Delete the fake admin account
            const [result] = await db.execute('DELETE FROM users WHERE id = ? AND email = ?', [fakeAdmin.id, 'admin@gmail.com']);
            
            if (result.affectedRows > 0) {
                console.log('✅ Fake admin account removed successfully');
            } else {
                console.log('⚠️ No rows affected - account might not exist');
            }
        } else {
            console.log('ℹ️ No fake admin account found');
        }
        
        // Verify remaining admins
        const [remainingAdmins] = await db.execute('SELECT id, email, name FROM users WHERE role = "admin"');
        
        console.log('📋 Remaining admin accounts:');
        remainingAdmins.forEach(admin => {
            console.log(`  - ID: ${admin.id}, Email: ${admin.email}, Name: ${admin.name}`);
        });
        
        console.log('✅ Admin cleanup completed');
        
    } catch (error) {
        console.error('❌ Error removing fake admin:', error);
    } finally {
        process.exit(0);
    }
}

removeFakeAdmin();