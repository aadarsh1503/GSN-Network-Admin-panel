// Debug what quotes company user 10 can update
import db from './config/db.js';

async function debugCompany10Quotes() {
    console.log('🔍 Debugging Company User 10 Quotes...\n');
    
    try {
        // Check company user 10
        console.log('👤 Checking company user 10...');
        const [companyUser] = await db.execute(`
            SELECT id, name, email, role FROM users WHERE id = 10
        `);
        
        if (companyUser.length === 0) {
            console.log('❌ Company user ID 10 not found');
            return;
        }
        
        const company = companyUser[0];
        console.log(`✅ Company: ${company.name} (${company.email}) - Role: ${company.role}`);
        
        // Find all quotes this company has responded to
        console.log('\n📨 Finding quotes this company has responded to...');
        const [companyQuotes] = await db.execute(`
            SELECT DISTINCT q.id, q.user_id, q.status, q.product_description, q.created_at,
                   u.name as customer_name, u.email as customer_email,
                   qr.id as response_id, qr.price, qr.status as response_status
            FROM quote_responses qr
            JOIN quotes q ON qr.quote_id = q.id
            LEFT JOIN users u ON q.user_id = u.id
            WHERE qr.company_id = 10
            ORDER BY q.created_at DESC
        `);
        
        if (companyQuotes.length === 0) {
            console.log('❌ This company has not responded to any quotes');
            return;
        }
        
        console.log(`✅ Found ${companyQuotes.length} quotes this company can update:`);
        companyQuotes.forEach((quote, index) => {
            console.log(`\n--- Quote ${index + 1} ---`);
            console.log(`  Quote ID: ${quote.id}`);
            console.log(`  Customer: ${quote.customer_name} (${quote.customer_email})`);
            console.log(`  Product: ${quote.product_description}`);
            console.log(`  Quote Status: ${quote.status}`);
            console.log(`  Company Response: $${quote.price} (Response ID: ${quote.response_id})`);
            console.log(`  Response Status: ${quote.response_status || 'NULL'}`);
            console.log(`  Created: ${new Date(quote.created_at).toLocaleDateString()}`);
        });
        
        // Check the most recent quotes to see what the frontend should be showing
        console.log('\n📊 Most recent quotes in database:');
        const [recentQuotes] = await db.execute(`
            SELECT id, user_id, status, product_description, created_at
            FROM quotes
            ORDER BY created_at DESC
            LIMIT 10
        `);
        
        console.log('Recent quotes:');
        recentQuotes.forEach((quote, index) => {
            console.log(`  ${index + 1}. Quote ${quote.id}: ${quote.product_description} - Status: ${quote.status} - ${new Date(quote.created_at).toLocaleDateString()}`);
        });
        
        // Check if quote 69 was deleted or never existed
        console.log('\n🔍 Checking for any trace of Quote 69...');
        const [deletedCheck] = await db.execute(`
            SELECT COUNT(*) as count FROM quote_responses WHERE quote_id = 69
        `);
        
        if (deletedCheck[0].count > 0) {
            console.log('⚠️ Quote 69 responses exist but quote is missing - data inconsistency');
        } else {
            console.log('✅ Quote 69 never existed or was properly cleaned up');
        }
        
        console.log('\n💡 Solution:');
        console.log('The frontend is trying to update a non-existent quote.');
        console.log('This could happen if:');
        console.log('1. The quote was deleted');
        console.log('2. The frontend has stale data');
        console.log('3. There\'s a mismatch between frontend and backend data');
        console.log('\nRecommendation: Refresh the frontend data or check why Quote 69 is being referenced.');
        
    } catch (error) {
        console.error('❌ Error debugging company quotes:', error);
    } finally {
        process.exit(0);
    }
}

debugCompany10Quotes();