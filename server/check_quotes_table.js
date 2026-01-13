import db from './config/db.js';

async function checkQuotesTable() {
    try {
        const [columns] = await db.execute('DESCRIBE quotes');
        console.log('Quotes table structure:');
        columns.forEach(col => {
            console.log(`- ${col.Field} (${col.Type})`);
        });
        
        const [sampleQuotes] = await db.execute('SELECT * FROM quotes LIMIT 3');
        console.log('\nSample quotes:');
        console.log(sampleQuotes);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkQuotesTable();