// Check the current support_tickets table structure
import db from './config/db.js';

const checkSupportTicketsTable = async () => {
    try {
        console.log('🔍 Checking support_tickets table structure...\n');

        // Check if table exists
        const [tables] = await db.execute("SHOW TABLES LIKE 'support_tickets'");
        
        if (tables.length === 0) {
            console.log('❌ support_tickets table does not exist');
        } else {
            console.log('✅ support_tickets table exists');
            
            // Check table structure
            const [columns] = await db.execute('DESCRIBE support_tickets');
            
            console.log('📊 Current table structure:');
            columns.forEach(col => {
                console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'} ${col.Key ? `[${col.Key}]` : ''} ${col.Default !== null ? `default: ${col.Default}` : ''}`);
            });
        }

        // Check what columns are missing
        const requiredColumns = ['id', 'user_id', 'subject', 'message', 'priority', 'category', 'status', 'admin_response', 'created_at', 'updated_at'];
        
        if (tables.length > 0) {
            const [columns] = await db.execute('DESCRIBE support_tickets');
            const existingColumns = columns.map(col => col.Field);
            
            console.log('\n🔍 Column Analysis:');
            requiredColumns.forEach(col => {
                if (existingColumns.includes(col)) {
                    console.log(`✅ ${col} - exists`);
                } else {
                    console.log(`❌ ${col} - missing`);
                }
            });
        }

        console.log('\n✨ Analysis completed!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await db.end();
    }
};

// Run the check
checkSupportTicketsTable();