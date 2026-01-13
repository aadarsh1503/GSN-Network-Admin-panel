// Fix Admin Emails in Database
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function fixAdminEmails() {
    let connection;
    try {
        console.log('🔧 Fixing admin emails in database...\n');
        
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        console.log('✅ Database connected successfully!\n');
        
        // Get current admin users
        const [admins] = await connection.execute(
            'SELECT id, name, email, role FROM users WHERE role = "admin" ORDER BY id'
        );
        
        console.log('📋 Current admin users:');
        admins.forEach((admin, index) => {
            console.log(`${index + 1}. ID: ${admin.id}, Email: ${admin.email}`);
        });
        
        // Update admin emails to valid ones
        const validEmails = [
            'root@khaleeji.app',  // Main admin email from .env
            'dzero169@gmail.com'  // Keep the second admin email if it's valid
        ];
        
        console.log('\n🔄 Updating admin emails...');
        
        for (let i = 0; i < admins.length; i++) {
            const admin = admins[i];
            const newEmail = validEmails[i] || 'root@khaleeji.app';
            
            if (admin.email !== newEmail) {
                await connection.execute(
                    'UPDATE users SET email = ? WHERE id = ?',
                    [newEmail, admin.id]
                );
                console.log(`✅ Updated admin ID ${admin.id}: ${admin.email} → ${newEmail}`);
            } else {
                console.log(`✅ Admin ID ${admin.id} already has valid email: ${admin.email}`);
            }
        }
        
        // Verify the updates
        console.log('\n📧 Updated admin users:');
        const [updatedAdmins] = await connection.execute(
            'SELECT id, name, email, role FROM users WHERE role = "admin" ORDER BY id'
        );
        
        updatedAdmins.forEach((admin, index) => {
            console.log(`${index + 1}. ID: ${admin.id}, Email: ${admin.email}`);
        });
        
        console.log('\n✅ Admin emails have been fixed!');
        console.log('📧 Email notifications should now work properly.');
        console.log('🧪 Test by creating a support ticket from the help page.');
        
    } catch (error) {
        console.error('❌ Error fixing admin emails:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed.');
        }
    }
}

fixAdminEmails();