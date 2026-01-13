// Fix the admin_bank_details table structure
import dotenv from 'dotenv';
dotenv.config();

import db from './config/db.js';

async function fixBankDetailsTable() {
  try {
    console.log('🔍 Checking admin_bank_details table structure...');
    
    // Get current table structure
    const [columns] = await db.execute(`
      SHOW COLUMNS FROM admin_bank_details
    `);
    
    console.log('📋 Current table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}) ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });
    
    const columnNames = columns.map(col => col.Field);
    
    // Check if we have the required columns
    const requiredColumns = ['iban_number', 'swift_code', 'payment_instructions'];
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('❌ Missing columns:', missingColumns);
      
      // Add missing columns
      for (const column of missingColumns) {
        if (column === 'iban_number') {
          console.log('➕ Adding iban_number column...');
          await db.execute('ALTER TABLE admin_bank_details ADD COLUMN iban_number VARCHAR(50) DEFAULT NULL');
        } else if (column === 'swift_code') {
          console.log('➕ Adding swift_code column...');
          await db.execute('ALTER TABLE admin_bank_details ADD COLUMN swift_code VARCHAR(20) DEFAULT NULL');
        } else if (column === 'payment_instructions') {
          console.log('➕ Adding payment_instructions column...');
          await db.execute('ALTER TABLE admin_bank_details ADD COLUMN payment_instructions TEXT DEFAULT NULL');
        }
      }
    }
    
    // Check if we need to rename 'instructions' to 'payment_instructions'
    if (columnNames.includes('instructions') && !columnNames.includes('payment_instructions')) {
      console.log('🔄 Renaming instructions to payment_instructions...');
      await db.execute('ALTER TABLE admin_bank_details CHANGE COLUMN instructions payment_instructions TEXT DEFAULT NULL');
    }
    
    console.log('✅ Table structure fixed!');
    
    // Now test inserting a record
    console.log('🧪 Testing insert operation...');
    
    const testData = {
      bank_name: 'Test Bank Fix',
      branch_name: 'Test Branch Fix',
      ifsc_code: 'TEST123456',
      iban_number: 'GB29 NWBK 6016 1331 9268 19',
      account_number: '1234567890123456',
      account_holder_name: 'GSN Network Services Test',
      swift_code: 'SBININBB123',
      payment_instructions: 'Test payment instructions',
      is_active: false
    };
    
    const [result] = await db.execute(
      `INSERT INTO admin_bank_details 
       (bank_name, branch_name, ifsc_code, iban_number, account_number, 
        account_holder_name, swift_code, payment_instructions, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [testData.bank_name, testData.branch_name, testData.ifsc_code, testData.iban_number, 
       testData.account_number, testData.account_holder_name, testData.swift_code, 
       testData.payment_instructions, testData.is_active]
    );
    
    console.log('✅ Test insert successful! ID:', result.insertId);
    
    // Clean up test record
    await db.execute('DELETE FROM admin_bank_details WHERE id = ?', [result.insertId]);
    console.log('🧹 Test record cleaned up');
    
    // Show final table structure
    const [finalColumns] = await db.execute('SHOW COLUMNS FROM admin_bank_details');
    console.log('\n📋 Final table structure:');
    finalColumns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing table:', error);
    console.error('Error details:', error.message);
    console.error('SQL State:', error.sqlState);
  } finally {
    await db.end();
  }
}

fixBankDetailsTable();