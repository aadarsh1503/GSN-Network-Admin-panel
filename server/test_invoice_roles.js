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

async function testInvoiceRoles() {
  let connection;
  
  try {
    console.log('🔍 Testing invoice roles and visibility...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Get the specific users we're testing
    const [users] = await connection.execute(`
      SELECT id, name, email, role 
      FROM users 
      WHERE email IN ('subodhchauhan1309@gmail.com', 'aadarshchauhan35@gmail.com')
      ORDER BY role, name
    `);
    
    console.log('\n👥 Test Users:');
    users.forEach(user => {
      console.log(`   ${user.role.toUpperCase()}: ${user.name} (${user.email}) - ID: ${user.id}`);
    });
    
    // Check transaction invoices for each user
    for (const user of users) {
      console.log(`\n📊 Invoices for ${user.name} (${user.email}) - Role: ${user.role}:`);
      
      // Business Panel: Show invoices where this user is the company (received payments)
      const [businessInvoices] = await connection.execute(`
        SELECT ti.*, u.name as payer_name, u.email as payer_email
        FROM transaction_invoices ti
        JOIN users u ON ti.user_id = u.id
        WHERE ti.company_id = ?
      `, [user.id]);
      
      console.log(`   🏢 Business Panel (company_id = ${user.id}): ${businessInvoices.length} invoices`);
      businessInvoices.forEach(inv => {
        console.log(`      - ${inv.invoice_number}: $${inv.total_amount} (received from ${inv.payer_name})`);
      });
      
      // User Panel: Show invoices where this user made payments
      const [userInvoices] = await connection.execute(`
        SELECT ti.*, c.name as company_name, c.email as company_email
        FROM transaction_invoices ti
        JOIN users c ON ti.company_id = c.id
        WHERE ti.user_id = ?
      `, [user.id]);
      
      console.log(`   👤 User Panel (user_id = ${user.id}): ${userInvoices.length} invoices`);
      userInvoices.forEach(inv => {
        console.log(`      - ${inv.invoice_number}: $${inv.total_amount} (paid to ${inv.company_name})`);
      });
      
      // Determine what they should see based on role
      console.log(`   🎯 Expected behavior for role "${user.role}":`);
      if (user.role === 'business') {
        console.log(`      - Should see ${userInvoices.length} invoices in User Panel (payments they made)`);
        console.log(`      - Should see ${businessInvoices.length} invoices in Business Panel (payments they received)`);
        console.log(`      - Primary panel: User Panel (most business users make payments)`);
      } else if (user.role === 'company') {
        console.log(`      - Should see ${businessInvoices.length} invoices in Business/Company Panel (payments they received)`);
        console.log(`      - Should see ${userInvoices.length} invoices in User Panel (payments they made)`);
        console.log(`      - Primary panel: Business/Company Panel (companies receive payments)`);
      }
    }
    
    console.log('\n🔍 Current Issue Analysis:');
    console.log('   - User subodhchauhan1309@gmail.com (business role) made payments to companies');
    console.log('   - They should see their invoices in the USER panel, not business panel');
    console.log('   - Business panel is for when you RECEIVE payments as a business');
    console.log('   - User panel is for when you MAKE payments as a user');
    
    console.log('\n💡 Solution:');
    console.log('   - Business users who make payments: Use User Panel');
    console.log('   - Business users who receive payments: Use Business Panel');
    console.log('   - Companies who receive payments: Use Company Panel');
    console.log('   - The role determines access, but the actual invoices depend on whether you paid or received payment');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testInvoiceRoles();