// create_transaction_invoices_table.js
// Run this script to create the transaction_invoices table

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function createTable() {
    let connection;
    
    try {
        // Create connection using the same credentials as your server
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        console.log('✅ Connected to database');
        
        // Create the transaction_invoices table
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS transaction_invoices (
                id INT AUTO_INCREMENT PRIMARY KEY,
                invoice_number VARCHAR(50) UNIQUE NOT NULL,
                quote_id INT NOT NULL,
                user_id INT NOT NULL,
                company_id INT NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                service_fee DECIMAL(10, 2) DEFAULT 0.00,
                total_amount DECIMAL(10, 2) NOT NULL,
                status ENUM('paid', 'pending', 'completed', 'cancelled') DEFAULT 'paid',
                payment_date TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_quote_id (quote_id),
                INDEX idx_user_id (user_id),
                INDEX idx_company_id (company_id),
                INDEX idx_invoice_number (invoice_number),
                INDEX idx_created_at (created_at)
            )
        `;
        
        await connection.execute(createTableSQL);
        console.log('✅ transaction_invoices table created successfully!');
        
        // Verify table exists
        const [tables] = await connection.execute("SHOW TABLES LIKE 'transaction_invoices'");
        if (tables.length > 0) {
            console.log('✅ Table verified in database');
            
            // Show table structure
            const [columns] = await connection.execute("DESCRIBE transaction_invoices");
            console.log('📋 Table structure:');
            columns.forEach(col => {
                console.log(`  - ${col.Field}: ${col.Type}`);
            });
        }
        
        // Add some sample data for testing
        console.log('📝 Adding sample transaction invoices...');
        
        // First, let's check if we have any quotes and users to reference
        const [quotes] = await connection.execute('SELECT id, user_id FROM quotes LIMIT 3');
        const [users] = await connection.execute("SELECT id FROM users WHERE role IN ('business', 'company') LIMIT 3");
        
        if (quotes.length > 0 && users.length > 0) {
            const sampleInvoices = [
                {
                    invoice_number: 'TXN-INV-2026-001001',
                    quote_id: quotes[0].id,
                    user_id: quotes[0].user_id,
                    company_id: users[0].id,
                    amount: 150.00,
                    service_fee: 7.50,
                    total_amount: 157.50,
                    status: 'paid'
                },
                {
                    invoice_number: 'TXN-INV-2026-001002',
                    quote_id: quotes.length > 1 ? quotes[1].id : quotes[0].id,
                    user_id: quotes.length > 1 ? quotes[1].user_id : quotes[0].user_id,
                    company_id: users.length > 1 ? users[1].id : users[0].id,
                    amount: 275.00,
                    service_fee: 13.75,
                    total_amount: 288.75,
                    status: 'completed'
                }
            ];
            
            for (const invoice of sampleInvoices) {
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
        } else {
            console.log('⚠️ No quotes or users found, skipping sample data creation');
        }
        
        // Show final count
        const [count] = await connection.execute('SELECT COUNT(*) as count FROM transaction_invoices');
        console.log(`📊 Total transaction invoices in database: ${count[0].count}`);
        
        console.log('🎉 Setup complete! You can now use the transaction invoices API.');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

createTable();