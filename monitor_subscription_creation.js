// Monitor subscription creation to find where Guest subscriptions are coming from
import db from './server/config/db.js';

async function monitorSubscriptionCreation() {
    try {
        console.log('🔍 Starting subscription creation monitoring...\n');
        
        // First, clean up any existing Guest subscriptions
        console.log('🧹 Cleaning up existing Guest subscriptions...');
        const [deleteResult] = await db.execute(`
            DELETE FROM user_subscriptions 
            WHERE plan_id = 1 OR amount_paid = 0
        `);
        console.log(`✅ Deleted ${deleteResult.affectedRows} Guest subscriptions\n`);
        
        // Get current subscription count
        const [currentSubs] = await db.execute('SELECT COUNT(*) as count FROM user_subscriptions');
        console.log(`📊 Current subscription count: ${currentSubs[0].count}\n`);
        
        // Monitor for new subscriptions every 5 seconds
        console.log('👀 Monitoring for new subscriptions (press Ctrl+C to stop)...\n');
        
        let lastCount = currentSubs[0].count;
        
        const monitor = setInterval(async () => {
            try {
                const [newCount] = await db.execute('SELECT COUNT(*) as count FROM user_subscriptions');
                
                if (newCount[0].count !== lastCount) {
                    console.log(`🚨 SUBSCRIPTION COUNT CHANGED: ${lastCount} → ${newCount[0].count}`);
                    
                    // Get the newest subscriptions
                    const [newSubs] = await db.execute(`
                        SELECT us.*, u.email, mp.name as plan_name
                        FROM user_subscriptions us
                        JOIN users u ON us.user_id = u.id
                        JOIN membership_plans mp ON us.plan_id = mp.id
                        ORDER BY us.created_at DESC
                        LIMIT 5
                    `);
                    
                    console.log('📋 Latest subscriptions:');
                    newSubs.forEach(sub => {
                        console.log(`  - ID: ${sub.id}, User: ${sub.email}, Plan: ${sub.plan_name}, Amount: $${sub.amount_paid}, Created: ${sub.created_at}`);
                    });
                    
                    // Check specifically for Guest subscriptions
                    const [guestSubs] = await db.execute(`
                        SELECT us.*, u.email, mp.name as plan_name
                        FROM user_subscriptions us
                        JOIN users u ON us.user_id = u.id
                        JOIN membership_plans mp ON us.plan_id = mp.id
                        WHERE mp.name = 'Guest' OR us.amount_paid = 0
                        ORDER BY us.created_at DESC
                    `);
                    
                    if (guestSubs.length > 0) {
                        console.log('🚨 GUEST SUBSCRIPTIONS DETECTED:');
                        guestSubs.forEach(sub => {
                            console.log(`  - ID: ${sub.id}, User: ${sub.email}, Plan: ${sub.plan_name}, Amount: $${sub.amount_paid}, Created: ${sub.created_at}`);
                        });
                    }
                    
                    console.log('');
                    lastCount = newCount[0].count;
                }
            } catch (error) {
                console.error('❌ Error during monitoring:', error);
            }
        }, 5000);
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Stopping monitoring...');
            clearInterval(monitor);
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

monitorSubscriptionCreation();