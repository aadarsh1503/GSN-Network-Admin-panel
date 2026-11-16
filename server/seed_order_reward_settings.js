import db from './config/db.js';
const run = async () => {
  await db.execute(`INSERT IGNORE INTO coupon_settings (setting_key, setting_value) VALUES
    ('order_reward_enabled',         '0'),
    ('order_reward_user_coupon_id',  ''),
    ('order_reward_company_coupon_id', ''),
    ('order_reward_expires_days',    '30'),
    ('order_reward_max_per_user',    '0')`);
  console.log('✅ Order reward coupon settings seeded');
  process.exit(0);
};
run().catch(e => { console.error(e.message); process.exit(1); });
