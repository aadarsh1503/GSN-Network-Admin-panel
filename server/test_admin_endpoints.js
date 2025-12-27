// Test script for admin panel endpoints
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

async function testAdminEndpoints() {
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Check if admin users exist
    const [adminUsers] = await connection.execute(
      'SELECT id, name, email, role FROM users WHERE role = "admin" LIMIT 5'
    );
    
    console.log('\n📊 Admin Users Found:', adminUsers.length);
    if (adminUsers.length > 0) {
      console.log('Admin users:', adminUsers);
      
      // Generate a test token for the first admin
      const adminUser = adminUsers[0];
      const token = jwt.sign(
        { id: adminUser.id, role: adminUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      console.log('\n🔑 Generated test token for admin:', adminUser.email);
      console.log('Token:', token);
      
      // Test the endpoints
      await testEndpoint('http://localhost:5000/api/admin-panel/quotes', token);
      await testEndpoint('http://localhost:5000/api/admin-panel/subscriptions', token);
      await testEndpoint('http://localhost:5000/api/admin-panel/transactions', token);
      
    } else {
      console.log('❌ No admin users found. Let me check all users...');
      
      // Check all users
      const [allUsers] = await connection.execute(
        'SELECT id, name, email, role FROM users LIMIT 10'
      );
      console.log('All users:', allUsers);
    }

    // Check if the required tables exist
    console.log('\n📋 Checking required tables...');
    
    const tables = ['quotes', 'subscriptions', 'transactions', 'users'];
    for (const table of tables) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`✅ ${table}: ${rows[0].count} records`);
      } catch (error) {
        console.log(`❌ ${table}: Table not found or error - ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function testEndpoint(url, token) {
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log(`\n🌐 ${url}`);
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      console.log(`✅ Success: ${Array.isArray(data) ? data.length : 'N/A'} records`);
      if (Array.isArray(data) && data.length > 0) {
        console.log('Sample record:', JSON.stringify(data[0], null, 2));
      }
    } else {
      console.log(`❌ Error: ${data.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`❌ Network error: ${error.message}`);
  }
}

testAdminEndpoints();