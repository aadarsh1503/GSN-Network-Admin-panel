// Debug the real issue with quote 69
import db from './config/db.js';

async function debugQuote69Real() {
    console.log('🔍 Debugging Quote 69 - Real Issue...\n');
    
    try {
        // Check if quote 69 exists (it should!)
        console.log('📊 Checking if Quote 69 exists...');
        const [quoteRows] = await db.execute(`
            SELECT q.id, q.user_id, q.status, q.product_description,
                   u.name as user_name, u.email as user_email
            FROM quotes q
            LEFT JOIN users u ON q.user_id = u.id
            WHERE q.id = 69
        `);
        
        if (quoteRows.length === 0) {
            console.log('❌ Quote 69 does not exist in quotes table');
            
            // Check if there are any quotes with higher IDs
            const [maxQuote] = await db.execute('SELECT MAX(id) as max_id FROM quotes');
            console.log(`📊 Highest quote ID in database: ${maxQuote[0].max_id}`);
            
            // Check recent quotes
            const [recentQuotes] = await db.execute(`
                SELECT id, product_description, created_at 
                FROM quotes 
                ORDER BY id DESC 
                LIMIT 10
            `);
            console.log('Recent quotes:');
            recentQuotes.forEach(q => {
                console.log(`  Quote ${q.id}: ${q.product_description} - ${new Date(q.created_at).toLocaleDateString()}`);
            });
            
            return;
        }
        
        const quote = quoteRows[0];
        console.log('✅ Quote 69 found:');
        console.log(`  - User: ${quote.user_name} (${quote.user_email})`);
        console.log(`  - Product: ${quote.product_description}`);
        console.log(`  - Status: ${quote.status}`);
        
        // Check quote responses for this quote
        console.log('\n📨 Checking quote responses for Quote 69...');
        const [responses] = await db.execute(`
            SELECT qr.id, qr.company_id, qr.price, qr.status as response_status,
                   c.name as company_name, c.email as company_email
            FROM quote_responses qr
            LEFT JOIN users c ON qr.company_id = c.id
            WHERE qr.quote_id = 69
        `);
        
        console.log(`Found ${responses.length} responses:`);
        responses.forEach((response, index) => {
            console.log(`  ${index + 1}. Company: ${response.company_name} (ID: ${response.company_id}) - $${response.price}`);
        });
        
        // Check if company 10 (Aadarsh-company) has responded
        const companyResponse = responses.find(r => r.company_id === 10);
        if (companyResponse) {
            console.log('\n✅ Company 10 (Aadarsh-company) HAS responded to Quote 69');
            console.log(`  - Response ID: ${companyResponse.id}`);
            console.log(`  - Price: $${companyResponse.price}`);
        } else {
            console.log('\n❌ Company 10 (Aadarsh-company) has NOT responded to Quote 69');
            console.log('💡 This explains the 404 error - company can only update quotes they responded to');
            
            // Show which companies DID respond
            if (responses.length > 0) {
                console.log('\n🏢 Companies that responded to Quote 69:');
                responses.forEach((response, index) => {
                    console.log(`  ${index + 1}. ${response.company_name} (ID: ${response.company_id})`);
                });
            }
        }
        
        // Test the exact query from the controller
        console.log('\n🔍 Testing the exact controller query...');
        const [controllerQuery] = await db.execute(`
            SELECT qr.id, q.user_id, u.name as user_name, u.email as user_email, u.role as user_role, q.status as current_status
            FROM quote_responses qr
            JOIN quotes q ON qr.quote_id = q.id
            LEFT JOIN users u ON q.user_id = u.id
            WHERE q.id = ? AND qr.company_id = ?
        `, [69, 10]);
        
        console.log(`Controller query result: ${controllerQuery.length} rows`);
        if (controllerQuery.length === 0) {
            console.log('❌ Controller query returns no results');
            console.log('💡 This means company 10 has not responded to quote 69');
        } else {
            console.log('✅ Controller query returns results - company can update this quote');
        }
        
    } catch (error) {
        console.error('❌ Error debugging quote 69:', error);
    } finally {
        process.exit(0);
    }
}

debugQuote69Real();