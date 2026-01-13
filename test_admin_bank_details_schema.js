// Test script to check admin_bank_details table schema and fix issues
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from server/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, 'server', '.env') });

import db from './server/config/db.js';

async function checkAndFixAdminBankDetailsSchema() {
  try {
    console.log('🔍 Checking admin_bank_details table schema...');
    
    // Check if table exists and get its structure
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'admin_bank_details'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📋 Current table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // Check for required columns
    const requiredColumns = ['iban_number', 'swift_code', 'payment_instructions'];
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('❌ Missing required columns:', missingColumns);
      console.log('💡 Please run the fix_admin_bank_details_schema.sql script to add missing columns');
      
      // Try to add missing columns automatically
      console.log('🔧 Attempting to fix schema automatically...');
      
      if (missingColumns.includes('iban_number')) {
        await db.execute('ALTER TABLE admin_bank_details ADD COLUMN iban_number VARCHAR(50) DEFAULT NULL AFTER account_holder_name');
        console.log('✅ Added iban_number column');
      }
      
      if (missingColumns.includes('swift_code')) {
        await db.execute('ALTER TABLE admin_bank_details ADD COLUMN swift_code VARCHAR(20) DEFAULT NULL AFTER iban_number');
        console.log('✅ Added swift_code column');
      }
      
      if (missingColumns.includes('payment_instructions')) {
        // Check if 'instructions' column exists and rename it
        if (existingColumns.includes('instructions')) {
          await db.execute('ALTER TABLE admin_bank_details CHANGE COLUMN instructions payment_instructions TEXT DEFAULT NULL');
          console.log('✅ Renamed instructions to payment_instructions');
        } else {
          await db.execute('ALTER TABLE admin_bank_details ADD COLUMN payment_instructions TEXT DEFAULT NULL');
          console.log('✅ Added payment_instructions column');
        }
      }
      
      console.log('🎉 Schema fixed successfully!');
    } else {
      console.log('✅ All required columns are present');
    }
    
    // Test a simple query
    console.log('🧪 Testing query...');
    const [testResult] = await db.execute('SELECT COUNT(*) as count FROM admin_bank_details');
    console.log(`📊 Found ${testResult[0].count} admin bank details records`);
    
    // Show current records
    const [records] = await db.execute(`
      SELECT id, bank_name, branch_name, account_holder_name, 
             iban_number, swift_code, is_active 
      FROM admin_bank_details 
      ORDER BY created_at DESC
    `);
    
    console.log('📋 Current admin bank details:');
    if (records.length === 0) {
      console.log('  No records found');
    } else {
      records.forEach(record => {
        console.log(`  - ID: ${record.id}, Bank: ${record.bank_name}, Active: ${record.is_active ? 'Yes' : 'No'}`);
        console.log(`    IBAN: ${record.iban_number || 'Not set'}, SWIFT: ${record.swift_code || 'Not set'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('💡 Table does not exist. Please run the create_subscription_requests_table.sql script first');
    }
  } finally {
    await db.end();
  }
}

// Run the check
checkAndFixAdminBankDetailsSchema();