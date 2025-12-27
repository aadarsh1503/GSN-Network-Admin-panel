import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkDisputeTables() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'gsn_network'
        });

        console.log('🔍 Checking dispute tables...');

        const [tables] = await connection.execute("SHOW TABLES LIKE 'dispute%'");
        console.log('Dispute tables found:', tables.map(t => Object.values(t)[0]));

        if (tables.length > 0) {
            const [reasons] = await connection.execute('SELECT COUNT(*) as count FROM dispute_reasons');
            console.log('Dispute reasons count:', reasons[0].count);

            const [disputes] = await connection.execute('SELECT COUNT(*) as count FROM disputes');
            console.log('Disputes count:', disputes[0].count);
        }

        await connection.end();
        console.log('✅ Database check completed!');
    } catch (error) {
        console.error('❌ Error checking database:', error.message);
    }
}

checkDisputeTables();