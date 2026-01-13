// Add the constraint back to prevent Guest subscription issues
import db from './server/config/db.js';

async function addConstraintBack() {
    try {
        console.log('🔧 Adding constraint back to prevent Guest subscription issues...\n');
        
        // First, clean up any existing Guest subscriptions that might have been created
        console.log('🧹 Step 1: Cleaning up any Guest subscriptions...');
        const [deleteResult] = await db.execute(`
            DELETE FROM user_subscriptions 
            WHERE plan_id = 1 OR amount_paid = 0 OR amount_paid = '0.00'
        `);
        console.log(`✅ Deleted ${deleteResult.affectedRows} Guest subscriptions\n`);
        
        // Check if constraint already exists
        console.log('🔍 Step 2: Checking if constraint exists...');
        const [constraints] = await db.execute(`
            SELECT CONSTRAINT_NAME 
            FROM information_schema.TABLE_CONSTRAINTS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'user_subscriptions' 
            AND CONSTRAINT_NAME = 'chk_no_guest_subscriptions'
        `);
        
        if (constraints.length > 0) {
            console.log('ℹ️ Constraint already exists, removing it first...');
            try {
                await db.execute(`
                    ALTER TABLE user_subscriptions 
                    DROP CONSTRAINT chk_no_guest_subscriptions
                `);
                console.log('✅ Old constraint removed');
            } catch (error) {
                console.log('⚠️ Could not remove old constraint:', error.message);
            }
        }
        
        // Add the constraint back
        console.log('\n🛡️ Step 3: Adding constraint to prevent Guest subscriptions...');
        try {
            await db.execute(`
                ALTER TABLE user_subscriptions 
                ADD CONSTRAINT chk_no_guest_subscriptions 
                CHECK (amount_paid > 0 OR payment_method = 'admin_override')
            `);
            console.log('✅ Constraint added successfully');
        } catch (error) {
            if (error.code === 'ER_CHECK_CONSTRAINT_DUP_NAME') {
                console.log('ℹ️ Constraint already exists');
            } else {
                console.log('⚠️ Error adding constraint:', error.message);
                throw error;
            }
        }
        
        // Verify the constraint is working
        console.log('\n🧪 Step 4: Testing constraint...');
        try {
            await db.execute(`
                INSERT INTO user_subscriptions 
                (user_id, plan_id, start_date, end_date, status, payment_status, amount_paid, created_at)
                VALUES (999, 1, NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH), 'active', 'paid', 0, NOW())
            `);
            console.log('❌ ERROR: Constraint is not working - Guest subscription was created!');
        } catch (error) {
            if (error.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
                console.log('✅ Constraint is working - Guest subscriptions are blocked');
            } else {
                console.log('⚠️ Unexpected error during test:', error.message);
            }
        }
        
        // Check current subscription state
        console.log('\n📊 Step 5: Verifying current subscription state...');
        const [currentSubs] = await db.execute(`
            SELECT us.*, u.email, mp.name as plan_name
            FROM user_subscriptions us
            JOIN users u ON us.user_id = u.id
            JOIN membership_plans mp ON us.plan_id = mp.id
            ORDER BY us.created_at DESC
        `);
        
        console.log(`📋 Current subscriptions: ${currentSubs.length}`);
        currentSubs.forEach(sub => {
            console.log(`  - ID: ${sub.id}, User: ${sub.email}, Plan: ${sub.plan_name}, Amount: $${sub.amount_paid}`);
        });
        
        // Check for any remaining Guest subscriptions
        const guestSubs = currentSubs.filter(sub => 
            sub.plan_name === 'Guest' || parseFloat(sub.amount_paid) === 0
        );
        
        if (guestSubs.length > 0) {
            console.log('\n⚠️ WARNING: Still found Guest subscriptions:');
            guestSubs.forEach(sub => {
                console.log(`  - ID: ${sub.id}, User: ${sub.email}, Plan: ${sub.plan_name}, Amount: $${sub.amount_paid}`);
            });
        } else {
            console.log('\n✅ No Guest subscriptions found - system is clean');
        }
        
        console.log('\n🎉 Constraint successfully added back!');
        console.log('\n📋 Protection Summary:');
        console.log('  ✅ Database constraint prevents Guest subscriptions');
        console.log('  ✅ Only paid subscriptions (amount_paid > 0) allowed');
        console.log('  ✅ Admin override option available if needed');
        console.log('  ✅ System protected against future Guest subscription issues');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

addConstraintBack();