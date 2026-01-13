-- Check payment proof related tables and data for Quote 84

-- 1. Check if payment_proofs table exists and its structure
DESCRIBE payment_proofs;

-- 2. Check existing payment proofs for quote 84
SELECT * FROM payment_proofs WHERE quote_id = 84;

-- 3. Check payment verifications for quote 84
SELECT * FROM payment_verifications WHERE quote_id = 84;

-- 4. Check user quote status for quote 84
SELECT * FROM user_quote_status WHERE quote_id = 84;

-- 5. Check quote responses for quote 84
SELECT * FROM quote_responses WHERE quote_id = 84;

-- 6. Check if there are any foreign key constraint issues
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_NAME IN ('payment_proofs', 'payment_verifications', 'user_quote_status')
   OR TABLE_NAME IN ('payment_proofs', 'payment_verifications', 'user_quote_status');

-- 7. If you need to clean up existing data (UNCOMMENT ONLY IF NEEDED):
-- DELETE FROM payment_verifications WHERE quote_id = 84;
-- DELETE FROM payment_proofs WHERE quote_id = 84;
-- UPDATE user_quote_status SET payment_proof_id = NULL, payment_verification_status = NULL WHERE quote_id = 84;