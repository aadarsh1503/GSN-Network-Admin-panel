// Add company response fields to support_tickets table
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function addCompanyResponseFields() {
    let connection;
    
    try {
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'gsn_database'
        });

        console.log('🔗 Connected to database');

        // Check if company_response column already exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'support_tickets' AND COLUMN_NAME = 'company_response'
        `, [process.env.DB_NAME || 'gsn_database']);

        if (columns.length > 0) {
            console.log('✅ company_response column already exists in support_tickets table');
        } else {
            console.log('📝 Adding company_response column to support_tickets table...');
            
            // Add the company_response column
            await connection.execute(`
                ALTER TABLE support_tickets 
                ADD COLUMN company_response TEXT DEFAULT NULL AFTER admin_response
            `);
            
            console.log('✅ company_response column added successfully');
        }

        // Check if company_responded_at column already exists
        const [timeColumns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'support_tickets' AND COLUMN_NAME = 'company_responded_at'
        `, [process.env.DB_NAME || 'gsn_database']);

        if (timeColumns.length > 0) {
            console.log('✅ company_responded_at column already exists');
        } else {
            console.log('📝 Adding company_responded_at column...');
            
            await connection.execute(`
                ALTER TABLE support_tickets 
                ADD COLUMN company_responded_at TIMESTAMP NULL DEFAULT NULL AFTER responded_at
            `);
            
            console.log('✅ company_responded_at column added successfully');
        }

        // Show current table structure
        console.log('📊 Current support_tickets table structure:');
        const [tableInfo] = await connection.execute(`
            SELECT 
                COUNT(*) as total_tickets,
                COUNT(admin_response) as admin_responses,
                COUNT(company_response) as company_responses
            FROM support_tickets
        `);
        console.log('   ', tableInfo[0]);

        console.log('');
        console.log('🎯 Company Ticket Response System is now ready:');
        console.log('   • Companies can respond to tickets sent to them');
        console.log('   • Company responses sync to messages automatically');
        console.log('   • Separate tracking for admin vs company responses');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the migration
addCompanyResponseFields();