import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function testFixedQuery() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('Testing fixed getUserCompanies query...');
    
    const testUserId = 1;
    const sql = `
      SELECT DISTINCT 
        c.id,
        c.name,
        c.email
      FROM users c
      WHERE c.role = 'company' 
      AND c.id IN (
        SELECT DISTINCT qr.company_id 
        FROM quote_responses qr
        JOIN quotes q ON qr.quote_id = q.id
        WHERE q.user_id = ?
        UNION
        SELECT DISTINCT company_id 
        FROM transactions 
        WHERE user_id = ? AND company_id IS NOT NULL
      )
      ORDER BY c.name ASC
    `;
    
    const [companies] = await connection.execute(sql, [testUserId, testUserId]);
    console.log('✅ Query successful! Found companies:', companies);
    
    if (companies.length === 0) {
      console.log('No interactions found, testing fallback...');
      const fallbackSql = `
        SELECT id, name, email 
        FROM users 
        WHERE role = 'company' AND status = 1 
        ORDER BY name ASC
      `;
      const [allCompanies] = await connection.execute(fallbackSql);
      console.log('✅ Fallback successful! Found companies:', allCompanies);
    }
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFixedQuery();