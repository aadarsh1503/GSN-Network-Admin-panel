import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testBusinessUsers() {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('✅ Connected to database successfully');
    
    // Check all users with their roles
    console.log('\n🔍 Checking all user roles...');
    const [allUsers] = await connection.execute('SELECT role, COUNT(*) as count FROM users GROUP BY role');
    console.log('📊 User roles distribution:');
    allUsers.forEach(row => {
      console.log(`  - ${row.role}: ${row.count} users`);
    });
    
    // Check business users specifically
    console.log('\n🏢 Checking business users...');
    const [businessUsers] = await connection.execute(`
      SELECT id, name, email, role, category, country, state, city, logo, about_company, created_at 
      FROM users 
      WHERE role = 'business' 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log(`📋 Found ${businessUsers.length} business users:`);
    
    if (businessUsers.length > 0) {
      businessUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. Business User:`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Category: ${user.category || 'Not set'}`);
        console.log(`   Location: ${user.city || 'N/A'}, ${user.state || 'N/A'}, ${user.country || 'N/A'}`);
        console.log(`   Logo: ${user.logo ? 'Yes' : 'No'}`);
        console.log(`   About: ${user.about_company ? 'Yes' : 'No'}`);
        console.log(`   Created: ${user.created_at}`);
      });
    } else {
      console.log('⚠️ No business users found');
      
      // Let's check if there are any users at all
      const [totalUsers] = await connection.execute('SELECT COUNT(*) as total FROM users');
      console.log(`📊 Total users in database: ${totalUsers[0].total}`);
      
      if (totalUsers[0].total > 0) {
        // Show sample users
        const [sampleUsers] = await connection.execute('SELECT id, name, email, role FROM users LIMIT 5');
        console.log('\n📋 Sample users:');
        sampleUsers.forEach(user => {
          console.log(`  - ID: ${user.id}, Name: ${user.name}, Role: ${user.role}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

testBusinessUsers();