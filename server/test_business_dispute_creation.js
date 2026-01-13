import db from './config/db.js';

const testBusinessDisputeCreation = async () => {
    try {
        console.log('🔍 Testing business dispute creation...');
        
        // Check recent disputes in the database
        const [disputes] = await db.execute(`
            SELECT 
                d.id,
                d.title,
                d.description,
                d.status,
                d.priority,
                d.created_at,
                u.name as user_name,
                u.role as user_role,
                c.name as company_name,
                c.role as company_role,
                dr.title as reason_title
            FROM disputes d
            JOIN users u ON d.user_id = u.id
            JOIN users c ON d.company_id = c.id
            JOIN dispute_reasons dr ON d.dispute_reason_id = dr.id
            ORDER BY d.created_at DESC
            LIMIT 10
        `);
        
        console.log('\n📋 Recent disputes in database:');
        if (disputes.length === 0) {
            console.log('   No disputes found in database');
        } else {
            disputes.forEach(dispute => {
                console.log(`   Dispute #${dispute.id}:`);
                console.log(`     Title: ${dispute.title}`);
                console.log(`     Filed by: ${dispute.user_name} (${dispute.user_role})`);
                console.log(`     Against: ${dispute.company_name} (${dispute.company_role})`);
                console.log(`     Status: ${dispute.status}`);
                console.log(`     Created: ${dispute.created_at}`);
                console.log('');
            });
        }
        
        // Check business users
        const [businessUsers] = await db.execute(`
            SELECT id, name, email, role 
            FROM users 
            WHERE role = 'business'
            ORDER BY created_at DESC
            LIMIT 5
        `);
        
        console.log('👥 Business users in database:');
        if (businessUsers.length === 0) {
            console.log('   No business users found');
        } else {
            businessUsers.forEach(user => {
                console.log(`   ${user.name} (${user.email}) - ID: ${user.id}`);
            });
        }
        
        // Check company users (targets for disputes)
        const [companyUsers] = await db.execute(`
            SELECT id, name, email, role 
            FROM users 
            WHERE role = 'company'
            ORDER BY created_at DESC
            LIMIT 5
        `);
        
        console.log('\n🏢 Company users in database:');
        if (companyUsers.length === 0) {
            console.log('   No company users found');
        } else {
            companyUsers.forEach(user => {
                console.log(`   ${user.name} (${user.email}) - ID: ${user.id}`);
            });
        }
        
        // Check dispute reasons
        const [reasons] = await db.execute(`
            SELECT id, title, is_active 
            FROM dispute_reasons 
            WHERE is_active = TRUE
            ORDER BY title
        `);
        
        console.log('\n📝 Available dispute reasons:');
        if (reasons.length === 0) {
            console.log('   No dispute reasons found');
        } else {
            reasons.forEach(reason => {
                console.log(`   ${reason.title} (ID: ${reason.id})`);
            });
        }
        
        console.log('\n✅ Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error testing business dispute creation:', error);
    } finally {
        process.exit(0);
    }
};

testBusinessDisputeCreation();