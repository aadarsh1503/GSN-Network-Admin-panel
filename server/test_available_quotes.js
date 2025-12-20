// Test script to check available quotes with user info
import db from './config/db.js';

async function testAvailableQuotes() {
    try {
        console.log('Testing available quotes with user info...\n');
        
        // Get a sample quote with user info (updated query)
        const [quotes] = await db.execute(`
            SELECT q.*, 
                   COALESCE(u.name, q.contact_name) as user_name, 
                   COALESCE(u.email, q.contact_email) as user_email,
                   q.contact_phone as user_phone,
                   u.role
            FROM quotes q 
            LEFT JOIN users u ON q.user_id = u.id 
            WHERE q.status = 'pending'
            LIMIT 5
        `);
        
        console.log(`Found ${quotes.length} pending quotes:\n`);
        
        quotes.forEach((quote, index) => {
            console.log(`Quote ${index + 1}:`);
            console.log(`  ID: ${quote.id}`);
            console.log(`  User ID: ${quote.user_id || 'NULL (Guest)'}`);
            console.log(`  User Name: ${quote.user_name || 'NULL'}`);
            console.log(`  User Email: ${quote.user_email || 'NULL'}`);
            console.log(`  User Phone: ${quote.user_phone || 'NULL'}`);
            console.log(`  User Role: ${quote.role || 'Guest'}`);
            console.log(`  Contact Name: ${quote.contact_name || 'NULL'}`);
            console.log(`  Contact Email: ${quote.contact_email || 'NULL'}`);
            console.log(`  Contact Phone: ${quote.contact_phone || 'NULL'}`);
            console.log(`  Product: ${quote.product_description}`);
            console.log(`  Status: ${quote.status}`);
            console.log('---');
        });
        
        // Check if users table has the data
        console.log('\nChecking users table for quote creators...\n');
        
        const [users] = await db.execute(`
            SELECT DISTINCT u.id, u.name, u.email, u.role
            FROM users u
            INNER JOIN quotes q ON u.id = q.user_id
            WHERE q.status = 'pending'
            LIMIT 5
        `);
        
        console.log(`Found ${users.length} users who created pending quotes:\n`);
        
        users.forEach((user, index) => {
            console.log(`User ${index + 1}:`);
            console.log(`  ID: ${user.id}`);
            console.log(`  Name: ${user.name}`);
            console.log(`  Email: ${user.email}`);
            console.log(`  Role: ${user.role}`);
            console.log('---');
        });
        
        console.log('\n✅ Test completed!');
        
    } catch (error) {
        console.error('❌ Error testing available quotes:', error);
    } finally {
        process.exit(0);
    }
}

testAvailableQuotes();