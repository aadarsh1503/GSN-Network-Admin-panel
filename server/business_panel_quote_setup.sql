-- Business Panel Quote Setup SQL
-- This script ensures the database is properly configured for business users to submit quotes
-- Run this in MySQL Workbench if you haven't already applied the user role fix

-- 1. Ensure the role enum includes 'user' role (if not already done)
-- This allows regular users, business users, and company users to all submit quotes
ALTER TABLE `users` 
MODIFY COLUMN `role` enum('admin','company','business','user') NOT NULL DEFAULT 'business';

-- 2. Ensure notifications target_audience includes 'users' and 'businesses'
ALTER TABLE `notifications` 
MODIFY COLUMN `target_audience` enum('all','companies','businesses','users') DEFAULT 'all';

-- 3. Verify the quotes table allows business users (user_id can be any user type)
-- The quotes table already supports this via the user_id foreign key to users table
-- No changes needed here

-- 4. Verify the user_quote_status table exists for tracking quote response acceptance/rejection
-- This table is used by both regular users and business users
CREATE TABLE IF NOT EXISTS `user_quote_status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quote_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `quote_response_id` int(11) NOT NULL,
  `status` enum('accepted','rejected') NOT NULL,
  `accepted_at` timestamp NULL DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`company_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`quote_response_id`) REFERENCES `quote_responses`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_user_quote_response` (`quote_id`, `user_id`, `quote_response_id`)
);

-- 5. Add index for better query performance on business user quotes
CREATE INDEX IF NOT EXISTS `idx_quotes_user_id` ON `quotes`(`user_id`);
CREATE INDEX IF NOT EXISTS `idx_quote_responses_quote_id` ON `quote_responses`(`quote_id`);
CREATE INDEX IF NOT EXISTS `idx_user_quote_status_user_id` ON `user_quote_status`(`user_id`);

-- Done! The business panel quote functionality should now work correctly.
-- Business users can:
-- 1. Submit quote requests (same as regular users)
-- 2. View their submitted quotes
-- 3. See responses from companies
-- 4. Accept or reject quote responses
-- 5. Receive notifications about quote status changes
