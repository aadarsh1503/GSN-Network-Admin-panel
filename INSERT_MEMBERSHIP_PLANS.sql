-- =====================================================
-- SIMPLE INSERT QUERIES FOR MEMBERSHIP PLANS
-- Copy and paste these queries directly into your MySQL/phpMyAdmin
-- =====================================================

-- Clear existing plans (OPTIONAL - only if you want to start fresh)
-- DELETE FROM user_subscriptions;
-- DELETE FROM membership_plans;
-- ALTER TABLE membership_plans AUTO_INCREMENT = 1;

-- =====================================================
-- INSERT MEMBERSHIP PLANS
-- =====================================================

INSERT INTO `membership_plans` (`id`, `name`, `description`, `price`, `duration_months`, `features`, `max_quotes`, `max_responses`, `directory_listing`, `priority_support`, `is_active`) VALUES
(1, 'Guest', 'Free basic access for new users to explore the platform', 0.00, 0, '["Browse company directory", "View company profiles", "Submit up to 5 quote requests", "Basic email support", "Access to help documentation", "Mobile app access"]', 5, 0, 0, 0, 1),
(2, 'Starter', 'Perfect for small businesses and individual entrepreneurs', 29.99, 1, '["Basic directory listing", "Unlimited quote submissions", "15 quote responses per month", "Email support", "Basic analytics dashboard", "Mobile app access", "Quote tracking", "Company profile customization"]', -1, 15, 1, 0, 1),
(3, 'Basic', 'Essential features for growing businesses with moderate volume', 49.99, 1, '["Enhanced directory listing", "Unlimited quote submissions", "50 quote responses per month", "Priority email support", "Advanced analytics dashboard", "Mobile app access", "Quote tracking & management", "Company profile with gallery", "Customer review management", "Basic API access"]', -1, 50, 1, 0, 1),
(4, 'Professional', 'Advanced features for established businesses with high volume', 99.99, 1, '["Premium directory listing", "Unlimited quote submissions", "150 quote responses per month", "Priority phone & email support", "Advanced analytics & reporting", "Mobile app access", "Quote automation tools", "Enhanced company profile", "Customer review management", "Full API access", "Integration support", "Custom branding options"]', -1, 150, 1, 1, 1),
(5, 'Enterprise', 'Complete solution for large organizations and enterprises', 199.99, 1, '["Featured directory listing", "Unlimited quote submissions", "Unlimited quote responses", "24/7 priority support", "Dedicated account manager", "Advanced analytics & custom reports", "Mobile app access", "Quote automation & AI tools", "Premium company profile", "Review management system", "Full API access", "Custom integrations", "White-label options", "Multi-location support", "Team collaboration tools"]', -1, -1, 1, 1, 1),
(6, 'Starter Quarterly', '3-month Starter plan with 10% discount', 80.97, 3, '["Basic directory listing", "Unlimited quote submissions", "15 quote responses per month", "Email support", "Basic analytics dashboard", "Mobile app access", "Quote tracking", "Company profile customization", "3-month commitment discount"]', -1, 15, 1, 0, 1),
(7, 'Basic Quarterly', '3-month Basic plan with 10% discount', 134.97, 3, '["Enhanced directory listing", "Unlimited quote submissions", "50 quote responses per month", "Priority email support", "Advanced analytics dashboard", "Mobile app access", "Quote tracking & management", "Company profile with gallery", "Customer review management", "Basic API access", "3-month commitment discount"]', -1, 50, 1, 0, 1),
(8, 'Starter Annual', '12-month Starter plan with 20% discount', 287.90, 12, '["Basic directory listing", "Unlimited quote submissions", "15 quote responses per month", "Email support", "Basic analytics dashboard", "Mobile app access", "Quote tracking", "Company profile customization", "12-month commitment discount", "Priority feature updates"]', -1, 15, 1, 0, 1),
(9, 'Basic Annual', '12-month Basic plan with 20% discount', 479.90, 12, '["Enhanced directory listing", "Unlimited quote submissions", "50 quote responses per month", "Priority email support", "Advanced analytics dashboard", "Mobile app access", "Quote tracking & management", "Company profile with gallery", "Customer review management", "Basic API access", "12-month commitment discount", "Priority feature updates"]', -1, 50, 1, 0, 1),
(10, 'Professional Annual', '12-month Professional plan with 20% discount', 959.90, 12, '["Premium directory listing", "Unlimited quote submissions", "150 quote responses per month", "Priority phone & email support", "Advanced analytics & reporting", "Mobile app access", "Quote automation tools", "Enhanced company profile", "Customer review management", "Full API access", "Integration support", "Custom branding options", "12-month commitment discount", "Priority feature updates", "Quarterly business reviews"]', -1, 150, 1, 1, 1),
(11, 'Professional Trial', '7-day free trial of Professional features', 0.00, 0, '["Premium directory listing", "Unlimited quote submissions", "150 quote responses", "Priority support", "Advanced analytics", "Mobile app access", "Quote automation tools", "Enhanced company profile", "7-day trial period", "No commitment required"]', -1, 150, 1, 1, 1),
(12, 'Custom Enterprise', 'Tailored solution for large enterprises with custom requirements', 0.00, 12, '["Custom directory placement", "Unlimited everything", "Dedicated infrastructure", "24/7 white-glove support", "Custom development", "On-premise deployment options", "Advanced security features", "Custom integrations", "Dedicated success manager", "SLA guarantees", "Custom reporting", "Multi-tenant support", "Contact for pricing"]', -1, -1, 1, 1, 0);

-- =====================================================
-- VERIFY THE DATA
-- =====================================================
SELECT id, name, price, duration_months, max_responses, is_active FROM membership_plans ORDER BY price ASC;