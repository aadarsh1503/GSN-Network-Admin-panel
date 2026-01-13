// Debug script to check company bank details
import db from './config/db.js';

const debugCompanyBankDetails = async () => {
  console.log('🔍 Debugging Company Bank Details');
  console.log('==================================');
  
  try {
    // Find the company user
    const [users] = await db.execute(`
      SELECT id, name, email, role 
      FROM users 
      WHERE email = 'aadarshchauhan35@gmail.com'
    `);
    
    if (users.length === 0) {
      console.log('❌ Company user not found');
      return;
    }
    
    const company = users[0];
    console.log('👤 Company User Found:');
    console.log(`   ID: ${company.id}`);
    console.log(`   Name: ${company.name}`);
    console.log(`   Email: ${company.email}`);
    console.log(`   Role: ${company.role}`);
    
    // Check bank details
    const [bankDetails] = await db.execute(`
      SELECT 
        id, company_id, bank_name, branch_name, ifsc_code, account_number, 
        account_holder_name, iban_number, swift_code, 
        payment_instructions, is_active, is_default, created_at, updated_at
      FROM company_bank_details 
      WHERE company_id = ? 
      ORDER BY is_default DESC, created_at DESC
    `, [company.id]);
    
    console.log(`\n💳 Bank Details Found: ${bankDetails.length}`);
    
    if (bankDetails.length === 0) {
      console.log('❌ No bank details found for this company');
      console.log('💡 This is why the quote response form shows "No active bank details found"');
      
      // Check if there are any bank details in the table at all
      const [allBankDetails] = await db.execute(`
        SELECT company_id, COUNT(*) as count 
        FROM company_bank_details 
        GROUP BY company_id
      `);
      
      console.log(`\n📊 All Company Bank Details in Database:`);
      allBankDetails.forEach(row => {
        console.log(`   Company ID ${row.company_id}: ${row.count} bank details`);
      });
      
    } else {
      bankDetails.forEach((bank, index) => {
        console.log(`\n💳 Bank Detail #${index + 1}:`);
        console.log(`   ID: ${bank.id}`);
        console.log(`   Bank Name: ${bank.bank_name}`);
        console.log(`   Account Name: ${bank.account_holder_name}`);
        console.log(`   Account Number: ${bank.account_number}`);
        console.log(`   Is Active: ${bank.is_active ? '✅ Yes' : '❌ No'}`);
        console.log(`   Is Default: ${bank.is_default ? '✅ Yes' : '❌ No'}`);
        console.log(`   Created: ${bank.created_at}`);
      });
      
      const activeCount = bankDetails.filter(bank => bank.is_active).length;
      console.log(`\n📈 Summary:`);
      console.log(`   Total Bank Details: ${bankDetails.length}`);
      console.log(`   Active Bank Details: ${activeCount}`);
      
      if (activeCount === 0) {
        console.log('⚠️  No active bank details found - this is the issue!');
      }
    }
    
    // Check the bank details page URL
    console.log(`\n🔗 Bank Details Management URL: http://localhost:5173/company/bank-details`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

debugCompanyBankDetails();