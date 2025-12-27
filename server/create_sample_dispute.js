import db from './config/db.js';

async function createSampleDispute() {
    console.log('🧪 Creating Sample Dispute for Testing...\n');

    try {
        // First, let's check if we have users and companies
        const [users] = await db.execute(`
            SELECT id, name, email, role 
            FROM users 
            WHERE role IN ('user', 'company') 
            LIMIT 5
        `);
        
        console.log('Available users and companies:');
        users.forEach(user => {
            console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
        });
        
        if (users.length < 2) {
            console.log('❌ Need at least 2 users (1 user + 1 company) to create a dispute');
            return;
        }

        // Find a user and a company
        const user = users.find(u => u.role === 'user');
        const company = users.find(u => u.role === 'company');
        
        if (!user || !company) {
            console.log('❌ Need both a user and a company to create a dispute');
            console.log(`Found: ${user ? 'User ✅' : 'User ❌'}, ${company ? 'Company ✅' : 'Company ❌'}`);
            return;
        }

        console.log(`\nCreating dispute between:`);
        console.log(`  User: ${user.name} (${user.email})`);
        console.log(`  Company: ${company.name} (${company.email})`);

        // Get a dispute reason
        const [reasons] = await db.execute(`
            SELECT id, title FROM dispute_reasons WHERE is_active = TRUE LIMIT 1
        `);
        
        if (reasons.length === 0) {
            console.log('❌ No active dispute reasons found');
            return;
        }

        const reason = reasons[0];
        console.log(`  Reason: ${reason.title}`);

        // Create the sample dispute
        const disputeData = {
            user_id: user.id,
            company_id: company.id,
            dispute_reason_id: reason.id,
            title: 'Sample Dispute - Poor Service Quality',
            description: 'This is a test dispute created for demonstration purposes. The company failed to deliver the service as promised and did not respond to multiple follow-up requests.',
            priority: 'medium',
            status: 'pending'
        };

        const [result] = await db.execute(`
            INSERT INTO disputes (user_id, company_id, dispute_reason_id, title, description, priority, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            disputeData.user_id,
            disputeData.company_id,
            disputeData.dispute_reason_id,
            disputeData.title,
            disputeData.description,
            disputeData.priority,
            disputeData.status
        ]);

        const disputeId = result.insertId;
        console.log(`\n✅ Sample dispute created successfully!`);
        console.log(`   Dispute ID: ${disputeId}`);
        console.log(`   Title: ${disputeData.title}`);
        console.log(`   Status: ${disputeData.status}`);
        console.log(`   Priority: ${disputeData.priority}`);

        // Add a sample image (optional)
        await db.execute(`
            INSERT INTO dispute_images (dispute_id, image_url, image_type, uploaded_by)
            VALUES (?, ?, ?, ?)
        `, [
            disputeId,
            'https://via.placeholder.com/400x300?text=Evidence+Image',
            'evidence',
            'user'
        ]);

        console.log(`   📸 Sample evidence image added`);

        console.log('\n🎉 Sample dispute created successfully!');
        console.log('📝 You can now test:');
        console.log('   • Dashboard dispute metrics');
        console.log('   • Dispute management pages');
        console.log('   • Dispute details modal');
        console.log('   • Status updates and resolution');

    } catch (error) {
        console.error('❌ Error creating sample dispute:', error);
    } finally {
        process.exit(0);
    }
}

createSampleDispute();