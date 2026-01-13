// Debug script to check payment proof data for quote 84
import db from './server/config/db.js';

const debugPaymentProofIssue = async () => {
  console.log('🔍 Debugging Payment Proof Issue for Quote 84');
  console.log('================================================');

  try {
    // Check quote 84 details
    const [quote] = await db.execute(
      'SELECT * FROM quotes WHERE id = 84'
    );
    
    if (quote.length === 0) {
      console.log('❌ Quote 84 not found');
      return;
    }
    
    console.log('\n📋 Quote 84 Details:');
    console.log(`   User ID: ${quote[0].user_id}`);
    console.log(`   Status: ${quote[0].status}`);
    console.log(`   Created: ${quote[0].created_at}`);

    // Check quote responses for quote 84
    const [responses] = await db.execute(
      'SELECT * FROM quote_responses WHERE quote_id = 84'
    );
    
    console.log(`\n💬 Quote Responses: ${responses.length} found`);
    responses.forEach((response, index) => {
      console.log(`   Response ${index + 1}: ID ${response.id}, Company ${response.company_id}, Price ${response.price}`);
    });

    // Check existing payment proofs for quote 84
    const [paymentProofs] = await db.execute(
      'SELECT * FROM payment_proofs WHERE quote_id = 84'
    );
    
    console.log(`\n💳 Existing Payment Proofs: ${paymentProofs.length} found`);
    if (paymentProofs.length > 0) {
      paymentProofs.forEach((proof, index) => {
        console.log(`   Proof ${index + 1}:`);
        console.log(`     ID: ${proof.id}`);
        console.log(`     User ID: ${proof.user_id}`);
        console.log(`     Company ID: ${proof.company_id}`);
        console.log(`     Quote Response ID: ${proof.quote_response_id}`);
        console.log(`     Upload Date: ${proof.upload_date}`);
        console.log(`     File: ${proof.file_name}`);
      });
    }

    // Check payment verifications
    const [verifications] = await db.execute(
      'SELECT * FROM payment_verifications WHERE quote_id = 84'
    );
    
    console.log(`\n✅ Payment Verifications: ${verifications.length} found`);
    if (verifications.length > 0) {
      verifications.forEach((verification, index) => {
        console.log(`   Verification ${index + 1}:`);
        console.log(`     ID: ${verification.id}`);
        console.log(`     User ID: ${verification.user_id}`);
        console.log(`     Company ID: ${verification.company_id}`);
        console.log(`     Quote Response ID: ${verification.quote_response_id}`);
        console.log(`     Payment Proof ID: ${verification.payment_proof_id}`);
      });
    }

    // Check user quote status
    const [userStatus] = await db.execute(
      'SELECT * FROM user_quote_status WHERE quote_id = 84'
    );
    
    console.log(`\n📊 User Quote Status: ${userStatus.length} found`);
    if (userStatus.length > 0) {
      userStatus.forEach((status, index) => {
        console.log(`   Status ${index + 1}:`);
        console.log(`     User ID: ${status.user_id}`);
        console.log(`     Company ID: ${status.company_id}`);
        console.log(`     Quote Response ID: ${status.quote_response_id}`);
        console.log(`     Response Status: ${status.response_status}`);
        console.log(`     Payment Proof ID: ${status.payment_proof_id}`);
        console.log(`     Payment Verification Status: ${status.payment_verification_status}`);
      });
    }

    // Check for business user trying to upload
    console.log('\n👤 Checking Business User Access:');
    const [businessUsers] = await db.execute(
      'SELECT id, name, email, role FROM users WHERE role = "business" AND email LIKE "%subodh%"'
    );
    
    if (businessUsers.length > 0) {
      const businessUser = businessUsers[0];
      console.log(`   Business User: ${businessUser.name} (${businessUser.email})`);
      console.log(`   User ID: ${businessUser.id}`);
      
      // Check if this business user has any payment proofs for quote 84
      const [businessPaymentProofs] = await db.execute(
        'SELECT * FROM payment_proofs WHERE quote_id = 84 AND user_id = ?',
        [businessUser.id]
      );
      
      console.log(`   Existing Payment Proofs for this user: ${businessPaymentProofs.length}`);
      
      if (businessPaymentProofs.length > 0) {
        console.log('\n🚨 FOUND THE ISSUE! This business user already has payment proofs:');
        businessPaymentProofs.forEach((proof, index) => {
          console.log(`     Proof ${index + 1}: Response ID ${proof.quote_response_id}, Company ${proof.company_id}`);
        });
      }
    }

    console.log('\n🔧 SOLUTION OPTIONS:');
    console.log('1. Delete existing payment proofs to allow new upload');
    console.log('2. Update the backend to allow re-uploading (already done)');
    console.log('3. Check if the user is trying to upload to a different company');

  } catch (error) {
    console.error('❌ Error debugging payment proof issue:', error);
  } finally {
    process.exit(0);
  }
};

debugPaymentProofIssue();