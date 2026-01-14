import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function checkRoles() {
    try {
        const [roles] = await db.execute('SELECT DISTINCT role, COUNT(*) as count FROM users GROUP BY role ORDER BY count DESC');
        console.log('📊 User Roles in Database:');
        console.log('==========================');
        roles.forEach(r => {
            console.log(`${r.role}: ${r.count} users`);
        });
        
        console.log('\n📋 Sample Users by Role:');
        console.log('========================');
        for (const roleData of roles) {
            const [users] = await db.execute('SELECT id, name, email FROM users WHERE role = ? LIMIT 3', [roleData.role]);
            console.log(`\n${roleData.role.toUpperCase()} Users:`);
            users.forEach(u => {
                console.log(`  ID: ${u.id} | Name: ${u.name} | Email: ${u.email}`);
            });
        }
        
        await db.end();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkRoles();