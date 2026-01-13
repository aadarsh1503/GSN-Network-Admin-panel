const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gsn_network',
  port: process.env.DB_PORT || 3306
};

async function debugQuote93RejectionReason() {
  let connection;
  
  try {
    console.log('🔍 Debugging Quote #93 Rejection Reason...\n');
    
    connection = await mysql.createConnection(dbConfig);
    
    // First, let's check the quote details
    console.log('📋 Quote #93 Details:');
    const [quoteDetails] = await connection.execute(
      'SELECT * FROM quotes WHERE id = 93'
    );
    console.log(quoteDetails[0]);
    
    // Check quote responses
    console.log('\n📝 Quote Responses for Quote #93:');
    const [responses] = await connection.execute(
      'SELECT * FROM quote_responses WHERE quote_id = 93'
    );
    console.log(responses);
    
    // Check user quote status
    console.log('\n👤 User Quote Status:');
    const [userStatus] = await connection.execute(
      'SELECT * FROM user_quote_status WHERE quote_response_id IN (SELECT id FROM quote_responses WHERE quote_id = 93)'
    );
    console.log(userStatus);
    
    // Check payment proofs
    console.log('\n💳 Payment Proofs:');
    const [paymentProofs] = await connection.execute(`
      SELECT pp.*, uqs.quote_response_id 
      FROM payment_proofs pp
      JOIN user_quote_status uqs ON pp.id = uqs.payment_proof_id
      WHERE uqs.quote_response_id IN (SELECT id FROM quote_responses WHERE quote_id = 93)
    `);
    console.log(paymentProofs);
    
    // Check payment verifications (this is where rejection reason should be)
    console.log('\n🔍 Payment Verifications (Rejection Reasons):');
    const [verifications] = await connection.execute(`
      SELECT pv.*, pp.id as payment_proof_id, uqs.quote_response_id
      FROM payment_verifications pv
      JOIN payment_proofs pp ON pv.payment_proof_id = pp.id
      JOIN user_quote_status uqs ON pp.id = uqs.payment_proof_id
      WHERE uqs.quote_response_id IN (SELECT id FROM quote_responses WHERE quote_id = 93)
    `);
    console.log('Payment Verifications:', verifications);
    
    // Now let's run the exact same query that the API uses
    console.log('\n🚀 API Query Result (Enhanced Quote Controller):');
    const userId = quoteDetails[0]?.user_id;
    
    if (userId) {
      const [apiResult] = await connection.execute(`
        SELECT qr.*, 
               u.name as company_name, 
               u.email as company_email,
               u.phone as company_phone,
               u.logo as company_logo,
               cbd.bank_name,
               cbd.branch_name,
               cbd.branch_address,
               cbd.ifsc_code,
               cbd.account_number,
               cbd.account_holder_name,
               cbd.iban_number,
               cbd.swift_code,
               cbd.routing_number,
               cbd.payment_instructions as bank_instructions,
               uqs.status as user_response_status,
               uqs.accepted_at,
               uqs.rejected_at,
               uqs.payment_verification_status,
               pp.file_name as payment_proof_file,
               pp.upload_date as payment_proof_date,
               pp.file_path as payment_proof_url,
               CASE WHEN pp.id IS NOT NULL THEN 1 ELSE 0 END as payment_proof_uploaded,
               pv.verification_status as payment_status,
               pv.verification_date,
               pv.company_notes as payment_company_notes,
               CASE WHEN pv.verification_status = 'rejected' THEN pv.verification_date ELSE NULL END as rejection_date
        FROM quote_responses qr
        JOIN users u ON qr.company_id = u.id
        LEFT JOIN quote_response_bank_details qrbd ON qr.id = qrbd.quote_response_id
        LEFT JOIN company_bank_details cbd ON qrbd.company_bank_details_id = cbd.id
        LEFT JOIN user_quote_status uqs ON (qr.id = uqs.quote_response_id AND uqs.user_id = ?)
        LEFT JOIN payment_proofs pp ON uqs.payment_proof_id = pp.id
        LEFT JOIN payment_verifications pv ON pp.id = pv.payment_proof_id
        WHERE qr.quote_id = ?
        ORDER BY qr.created_at DESC
      `, [userId, 93]);
      
      console.log('API Result:', JSON.stringify(apiResult, null, 2));
      
      // Focus on the rejection reason specifically
      apiResult.forEach((response, index) => {
        console.log(`\n📋 Response ${index + 1}:`);
        console.log(`Company: ${response.company_name}`);
        console.log(`Payment Status: ${response.payment_status}`);
        console.log(`Payment Company Notes: ${response.payment_company_notes}`);
        console.log(`Rejection Date: ${response.rejection_date}`);
        console.log(`User Response Status: ${response.user_response_status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugQuote93RejectionReason();