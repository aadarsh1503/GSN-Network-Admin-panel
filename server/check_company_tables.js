import db from './config/db.js';

const checkTables = async () => {
    try {
        const [result] = await db.execute("SHOW TABLES LIKE '%company%'");
        console.log('Company-related tables:', result);
        
        // Also check users table structure for company info
        const [userColumns] = await db.execute("DESCRIBE users");
        console.log('\nUsers table columns:');
        userColumns.forEach(col => {
            console.log(`${col.Field}: ${col.Type}`);
        });
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
};

checkTables();