// Check company_bank_details table schema
import dotenv from 'dotenv';
dotenv.config();

import db from './config/db.js';

async function checkCompanyBankDetailsSchema() {
  try {
    console.log('🔍 Checking company_bank_details table structure...');
    
    // Get current table structure
    const [columns] = await db.execute('SHOW COLUMNS FROM company_bank_details');
    
    console.log('📋 Current table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    const columnNames = columns.map(col => col.Field);
    
    // Check if we have the required columns
    const requiredColumns = ['iban_number', 'swift_code', 'payment_instructions'];
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('❌ Missing columns:', missingColumns);
    } else {
      console.log('✅ All required columns are present');
    }
    
    // Check existing data
    const [records] = await db.execute(`
      SELECT id, company_id, bank_name, account_number, 
             iban_number, swift_code, is_active 
      FROM company_bank_details 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('\n📋 Sample company bank details:');
    if (records.length === 0) {
      console.log('  No records found');
    } else {
      records.forEach(record => {
        console.log(`  - ID: ${record.id}, Company: ${record.company_id}, Bank: ${record.bank_name}`);
        console.log(`    IBAN: ${record.iban_number || 'Not set'}, SWIFT: ${record.swift_code || 'Not set'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
  } finally {
    await db.end();
  }
}

checkCompanyBankDetailsSchema();