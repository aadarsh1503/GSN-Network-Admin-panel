-- SQL Script to update existing quotes with verified payments to approved status
-- Run this script in your MySQL database

-- First, let's see current status of quotes with verified payments
SELECT 
    q.id as quote_id,
    q.status as current_quote_status,
    pv.verification_status,
    pv.verification_date,
    u.name as customer_name,
    c.name as company_name
FROM quotes q
JOIN payment_verifications pv ON q.id = pv.quote_id
JOIN users u ON q.user_id = u.id
JOIN users c ON pv.company_id = c.id
WHERE pv.verification_status = 'verified'
ORDER BY pv.verification_date DESC;

-- Update quotes with verified payments to approved status
UPDATE quotes q
JOIN payment_verifications pv ON q.id = pv.quote_id
SET q.status = 'approved'
WHERE pv.verification_status = 'verified' 
AND q.status != 'approved';

-- Update user_quote_status table to ensure payment verification status is correct
UPDATE user_quote_status uqs
JOIN payment_verifications pv ON uqs.quote_id = pv.quote_id AND uqs.user_id = pv.user_id
SET uqs.payment_verification_status = 'verified'
WHERE pv.verification_status = 'verified'
AND uqs.status = 'accepted';

-- Verify the updates
SELECT 
    q.id as quote_id,
    q.status as updated_quote_status,
    pv.verification_status,
    pv.verification_date,
    u.name as customer_name,
    c.name as company_name
FROM quotes q
JOIN payment_verifications pv ON q.id = pv.quote_id
JOIN users u ON q.user_id = u.id
JOIN users c ON pv.company_id = c.id
WHERE pv.verification_status = 'verified'
ORDER BY pv.verification_date DESC;

-- Show summary of changes
SELECT 
    COUNT(*) as total_verified_quotes,
    SUM(CASE WHEN q.status = 'approved' THEN 1 ELSE 0 END) as approved_quotes,
    SUM(CASE WHEN q.status != 'approved' THEN 1 ELSE 0 END) as non_approved_quotes
FROM quotes q
JOIN payment_verifications pv ON q.id = pv.quote_id
WHERE pv.verification_status = 'verified';