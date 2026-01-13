// Simple check for business users
import db from './config/db.js';

const checkBusinessUsers = async () => {
    try {
        console.log('Checking business users...');
        
        const [rows] = await db.execute(
            'SELECT id, name, email, role, status FROM users WHERE role = "business" LIMIT 3'
        );
        
        console.log(`Found ${rows.length} business users:`);
        rows.forEach(user => {
            console.log(`- ${user.name} (${user.email}) - Status: ${user.status ? 'Active' : 'Inactive'}`);
        });
        
        if (rows.length === 0) {
            console.log('No business users found. This might be the issue.');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        process.exit(0);
    }
};

checkBusinessUsers();