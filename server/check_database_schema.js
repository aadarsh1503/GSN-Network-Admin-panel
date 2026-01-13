// Check database schema to understand the table structure
import db from './config/db.js';

const checkSchema = async () => {
    try {
        console.log('🔍 Checking database schema...\n');

        // Check quotes table
        console.log('1. Quotes table structure:');
        const [quotesSchema] = await db.execute('DESCRIBE quotes');
        quotesSchema.forEach(col => {
            console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : ''}`);
        });

        // Check user_quote_status table
        console.log('\n2. User Quote Status table structure:');
        try {
            const [uqsSchema] = await db.execute('DESCRIBE user_quote_status');
            uqsSchema.forEach(col => {
                console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : ''}`);
            });
        } catch (error) {
            console.log('   ❌ Table does not exist or access denied');
        }

        // Check payment_verifications table
        console.log('\n3. Payment Verifications table structure:');
        try {
            const [pvSchema] = await db.execute('DESCRIBE payment_verifications');
            pvSchema.forEach(col => {
                console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : ''}`);
            });
        } catch (error) {
            console.log('   ❌ Table does not exist or access denied');
        }

        // Check quote_responses table
        console.log('\n4. Quote Responses table structure:');
        try {
            const [qrSchema] = await db.execute('DESCRIBE quote_responses');
            qrSchema.forEach(col => {
                console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : ''}`);
            });
        } catch (error) {
            console.log('   ❌ Table does not exist or access denied');
        }

        // Show sample data
        console.log('\n5. Sample quotes with status:');
        const [sampleQuotes] = await db.execute(`
            SELECT id, status, user_id, created_at 
            FROM quotes 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        
        if (sampleQuotes.length > 0) {
            sampleQuotes.forEach(quote => {
                console.log(`   - Quote #${quote.id}: Status = "${quote.status}", User = ${quote.user_id}`);
            });
        } else {
            console.log('   No quotes found');
        }

    } catch (error) {
        console.error('❌ Error checking schema:', error);
    }
};

checkSchema();