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

async function checkUserAadiInvoices() {
  let connection;
  
  try {
    console.log('🔍 Checking user aadi@gmail.com invoices...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Check if user exists
    const [users] = await connection.execute(`
      SELECT id, name, email, role 
      FROM users 
      WHERE email = 'aadi@gmail.com'
    `);
    
    if (users.length === 0) {
      console.log('❌ User aadi@gmail.com not found');
      return;
    }
    
    const user = users[0];
    console.log(`👤 Found user: ${user.name} (${user.email}) - Role: ${user.role} - ID: ${user.id}`);
    
    // Check their quotes
    const [quotes] = await connection.execute(`
      SELECT q.*, 
             COUNT(qr.id) as response_count,
             GROUP_CONCAT(qr.id) as response_ids
      FROM quotes q
      LEFT JOIN quote_responses qr ON q.id = qr.quote_id
      WHERE q.user_id = ?
      GROUP BY q.id
      ORDER BY q.created_at DESC
    `, [user.id]);
    
    console.log(`\n📋 Found ${quotes.length} quotes for this user:`);
    quotes.forEach(quote => {
      console.log(`   - Quote #${quote.id}: ${quote.departure_city || 'N/A'} → ${quote.arrival_city || 'N/A'}`);
      console.log(`     Status: ${quote.status}, Responses: ${quote.response_count}`);
      if (quote.response_ids) {
        console.log(`     Response IDs: ${quote.response_ids}`);
      }
    });
    
    // Check quote responses for this user's quotes
    const [responses] = await connection.execute(`
      SELECT qr.*, c.name as company_name, c.email as company_email
      FROM quote_responses qr
      JOIN quotes q ON qr.quote_id = q.id
      JOIN users c ON qr.company_id = c.id
      WHERE q.user_id = ?
      ORDER BY qr.created_at DESC
    `, [user.id]);
    
    console.log(`\n💼 Found ${responses.length} quote responses:`);
    responses.forEach(response => {
      console.log(`   - Response #${response.id}: Quote #${response.quote_id} by ${response.company_name}`);
      console.log(`     Amount: $${response.price || 'N/A'}, Status: ${response.status}`);
    });
    
    // Check payment verifications
    const [payments] = await connection.execute(`
      SELECT pv.*, q.id as quote_id, c.name as company_name
      FROM payment_verifications pv
      JOIN quotes q ON pv.quote_id = q.id
      JOIN quote_responses qr ON q.id = qr.quote_id
      JOIN users c ON qr.company_id = c.id
      WHERE q.user_id = ?
      ORDER BY pv.created_at DESC
    `, [user.id]);
    
    console.log(`\n💳 Found ${payments.length} payment verifications:`);
    payments.forEach(payment => {
      console.log(`   - Payment #${payment.id}: Quote #${payment.quote_id} to ${payment.company_name}`);
      console.log(`     Verification Status: ${payment.verification_status}`);
      console.log(`     Verification Date: ${payment.verification_date}`);
    });
    
    // Check existing transaction invoices
    const [invoices] = await connection.execute(`
      SELECT ti.*, c.name as company_name
      FROM transaction_invoices ti
      JOIN users c ON ti.company_id = c.id
      WHERE ti.user_id = ?
      ORDER BY ti.created_at DESC
    `, [user.id]);
    
    console.log(`\n🧾 Found ${invoices.length} transaction invoices:`);
    invoices.forEach(invoice => {
      console.log(`   - Invoice ${invoice.invoice_number}: Quote #${invoice.quote_id} to ${invoice.company_name}`);
      console.log(`     Amount: $${invoice.total_amount}, Status: ${invoice.status}`);
    });
    
    // Find verified payments without invoices
    const [verifiedPayments] = await connection.execute(`
      SELECT DISTINCT pv.*, q.id as quote_id, qr.company_id, qr.price as total_price, c.name as company_name
      FROM payment_verifications pv
      JOIN quotes q ON pv.quote_id = q.id
      JOIN quote_responses qr ON q.id = qr.quote_id
      JOIN users c ON qr.company_id = c.id
      LEFT JOIN transaction_invoices ti ON q.id = ti.quote_id AND ti.user_id = q.user_id
      WHERE q.user_id = ? AND pv.verification_status = 'verified' AND ti.id IS NULL
      ORDER BY pv.created_at DESC
    `, [user.id]);
    
    console.log(`\n🔍 Found ${verifiedPayments.length} verified payments without invoices:`);
    
    if (verifiedPayments.length > 0) {
      console.log('\n🔧 Creating missing transaction invoices...');
      
      for (const payment of verifiedPayments) {
        const invoiceNumber = `TXN-INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`;
        const serviceFeePct = 0.05; // 5%
        const amount = parseFloat(payment.total_price || payment.price || 0);
        const serviceFee = amount * serviceFeePct;
        const totalAmount = amount + serviceFee;
        
        await connection.execute(`
          INSERT INTO transaction_invoices 
          (invoice_number, quote_id, user_id, company_id, amount, service_fee, total_amount, status, payment_date, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', ?, NOW(), NOW())
        `, [
          invoiceNumber,
          payment.quote_id,
          user.id,
          payment.company_id,
          amount,
          serviceFee,
          totalAmount,
          payment.verification_date
        ]);
        
        console.log(`✅ Created invoice ${invoiceNumber} for Quote #${payment.quote_id} to ${payment.company_name}`);
        console.log(`   Amount: $${amount} + $${serviceFee.toFixed(2)} = $${totalAmount.toFixed(2)}`);
      }
    }
    
    // Final count
    const [finalInvoices] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM transaction_invoices ti
      WHERE ti.user_id = ?
    `, [user.id]);
    
    console.log(`\n🎉 Final result: ${finalInvoices[0].count} transaction invoices for user ${user.email}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkUserAadiInvoices();