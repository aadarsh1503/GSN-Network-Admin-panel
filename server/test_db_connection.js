// Test database connection with current credentials
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Testing Database Connection');
console.log('=' .repeat(50));

console.log('Database Configuration:');
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`User: ${process.env.DB_USER}`);
console.log(`Password: ${process.env.DB_PASSWORD ? '***' + process.env.DB_PASSWORD.slice(-3) : 'NOT SET'}`);
console.log(`Database: ${process.env.DB_NAME}`);
console.log('');

// Test with current .env credentials
const testCurrentCredentials = async () => {
    console.log('📋 Testing with current .env credentials...');
    
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 1,
            queueLimit: 0,
            connectTimeout: 10000
        });

        const connection = await pool.getConnection();
        console.log('✅ Connection successful with current credentials!');
        
        // Test a simple query
        const [result] = await connection.execute('SELECT 1 as test');
        console.log('✅ Query test successful:', result[0]);
        
        connection.release();
        await pool.end();
        
    } catch (error) {
        console.log('❌ Connection failed with current credentials');
        console.log('Error:', error.message);
        console.log('Error Code:', error.code);
        
        // Test with old credentials
        console.log('\n📋 Testing with old credentials (sCp@/2I1D3w)...');
        
        try {
            const oldPool = mysql.createPool({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: 'sCp@/2I1D3w', // Old password
                database: process.env.DB_NAME,
                waitForConnections: true,
                connectionLimit: 1,
                queueLimit: 0,
                connectTimeout: 10000
            });

            const oldConnection = await oldPool.getConnection();
            console.log('✅ Connection successful with OLD credentials!');
            console.log('🔧 Issue: Password in .env file needs to be updated back to: sCp@/2I1D3w');
            
            oldConnection.release();
            await oldPool.end();
            
        } catch (oldError) {
            console.log('❌ Connection also failed with old credentials');
            console.log('Error:', oldError.message);
            
            // Check if it's a network issue
            console.log('\n📋 Testing network connectivity...');
            try {
                const testPool = mysql.createPool({
                    host: process.env.DB_HOST,
                    user: 'test', // Wrong user to test if we can reach the server
                    password: 'test',
                    database: process.env.DB_NAME,
                    connectTimeout: 5000
                });
                
                await testPool.getConnection();
            } catch (networkError) {
                if (networkError.code === 'ER_ACCESS_DENIED_ERROR') {
                    console.log('✅ Network is fine - can reach database server');
                    console.log('❌ Issue is with credentials');
                } else if (networkError.code === 'ECONNREFUSED' || networkError.code === 'ETIMEDOUT') {
                    console.log('❌ Network issue - cannot reach database server');
                    console.log('Check if database server is running and accessible');
                } else {
                    console.log('❌ Unknown network error:', networkError.message);
                }
            }
        }
    }
};

// Test different scenarios
const runTests = async () => {
    await testCurrentCredentials();
    
    console.log('\n📊 DIAGNOSIS:');
    console.log('-'.repeat(30));
    
    if (process.env.DB_PASSWORD === 'sCp@/2I1D3wnow') {
        console.log('❌ Issue found: Password in .env has extra "now" at the end');
        console.log('🔧 Fix: Change DB_PASSWORD from "sCp@/2I1D3wnow" to "sCp@/2I1D3w"');
    } else if (!process.env.DB_PASSWORD) {
        console.log('❌ Issue found: DB_PASSWORD not set in .env file');
    } else {
        console.log('ℹ️  Password looks correct, checking other issues...');
    }
    
    console.log('\n🏁 Test completed');
};

runTests().catch(console.error);