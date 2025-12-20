// Script to fix quote status issues
import db from './config/db.js';

async function fixQuoteStatusIssues() {
    try {
        console.log('Checking if user_quote_status table exists...');
        
        // Check if table exists
        const [tables] = await db.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'GSN' AND TABLE_NAME = 'user_quote_status'
        `);
        
        if (tables.length === 0) {
            console.log('Creating user_quote_status table...');
            
            // Create the table
            await db.execute(`
                CREATE TABLE IF NOT EXISTS user_quote_status (
                    id int(11) NOT NULL AUTO_INCREMENT,
                    quote_id int(11) NOT NULL,
                    user_id int(11) NOT NULL,
                    company_id int(11) NOT NULL,
                    quote_response_id int(11) NOT NULL,
                    status enum('accepted','rejected') NOT NULL,
                    accepted_at timestamp NULL DEFAULT NULL,
                    rejected_at timestamp NULL DEFAULT NULL,
                    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
                    updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (quote_response_id) REFERENCES quote_responses(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_user_quote_response (quote_id, user_id, quote_response_id)
                )
            `);
            
            console.log('user_quote_status table created successfully!');
        } else {
            console.log('user_quote_status table already exists.');
        }
        
        // Check for any inconsistent data
        console.log('Checking for data inconsistencies...');
        
        const [inconsistentData] = await db.execute(`
            SELECT qr1.quote_id, qr1.company_id, COUNT(*) as count
            FROM quote_responses qr1
            WHERE qr1.status IN ('accepted', 'rejected')
            GROUP BY qr1.quote_id, qr1.company_id
            HAVING COUNT(*) > 1
        `);
        
        if (inconsistentData.length > 0) {
            console.log('Found inconsistent data:', inconsistentData);
            console.log('Please review and fix manually if needed.');
        }
        
        console.log('Quote status issues check completed!');
        
    } catch (error) {
        console.error('Error fixing quote status issues:', error);
    } finally {
        process.exit(0);
    }
}

fixQuoteStatusIssues();