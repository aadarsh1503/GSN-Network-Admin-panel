// create_transaction_invoices_table_simple.js
// Run this script to create the transaction_invoices table

import mysql from 'mysql2/promise';

async function createTable() {
    let connection;
    
    try {
        // Create connection using the same credentials as your server
        connection = await mysql.createConnection({
            host: '92.112.181.224',
            user: 'gsnuser',
            password: 'sCp@/2I1D3w',
            database: 'GSN'
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
        
        console.log('🎉 Setup complete! You can now use the transaction invoices API.');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n💡 Make sure to:');
        console.log('1. Update the database credentials in this script');
        console.log('2. Ensure MySQL server is running');
        console.log('3. Database exists');
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

createTable();