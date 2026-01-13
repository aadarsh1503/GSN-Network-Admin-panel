// Test script to verify the company quote responses access fix
// This simulates the SQL query logic to check access permissions

console.log('=== COMPANY QUOTE RESPONSES ACCESS FIX TEST ===');

// Simulate the access check query logic
function checkCompanyAccess(quoteId, companyId, mockData) {
    console.log(`\nChecking access for Company ${companyId} to Quote ${quoteId}:`);
    
    // Simulate the SQL query conditions
    const hasAccess = mockData.some(record => {
        const isTraditionalAccepted = record.user_response_status === 'accepted';
        const isApprovedWithVerifiedPayment = record.quote_status === 'approved' && record.payment_verification_status === 'verified';
        const isApprovedWithPaymentProof = record.quote_status === 'approved' && record.has_payment_proof;
        
        const hasAccess = isTraditionalAccepted || isApprovedWithVerifiedPayment || isApprovedWithPaymentProof;
        
        console.log(`  Record ${record.id}:`, {
            user_response_status: record.user_response_status,
            quote_status: record.quote_status,
            payment_verification_status: record.payment_verification_status,
            has_payment_proof: record.has_payment_proof,
            hasAccess: hasAccess
        });
        
        return hasAccess;
    });
    
    return hasAccess;
}

// Test Case 1: Traditional accepted quote
console.log('\n--- Test Case 1: Traditional Accepted Quote ---');
const testData1 = [
    {
        id: 1,
        quote_id: 62,
        company_id: 1,
        user_response_status: 'accepted',
        quote_status: 'pending',
        payment_verification_status: null,
        has_payment_proof: false
    }
];

const access1 = checkCompanyAccess(62, 1, testData1);
console.log(`Result: ${access1 ? '✅ ACCESS GRANTED' : '❌ ACCESS DENIED'}`);

// Test Case 2: Approved quote with verified payment (the problematic case)
console.log('\n--- Test Case 2: Approved Quote with Verified Payment ---');
const testData2 = [
    {
        id: 2,
        quote_id: 62,
        company_id: 1,
        user_response_status: 'pending', // User hasn't accepted, but payment was verified
        quote_status: 'approved',
        payment_verification_status: 'verified',
        has_payment_proof: true
    }
];

const access2 = checkCompanyAccess(62, 1, testData2);
console.log(`Result: ${access2 ? '✅ ACCESS GRANTED' : '❌ ACCESS DENIED'}`);

// Test Case 3: Approved quote with payment proof but not verified yet
console.log('\n--- Test Case 3: Approved Quote with Payment Proof (Not Verified) ---');
const testData3 = [
    {
        id: 3,
        quote_id: 62,
        company_id: 1,
        user_response_status: null,
        quote_status: 'approved',
        payment_verification_status: 'pending',
        has_payment_proof: true
    }
];

const access3 = checkCompanyAccess(62, 1, testData3);
console.log(`Result: ${access3 ? '✅ ACCESS GRANTED' : '❌ ACCESS DENIED'}`);

// Test Case 4: No access (should be denied)
console.log('\n--- Test Case 4: No Access (Should be Denied) ---');
const testData4 = [
    {
        id: 4,
        quote_id: 62,
        company_id: 1,
        user_response_status: 'pending',
        quote_status: 'pending',
        payment_verification_status: null,
        has_payment_proof: false
    }
];

const access4 = checkCompanyAccess(62, 1, testData4);
console.log(`Result: ${access4 ? '✅ ACCESS GRANTED' : '❌ ACCESS DENIED'}`);

console.log('\n=== SUMMARY ===');
console.log('The fix should allow access for:');
console.log('1. ✅ Traditional accepted quotes');
console.log('2. ✅ Approved quotes with verified payment');
console.log('3. ✅ Approved quotes with payment proof');
console.log('4. ❌ Quotes with no acceptance or approval');

console.log('\n=== SQL QUERY LOGIC ===');
console.log(`
SELECT qr.id
FROM quote_responses qr
LEFT JOIN user_quote_status uqs ON qr.id = uqs.quote_response_id
LEFT JOIN quotes q ON qr.quote_id = q.id
LEFT JOIN payment_proofs pp ON (uqs.payment_proof_id = pp.id AND pp.company_id = qr.company_id)
LEFT JOIN payment_verifications pv ON (pp.id = pv.payment_proof_id AND pv.company_id = qr.company_id)
WHERE qr.quote_id = ? AND qr.company_id = ?
AND (
    uqs.status = 'accepted'  -- Traditional acceptance
    OR (q.status = 'approved' AND pv.verification_status = 'verified')  -- Approved via payment verification
    OR (q.status = 'approved' AND pp.company_id = qr.company_id)  -- Approved with payment proof
)
`);

console.log('\n=== TESTING INSTRUCTIONS ===');
console.log('1. Go to http://localhost:5173/company/my-quotes');
console.log('2. Click "View Details" on an approved quote');
console.log('3. Should now work without 403 error');
console.log('4. Check browser console for any remaining errors');