// Cleanup script to remove payment proof data for quote 84 if needed
import db from './server/config/db.js';

const cleanupPaymentProofQuote84 = async () => {
  console.log('🧹 Cleanup Payment Proof Data for Quote 84');
  console.log('===========================================');

  try {
    // First, let's see what we have
    const [paymentProofs] = await db.execute(
      'SELECT * FROM payment_proofs WHERE quote_id = 84'
    );
    
    const [verifications] = await db.execute(
      'SELECT * FROM payment_verifications WHERE quote_id = 84'
    );
    
    const [userStatus] = await db.execute(
      'SELECT * FROM user_quote_status WHERE quote_id = 84'
    );

    console.log(`\n📊 Current Data:`)
    console.log(`   Payment Proofs: ${paymentProofs.length}`);
    console.log(`   Payment Verifications: ${verifications.length}`);
    console.log(`   User Quote Status: ${userStatus.length}`);

    if (paymentProofs.length === 0 && verifications.length === 0 && userStatus.length === 0) {
      console.log('\n✅ No payment proof data found for quote 84. Nothing to clean up.');
      return;
    }

    console.log('\n⚠️  WARNING: This will delete all payment proof data for quote 84!');
    console.log('This includes:');
    console.log('- Payment proof files and records');
    console.log('- Payment verification records');
    console.log('- User quote status records related to payment');
    console.log('\nTo proceed, uncomment the cleanup code below and run again.');

    // UNCOMMENT THE FOLLOWING LINES TO ACTUALLY PERFORM THE CLEANUP
    /*
    console.log('\n🗑️  Starting cleanup...');
    
    // Delete payment verifications first (foreign key constraint)
    if (verifications.length > 0) {
      await db.execute('DELETE FROM payment_verifications WHERE quote_id = 84');
      console.log(`✅ Deleted ${verifications.length} payment verification records`);
    }
    
    // Delete payment proofs
    if (paymentProofs.length > 0) {
      await db.execute('DELETE FROM payment_proofs WHERE quote_id = 84');
      console.log(`✅ Deleted ${paymentProofs.length} payment proof records`);
    }
    
    // Reset user quote status payment-related fields
    if (userStatus.length > 0) {
      await db.execute(
        'UPDATE user_quote_status SET payment_proof_id = NULL, payment_verification_status = NULL WHERE quote_id = 84'
      );
      console.log(`✅ Reset payment fields in ${userStatus.length} user quote status records`);
    }
    
    console.log('\n🎉 Cleanup completed successfully!');
    console.log('You can now try uploading payment proof again.');
    */

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    process.exit(0);
  }
};

cleanupPaymentProofQuote84();