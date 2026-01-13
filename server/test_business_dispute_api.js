import db from './config/db.js';

const testBusinessDisputeAPI = async () => {
    try {
        console.log('🔍 Testing business dispute API endpoints...');
        
        // Test the /api/disputes/my-disputes endpoint logic
        const businessUserId = 21; // adaersh user ID from the database
        
        console.log(`\n📋 Testing disputes for business user ID: ${businessUserId}`);
        
        // This is what the /api/disputes/my-disputes endpoint should return
        const sql = `
            SELECT 
                d.id,
                d.title,
                d.description,
                d.status,
                d.priority,
                d.admin_response,
                d.company_response,
                d.company_suggested_status,
                d.company_responded_at,
                d.company_requested_status,
                d.company_status_reason,
                d.company_status_requested_at,
                d.created_at,
                d.updated_at,
                d.resolved_at,
                c.name as company_name,
                c.email as company_email,
                dr.title as reason_title
            FROM disputes d
            JOIN users c ON d.company_id = c.id
            JOIN dispute_reasons dr ON d.dispute_reason_id = dr.id
            WHERE d.user_id = ?
            ORDER BY d.created_at DESC
        `;
        
        const [disputes] = await db.execute(sql, [businessUserId]);
        
        console.log(`\n✅ Found ${disputes.length} disputes for business user:`);
        
        if (disputes.length === 0) {
            console.log('   No disputes found - this might be the issue!');
        } else {
            disputes.forEach(dispute => {
                console.log(`   Dispute #${dispute.id}:`);
                console.log(`     Title: ${dispute.title}`);
                console.log(`     Against: ${dispute.company_name}`);
                console.log(`     Status: ${dispute.status}`);
                console.log(`     Reason: ${dispute.reason_title}`);
                console.log(`     Created: ${dispute.created_at}`);
                console.log('');
            });
        }
        
        // Also test the user-companies endpoint
        console.log('\n🏢 Testing user-companies endpoint logic:');
        const companiesSql = `
            SELECT DISTINCT 
                c.id,
                c.name,
                c.email
            FROM users c
            WHERE c.role = 'company' 
            AND c.id IN (
                SELECT DISTINCT qr.company_id 
                FROM quote_responses qr
                JOIN quotes q ON qr.quote_id = q.id
                WHERE q.user_id = ?
                UNION
                SELECT DISTINCT company_id 
                FROM transactions 
                WHERE user_id = ? AND company_id IS NOT NULL
            )
            ORDER BY c.name ASC
        `;
        
        const [companies] = await db.execute(companiesSql, [businessUserId, businessUserId]);
        
        console.log(`   Found ${companies.length} companies with interactions:`);
        if (companies.length === 0) {
            console.log('   No companies found with interactions, will return all companies');
            
            const allCompaniesSql = `
                SELECT id, name, email 
                FROM users 
                WHERE role = 'company' AND status = 1 
                ORDER BY name ASC
            `;
            const [allCompanies] = await db.execute(allCompaniesSql);
            console.log(`   All companies available: ${allCompanies.length}`);
            allCompanies.slice(0, 3).forEach(company => {
                console.log(`     ${company.name} (ID: ${company.id})`);
            });
        } else {
            companies.forEach(company => {
                console.log(`     ${company.name} (ID: ${company.id})`);
            });
        }
        
        console.log('\n✅ API endpoint test completed!');
        
    } catch (error) {
        console.error('❌ Error testing business dispute API:', error);
    } finally {
        process.exit(0);
    }
};

testBusinessDisputeAPI();