import db from './config/db.js';
import jwt from 'jsonwebtoken';

async function testCompanyAuth() {
    try {
        console.log('🧪 Testing company authentication and dispute access...\n');
        
        // Get a company user
        const [companies] = await db.execute(`
            SELECT id, name, email, role 
            FROM users 
            WHERE role = 'company' 
            LIMIT 1
        `);
        
        if (companies.length === 0) {
            console.log('❌ No company users found');
            return;
        }
        
        const company = companies[0];
        console.log(`Found company: ${company.name} (ID: ${company.id})`);
        
        // Generate a test JWT token
        const token = jwt.sign(
            { 
                id: company.id, 
                email: company.email, 
                role: company.role 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1h' }
        );
        
        console.log('Generated test token:', token.substring(0, 50) + '...');
        
        // Test getting company disputes
        console.log('\n1️⃣ Testing company disputes query...');
        const [disputes] = await db.execute(`
            SELECT 
                d.id,
                d.title,
                d.status,
                d.company_response,
                d.company_requested_status,
                u.name as user_name
            FROM disputes d
            JOIN users u ON d.user_id = u.id
            WHERE d.company_id = ?
            ORDER BY d.created_at DESC
        `, [company.id]);
        
        console.log(`Found ${disputes.length} disputes for this company:`);
        disputes.forEach(d => {
            console.log(`  - ID: ${d.id}, Status: ${d.status}, Title: ${d.title}`);
            console.log(`    User: ${d.user_name}`);
            console.log(`    Company Response: ${d.company_response ? 'Yes' : 'No'}`);
            console.log(`    Requested Status: ${d.company_requested_status || 'None'}`);
        });
        
        // Test if we can update a dispute
        if (disputes.length > 0) {
            const testDispute = disputes[0];
            console.log(`\n2️⃣ Testing status update for dispute ${testDispute.id}...`);
            
            const newStatus = 'investigating';
            const reason = 'Test status change from auth test';
            
            const updateSql = `
                UPDATE disputes 
                SET company_requested_status = ?, company_status_reason = ?, 
                    company_status_requested_at = NOW()
                WHERE id = ? AND company_id = ?
            `;
            const [result] = await db.execute(updateSql, [newStatus, reason, testDispute.id, company.id]);
            
            if (result.affectedRows > 0) {
                console.log('✅ Status update successful');
            } else {
                console.log('❌ Status update failed - no rows affected');
            }
        }
        
        console.log('\n📝 Test token for manual testing:');
        console.log(`Bearer ${token}`);
        console.log('\nUse this token in your browser\'s localStorage as "token"');
        
    } catch (error) {
        console.error('❌ Error testing company auth:', error);
    } finally {
        process.exit(0);
    }
}

testCompanyAuth();