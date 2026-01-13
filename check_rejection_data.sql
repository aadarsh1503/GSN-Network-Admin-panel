-- SQL script to check rejection reason data for existing quotes
-- Run this in your MySQL database to understand why rejection reasons might not show

-- 1. Check if Quote #92 exists
SELECT 'Quote #92 Status' as check_type, 
       q.id, q.status, q.user_id, u.name as user_name, u.email
FROM quotes q 
JOIN users u ON q.user_id = u.id 
WHERE q.id = 92;

-- 2. Check quote responses for Quote #92
SELECT 'Quote #92 Responses' as check_type,
       qr.id as response_id, qr.company_id, qr.price, 
       c.name as company_name, qr.created_at
FROM quote_responses qr
JOIN users c ON qr.company_id = c.id
WHERE qr.quote_id = 92
ORDER BY qr.created_at DESC;

-- 3. Check user quote status for Quote #92
SELECT 'User Quote Status' as check_type,
       uqs.*, qr.company_id, c.name as company_name
FROM user_quote_status uqs
JOIN quote_responses qr ON uqs.quote_response_id = qr.id
JOIN users c ON qr.company_id = c.id
WHERE uqs.quote_id = 92;

-- 4. Check payment proofs for Quote #92
SELECT 'Payment Proofs' as check_type,
       pp.id, pp.quote_id, pp.user_id, pp.company_id, 
       pp.file_name, pp.upload_date, pp.notes
FROM payment_proofs pp
WHERE pp.quote_id = 92;

-- 5. Check payment verifications for Quote #92
SELECT 'Payment Verifications' as check_type,
       pv.id, pv.quote_id, pv.user_id, pv.company_id,
       pv.verification_status, pv.company_notes, pv.verification_date,
       c.name as company_name
FROM payment_verifications pv
JOIN users c ON pv.company_id = c.id
WHERE pv.quote_id = 92;

-- 6. Check for rejected payments system-wide (to see if any exist)
SELECT 'All Rejected Payments' as check_type,
       pv.id, pv.quote_id, pv.verification_status, 
       pv.company_notes, pv.verification_date,
       c.name as company_name, u.name as user_name
FROM payment_verifications pv
JOIN users c ON pv.company_id = c.id
JOIN users u ON pv.user_id = u.id
WHERE pv.verification_status = 'rejected'
ORDER BY pv.verification_date DESC
LIMIT 10;

-- 7. Check for quotes with rejected status
SELECT 'Rejected Status Quotes' as check_type,
       q.id, q.status, q.created_at, u.name as user_name
FROM quotes q
JOIN users u ON q.user_id = u.id
WHERE q.status = 'rejected'
ORDER BY q.updated_at DESC
LIMIT 10;

-- 8. Full data check for Quote #92 (simulating the API call)
SELECT 'Full API Simulation' as check_type,
       qr.id as response_id,
       qr.company_id,
       qr.price,
       c.name as company_name,
       uqs.status as user_response_status,
       uqs.accepted_at,
       pp.id as payment_proof_id,
       pp.file_path as payment_proof_url,
       CASE WHEN pp.id IS NOT NULL THEN 1 ELSE 0 END as payment_proof_uploaded,
       pv.verification_status as payment_status,
       pv.verification_date,
       pv.company_notes as payment_company_notes,
       CASE WHEN pv.verification_status = 'rejected' THEN pv.verification_date ELSE NULL END as rejection_date
FROM quote_responses qr
JOIN users c ON qr.company_id = c.id
LEFT JOIN user_quote_status uqs ON qr.id = uqs.quote_response_id
LEFT JOIN payment_proofs pp ON uqs.payment_proof_id = pp.id
LEFT JOIN payment_verifications pv ON pp.id = pv.payment_proof_id
WHERE qr.quote_id = 92
ORDER BY qr.created_at DESC;

-- 9. Check for data inconsistencies
SELECT 'Data Inconsistencies' as check_type,
       'Quotes with rejected status but no payment verification' as issue,
       COUNT(*) as count
FROM quotes q
WHERE q.status = 'rejected' 
AND NOT EXISTS (
    SELECT 1 FROM payment_verifications pv 
    WHERE pv.quote_id = q.id AND pv.verification_status = 'rejected'
)

UNION ALL

SELECT 'Data Inconsistencies' as check_type,
       'Rejected payments without reasons' as issue,
       COUNT(*) as count
FROM payment_verifications pv
WHERE pv.verification_status = 'rejected'
AND (pv.company_notes IS NULL OR pv.company_notes = '')

UNION ALL

SELECT 'Data Inconsistencies' as check_type,
       'Payment verifications without payment proofs' as issue,
       COUNT(*) as count
FROM payment_verifications pv
WHERE NOT EXISTS (
    SELECT 1 FROM payment_proofs pp WHERE pp.id = pv.payment_proof_id
);

-- 10. Summary statistics
SELECT 'Summary Statistics' as check_type,
       'Total Quotes' as metric,
       COUNT(*) as value
FROM quotes

UNION ALL

SELECT 'Summary Statistics' as check_type,
       'Total Quote Responses' as metric,
       COUNT(*) as value
FROM quote_responses

UNION ALL

SELECT 'Summary Statistics' as check_type,
       'Total Payment Proofs' as metric,
       COUNT(*) as value
FROM payment_proofs

UNION ALL

SELECT 'Summary Statistics' as check_type,
       'Total Payment Verifications' as metric,
       COUNT(*) as value
FROM payment_verifications

UNION ALL

SELECT 'Summary Statistics' as check_type,
       'Rejected Payments' as metric,
       COUNT(*) as value
FROM payment_verifications
WHERE verification_status = 'rejected'

UNION ALL

SELECT 'Summary Statistics' as check_type,
       'Rejected Payments with Reasons' as metric,
       COUNT(*) as value
FROM payment_verifications
WHERE verification_status = 'rejected'
AND company_notes IS NOT NULL 
AND company_notes != '';