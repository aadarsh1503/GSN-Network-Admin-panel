// add_sample_transaction_invoices.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function addSampleData() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        console.log('✅ Connected to database');
        
        // Get some real quotes and users from the database
        const [quotes] = await connection.execute(`
            SELECT q.id, q.user_id, qr.company_id, qr.price 
            FROM quotes q 
            LEFT JOIN quote_responses qr ON q.id = qr.quote_id 
            WHERE q.user_id IS NOT NULL AND qr.company_id IS NOT NULL 
            LIMIT 5
        `);
        
        console.log(`Found ${quotes.length} quotes with responses`);
        
        if (quotes.length === 0) {
            // If no quotes with responses, get any quotes and users
            const [allQuotes] = await connection.execute('SELECT id, user_id FROM quotes WHERE user_id IS NOT NULL LIMIT 3');
            const [businessUsers] = await connection.execute("SELECT id FROM users WHERE role IN ('business', 'company') LIMIT 3");
            
            if (allQuotes.length > 0 && businessUsers.length > 0) {
                console.log('Using fallback data...');
                
                const sampleInvoices = [
                    {
                        invoice_number: 'TXN-INV-2026-001001',
                        quote_id: allQuotes[0].id,
                        user_id: allQuotes[0].user_id,
                        company_id: businessUsers[0].id,
                        amount: 150.00,
                        service_fee: 7.50,
                        total_amount: 157.50,
                        status: 'paid'
                    }
                ];
                
                for (const invoice of sampleInvoices) {
                    await insertInvoice(connection, invoice);
                }
            } else {
                console.log('❌ No suitable data found for sample invoices');
                return;
            }
        } else {
            // Use real quote data
            const sampleInvoices = quotes.slice(0, 3).map((quote, index) => ({
                invoice_number: `TXN-INV-2026-${String(index + 1).padStart(6, '0')}`,
                quote_id: quote.id,
                user_id: quote.user_id,
                company_id: quote.company_id,
                amount: quote.price || (100 + index * 50),
                service_fee: (quote.price || (100 + index * 50)) * 0.05,
                total_amount: (quote.price || (100 + index * 50)) * 1.05,
                status: ['paid', 'completed', 'pending'][index % 3]
            }));
            
            for (const invoice of sampleInvoices) {
                await insertInvoice(connection, invoice);
            }
        }
        
        // Show final count
        const [count] = await connection.execute('SELECT COUNT(*) as count FROM transaction_invoices');
        console.log(`📊 Total transaction invoices in database: ${count[0].count}`);
        
        // Show sample data
        const [sample] = await connection.execute(`
            SELECT ti.*, u.name as user_name, c.name as company_name 
            FROM transaction_invoices ti
            LEFT JOIN users u ON ti.user_id = u.id
            LEFT JOIN users c ON ti.company_id = c.id
            LIMIT 3
        `);
        
        console.log('📋 Sample invoices:');
        sample.forEach(invoice => {
            console.log(`  - ${invoice.invoice_number}: $${invoice.total_amount} (${invoice.user_name} -> ${invoice.company_name})`);
        });
        
        console.log('🎉 Sample data added successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function insertInvoice(connection, invoice) {
    try {
        const insertSQL = `
            INSERT INTO transaction_invoices 
            (invoice_number, quote_id, user_id, company_id, amount, service_fee, total_amount, status, payment_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        await connection.execute(insertSQL, [
            invoice.invoice_number,
            invoice.quote_id,
            invoice.user_id,
            invoice.company_id,
            invoice.amount,
            invoice.service_fee,
            invoice.total_amount,
            invoice.status
        ]);
        
        console.log(`✅ Sample invoice created: ${invoice.invoice_number}`);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            console.log(`⚠️ Invoice ${invoice.invoice_number} already exists, skipping...`);
        } else {
            console.error(`❌ Error creating invoice ${invoice.invoice_number}:`, error.message);
        }
    }
}

addSampleData();