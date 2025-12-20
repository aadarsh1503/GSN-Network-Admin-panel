-- =====================================================
-- COMPREHENSIVE MEMBERSHIP PLANS DATA
-- =====================================================
-- Run these SQL queries to populate your membership_plans table with comprehensive data

-- First, clear existing data (optional - remove if you want to keep existing plans)
-- DELETE FROM user_subscriptions; -- Clear subscriptions first due to foreign key
-- DELETE FROM membership_plans; -- Clear existing plans

-- Reset auto increment (optional)
-- ALTER TABLE membership_plans AUTO_INCREMENT = 1;

-- =====================================================
-- INSERT COMPREHENSIVE MEMBERSHIP PLANS
-- =====================================================

INSERT INTO `membership_plans` (
    `id`, 
    `name`, 
    `description`, 
    `price`, 
    `duration_months`, 
    `features`, 
    `max_quotes`, 
    `max_responses`, 
    `directory_listing`, 
    `priority_support`, 
    `is_active`, 
    `created_at`
) VALUES 

-- =====================================================
-- 1. GUEST PLAN (Free)
-- =====================================================
(1, 
'Guest', 
'Free basic access for new users to explore the platform', 
0.00, 
0, 
'["Browse company directory", "View company profiles", "Submit up to 5 quote requests", "Basic email support", "Access to help documentation", "Mobile app access"]', 
5, 
0, 
0, 
0, 
1, 
NOW()),

-- =====================================================
-- 2. STARTER PLAN (Small businesses)
-- =====================================================
(2, 
'Starter', 
'Perfect for small businesses and individual entrepreneurs', 
29.99, 
1, 
'["Basic directory listing", "Unlimited quote submissions", "15 quote responses per month", "Email support", "Basic analytics dashboard", "Mobile app access", "Quote tracking", "Company profile customization"]', 
-1, 
15, 
1, 
0, 
1, 
NOW()),

-- =====================================================
-- 3. BASIC PLAN (Growing businesses)
-- =====================================================
(3, 
'Basic', 
'Essential features for growing businesses with moderate volume', 
49.99, 
1, 
'["Enhanced directory listing", "Unlimited quote submissions", "50 quote responses per month", "Priority email support", "Advanced analytics dashboard", "Mobile app access", "Quote tracking & management", "Company profile with gallery", "Customer review management", "Basic API access"]', 
-1, 
50, 
1, 
0, 
1, 
NOW()),

-- =====================================================
-- 4. PROFESSIONAL PLAN (Established businesses)
-- =====================================================
(4, 
'Professional', 
'Advanced features for established businesses with high volume', 
99.99, 
1, 
'["Premium directory listing", "Unlimited quote submissions", "150 quote responses per month", "Priority phone & email support", "Advanced analytics & reporting", "Mobile app access", "Quote automation tools", "Enhanced company profile", "Customer review management", "Full API access", "Integration support", "Custom branding options"]', 
-1, 
150, 
1, 
1, 
1, 
NOW()),

-- =====================================================
-- 5. ENTERPRISE PLAN (Large organizations)
-- =====================================================
(5, 
'Enterprise', 
'Complete solution for large organizations and enterprises', 
199.99, 
1, 
'["Featured directory listing", "Unlimited quote submissions", "Unlimited quote responses", "24/7 priority support", "Dedicated account manager", "Advanced analytics & custom reports", "Mobile app access", "Quote automation & AI tools", "Premium company profile", "Review management system", "Full API access", "Custom integrations", "White-label options", "Multi-location support", "Team collaboration tools"]', 
-1, 
-1, 
1, 
1, 
1, 
NOW()),

-- =====================================================
-- 6. QUARTERLY STARTER (3-month discount)
-- =====================================================
(6, 
'Starter Quarterly', 
'3-month Starter plan with 10% discount', 
80.97, 
3, 
'["Basic directory listing", "Unlimited quote submissions", "15 quote responses per month", "Email support", "Basic analytics dashboard", "Mobile app access", "Quote tracking", "Company profile customization", "3-month commitment discount"]', 
-1, 
15, 
1, 
0, 
1, 
NOW()),

-- =====================================================
-- 7. QUARTERLY BASIC (3-month discount)
-- =====================================================
(7, 
'Basic Quarterly', 
'3-month Basic plan with 10% discount', 
134.97, 
3, 
'["Enhanced directory listing", "Unlimited quote submissions", "50 quote responses per month", "Priority email support", "Advanced analytics dashboard", "Mobile app access", "Quote tracking & management", "Company profile with gallery", "Customer review management", "Basic API access", "3-month commitment discount"]', 
-1, 
50, 
1, 
0, 
1, 
NOW()),

-- =====================================================
-- 8. ANNUAL STARTER (12-month discount)
-- =====================================================
(8, 
'Starter Annual', 
'12-month Starter plan with 20% discount', 
287.90, 
12, 
'["Basic directory listing", "Unlimited quote submissions", "15 quote responses per month", "Email support", "Basic analytics dashboard", "Mobile app access", "Quote tracking", "Company profile customization", "12-month commitment discount", "Priority feature updates"]', 
-1, 
15, 
1, 
0, 
1, 
NOW()),

-- =====================================================
-- 9. ANNUAL BASIC (12-month discount)
-- =====================================================
(9, 
'Basic Annual', 
'12-month Basic plan with 20% discount', 
479.90, 
12, 
'["Enhanced directory listing", "Unlimited quote submissions", "50 quote responses per month", "Priority email support", "Advanced analytics dashboard", "Mobile app access", "Quote tracking & management", "Company profile with gallery", "Customer review management", "Basic API access", "12-month commitment discount", "Priority feature updates"]', 
-1, 
50, 
1, 
0, 
1, 
NOW()),

-- =====================================================
-- 10. ANNUAL PROFESSIONAL (12-month discount)
-- =====================================================
(10, 
'Professional Annual', 
'12-month Professional plan with 20% discount', 
959.90, 
12, 
'["Premium directory listing", "Unlimited quote submissions", "150 quote responses per month", "Priority phone & email support", "Advanced analytics & reporting", "Mobile app access", "Quote automation tools", "Enhanced company profile", "Customer review management", "Full API access", "Integration support", "Custom branding options", "12-month commitment discount", "Priority feature updates", "Quarterly business reviews"]', 
-1, 
150, 
1, 
1, 
1, 
NOW()),

-- =====================================================
-- 11. TRIAL PLAN (7-day free trial)
-- =====================================================
(11, 
'Professional Trial', 
'7-day free trial of Professional features', 
0.00, 
0, 
'["Premium directory listing", "Unlimited quote submissions", "150 quote responses", "Priority support", "Advanced analytics", "Mobile app access", "Quote automation tools", "Enhanced company profile", "7-day trial period", "No commitment required"]', 
-1, 
150, 
1, 
1, 
1, 
NOW()),

-- =====================================================
-- 12. CUSTOM ENTERPRISE (Contact for pricing)
-- =====================================================
(12, 
'Custom Enterprise', 
'Tailored solution for large enterprises with custom requirements', 
0.00, 
12, 
'["Custom directory placement", "Unlimited everything", "Dedicated infrastructure", "24/7 white-glove support", "Custom development", "On-premise deployment options", "Advanced security features", "Custom integrations", "Dedicated success manager", "SLA guarantees", "Custom reporting", "Multi-tenant support", "Contact for pricing"]', 
-1, 
-1, 
1, 
1, 
0, 
NOW());

-- =====================================================
-- UPDATE EXISTING PLANS (if they exist)
-- =====================================================
-- If you want to update existing plans instead of inserting new ones, use these queries:

/*
UPDATE membership_plans SET 
    description = 'Free basic access for new users to explore the platform',
    features = '["Browse company directory", "View company profiles", "Submit up to 5 quote requests", "Basic email support", "Access to help documentation", "Mobile app access"]'
WHERE id = 1;

UPDATE membership_plans SET 
    name = 'Starter',
    description = 'Perfect for small businesses and individual entrepreneurs',
    price = 29.99,
    features = '["Basic directory listing", "Unlimited quote submissions", "15 quote responses per month", "Email support", "Basic analytics dashboard", "Mobile app access", "Quote tracking", "Company profile customization"]',
    max_responses = 15
WHERE id = 2;

UPDATE membership_plans SET 
    description = 'Essential features for growing businesses with moderate volume',
    features = '["Enhanced directory listing", "Unlimited quote submissions", "50 quote responses per month", "Priority email support", "Advanced analytics dashboard", "Mobile app access", "Quote tracking & management", "Company profile with gallery", "Customer review management", "Basic API access"]'
WHERE id = 3;

UPDATE membership_plans SET 
    description = 'Complete solution for large organizations and enterprises',
    features = '["Featured directory listing", "Unlimited quote submissions", "Unlimited quote responses", "24/7 priority support", "Dedicated account manager", "Advanced analytics & custom reports", "Mobile app access", "Quote automation & AI tools", "Premium company profile", "Review management system", "Full API access", "Custom integrations", "White-label options", "Multi-location support", "Team collaboration tools"]'
WHERE id = 4;
*/

-- =====================================================
-- VERIFY THE DATA
-- =====================================================
-- Run this query to see all plans:
-- SELECT id, name, price, duration_months, max_responses, is_active FROM membership_plans ORDER BY price ASC;

-- =====================================================
-- SAMPLE USER SUBSCRIPTIONS (Optional)
-- =====================================================
-- Add some sample subscriptions for testing:

/*
INSERT INTO user_subscriptions (user_id, plan_id, start_date, end_date, status, payment_status, amount_paid) VALUES
(2, 3, '2024-12-01', '2025-01-01', 'active', 'paid', 49.99),
(3, 4, '2024-11-15', '2024-12-15', 'active', 'paid', 99.99),
(4, 2, '2024-12-10', '2025-01-10', 'active', 'paid', 29.99);
*/

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. All plans are set to active (is_active = 1)
-- 2. Features are stored as JSON arrays
-- 3. -1 means unlimited for max_quotes and max_responses
-- 4. Prices include monthly, quarterly, and annual options
-- 5. Trial plans are included for marketing purposes
-- 6. Custom Enterprise plan for large clients
-- 7. Directory listing and priority support flags are set appropriately
-- 8. Created timestamps are set to NOW()

-- =====================================================
-- ADMIN MANAGEMENT:
-- =====================================================
-- Admins can now:
-- 1. View all plans at: /admin/manage-Subscription
-- 2. Create new plans at: /admin/create-Subscription
-- 3. Edit existing plans (click edit button)
-- 4. Activate/deactivate plans (toggle button)
-- 5. Delete plans (deactivate button)

-- =====================================================
-- USER EXPERIENCE:
-- =====================================================
-- Users can now:
-- 1. View available plans at: /subscriptions
-- 2. See their current subscription status
-- 3. Upgrade/downgrade plans
-- 4. View plan features and pricing
-- 5. Activate subscriptions (simplified payment for now)