-- GSN Database Updates
-- Run these SQL commands to add missing tables and columns

-- 1. Add password reset token columns to users table
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `password_reset_token` varchar(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `password_reset_expires` datetime DEFAULT NULL;

-- 2. Create Suggestions/Feedback table
CREATE TABLE IF NOT EXISTS `suggestions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT 'general',
  `message` text NOT NULL,
  `status` enum('pending','reviewed','implemented','rejected') DEFAULT 'pending',
  `admin_response` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- 3. Create Membership Plans table
CREATE TABLE IF NOT EXISTS `membership_plans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `duration_months` int(11) NOT NULL DEFAULT 1,
  `features` text DEFAULT NULL,
  `max_quotes` int(11) DEFAULT -1,
  `max_responses` int(11) DEFAULT -1,
  `directory_listing` tinyint(1) DEFAULT 1,
  `priority_support` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

-- 4. Create User Subscriptions table
CREATE TABLE IF NOT EXISTS `user_subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('active','expired','cancelled') DEFAULT 'active',
  `payment_status` enum('pending','paid','failed') DEFAULT 'pending',
  `transaction_id` varchar(100) DEFAULT NULL,
  `amount_paid` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`plan_id`) REFERENCES `membership_plans`(`id`) ON DELETE CASCADE
);

-- 5. Create Transactions table
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `subscription_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `transaction_reference` varchar(100) DEFAULT NULL,
  `status` enum('pending','completed','failed','refunded') DEFAULT 'pending',
  `description` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`subscription_id`) REFERENCES `user_subscriptions`(`id`) ON DELETE SET NULL
);

-- 6. Create Wishlist table
CREATE TABLE IF NOT EXISTS `wishlist` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`company_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_wishlist` (`user_id`, `company_id`)
);

-- 7. Create Profile Views table
CREATE TABLE IF NOT EXISTS `profile_views` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `viewer_id` int(11) DEFAULT NULL,
  `viewer_ip` varchar(45) DEFAULT NULL,
  `viewed_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`company_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`viewer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

-- 8. Create Blacklist Reasons table (for tracking blacklist history)
CREATE TABLE IF NOT EXISTS `blacklist_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `reason` text NOT NULL,
  `blacklisted_by` int(11) NOT NULL,
  `action` enum('blacklisted','removed') NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`company_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`blacklisted_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- 9. Update notifications table to have proper structure
ALTER TABLE `notifications` 
MODIFY COLUMN `target_audience` varchar(50) DEFAULT 'all',
ADD COLUMN IF NOT EXISTS `target_role` varchar(50) DEFAULT 'all';

-- 10. Create Login History table for reports
CREATE TABLE IF NOT EXISTS `login_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `login_time` timestamp DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `status` enum('success','failed') DEFAULT 'success',
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- 11. Insert default membership plans
INSERT IGNORE INTO `membership_plans` (`id`, `name`, `description`, `price`, `duration_months`, `features`, `max_quotes`, `max_responses`, `directory_listing`, `priority_support`) VALUES 
(1, 'Guest', 'Free basic access', 0.00, 0, '["View directory","Submit quotes","Basic support"]', 5, 0, 0, 0),
(2, 'Basic', 'Essential features for small businesses', 49.99, 1, '["Directory listing","Unlimited quotes","10 quote responses/month","Email support"]', -1, 10, 1, 0),
(3, 'Professional', 'Advanced features for growing businesses', 99.99, 1, '["Priority directory listing","Unlimited quotes","50 quote responses/month","Priority support","Analytics dashboard"]', -1, 50, 1, 1),
(4, 'Enterprise', 'Full access for large organizations', 199.99, 1, '["Featured directory listing","Unlimited quotes","Unlimited responses","24/7 priority support","Advanced analytics","API access"]', -1, -1, 1, 1);
