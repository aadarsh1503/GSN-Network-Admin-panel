-- Add email_notifications table for tracking email notifications
CREATE TABLE IF NOT EXISTS `email_notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `recipient_email` varchar(255) NOT NULL,
  `subject` varchar(500) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(100) DEFAULT 'general',
  `quote_id` int(11) DEFAULT NULL,
  `status` enum('sent','failed','pending') DEFAULT 'pending',
  `error_message` text DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON DELETE SET NULL,
  INDEX `idx_recipient_email` (`recipient_email`),
  INDEX `idx_quote_id` (`quote_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_type` (`type`)
);