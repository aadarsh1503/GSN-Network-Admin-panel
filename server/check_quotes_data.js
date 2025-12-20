// Check quotes data in database
import db from './config/db.js';

async function checkQuotesData() {
    try {
        console.log('Checking quotes data in database...\n');
        
        // Get all quotes with their user/contact info
        const [allQuotes] = await db.execute(`
            SELECT 
                q.id,
                q.user_id,
                q.contact_name,
                q.contact_email,
                q.contact_phone,
                q.product_description,
                q.status,
                q.created_at,
                u.name as registered_user_name,
                u.email as registered_user_email
            FROM quotes q
            LEFT JOIN users u ON q.user_id = u.id
            ORDER BY q.created_at DESC
            LIMIT 10
        `);
        
        console.log(`Found ${allQuotes.length} recent quotes:\n`);
        
        allQuotes.forEach((quote, index) => {
            console.log(`\n=== Quote ${index + 1} ===`);
            console.log(`ID: ${quote.id}`);
            console.log(`Status: ${quote.status}`);
            console.log(`Product: ${quote.product_description}`);
            console.log(`Created: ${quote.created_at}`);
            console.log(`\nUser Info:`);
            console.log(`  User ID: ${quote.user_id || 'NULL (Guest Quote)'}`);
            console.log(`  Registered User Name: ${quote.registered_user_name || 'N/A'}`);
            console.log(`  Registered User Email: ${quote.registered_user_email || 'N/A'}`);
            console.log(`\nContact Info (for guest quotes):`);
            console.log(`  Contact Name: ${quote.contact_name || 'N/A'}`);
            console.log(`  Contact Email: ${quote.contact_email || 'N/A'}`);
            console.log(`  Contact Phone: ${quote.contact_phone || 'N/A'}`);
            
            // Determine what will be shown
            const displayName = quote.registered_user_name || quote.contact_name;
            const displayEmail = quote.registered_user_email || quote.contact_email;
            const displayPhone = quote.contact_phone;
            
            console.log(`\n✅ Will Display:`);
            console.log(`  Name: ${displayName || '❌ NO NAME'}`);
            console.log(`  Email: ${displayEmail || '❌ NO EMAIL'}`);
            console.log(`  Phone: ${displayPhone || '❌ NO PHONE'}`);
        });
        
        // Count quotes by type
        const [stats] = await db.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN user_id IS NOT NULL THEN 1 ELSE 0 END) as registered_user_quotes,
                SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END) as guest_quotes,
                SUM(CASE WHEN user_id IS NULL AND contact_name IS NOT NULL THEN 1 ELSE 0 END) as guest_with_contact,
                SUM(CASE WHEN user_id IS NULL AND contact_name IS NULL THEN 1 ELSE 0 END) as guest_without_contact
            FROM quotes
        `);
        
        console.log(`\n\n=== Statistics ===`);
        console.log(`Total Quotes: ${stats[0].total}`);
        console.log(`Registered User Quotes: ${stats[0].registered_user_quotes}`);
        console.log(`Guest Quotes: ${stats[0].guest_quotes}`);
        console.log(`  - With Contact Info: ${stats[0].guest_with_contact}`);
        console.log(`  - Without Contact Info: ${stats[0].guest_without_contact}`);
        
        console.log('\n✅ Check completed!');
        
    } catch (error) {
        console.error('❌ Error checking quotes data:', error);
    } finally {
        process.exit(0);
    }
}

checkQuotesData();