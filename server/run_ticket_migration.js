// Run the ticket-message integration migration
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function runTicketMigration() {
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

        // Check if ticket_id column already exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'ticket_id'
        `, [process.env.DB_NAME || 'gsn_database']);

        if (columns.length > 0) {
            console.log('✅ ticket_id column already exists in messages table');
        } else {
            console.log('📝 Adding ticket_id column to messages table...');
            
            // Add the ticket_id column
            await connection.execute(`
                ALTER TABLE messages 
                ADD COLUMN ticket_id INT(11) DEFAULT NULL AFTER quote_id
            `);
            
            console.log('✅ ticket_id column added successfully');
        }

        // Check if foreign key constraint exists
        const [constraints] = await connection.execute(`
            SELECT CONSTRAINT_NAME 
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'messages' AND CONSTRAINT_NAME = 'fk_messages_ticket_id'
        `, [process.env.DB_NAME || 'gsn_database']);

        if (constraints.length > 0) {
            console.log('✅ Foreign key constraint already exists');
        } else {
            console.log('📝 Adding foreign key constraint...');
            
            try {
                await connection.execute(`
                    ALTER TABLE messages 
                    ADD CONSTRAINT fk_messages_ticket_id 
                    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE SET NULL
                `);
                console.log('✅ Foreign key constraint added successfully');
            } catch (error) {
                if (error.code === 'ER_DUP_KEYNAME') {
                    console.log('✅ Foreign key constraint already exists');
                } else {
                    console.error('⚠️  Could not add foreign key constraint:', error.message);
                }
            }
        }

        // Check if index exists
        const [indexes] = await connection.execute(`
            SELECT INDEX_NAME 
            FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'messages' AND INDEX_NAME = 'idx_messages_ticket_id'
        `, [process.env.DB_NAME || 'gsn_database']);

        if (indexes.length > 0) {
            console.log('✅ Index already exists');
        } else {
            console.log('📝 Adding index for better performance...');
            
            try {
                await connection.execute(`
                    CREATE INDEX idx_messages_ticket_id ON messages(ticket_id)
                `);
                console.log('✅ Index added successfully');
            } catch (error) {
                if (error.code === 'ER_DUP_KEYNAME') {
                    console.log('✅ Index already exists');
                } else {
                    console.error('⚠️  Could not add index:', error.message);
                }
            }
        }

        // Show current table structure
        console.log('📊 Current messages table structure:');
        const [tableInfo] = await connection.execute(`
            SELECT 
                COUNT(*) as total_messages,
                COUNT(ticket_id) as ticket_linked_messages,
                COUNT(quote_id) as quote_linked_messages
            FROM messages
        `);
        console.log('   ', tableInfo[0]);

        console.log('');
        console.log('🎯 Ticket-Message Integration is now active:');
        console.log('   • Messages table now has ticket_id field');
        console.log('   • Ticket responses will create messages automatically');
        console.log('   • Messages will show ticket context');
        console.log('   • All user roles can see ticket conversations in Messages');

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
runTicketMigration();