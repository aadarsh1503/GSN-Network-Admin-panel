// Debug the new business user quote issue
import db from './config/db.js';

async function debugBusinessUserQuote() {
    console.log('🔍 Debugging Business User Quote Issue...\n');
    
    try {
        // Find the most recent quote by business user (a@gmail.com)
        console.log('📊 Looking for recent quotes by business user...');
        const [recentQuotes] = await db.execute(`
            SELECT q.id, q.product_description, q.status, q.created_at,
                   u.name as user_name, u.email as user_email, u.role as user_role
            FROM quotes q
            LEFT JOIN users u ON q.user_id = u.id
            WHERE u.email = 'a@gmail.com' OR u.role = 'business'
            ORDER BY q.created_at DESC
            LIMIT 5
        `);
        
        console.log('Recent quotes by business users:');
        recentQuotes.forEach((quote, index) => {
            console.log(`  ${index + 1}. Quote ${quote.id}: ${quote.user_name} (${quote.user_email}) - ${quote.product_description} - Status: ${quote.status} - Role: ${quote.user_role} - ${new Date(quote.created_at).toLocaleDateString()}`);
        });
        
        if (recentQuotes.length === 0) {
            console.log('❌ No quotes found for business users');
            return;
        }
        
        // Check the most recent business quote in detail
        const targetQuote = recentQuotes[0];
        console.log(`\n🔍 Analyzing Quote ${targetQuote.id} in detail...`);
        
        // Check quote responses
        console.log('\n📨 Quote Responses:');
        const [responses] = await db.execute(`
            SELECT qr.id, qr.company_id, qr.price, qr.transit_time, qr.status as response_status,
                   c.name as company_name, c.email as company_email, c.role as company_role
            FROM quote_responses qr
            LEFT JOIN users c ON qr.company_id = c.id
            WHERE qr.quote_id = ?
            ORDER BY qr.created_at DESC
        `, [targetQuote.id]);
        
        if (responses.length === 0) {
            console.log('❌ No responses found for this quote');
        } else {
            responses.forEach((response, index) => {
                console.log(`  ${index + 1}. Response ${response.id}: ${response.company_name} (${response.company_email}) - $${response.price} - Status: ${response.response_status || 'NULL'} - Role: ${response.company_role}`);
            });
        }
        
        // Check user_quote_status
        console.log('\n👤 User Quote Status:');
        const [userStatuses] = await db.execute(`
            SELECT uqs.id, uqs.quote_response_id, uqs.status, uqs.accepted_at, uqs.created_at,
                   qr.company_id, c.name as company_name
            FROM user_quote_status uqs
            LEFT JOIN quote_responses qr ON uqs.quote_response_id = qr.id
            LEFT JOIN users c ON qr.company_id = c.id
            WHERE uqs.quote_id = ?
            ORDER BY uqs.created_at DESC
        `, [targetQuote.id]);
        
        if (userStatuses.length === 0) {
            console.log('❌ No user quote status entries found for this quote');
            console.log('💡 This means the business user has not accepted/rejected any responses yet');
        } else {
            userStatuses.forEach((status, index) => {
                console.log(`  ${index + 1}. Status ${status.id}: Response ${status.quote_response_id} (${status.company_name}) - Status: ${status.status} - ${status.accepted_at ? 'Accepted: ' + new Date(status.accepted_at).toLocaleDateString() : 'Not accepted'}`);
            });
        }
        
        // Check payment proofs
        console.log('\n💳 Payment Proofs:');
        const [paymentProofs] = await db.execute(`
            SELECT pp.id, pp.file_path, pp.upload_date, pp.company_id,
                   c.name as company_name,
                   pv.verification_status, pv.verification_date
            FROM payment_proofs pp
            LEFT JOIN users c ON pp.company_id = c.id
            LEFT JOIN payment_verifications pv ON pp.id = pv.payment_proof_id
            WHERE pp.quote_id = ?
            ORDER BY pp.upload_date DESC
        `, [targetQuote.id]);
        
        if (paymentProofs.length === 0) {
            console.log('❌ No payment proofs found for this quote');
        } else {
            paymentProofs.forEach((proof, index) => {
                console.log(`  ${index + 1}. Payment ${proof.id}: ${proof.company_name} - Status: ${proof.verification_status || 'Pending'} - ${proof.verification_date ? new Date(proof.verification_date).toLocaleDateString() : 'Not verified'}`);
            });
        }
        
        // Test the admin query for this specific quote
        console.log('\n🔍 Testing Admin Query for this Quote:');
        const [adminResult] = await db.execute(`
            SELECT 
                q.id,
                q.user_id,
                u.name as user_name,
                u.email as user_email,
                u.role as user_role,
                q.product_description,
                q.status,
                
                -- Response counts
                COALESCE(response_counts.response_count, 0) as response_count,
                COALESCE(response_counts.accepted_count, 0) as accepted_count,
                
                -- Company working on this quote (accepted response)
                working_company.company_name,
                working_company.company_email,
                working_company.price as accepted_price,
                working_company.transit_time as accepted_transit_time,
                working_company.accepted_at,
                working_company.payment_status
                
            FROM quotes q
            LEFT JOIN users u ON q.user_id = u.id
            
            -- Subquery for response counts
            LEFT JOIN (
                SELECT 
                    qr_count.quote_id,
                    COUNT(DISTINCT qr_count.id) as response_count,
                    COUNT(DISTINCT CASE WHEN uqs_count.status = 'accepted' THEN qr_count.id END) as accepted_count
                FROM quote_responses qr_count
                LEFT JOIN user_quote_status uqs_count ON qr_count.id = uqs_count.quote_response_id
                GROUP BY qr_count.quote_id
            ) response_counts ON q.id = response_counts.quote_id
            
            -- Subquery for working company (accepted response)
            LEFT JOIN (
                SELECT 
                    qr2.quote_id,
                    c.name as company_name,
                    c.email as company_email,
                    qr2.price,
                    qr2.transit_time,
                    uqs2.accepted_at,
                    pv.verification_status as payment_status
                FROM quote_responses qr2
                JOIN users c ON qr2.company_id = c.id
                LEFT JOIN user_quote_status uqs2 ON qr2.id = uqs2.quote_response_id
                LEFT JOIN payment_proofs pp ON uqs2.payment_proof_id = pp.id
                LEFT JOIN payment_verifications pv ON pp.id = pv.payment_proof_id
                WHERE uqs2.status = 'accepted'
            ) working_company ON q.id = working_company.quote_id
            
            WHERE q.id = ?
        `, [targetQuote.id]);
        
        if (adminResult.length > 0) {
            const result = adminResult[0];
            console.log('Admin Query Result:');
            console.log(`  Quote ID: ${result.id}`);
            console.log(`  User: ${result.user_name} (${result.user_email}) - Role: ${result.user_role}`);
            console.log(`  Product: ${result.product_description}`);
            console.log(`  Quote Status: ${result.status}`);
            console.log(`  Response Count: ${result.response_count}`);
            console.log(`  Accepted Count: ${result.accepted_count}`);
            console.log(`  Company Name: ${result.company_name || 'NULL'}`);
            console.log(`  Company Email: ${result.company_email || 'NULL'}`);
            console.log(`  Accepted Price: ${result.accepted_price || 'NULL'}`);
            console.log(`  Payment Status: ${result.payment_status || 'NULL'}`);
        }
        
        // Analysis and potential fix
        console.log('\n📋 Analysis Summary:');
        if (responses.length === 0) {
            console.log('❌ Issue: No company responses found for this quote');
        } else if (userStatuses.length === 0) {
            console.log('❌ Issue: Business user has not accepted any responses yet');
            console.log('💡 Solution: Business user needs to accept a company response first');
            
            // Offer to fix it
            if (responses.length > 0) {
                console.log(`\n🔧 Would you like me to fix this by accepting response ${responses[0].id} from ${responses[0].company_name}?`);
                console.log('This will make the company data appear in the admin panel.');
            }
        } else {
            const acceptedStatuses = userStatuses.filter(s => s.status === 'accepted');
            if (acceptedStatuses.length === 0) {
                console.log('❌ Issue: No accepted responses found');
                console.log('💡 Current user_quote_status entries are all pending/rejected');
                
                // Offer to fix it
                if (userStatuses.length > 0) {
                    const pendingStatus = userStatuses.find(s => s.status === 'pending');
                    if (pendingStatus) {
                        console.log(`\n🔧 I can fix this by changing status ${pendingStatus.id} from 'pending' to 'accepted'`);
                    }
                }
            } else {
                console.log('✅ Accepted responses found, company data should be visible');
            }
        }
        
    } catch (error) {
        console.error('❌ Error debugging business user quote:', error);
    } finally {
        process.exit(0);
    }
}

debugBusinessUserQuote();