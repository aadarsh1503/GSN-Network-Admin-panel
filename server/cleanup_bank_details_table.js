// Clean up the admin_bank_details table - remove duplicate instructions column
import dotenv from 'dotenv';
dotenv.config();

import db from './config/db.js';

async function cleanupBankDetailsTable() {
  try {
    console.log('🧹 Cleaning up admin_bank_details table...');
    
    // Check if both instructions and payment_instructions exist
    const [columns] = await db.execute('SHOW COLUMNS FROM admin_bank_details');
    const columnNames = columns.map(col => col.Field);
    
    if (columnNames.includes('instructions') && columnNames.includes('payment_instructions')) {
      console.log('🔄 Found both instructions and payment_instructions columns');
      
      // Copy data from instructions to payment_instructions if payment_instructions is null
      console.log('📋 Copying data from instructions to payment_instructions...');
      await db.execute(`
        UPDATE admin_bank_details 
        SET payment_instructions = instructions 
        WHERE payment_instructions IS NULL AND instructions IS NOT NULL
      `);
      
      // Drop the old instructions column
      console.log('🗑️ Dropping old instructions column...');
      await db.execute('ALTER TABLE admin_bank_details DROP COLUMN instructions');
      
      console.log('✅ Cleanup completed!');
    } else {
      console.log('✅ Table is already clean');
    }
    
    // Show final structure
    const [finalColumns] = await db.execute('SHOW COLUMNS FROM admin_bank_details');
    console.log('\n📋 Final table structure:');
    finalColumns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type}`);
    });
    
  } catch (error) {
    console.error('❌ Error cleaning up table:', error);
  } finally {
    await db.end();
  }
}

cleanupBankDetailsTable();