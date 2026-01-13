// Test environment variable loading from server directory
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Testing Environment Variable Loading');
console.log('=' .repeat(50));

console.log('Current working directory:', process.cwd());
console.log('Script directory:', __dirname);

// Test 1: Load .env from current directory
console.log('\n📋 Test 1: Loading .env from current directory');
const result1 = dotenv.config();
console.log('Result:', result1.error ? `Error: ${result1.error.message}` : 'Success');
console.log('DB_HOST:', process.env.DB_HOST || 'NOT SET');
console.log('DB_USER:', process.env.DB_USER || 'NOT SET');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' + process.env.DB_PASSWORD.slice(-3) : 'NOT SET');

// Test 2: Load .env with explicit path
console.log('\n📋 Test 2: Loading .env with explicit path');
const envPath = path.join(__dirname, '.env');
console.log('Trying path:', envPath);

const result2 = dotenv.config({ path: envPath });
console.log('Result:', result2.error ? `Error: ${result2.error.message}` : 'Success');
console.log('DB_HOST:', process.env.DB_HOST || 'NOT SET');
console.log('DB_USER:', process.env.DB_USER || 'NOT SET');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' + process.env.DB_PASSWORD.slice(-3) : 'NOT SET');

// Test 3: Check if .env file exists
console.log('\n📋 Test 3: Checking .env file existence');
import fs from 'fs';

const envExists = fs.existsSync(envPath);
console.log('.env file exists:', envExists);

if (envExists) {
    console.log('\n📋 .env file contents:');
    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const lines = envContent.split('\n').slice(0, 10); // First 10 lines
        lines.forEach((line, index) => {
            if (line.trim() && !line.startsWith('#')) {
                const [key] = line.split('=');
                console.log(`${index + 1}. ${key}=***`);
            }
        });
    } catch (error) {
        console.log('Error reading .env file:', error.message);
    }
}

// Test 4: Manual database connection test
console.log('\n📋 Test 4: Manual database connection test');
if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD) {
    console.log('✅ All database environment variables are loaded');
    
    // Test connection
    const testConnection = async () => {
        const mysql = await import('mysql2/promise');
        
        try {
            const pool = mysql.default.createPool({
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
            console.log('✅ Database connection successful!');
            
            const [result] = await connection.execute('SELECT 1 as test');
            console.log('✅ Query test successful');
            
            connection.release();
            await pool.end();
            
        } catch (error) {
            console.log('❌ Database connection failed:', error.message);
            
            // Check if password issue
            if (error.code === 'ER_ACCESS_DENIED_ERROR') {
                console.log('🔧 Trying to fix password issue...');
                
                // Check if password has extra characters
                const currentPassword = process.env.DB_PASSWORD;
                console.log('Current password length:', currentPassword.length);
                console.log('Current password ends with:', currentPassword.slice(-5));
                
                if (currentPassword.endsWith('now')) {
                    console.log('❌ Found issue: Password ends with "now"');
                    console.log('🔧 Suggested fix: Remove "now" from the end of DB_PASSWORD');
                }
            }
        }
    };
    
    testConnection();
} else {
    console.log('❌ Missing database environment variables');
    console.log('DB_HOST:', process.env.DB_HOST ? '✅' : '❌');
    console.log('DB_USER:', process.env.DB_USER ? '✅' : '❌');
    console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '✅' : '❌');
    console.log('DB_NAME:', process.env.DB_NAME ? '✅' : '❌');
}

console.log('\n🏁 Environment test completed');