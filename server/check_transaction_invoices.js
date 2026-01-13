// check_transaction_invoices.js
import mysql from 'mysql2/promise';

async function checkTransactionInvoices() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: '92.112.181.224',
            user: 'gsnuser',
            password: 'sCp@/2I1D3w',
            database: 'GSN'
        });
        
        console.log('✅ Connected to database');
        
        // Check for the specific user
        const userEmail = 'subodhchauhan1309@gmail.com';
        
        // First, find the user
        const [users] = await connection.execute(
            'SELECT id, name, email, role FROM users WHERE email = ?',
            [userEmail]
        );
        
        if (users.length === 0) {
            console.log(`❌ User not found: ${userEmail}`);
            return;
        }
        
        const user = users[0];
        console.log(`👤 Found user:`, user);
        
        // Check for quotes by this user
        const [quotes] = await connection.execute(
            'SELECT id, user_id, departure_country, arrival_country, product_description FROM quotes WHERE user_id = ?',
            [user.id]
        );
        
        console.log(`📋 Found ${quotes.length} quotes for this user:`);
        quotes.forEach(quote => {
            console.log(`  - Quote #${quote.id}: ${quote.departure_country} → ${quote.arrival_country} (${quote.product_description})`);
        });
        
        // Check for quote responses (companies that responded)
        const [responses] = await connection.execute(`
            SELECT qr.*, q.user_id, u.name as company_name, u.email as company_email
            FROM quote_responses qr
            JOIN quotes q ON qr.quote_id = q.id
            JOIN users u ON qr.company_id = u.id
            WHERE q.user_id = ?
        `, [user.id]);
        
        console.log(`💼 Found ${responses.length} quote responses:`);
        responses.forEach(response => {
            console.log(`  - Response #${response.id}: Quote #${response.quote_id} by ${response.company_name} ($${response.price})`);
        });
        
        // Check for payment verifications
        const [payments] = await connection.execute(`
            SELECT pv.*, qr.quote_id, qr.company_id, qr.price
            FROM payment_verifications pv
            JOIN quote_responses qr ON pv.quote_response_id = qr.id
            JOIN quotes q ON qr.quote_id = q.id
            WHERE q.user_id = ?
        `, [user.id]);
        
        console.log(`💳 Found ${payments.length} payment verifications:`);
        payments.forEach(payment => {
            console.log(`  - Payment #${payment.id}: Quote #${payment.quote_id}, Status: ${payment.verification_status}, Amount: $${payment.price}`);
        });
        
        // Check for existing transaction invoices
        const [invoices] = await connection.execute(
            'SELECT * FROM transaction_invoices WHERE user_id = ?',
            [user.id]
        );
        
        console.log(`🧾 Found ${invoices.length} transaction invoices for this user:`);
        invoices.forEach(invoice => {
            console.log(`  - Invoice ${invoice.invoice_number}: Quote #${invoice.quote_id}, Amount: $${invoice.total_amount}, Status: ${invoice.status}`);
        });
        
        // Check for verified payments that don't have invoices yet
        const [verifiedPayments] = await connection.execute(`
            SELECT pv.*, qr.quote_id, qr.company_id, qr.price, q.user_id
            FROM payment_verifications pv
            JOIN quote_responses qr ON pv.quote_response_id = qr.id
            JOIN quotes q ON qr.quote_id = q.id
            LEFT JOIN transaction_invoices ti ON ti.quote_id = qr.quote_id AND ti.user_id = q.user_id
            WHERE q.user_id = ? AND pv.verification_status = 'verified' AND ti.id IS NULL
        `, [user.id]);
        
        console.log(`\n🔍 Found ${verifiedPayments.length} verified payments without invoices:`);
        verifiedPayments.forEach(payment => {
            console.log(`  - Payment #${payment.id}: Quote #${payment.quote_id}, Company #${payment.company_id}, Amount: $${payment.price}`);
        });
        
        if (verifiedPayments.length > 0) {
            console.log('\n💡 These payments should have transaction invoices created!');
            
            // Create missing invoices
            for (const payment of verifiedPayments) {
                const invoiceNumber = `TXN-INV-2026-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
                const serviceFee = payment.price * 0.05; // 5% service fee
                const totalAmount = parseFloat(payment.price) + serviceFee;
                
                try {
                    await connection.execute(`
                        INSERT INTO transaction_invoices 
                        (invoice_number, quote_id, user_id, company_id, amount, service_fee, total_amount, status, payment_date)
                        VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', NOW())
                    `, [
                        invoiceNumber,
                        payment.quote_id,
                        payment.user_id,
                        payment.company_id,
                        payment.price,
                        serviceFee,
                        totalAmount
                    ]);
                    
                    console.log(`✅ Created invoice ${invoiceNumber} for Quote #${payment.quote_id}`);
                } catch (error) {
                    console.error(`❌ Error creating invoice for Quote #${payment.quote_id}:`, error.message);
                }
            }
        }
        
        // Final check - show all transaction invoices again
        const [finalInvoices] = await connection.execute(
            'SELECT * FROM transaction_invoices WHERE user_id = ?',
            [user.id]
        );
        
        console.log(`\n🎉 Final count: ${finalInvoices.length} transaction invoices for user ${userEmail}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkTransactionInvoices();