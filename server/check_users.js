import db from './config/db.js';

async function checkUsers() {
    try {
        const [users] = await db.execute('SELECT id, name, email, role FROM users ORDER BY id DESC LIMIT 15');
        console.log('Recent users:');
        users.forEach(u => {
            console.log(`  ${u.role}: ${u.name} (${u.email}) - ID: ${u.id}`);
        });
        
        // Check for the specific email
        const [specificUser] = await db.execute('SELECT * FROM users WHERE email = ?', ['subodhchauhan35@gmail.com']);
        if (specificUser.length > 0) {
            console.log('\nFound user with subodhchauhan35@gmail.com:', specificUser[0]);
        } else {
            console.log('\nUser with subodhchauhan35@gmail.com not found');
            
            // Check similar emails
            const [similarUsers] = await db.execute('SELECT * FROM users WHERE email LIKE ?', ['%subodh%']);
            console.log('Similar emails:', similarUsers);
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

checkUsers();