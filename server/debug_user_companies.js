import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function debugUserCompanies() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('🔍 Debugging getUserCompanies function...\n');
    
    // Check if tables exist
    console.log('1. Checking if required tables exist...');
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    console.log('Available tables:', tableNames);
    
    const requiredTables = ['users', 'quotes', 'transactions'];
    for (const table of requiredTables) {
      if (tableNames.includes(table)) {
        console.log('✅', table, 'exists');
      } else {
        console.log('❌', table, 'missing');
      }
    }
    
    // Check users table structure
    if (tableNames.includes('users')) {
      console.log('\n2. Checking users table structure...');
      const [userCols] = await connection.execute('DESCRIBE users');
      console.log('Users columns:', userCols.map(c => c.Field));
      
      // Check if there are any company users
      const [companyCount] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE role = ?', ['company']);
      console.log('Company users count:', companyCount[0].count);
    }
    
    // Check quotes table if exists
    if (tableNames.includes('quotes')) {
      console.log('\n3. Checking quotes table structure...');
      const [quoteCols] = await connection.execute('DESCRIBE quotes');
      console.log('Quotes columns:', quoteCols.map(c => c.Field));
    }
    
    // Check transactions table if exists
    if (tableNames.includes('transactions')) {
      console.log('\n4. Checking transactions table structure...');
      const [transCols] = await connection.execute('DESCRIBE transactions');
      console.log('Transactions columns:', transCols.map(c => c.Field));
    }
    
    // Try the actual query with a test user_id
    console.log('\n5. Testing the getUserCompanies query...');
    try {
      const testUserId = 1; // Use a test user ID
      const sql = `
        SELECT DISTINCT 
          c.id,
          c.name,
          c.email
        FROM users c
        WHERE c.role = 'company' 
        AND c.id IN (
          SELECT DISTINCT company_id FROM quotes WHERE user_id = ?
          UNION
          SELECT DISTINCT company_id FROM transactions WHERE user_id = ?
        )
        ORDER BY c.name ASC
      `;
      const [companies] = await connection.execute(sql, [testUserId, testUserId]);
      console.log('Query result:', companies);
      
      if (companies.length === 0) {
        console.log('No companies found, trying fallback query...');
        const fallbackSql = `
          SELECT id, name, email 
          FROM users 
          WHERE role = 'company' AND status = 1 
          ORDER BY name ASC
        `;
        const [allCompanies] = await connection.execute(fallbackSql);
        console.log('Fallback result:', allCompanies);
      }
    } catch (queryError) {
      console.log('❌ Query error:', queryError.message);
    }
    
    await connection.end();
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  }
}

debugUserCompanies();