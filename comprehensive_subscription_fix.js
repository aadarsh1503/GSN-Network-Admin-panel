// Comprehensive fix for Guest subscription issue
import db from './server/config/db.js';

async function comprehensiveSubscriptionFix() {
    try {
        console.log('🔧 Applying comprehensive subscription fix...\n');
        
        // 1. Clean up all existing Guest subscriptions
        console.log('🧹 Step 1: Cleaning up existing Guest subscriptions...');
        const [deleteResult] = await db.execute(`
            DELETE FROM user_subscriptions 
            WHERE plan_id = 1 OR amount_paid = 0 OR amount_paid = '0.00'
        `);
        console.log(`✅ Deleted ${deleteResult.affectedRows} Guest subscriptions\n`);
        
        // 2. Check if there are any database triggers that might be creating subscriptions
        console.log('🔍 Step 2: Checking for database triggers...');
        const [triggers] = await db.execute(`
            SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE 
            FROM information_schema.TRIGGERS 
            WHERE TRIGGER_SCHEMA = DATABASE()
            AND EVENT_OBJECT_TABLE IN ('users', 'user_subscriptions')
        `);
        
        if (triggers.length > 0) {
            console.log('⚠️ Found database triggers:');
            triggers.forEach(trigger => {
                console.log(`  - ${trigger.TRIGGER_NAME} on ${trigger.EVENT_OBJECT_TABLE} (${trigger.EVENT_MANIPULATION})`);
            });
        } else {
            console.log('✅ No database triggers found');
        }
        console.log('');
        
        // 3. Add a constraint to prevent zero-amount subscriptions (except for specific cases)
        console.log('🛡️ Step 3: Adding database constraint to prevent Guest subscriptions...');
        try {
            await db.execute(`
                ALTER TABLE user_subscriptions 
                ADD CONSTRAINT chk_no_guest_subscriptions 
                CHECK (amount_paid > 0 OR payment_method = 'admin_override')
            `);
            console.log('✅ Added constraint to prevent Guest subscriptions');
        } catch (error) {
            if (error.code === 'ER_CHECK_CONSTRAINT_DUP_NAME') {
                console.log('ℹ️ Constraint already exists');
            } else {
                console.log('⚠️ Could not add constraint:', error.message);
            }
        }
        console.log('');
        
        // 4. Create a function to monitor subscription creation
        console.log('📊 Step 4: Setting up subscription monitoring...');
        
        // Create a monitoring table if it doesn't exist
        try {
            await db.execute(`
                CREATE TABLE IF NOT EXISTS subscription_audit (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    action_type VARCHAR(50),
                    subscription_id INT,
                    user_id INT,
                    plan_id INT,
                    amount_paid DECIMAL(10,2),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    stack_trace TEXT
                )
            `);
            console.log('✅ Created subscription audit table');
        } catch (error) {
            console.log('⚠️ Could not create audit table:', error.message);
        }
        console.log('');
        
        // 5. Verify the fix by checking current subscriptions
        console.log('🔍 Step 5: Verifying current subscription state...');
        const [currentSubs] = await db.execute(`
            SELECT us.*, u.email, mp.name as plan_name
            FROM user_subscriptions us
            JOIN users u ON us.user_id = u.id
            JOIN membership_plans mp ON us.plan_id = mp.id
            ORDER BY us.created_at DESC
        `);
        
        console.log(`📊 Current subscriptions: ${currentSubs.length}`);
        currentSubs.forEach(sub => {
            console.log(`  - ID: ${sub.id}, User: ${sub.email}, Plan: ${sub.plan_name}, Amount: $${sub.amount_paid}`);
        });
        
        // Check for any remaining Guest subscriptions
        const guestSubs = currentSubs.filter(sub => sub.plan_name === 'Guest' || parseFloat(sub.amount_paid) === 0);
        if (guestSubs.length > 0) {
            console.log('\n⚠️ WARNING: Still found Guest subscriptions:');
            guestSubs.forEach(sub => {
                console.log(`  - ID: ${sub.id}, User: ${sub.email}, Plan: ${sub.plan_name}, Amount: $${sub.amount_paid}`);
            });
        } else {
            console.log('\n✅ No Guest subscriptions found');
        }
        console.log('');
        
        // 6. Test the admin panel query
        console.log('🧪 Step 6: Testing admin panel query...');
        const [adminPanelSubs] = await db.execute(`
            SELECT 
                us.id,
                us.user_id,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone,
                u.role as user_role,
                us.plan_id,
                mp.name as plan_name,
                mp.price as plan_price,
                mp.duration_months,
                us.start_date,
                us.end_date,
                us.status,
                us.payment_status,
                us.transaction_id,
                us.amount_paid,
                us.created_at
            FROM user_subscriptions us
            JOIN users u ON us.user_id = u.id
            JOIN membership_plans mp ON us.plan_id = mp.id
            WHERE us.id IN (
                SELECT MAX(us2.id)
                FROM user_subscriptions us2
                WHERE us2.user_id = us.user_id
                AND us2.amount_paid > 0
                GROUP BY us2.user_id
            )
            ORDER BY us.created_at DESC
        `);
        
        console.log(`📊 Admin panel query results: ${adminPanelSubs.length} subscriptions`);
        adminPanelSubs.forEach(sub => {
            console.log(`  - ${sub.user_name} (${sub.user_email}): ${sub.plan_name} - $${sub.amount_paid}`);
        });
        console.log('');
        
        // 7. Create a cleanup script for future use
        console.log('📝 Step 7: Creating cleanup script...');
        const cleanupScript = `-- Emergency cleanup script for Guest subscriptions
-- Run this if Guest subscriptions appear again

DELETE FROM user_subscriptions 
WHERE plan_id = 1 OR amount_paid = 0 OR amount_paid = '0.00';

-- Check results
SELECT 
    us.id,
    u.email,
    mp.name as plan_name,
    us.amount_paid
FROM user_subscriptions us
JOIN users u ON us.user_id = u.id
JOIN membership_plans mp ON us.plan_id = mp.id
ORDER BY us.created_at DESC;
        `;
        
        // Write cleanup script to file
        import('fs').then(fs => {
            fs.writeFileSync('emergency_guest_cleanup.sql', cleanupScript);
            console.log('✅ Created emergency_guest_cleanup.sql');
        }).catch(() => {
            console.log('⚠️ Could not create cleanup script file');
        });
        console.log('');
        
        console.log('🎉 Comprehensive subscription fix completed!');
        console.log('');
        console.log('📋 Summary:');
        console.log(`  - Deleted ${deleteResult.affectedRows} Guest subscriptions`);
        console.log(`  - Current subscriptions: ${currentSubs.length}`);
        console.log(`  - Admin panel shows: ${adminPanelSubs.length} subscriptions`);
        console.log(`  - Database triggers: ${triggers.length}`);
        console.log('');
        console.log('💡 Next steps:');
        console.log('  1. Test the admin panel at http://localhost:5173/admin/subscribers');
        console.log('  2. Try deleting a subscription to see if Guest plans are created');
        console.log('  3. If Guest plans still appear, run the monitoring script');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

comprehensiveSubscriptionFix();