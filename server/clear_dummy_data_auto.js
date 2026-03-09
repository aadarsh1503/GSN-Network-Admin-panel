import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config({ path: './.env' });

async function clearDummyData() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to database successfully\n');

    // Tables to preserve (admin and system configuration tables)
    const preserveTables = [
      'admin_actions',
      'admin_bank_details', 
      'admin_notifications',
      'admin_toast_seen',
      'aws_settings',
      'general_settings',
      'system_versions',
      'migrations',
      'business_categories',
      'logistics_categories',
      'membership_plans',
      'dispute_reasons'
    ];
    
    const [tables] = await connection.query('SHOW TABLES');
    const allTables = tables.map(table => Object.values(table)[0]);
    
    console.log('📋 Tables that will be CLEARED (data removed):');
    console.log('=' .repeat(50));
    
    const tablesToClear = allTables.filter(table => 
      !preserveTables.includes(table)
    );
    
    tablesToClear.forEach((table, index) => {
      console.log(`${index + 1}. ${table}`);
    });
    
    console.log('=' .repeat(50));
    console.log(`\nTotal tables to clear: ${tablesToClear.length}\n`);
    
    console.log('🔒 Tables that will be PRESERVED:');
    console.log('=' .repeat(50));
    const preservedTables = allTables.filter(table => 
      preserveTables.includes(table)
    );
    preservedTables.forEach((table, index) => {
      console.log(`${index + 1}. ${table}`);
    });
    console.log('=' .repeat(50));
    console.log('\n');

    console.log('🔄 Starting data deletion...\n');

    // Disable foreign key checks temporarily
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    let successCount = 0;
    let errorCount = 0;

    // Clear each table
    for (const tableName of tablesToClear) {
      try {
        const [result] = await connection.query(`DELETE FROM \`${tableName}\``);
        console.log(`✅ Cleared ${tableName} - ${result.affectedRows} rows deleted`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error clearing ${tableName}:`, error.message);
        errorCount++;
      }
    }

    // Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('\n' + '=' .repeat(50));
    console.log('📊 Summary:');
    console.log(`✅ Successfully cleared: ${successCount} tables`);
    console.log(`❌ Errors: ${errorCount} tables`);
    console.log(`🔒 Preserved: ${preservedTables.length} tables`);
    console.log('=' .repeat(50));
    
    console.log('\n✅ Data cleanup completed!');

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

clearDummyData();
