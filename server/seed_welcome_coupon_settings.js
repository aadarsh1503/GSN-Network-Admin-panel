import db from './config/db.js';
const run = async () => {
  await db.execute(`INSERT IGNORE INTO coupon_settings (setting_key, setting_value) VALUES
    ('welcome_coupon_enabled',      '0'),
    ('welcome_coupon_id',           ''),
    ('welcome_coupon_roles',        'user,business,company'),
    ('welcome_coupon_expires_days', '30')`);
  console.log('✅ Welcome coupon settings seeded');
  process.exit(0);
};
run().catch(e => { console.error(e.message); process.exit(1); });
