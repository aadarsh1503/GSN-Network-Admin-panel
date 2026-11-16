// Wipe all business/user/transactional data while preserving the admin login and platform config.
// Usage: node wipe_data.js
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config({ path: './.env' });

// Platform configuration tables that must NOT be wiped.
const PRESERVE_TABLES = [
  'general_settings',
  'aws_settings',
  'wallet_settings',
  'referral_settings',
  'referral_reward_rules',
  'referral_coupon_rules',
  'coupon_settings',
  'membership_plans',
  'business_categories',
  'logistics_categories',
  'dispute_reasons',
  'admin_bank_details',
  'system_versions',
  'migrations'
];

async function wipeData() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to database\n');

    const [tableRows] = await connection.query('SHOW TABLES');
    const allTables = tableRows.map((t) => Object.values(t)[0]);

    // Identify the admin accounts to keep.
    const [admins] = await connection.query(
      "SELECT id, name, email FROM users WHERE role = 'admin' ORDER BY id ASC"
    );

    console.log('🔒 Preserving admin account(s):');
    if (admins.length === 0) {
      console.log('   ⚠️  No admin user found! Aborting to avoid locking you out.');
      return;
    }
    admins.forEach((a) => console.log(`   - id ${a.id} | ${a.name} | ${a.email}`));

    console.log('\n🔒 Preserving config tables:');
    PRESERVE_TABLES.forEach((t) => console.log(`   - ${t}`));

    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    let cleared = 0;
    let errors = 0;

    // 1) users -> delete everything except admins
    const [userResult] = await connection.query(
      "DELETE FROM users WHERE role <> 'admin' OR role IS NULL"
    );
    console.log(`\n✅ users: deleted ${userResult.affectedRows} non-admin row(s)`);
    cleared++;

    // 2) every other non-preserved table
    const tablesToClear = allTables.filter(
      (t) => !PRESERVE_TABLES.includes(t) && t !== 'users'
    );

    console.log(`\n🔄 Clearing ${tablesToClear.length} table(s)...\n`);

    for (const table of tablesToClear) {
      try {
        const [result] = await connection.query(`DELETE FROM \`${table}\``);
        console.log(`✅ ${table}: ${result.affectedRows} row(s) deleted`);
        cleared++;
      } catch (error) {
        console.error(`❌ ${table}: ${error.message}`);
        errors++;
      }
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log(`✅ Cleared: ${cleared} table(s) (incl. users non-admin)`);
    console.log(`❌ Errors: ${errors} table(s)`);
    console.log(`🔒 Preserved: ${PRESERVE_TABLES.length} config table(s) + ${admins.length} admin account(s)`);
    console.log('='.repeat(50));
    console.log('\n✅ Data wipe completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

wipeData();
