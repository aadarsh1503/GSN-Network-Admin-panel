import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
};

async function testBusinessAPI() {
  let connection;
  
  try {
    console.log('🔍 Testing business API SQL query directly...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Test the exact SQL query from the business controller
    const businessId = 44; // subodhchauhan1309@gmail.com
    
    const sql = `
        SELECT 
            ti.*,
            q.id as quote_id,
            q.departure_city,
            q.arrival_city,
            q.product_description,
            q.shipping_mode,
            c.name as company_name,
            c.email as company_email,
            c.phone as company_phone
        FROM transaction_invoices ti
        LEFT JOIN quotes q ON ti.quote_id = q.id
        LEFT JOIN users c ON ti.company_id = c.id
        WHERE ti.user_id = ?
        ORDER BY ti.created_at DESC
    `;
    
    console.log('🔍 Executing SQL query...');
    console.log('🔍 SQL:', sql);
    console.log('🔍 Parameters:', [businessId]);
    
    const [invoices] = await connection.execute(sql, [businessId]);
    
    console.log('📊 Query result count:', invoices.length);
    
    if (invoices.length > 0) {
      console.log('📋 Sample invoice:', invoices[0]);
      console.log('\n📋 All invoices:');
      invoices.forEach((inv, idx) => {
        console.log(`   ${idx + 1}. ${inv.invoice_number}: $${inv.total_amount} (paid to ${inv.company_name})`);
      });
    } else {
      console.log('❌ No invoices found for business user ID:', businessId);
    }
    
    // Also test what the old query would have returned
    console.log('\n🔍 Testing old query (company_id = businessId):');
    const oldSql = `
        SELECT 
            ti.*,
            q.id as quote_id,
            q.departure_city,
            q.arrival_city,
            u.name as user_name,
            u.email as user_email,
            u.phone as user_phone
        FROM transaction_invoices ti
        LEFT JOIN quotes q ON ti.quote_id = q.id
        LEFT JOIN users u ON ti.user_id = u.id
        WHERE ti.company_id = ?
        ORDER BY ti.created_at DESC
    `;
    
    const [oldInvoices] = await connection.execute(oldSql, [businessId]);
    console.log('📊 Old query result count:', oldInvoices.length);
    
    if (oldInvoices.length > 0) {
      console.log('📋 Old query would have returned:');
      oldInvoices.forEach((inv, idx) => {
        console.log(`   ${idx + 1}. ${inv.invoice_number}: $${inv.total_amount} (received from ${inv.user_name})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testBusinessAPI();