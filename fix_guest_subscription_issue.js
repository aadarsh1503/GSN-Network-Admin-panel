// Fix Guest subscription issue by removing Guest subscriptions
import db from './server/config/db.js';

async function fixGuestSubscriptionIssue() {
    try {
        console.log('🔧 Fixing Guest subscription issue...\n');
        
        // First, let's see what we have
        const [guestSubs] = await db.execute(`
            SELECT us.*, u.email, mp.name as plan_name
            FROM user_subscriptions us
            JOIN users u ON us.user_id = u.id
            JOIN membership_plans mp ON us.plan_id = mp.id
            WHERE mp.name = 'Guest' OR us.amount_paid = 0
            ORDER BY us.created_at DESC
        `);
        
        console.log(`📋 Found ${guestSubs.length} Guest subscriptions:`);
        guestSubs.forEach(sub => {
            console.log(`  - ID: ${sub.id}, User: ${sub.email}, Plan: ${sub.plan_name}, Amount: $${sub.amount_paid}`);
        });
        
        if (guestSubs.length === 0) {
            console.log('✅ No Guest subscriptions found. Issue may already be resolved.');
            process.exit(0);
        }
        
        // Delete Guest subscriptions
        console.log('\n🗑️ Removing Guest subscriptions...');
        const [deleteResult] = await db.execute(`
            DELETE FROM user_subscriptions 
            WHERE plan_id = 1 OR amount_paid = 0
        `);
        
        console.log(`✅ Deleted ${deleteResult.affectedRows} Guest subscriptions`);
        
        // Verify the fix
        console.log('\n🔍 Verifying fix...');
        const [remainingSubs] = await db.execute(`
            SELECT us.*, u.email, mp.name as plan_name
            FROM user_subscriptions us
            JOIN users u ON us.user_id = u.id
            JOIN membership_plans mp ON us.plan_id = mp.id
            ORDER BY us.created_at DESC
        `);
        
        console.log(`📊 Remaining subscriptions: ${remainingSubs.length}`);
        remainingSubs.forEach(sub => {
            console.log(`  - ID: ${sub.id}, User: ${sub.email}, Plan: ${sub.plan_name}, Amount: $${sub.amount_paid}`);
        });
        
        console.log('\n🎉 Guest subscription issue fixed!');
        console.log('💡 Users without paid subscriptions will now get Guest access by default (no database record needed)');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixGuestSubscriptionIssue();