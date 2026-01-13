import db from './config/db.js';
import fs from 'fs';
import path from 'path';

const runDisputeMessagesMigration = async () => {
    try {
        console.log('🚀 Starting dispute messages table migration...');
        
        // Read the SQL file
        const sqlPath = path.join(process.cwd(), 'create_dispute_messages_table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Execute the SQL
        await db.execute(sql);
        
        console.log('✅ Dispute messages table created successfully!');
        
        // Test the table by checking if it exists
        const [tables] = await db.execute(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'dispute_messages'
        `);
        
        if (tables.length > 0) {
            console.log('✅ Table verification successful - dispute_messages table exists');
            
            // Show table structure
            const [columns] = await db.execute('DESCRIBE dispute_messages');
            console.log('\n📋 Table structure:');
            columns.forEach(col => {
                console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key ? `(${col.Key})` : ''}`);
            });
        } else {
            console.log('❌ Table verification failed - dispute_messages table not found');
        }
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        process.exit(0);
    }
};

runDisputeMessagesMigration();