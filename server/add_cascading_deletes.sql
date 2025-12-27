-- Add proper cascading delete constraints for all user-related data
-- This ensures when a user is deleted, all their related data is automatically deleted

-- First, let's check existing foreign keys and drop them if they don't have CASCADE
-- Then add proper CASCADE constraints

-- ==================== TRANSACTIONS TABLE ====================
-- Drop existing foreign key constraints if they exist
ALTER TABLE transactions DROP FOREIGN KEY IF EXISTS transactions_ibfk_1;
ALTER TABLE transactions DROP FOREIGN KEY IF EXISTS transactions_ibfk_2;
ALTER TABLE transactions DROP FOREIGN KEY IF EXISTS transactions_ibfk_3;
ALTER TABLE transactions DROP FOREIGN KEY IF EXISTS transactions_ibfk_4;
ALTER TABLE transactions DROP FOREIGN KEY IF EXISTS fk_transactions_user_id;
ALTER TABLE transactions DROP FOREIGN KEY IF EXISTS fk_transactions_company_id;
ALTER TABLE transactions DROP FOREIGN KEY IF EXISTS fk_transactions_quote_response_id;
ALTER TABLE transactions DROP FOREIGN KEY IF EXISTS fk_transactions_subscription_id;

-- Add proper CASCADE constraints for transactions
ALTER TABLE transactions 
ADD CONSTRAINT fk_transactions_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE transactions 
ADD CONSTRAINT fk_transactions_company_id 
FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE transactions 
ADD CONSTRAINT fk_transactions_quote_response_id 
FOREIGN KEY (quote_response_id) REFERENCES quote_responses(id) ON DELETE CASCADE;

-- For subscription_id, we need to check if user_subscriptions table exists
ALTER TABLE transactions 
ADD CONSTRAINT fk_transactions_subscription_id 
FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id) ON DELETE CASCADE;

-- ==================== USER_SUBSCRIPTIONS TABLE ====================
-- Drop existing foreign key constraints if they exist
ALTER TABLE user_subscriptions DROP FOREIGN KEY IF EXISTS user_subscriptions_ibfk_1;
ALTER TABLE user_subscriptions DROP FOREIGN KEY IF EXISTS user_subscriptions_ibfk_2;
ALTER TABLE user_subscriptions DROP FOREIGN KEY IF EXISTS fk_user_subscriptions_user_id;
ALTER TABLE user_subscriptions DROP FOREIGN KEY IF EXISTS fk_user_subscriptions_plan_id;

-- Add proper CASCADE constraints for user_subscriptions
ALTER TABLE user_subscriptions 
ADD CONSTRAINT fk_user_subscriptions_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_subscriptions 
ADD CONSTRAINT fk_user_subscriptions_plan_id 
FOREIGN KEY (plan_id) REFERENCES membership_plans(id) ON DELETE RESTRICT;

-- ==================== QUOTES TABLE ====================
-- This should already have CASCADE, but let's ensure it
ALTER TABLE quotes DROP FOREIGN KEY IF EXISTS quotes_ibfk_1;
ALTER TABLE quotes DROP FOREIGN KEY IF EXISTS fk_quotes_user_id;

ALTER TABLE quotes 
ADD CONSTRAINT fk_quotes_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ==================== QUOTE_RESPONSES TABLE ====================
-- This should already have CASCADE, but let's ensure it
ALTER TABLE quote_responses DROP FOREIGN KEY IF EXISTS quote_responses_ibfk_1;
ALTER TABLE quote_responses DROP FOREIGN KEY IF EXISTS quote_responses_ibfk_2;
ALTER TABLE quote_responses DROP FOREIGN KEY IF EXISTS fk_quote_responses_quote_id;
ALTER TABLE quote_responses DROP FOREIGN KEY IF EXISTS fk_quote_responses_company_id;

ALTER TABLE quote_responses 
ADD CONSTRAINT fk_quote_responses_quote_id 
FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE;

ALTER TABLE quote_responses 
ADD CONSTRAINT fk_quote_responses_company_id 
FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE;

-- ==================== USER_QUOTE_STATUS TABLE ====================
ALTER TABLE user_quote_status DROP FOREIGN KEY IF EXISTS user_quote_status_ibfk_1;
ALTER TABLE user_quote_status DROP FOREIGN KEY IF EXISTS user_quote_status_ibfk_2;
ALTER TABLE user_quote_status DROP FOREIGN KEY IF EXISTS user_quote_status_ibfk_3;
ALTER TABLE user_quote_status DROP FOREIGN KEY IF EXISTS user_quote_status_ibfk_4;
ALTER TABLE user_quote_status DROP FOREIGN KEY IF EXISTS fk_user_quote_status_quote_id;
ALTER TABLE user_quote_status DROP FOREIGN KEY IF EXISTS fk_user_quote_status_user_id;
ALTER TABLE user_quote_status DROP FOREIGN KEY IF EXISTS fk_user_quote_status_company_id;
ALTER TABLE user_quote_status DROP FOREIGN KEY IF EXISTS fk_user_quote_status_quote_response_id;

ALTER TABLE user_quote_status 
ADD CONSTRAINT fk_user_quote_status_quote_id 
FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE;

ALTER TABLE user_quote_status 
ADD CONSTRAINT fk_user_quote_status_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_quote_status 
ADD CONSTRAINT fk_user_quote_status_company_id 
FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_quote_status 
ADD CONSTRAINT fk_user_quote_status_quote_response_id 
FOREIGN KEY (quote_response_id) REFERENCES quote_responses(id) ON DELETE CASCADE;

-- ==================== MESSAGES TABLE ====================
ALTER TABLE messages DROP FOREIGN KEY IF EXISTS messages_ibfk_1;
ALTER TABLE messages DROP FOREIGN KEY IF EXISTS messages_ibfk_2;
ALTER TABLE messages DROP FOREIGN KEY IF EXISTS messages_ibfk_3;
ALTER TABLE messages DROP FOREIGN KEY IF EXISTS fk_messages_sender_id;
ALTER TABLE messages DROP FOREIGN KEY IF EXISTS fk_messages_receiver_id;
ALTER TABLE messages DROP FOREIGN KEY IF EXISTS fk_messages_quote_id;

ALTER TABLE messages 
ADD CONSTRAINT fk_messages_sender_id 
FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE messages 
ADD CONSTRAINT fk_messages_receiver_id 
FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE messages 
ADD CONSTRAINT fk_messages_quote_id 
FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL;

-- ==================== REVIEWS TABLE ====================
ALTER TABLE reviews DROP FOREIGN KEY IF EXISTS reviews_ibfk_1;
ALTER TABLE reviews DROP FOREIGN KEY IF EXISTS reviews_ibfk_2;
ALTER TABLE reviews DROP FOREIGN KEY IF EXISTS reviews_ibfk_3;
ALTER TABLE reviews DROP FOREIGN KEY IF EXISTS fk_reviews_user_id;
ALTER TABLE reviews DROP FOREIGN KEY IF EXISTS fk_reviews_company_id;
ALTER TABLE reviews DROP FOREIGN KEY IF EXISTS fk_reviews_quote_id;

ALTER TABLE reviews 
ADD CONSTRAINT fk_reviews_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE reviews 
ADD CONSTRAINT fk_reviews_company_id 
FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE reviews 
ADD CONSTRAINT fk_reviews_quote_id 
FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL;

-- ==================== SUPPORT_TICKETS TABLE ====================
ALTER TABLE support_tickets DROP FOREIGN KEY IF EXISTS support_tickets_ibfk_1;
ALTER TABLE support_tickets DROP FOREIGN KEY IF EXISTS support_tickets_ibfk_2;
ALTER TABLE support_tickets DROP FOREIGN KEY IF EXISTS fk_support_tickets_user_id;
ALTER TABLE support_tickets DROP FOREIGN KEY IF EXISTS fk_support_tickets_admin_id;

ALTER TABLE support_tickets 
ADD CONSTRAINT fk_support_tickets_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE support_tickets 
ADD CONSTRAINT fk_support_tickets_admin_id 
FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL;

-- ==================== USER_NOTIFICATIONS TABLE ====================
ALTER TABLE user_notifications DROP FOREIGN KEY IF EXISTS user_notifications_ibfk_1;
ALTER TABLE user_notifications DROP FOREIGN KEY IF EXISTS user_notifications_ibfk_2;
ALTER TABLE user_notifications DROP FOREIGN KEY IF EXISTS fk_user_notifications_user_id;
ALTER TABLE user_notifications DROP FOREIGN KEY IF EXISTS fk_user_notifications_notification_id;

ALTER TABLE user_notifications 
ADD CONSTRAINT fk_user_notifications_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_notifications 
ADD CONSTRAINT fk_user_notifications_notification_id 
FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE;

-- ==================== NOTIFICATIONS TABLE ====================
ALTER TABLE notifications DROP FOREIGN KEY IF EXISTS notifications_ibfk_1;
ALTER TABLE notifications DROP FOREIGN KEY IF EXISTS fk_notifications_created_by;

ALTER TABLE notifications 
ADD CONSTRAINT fk_notifications_created_by 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

-- ==================== COMPANY_BRANCHES TABLE ====================
-- This should already have CASCADE from schema, but let's ensure it
ALTER TABLE company_branches DROP FOREIGN KEY IF EXISTS company_branches_ibfk_1;
ALTER TABLE company_branches DROP FOREIGN KEY IF EXISTS fk_company_branches_company_id;

ALTER TABLE company_branches 
ADD CONSTRAINT fk_company_branches_company_id 
FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE;

-- ==================== COMPANY_MEMBERS TABLE ====================
-- This should already have CASCADE from schema, but let's ensure it
ALTER TABLE company_members DROP FOREIGN KEY IF EXISTS company_members_ibfk_1;
ALTER TABLE company_members DROP FOREIGN KEY IF EXISTS company_members_ibfk_2;
ALTER TABLE company_members DROP FOREIGN KEY IF EXISTS fk_company_members_company_id;
ALTER TABLE company_members DROP FOREIGN KEY IF EXISTS fk_company_members_branch_id;

ALTER TABLE company_members 
ADD CONSTRAINT fk_company_members_company_id 
FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE company_members 
ADD CONSTRAINT fk_company_members_branch_id 
FOREIGN KEY (branch_id) REFERENCES company_branches(id) ON DELETE CASCADE;

-- ==================== EMAIL_NOTIFICATIONS TABLE ====================
ALTER TABLE email_notifications DROP FOREIGN KEY IF EXISTS email_notifications_ibfk_1;
ALTER TABLE email_notifications DROP FOREIGN KEY IF EXISTS fk_email_notifications_quote_id;

ALTER TABLE email_notifications 
ADD CONSTRAINT fk_email_notifications_quote_id 
FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL;

-- Show completion message
SELECT 'Cascading delete constraints added successfully!' as status;