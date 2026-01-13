// Check dependencies for subscription ID 33
import db from './server/config/db.js';

async function checkSubscriptionDependencies() {
    try {
        console.log('🔍 Checking dependencies for subscription ID 33...\n');
        
        // Check invoices
        console.log('📄 Checking invoices...');
        const [invoices] = await db.execute(`
            SELECT * FROM invoices WHERE subscription_id = 33
        `);
        
        if (invoices.length > 0) {
            console.log(`⚠️ Found ${invoices.length} invoices:`)
            invoices.forEach(invoice => {
                console.log(`  - Invoice ID: ${invoice.id}, Amount: $${invoice.amount}, Status: ${invoice.status}`);
            });
        } else {
            console.log('✅ No invoices found');
        }
        
        // Check transactions
        console.log('\n💳 Checking transactions...');
        const [transactions] = await db.execute(`
            SELECT * FROM transactions WHERE subscription_id = 33
        `);
        
        if (transactions.length > 0) {
            console.log(`⚠️ Found ${transactions.length} transactions:`);
            transactions.forEach(transaction => {
                console.log(`  - Transaction ID: ${transaction.id}, Amount: $${transaction.amount}, Status: ${transaction.status}`);
            });
        } else {
            console.log('✅ No transactions found');
        }
        
        // Check all foreign key references
        console.log('\n🔗 Checking all foreign key references...');
        const [fkReferences] = await db.execute(`
            SELECT 
                TABLE_NAME,
                COLUMN_NAME,
                CONSTRAINT_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE REFERENCED_TABLE_NAME = 'user_subscriptions'
            AND REFERENCED_COLUMN_NAME = 'id'
            AND TABLE_SCHEMA = DATABASE()
        `);
        
        console.log('📋 Foreign key constraints:');
        for (const fk of fkReferences) {
            console.log(`  - ${fk.TABLE_NAME}.${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
            
            // Check if there are any records in this table
            const [records] = await db.execute(`
                SELECT COUNT(*) as count FROM ${fk.TABLE_NAME} WHERE ${fk.COLUMN_NAME} = 33
            `);
            
            if (records[0].count > 0) {
                console.log(`    ⚠️ ${records[0].count} records found in ${fk.TABLE_NAME}`);
            } else {
                console.log(`    ✅ No records in ${fk.TABLE_NAME}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkSubscriptionDependencies();