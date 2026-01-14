// Check table structure
import db from './config/db.js';

async function checkTableStructure() {
    try {
        console.log('🔍 Checking table structures...');
        
        // Check user_quote_status table structure
        const [uqsColumns] = await db.execute('DESCRIBE user_quote_status');
        console.log('\n📊 user_quote_status table columns:');
        uqsColumns.forEach(col => {
            console.log(`  ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'nullable' : 'not null'})`);
        });
        
        // Check payment_verifications table structure
        const [pvColumns] = await db.execute('DESCRIBE payment_verifications');
        console.log('\n✅ payment_verifications table columns:');
        pvColumns.forEach(col => {
            console.log(`  ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'nullable' : 'not null'})`);
        });
        
        // Get a sample record from user_quote_status
        const [sampleUqs] = await db.execute('SELECT * FROM user_quote_status LIMIT 1');
        console.log('\n📋 Sample user_quote_status record:');
        console.log(sampleUqs[0] || 'No records found');
        
    } catch (error) {
        console.error('❌ Error checking table structure:', error);
    } finally {
        process.exit(0);
    }
}

checkTableStructure();