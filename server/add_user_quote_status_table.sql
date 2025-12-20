-- Add user_quote_status table for tracking user responses to quote responses
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