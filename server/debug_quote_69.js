// Debug quote 69 to see if the company can update its status
import db from './config/db.js';

async function debugQuote69() {
    console.log('🔍 Debugging Quote 69...\n');
    
    try {
        // Check if quote 69 exists
        console.log('📊 Checking if Quote 69 exists...');
        const [quoteRows] = await db.execute(`
            SELECT q.id, q.user_id, q.status, q.product_description,
                   u.name as user_name, u.email as user_email
            FROM quotes q
            LEFT JOIN users u ON q.user_id = u.id
            WHERE q.id = 69
        `);
        
        if (quoteRows.length === 0) {
            console.log('❌ Quote 69 does not exist');
            return;
        }
        
        const quote = quoteRows[0];
        console.log('✅ Quote 69 found:');
        console.log(`  - User: ${quote.user_name} (${quote.user_email})`);
        console.log(`  - Product: ${quote.product_description}`);
        console.log(`  - Status: ${quote.status}`);
        
        // Check quote responses for this quote
        console.log('\n📨 Checking quote responses...');
        const [responses] = await db.execute(`
            SELECT qr.id, qr.company_id, qr.price, qr.status as response_status,
                   c.name as company_name, c.email as company_email
            FROM quote_responses qr
            LEFT JOIN users c ON qr.company_id = c.id
            WHERE qr.quote_id = 69
        `);
        
        if (responses.length === 0) {
            console.log('❌ No responses found for Quote 69');
            console.log('💡 This means no company has responded to this quote yet');
            return;
        }
        
        console.log(`✅ Found ${responses.length} responses:`);
        responses.forEach((response, index) => {
            console.log(`  ${index + 1}. Company: ${response.company_name} (ID: ${response.company_id}) - $${response.price} - Status: ${response.response_status || 'NULL'}`);
        });
        
        // Check which company is currently logged in (user 10 based on logs)
        console.log('\n👤 Checking current company user (ID: 10)...');
        const [companyUser] = await db.execute(`
            SELECT id, name, email, role FROM users WHERE id = 10
        `);
        
        if (companyUser.length > 0) {
            const company = companyUser[0];
            console.log(`✅ Company user found: ${company.name} (${company.email}) - Role: ${company.role}`);
            
            // Check if this company has responded to quote 69
            const companyResponse = responses.find(r => r.company_id === 10);
            if (companyResponse) {
                console.log('✅ This company HAS responded to Quote 69');
                console.log(`  - Response ID: ${companyResponse.id}`);
                console.log(`  - Price: $${companyResponse.price}`);
                console.log('💡 Company should be able to update quote status');
            } else {
                console.log('❌ This company has NOT responded to Quote 69');
                console.log('💡 This is why the 404 error occurs - company can only update quotes they responded to');
            }
        } else {
            console.log('❌ Company user ID 10 not found');
        }
        
        // Show all companies that CAN update this quote
        if (responses.length > 0) {
            console.log('\n🏢 Companies that can update Quote 69 status:');
            responses.forEach((response, index) => {
                console.log(`  ${index + 1}. ${response.company_name} (ID: ${response.company_id})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error debugging quote 69:', error);
    } finally {
        process.exit(0);
    }
}

debugQuote69();