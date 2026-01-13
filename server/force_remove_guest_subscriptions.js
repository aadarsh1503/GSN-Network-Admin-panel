import db from './config/db.js';

const forceRemoveGuestSubscriptions = async () => {
  try {
    console.log('🔍 Force removing ALL Guest subscriptions...');
    
    // 1. Find all Guest subscriptions
    const [guestSubs] = await db.execute(`
      SELECT 
        us.id, us.user_id, us.amount_paid, us.status,
        u.name, u.email, mp.name as plan_name
      FROM user_subscriptions us
      JOIN users u ON us.user_id = u.id
      JOIN membership_plans mp ON us.plan_id = mp.id
      WHERE mp.name = 'Guest' OR us.amount_paid = 0 OR us.amount_paid = '0.00'
    `);
    
    console.log(`Found ${guestSubs.length} Guest/zero-value subscriptions:`);
    console.table(guestSubs);
    
    // 2. Delete ALL Guest subscriptions
    if (guestSubs.length > 0) {
      await db.execute(`
        DELETE us FROM user_subscriptions us
        JOIN membership_plans mp ON us.plan_id = mp.id
        WHERE mp.name = 'Guest' OR us.amount_paid = 0 OR us.amount_paid = '0.00'
      `);
      
      console.log(`✅ Deleted ${guestSubs.length} Guest subscriptions`);
    }
    
    // 3. Check remaining subscriptions
    const [remaining] = await db.execute(`
      SELECT 
        us.id, us.user_id, us.amount_paid, us.status,
        u.name, u.email, mp.name as plan_name, mp.price
      FROM user_subscriptions us
      JOIN users u ON us.user_id = u.id
      JOIN membership_plans mp ON us.plan_id = mp.id
      ORDER BY us.created_at DESC
    `);
    
    console.log('\n📋 Remaining subscriptions:');
    console.table(remaining);
    
    // 4. Check if there are any zero-value subscriptions left
    const zeroValueLeft = remaining.filter(sub => parseFloat(sub.amount_paid) === 0);
    if (zeroValueLeft.length > 0) {
      console.log('\n⚠️ Still found zero-value subscriptions:');
      console.table(zeroValueLeft);
    } else {
      console.log('\n✅ No zero-value subscriptions remaining!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.end();
    process.exit(0);
  }
};

forceRemoveGuestSubscriptions();