import db from './config/db.js';

async function checkTables() {
    try {
        console.log('Checking quote_responses table...');
        const [columns] = await db.execute('DESCRIBE quote_responses');
        console.log('quote_responses table exists with columns:');
        columns.forEach(col => console.log(`- ${col.Field}`));
        
        console.log('\nChecking if table has data...');
        const [count] = await db.execute('SELECT COUNT(*) as count FROM quote_responses');
        console.log('quote_responses count:', count[0].count);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        
        // Try to create the table if it doesn't exist
        console.log('\nTrying to create quote_responses table...');
        try {
            await db.execute(`
                CREATE TABLE IF NOT EXISTS quote_responses (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    quote_id INT NOT NULL,
                    company_id INT NOT NULL,
                    price DECIMAL(10,2) NOT NULL,
                    currency VARCHAR(3) DEFAULT 'USD',
                    transit_time VARCHAR(50),
                    notes TEXT,
                    terms_conditions TEXT,
                    validity_period INT DEFAULT 30,
                    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
                    FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `);
            console.log('✅ quote_responses table created successfully');
        } catch (createError) {
            console.error('Failed to create table:', createError.message);
        }
        
        process.exit(1);
    }
}

checkTables();