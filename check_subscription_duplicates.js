// Check for subscription duplicates and Guest plans
import db from './server/config/db.js';

async function checkSubscriptionIssues() {
    try {
        console.log('🔍 Checking subscription database state...\n');
        
        // Check for Guest plans in membership_plans
        const [guestPlans] = await db.execute('SELECT * FROM membership_plans WHERE name = "Guest" OR price = 0');
        console.log('📋 Guest plans in membership_plans:', guestPlans.length);
        if (guestPlans.length > 0) {
            console.log(guestPlans);
        }
        
        // Check for zero-amount subscriptions
        const [zeroSubs] = await db.execute('SELECT * FROM user_subscriptions WHERE amount_paid = 0 OR amount_paid IS NULL ORDER BY created_at DESC LIMIT 10');
        console.log('\n💰 Zero-amount subscriptions:', zeroSubs.length);
        if (zeroSubs.length > 0) {
            console.log(zeroSubs);
        }
        
        // Check for duplicate subscriptions per user
        const [duplicates] = await db.execute(`
            SELECT user_id, COUNT(*) as count, GROUP_CONCAT(id) as subscription_ids
            FROM user_subscriptions 
            GROUP BY user_id 
            HAVING COUNT(*) > 1
            ORDER BY count DESC
        `);
        console.log('\n👥 Users with multiple subscriptions:', duplicates.length);
        if (duplicates.length > 0) {
            console.log(duplicates);
        }
        
        // Check specific problematic users mentioned
        const problematicEmails = ['last@gmail.com', 'problem@gmail.com', 'sparsh@gmail.com', 'aar@gmail.com', 'aadarshchauhan35@gmail.com'];
        
        for (const email of problematicEmails) {
            const [userSubs] = await db.execute(`
                SELECT us.*, u.email, mp.name as plan_name, mp.price as plan_price
                FROM user_subscriptions us
                JOIN users u ON us.user_id = u.id
                JOIN membership_plans mp ON us.plan_id = mp.id
                WHERE u.email = ?
                ORDER BY us.created_at DESC
            `, [email]);
            
            if (userSubs.length > 0) {
                console.log(`\n📧 Subscriptions for ${email}:`);
                userSubs.forEach(sub => {
                    console.log(`  - ID: ${sub.id}, Plan: ${sub.plan_name}, Amount: $${sub.amount_paid}, Status: ${sub.status}, Created: ${sub.created_at}`);
                });
            }
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkSubscriptionIssues();