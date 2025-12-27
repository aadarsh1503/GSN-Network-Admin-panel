import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testDatabaseConnection() {
    console.log('🔍 Testing Database Connection...\n');
    
    const config = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        connectTimeout: 10000,
        acquireTimeout: 10000,
        timeout: 10000
    };
    
    console.log('Database Config:');
    console.log(`Host: ${config.host}`);
    console.log(`User: ${config.user}`);
    console.log(`Database: ${config.database}`);
    console.log('');
    
    try {
        console.log('Attempting to connect...');
        const connection = await mysql.createConnection(config);
        console.log('✅ Database connection successful!');
        
        // Test a simple query
        const [rows] = await connection.execute('SELECT 1 as test');
        console.log('✅ Database query test successful:', rows);
        
        await connection.end();
        console.log('✅ Connection closed properly');
        
    } catch (error) {
        console.error('❌ Database connection failed:');
        console.error(`Error: ${error.message}`);
        console.error(`Code: ${error.code}`);
        console.error(`Errno: ${error.errno}`);
        
        if (error.code === 'ETIMEDOUT') {
            console.log('\n💡 Possible solutions:');
            console.log('1. Check if the database server is running');
            console.log('2. Verify network connectivity to the database host');
            console.log('3. Check if firewall is blocking the connection');
            console.log('4. Verify database credentials are correct');
        }
    }
}

testDatabaseConnection();