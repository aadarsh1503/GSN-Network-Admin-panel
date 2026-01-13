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

async function debugInvoiceFlow() {
  let connection;
  
  try {
    console.log('🔍 Debugging invoice flow...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Check the specific transaction we're looking for
    console.log('\n📋 Checking Quote #95 transaction flow:');
    
    // 1. Check the quote
    const [quotes] = await connection.execute(`
      SELECT q.*, u.name as user_name, u.email as user_email, u.role as user_role
      FROM quotes q 
      JOIN users u ON q.user_id = u.id 
      WHERE q.id = 95
    `);
    
    if (quotes.length > 0) {
      const quote = quotes[0];
      console.log(`✅ Quote #95: ${quote.user_name} (${quote.user_email}) - Role: ${quote.user_role}`);
      console.log(`   From: ${quote.from_location} → To: ${quote.to_location}`);
      console.log(`   Service: ${quote.service_type}`);
      
      // 2. Check quote responses
      const [responses] = await connection.execute(`
        SELECT qr.*, c.name as company_name, c.email as company_email
        FROM quote_responses qr
        JOIN users c ON qr.company_id = c.id
        WHERE qr.quote_id = 95
      `);
      
      if (responses.length > 0) {
        const response = responses[0];
        console.log(`✅ Quote Response: ${response.company_name} (${response.company_email})`);
        console.log(`   Amount: $${response.total_price}`);
        console.log(`   Status: ${response.status}`);
        
        // 3. Check payment verification
        const [payments] = await connection.execute(`
          SELECT * FROM payment_verifications 
          WHERE quote_id = 95
          ORDER BY created_at DESC
        `);
        
        if (payments.length > 0) {
          const payment = payments[0];
          console.log(`✅ Payment Verification: Status: ${payment.status}`);
          console.log(`   Amount: $${payment.amount}`);
          console.log(`   Payment Date: ${payment.payment_date}`);
          
          // 4. Check transaction invoices
          const [invoices] = await connection.execute(`
            SELECT ti.*, 
                   u.name as user_name, u.email as user_email, u.role as user_role,
                   c.name as company_name, c.email as company_email, c.role as company_role
            FROM transaction_invoices ti
            JOIN users u ON ti.user_id = u.id
            JOIN users c ON ti.company_id = c.id
            WHERE ti.quote_id = 95
          `);
          
          if (invoices.length > 0) {
            const invoice = invoices[0];
            console.log(`✅ Transaction Invoice: ${invoice.invoice_number}`);
            console.log(`   User: ${invoice.user_name} (${invoice.user_email}) - Role: ${invoice.user_role}`);
            console.log(`   Company: ${invoice.company_name} (${invoice.company_email}) - Role: ${invoice.company_role}`);
            console.log(`   Amount: $${invoice.amount}`);
            console.log(`   Total: $${invoice.total_amount}`);
            console.log(`   Status: ${invoice.status}`);
            
            console.log('\n🎯 Invoice Visibility:');
            console.log(`   User Panel (user_id = ${invoice.user_id}): Should see this invoice`);
            console.log(`   Business Panel (company_id = ${invoice.company_id}): Should see this invoice`);
            console.log(`   Company Panel (company_id = ${invoice.company_id}): Should see this invoice`);
            
          } else {
            console.log('❌ No transaction invoice found for Quote #95');
            
            // Create the missing invoice
            console.log('\n🔧 Creating missing transaction invoice...');
            
            const invoiceNumber = `TXN-INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`;
            const serviceFeePct = 0.05; // 5%
            const amount = parseFloat(response.total_price);
            const serviceFee = amount * serviceFeePct;
            const totalAmount = amount + serviceFee;
            
            await connection.execute(`
              INSERT INTO transaction_invoices 
              (invoice_number, quote_id, user_id, company_id, amount, service_fee, total_amount, status, payment_date, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', ?, NOW(), NOW())
            `, [
              invoiceNumber,
              95,
              quote.user_id,
              response.company_id,
              amount,
              serviceFee,
              totalAmount,
              payment.payment_date
            ]);
            
            console.log(`✅ Created invoice: ${invoiceNumber}`);
            console.log(`   User ID: ${quote.user_id} (${quote.user_name})`);
            console.log(`   Company ID: ${response.company_id} (${response.company_name})`);
            console.log(`   Amount: $${amount} + $${serviceFee.toFixed(2)} = $${totalAmount.toFixed(2)}`);
          }
          
        } else {
          console.log('❌ No payment verification found for Quote #95');
        }
        
      } else {
        console.log('❌ No quote response found for Quote #95');
      }
      
    } else {
      console.log('❌ Quote #95 not found');
    }
    
    // Check all users and their roles
    console.log('\n👥 All users and their roles:');
    const [allUsers] = await connection.execute(`
      SELECT id, name, email, role 
      FROM users 
      WHERE email IN ('subodhchauhan1309@gmail.com', 'aadarshchauhan35@gmail.com')
      ORDER BY role, name
    `);
    
    allUsers.forEach(user => {
      console.log(`   ${user.role.toUpperCase()}: ${user.name} (${user.email}) - ID: ${user.id}`);
    });
    
    // Check invoices for both users
    console.log('\n🧾 Transaction invoices for both users:');
    
    for (const user of allUsers) {
      if (user.role === 'business') {
        // For business users, check invoices where they are the user (made payments)
        const [userInvoices] = await connection.execute(`
          SELECT ti.*, c.name as company_name
          FROM transaction_invoices ti
          JOIN users c ON ti.company_id = c.id
          WHERE ti.user_id = ?
        `, [user.id]);
        
        console.log(`\n   📊 ${user.name} (${user.email}) - Business User:`);
        console.log(`      User Panel invoices (user_id = ${user.id}): ${userInvoices.length}`);
        userInvoices.forEach(inv => {
          console.log(`        - ${inv.invoice_number}: $${inv.total_amount} (paid to ${inv.company_name})`);
        });
        
        // Also check if they have any as company (shouldn't for business role)
        const [companyInvoices] = await connection.execute(`
          SELECT ti.*, u.name as user_name
          FROM transaction_invoices ti
          JOIN users u ON ti.user_id = u.id
          WHERE ti.company_id = ?
        `, [user.id]);
        
        console.log(`      Business Panel invoices (company_id = ${user.id}): ${companyInvoices.length}`);
        companyInvoices.forEach(inv => {
          console.log(`        - ${inv.invoice_number}: $${inv.total_amount} (received from ${inv.user_name})`);
        });
      }
      
      if (user.role === 'company') {
        // For company users, check invoices where they are the company (received payments)
        const [companyInvoices] = await connection.execute(`
          SELECT ti.*, u.name as user_name
          FROM transaction_invoices ti
          JOIN users u ON ti.user_id = u.id
          WHERE ti.company_id = ?
        `, [user.id]);
        
        console.log(`\n   📊 ${user.name} (${user.email}) - Company:`);
        console.log(`      Company Panel invoices (company_id = ${user.id}): ${companyInvoices.length}`);
        companyInvoices.forEach(inv => {
          console.log(`        - ${inv.invoice_number}: $${inv.total_amount} (received from ${inv.user_name})`);
        });
        
        // Also check if they have any as user (shouldn't for company role)
        const [userInvoices] = await connection.execute(`
          SELECT ti.*, c.name as company_name
          FROM transaction_invoices ti
          JOIN users c ON ti.company_id = c.id
          WHERE ti.user_id = ?
        `, [user.id]);
        
        console.log(`      User Panel invoices (user_id = ${user.id}): ${userInvoices.length}`);
        userInvoices.forEach(inv => {
          console.log(`        - ${inv.invoice_number}: $${inv.total_amount} (paid to ${inv.company_name})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugInvoiceFlow();