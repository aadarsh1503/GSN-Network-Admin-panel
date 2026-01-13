const mysql = require('mysql2/promise');
require('dotenv').config();

const checkBusinessUsers = async () => {
    try {
        console.log('🔍 Checking business users...');
        
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        console.log('✅ MySQL Database connected successfully!');
        
        // Check business users with their passwords (hashed)
        const [businessUsers] = await connection.execute(`
            SELECT id, name, email, role, password 
            FROM users 
            WHERE role = 'business'
            ORDER BY created_at DESC
            LIMIT 5
        `);
        
        console.log('\n👥 Business users in database:');
        businessUsers.forEach(user => {
            console.log(`   ${user.name} (${user.email}) - ID: ${user.id}`);
            console.log(`     Password hash: ${user.password.substring(0, 20)}...`);
        });
        
        await connection.end();
        console.log('\n✅ Check completed successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

checkBusinessUsers();