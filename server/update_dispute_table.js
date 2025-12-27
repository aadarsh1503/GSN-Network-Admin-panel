import db from './config/db.js';
import fs from 'fs';

async function updateDisputeTable() {
    try {
        console.log('🔄 Updating disputes table with company response columns...');
        
        // Read the SQL file
        const sql = fs.readFileSync('./add_company_dispute_columns.sql', 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
        
        for (const statement of statements) {
            if (statement.trim()) {
                console.log(`Executing: ${statement.trim().substring(0, 50)}...`);
                await db.execute(statement.trim());
            }
        }
        
        console.log('✅ Disputes table updated successfully!');
        
        // Verify the changes
        console.log('\n📋 Updated table structure:');
        const [columns] = await db.execute('DESCRIBE disputes');
        columns.forEach(col => {
            if (col.Field.includes('company_')) {
                console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(required)'}`);
            }
        });
        
    } catch (error) {
        console.error('❌ Error updating disputes table:', error);
    } finally {
        process.exit(0);
    }
}

updateDisputeTable();