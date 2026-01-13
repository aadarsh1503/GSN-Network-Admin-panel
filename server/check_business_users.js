import db from './config/db.js';
import bcrypt from 'bcryptjs';

async function checkBusinessUsers() {
    try {
        const [users] = await db.execute('SELECT id, name, email, role FROM users WHERE role = "business" LIMIT 5');
        console.log('Business users found:');
        users.forEach(user => {
            console.log(`- ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
        });
        
        // Let's create a test password for the first business user
        if (users.length > 0) {
            const testPassword = 'test123';
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(testPassword, salt);
            
            await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, users[0].id]);
            console.log(`\nUpdated password for ${users[0].email} to: ${testPassword}`);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkBusinessUsers();