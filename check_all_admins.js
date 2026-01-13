// Check All Admin Users in Database
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

async function checkAllAdmins() {
    let connection;
    try {
        console.log('🔍 Connecting to database to check admin users...\n');
        
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        console.log('✅ Database connected successfully!\n');
        
        // Check all admin users
        console.log('📋 Checking all admin users...');
        const [admins] = await connection.execute(
            'SELECT id, name, email, role, created_at FROM users WHERE role = "admin" ORDER BY id'
        );
        
        console.log(`\n👥 Found ${admins.length} admin users:\n`);
        
        if (admins.length === 0) {
            console.log('❌ No admin users found in the database!');
            console.log('💡 You need to create admin users first.');
            return;
        }
        
        admins.forEach((admin, index) => {
            console.log(`${index + 1}. Admin User Details:`);
            console.log(`   ID: ${admin.id}`);
            console.log(`   Name: ${admin.name || 'No name set'}`);
            console.log(`   Email: ${admin.email || '❌ NO EMAIL SET'}`);
            console.log(`   Role: ${admin.role}`);
            console.log(`   Created: ${admin.created_at}`);
            console.log(`   Status: ${admin.email ? '✅ Has email' : '❌ Missing email'}`);
            console.log('');
        });
        
        // Check valid admin emails
        const validAdminEmails = admins.filter(admin => admin.email && admin.email.trim()).map(admin => admin.email);
        
        console.log('📧 Valid admin emails for notifications:');
        if (validAdminEmails.length === 0) {
            console.log('❌ NO VALID ADMIN EMAILS FOUND!');
            console.log('\n🔧 SOLUTION: Update admin emails using one of these methods:');
            console.log('1. Update directly in database:');
            console.log(`   UPDATE users SET email = 'root@khaleeji.app' WHERE role = 'admin' AND id = ${admins[0]?.id};`);
            console.log('2. Use the admin panel to update user profiles');
            console.log('3. Run the add_admin_email.js script');
        } else {
            validAdminEmails.forEach((email, index) => {
                console.log(`   ${index + 1}. ${email}`);
            });
        }
        
        // Check .env fallback email
        console.log('\n📧 Fallback emails from .env:');
        console.log(`   ADMIN_EMAIL: ${process.env.ADMIN_EMAIL || 'Not set'}`);
        console.log(`   EMAIL_FROM: ${process.env.EMAIL_FROM || 'Not set'}`);
        
        // Recommend action
        console.log('\n💡 RECOMMENDATION:');
        if (validAdminEmails.length === 0) {
            console.log('❌ URGENT: No admin emails found. Email notifications will fail!');
            console.log('🔧 ACTION NEEDED: Update at least one admin user with a valid email address.');
        } else {
            console.log('✅ Admin emails found. Email notifications should work.');
            console.log(`📊 ${validAdminEmails.length} admin(s) will receive ticket notifications.`);
        }
        
    } catch (error) {
        console.error('❌ Error checking admin users:', error.message);
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n🔧 Database connection failed. Check your .env file:');
            console.log(`   DB_HOST: ${process.env.DB_HOST}`);
            console.log(`   DB_USER: ${process.env.DB_USER}`);
            console.log(`   DB_NAME: ${process.env.DB_NAME}`);
            console.log('   DB_PASSWORD: [hidden]');
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed.');
        }
    }
}

checkAllAdmins();