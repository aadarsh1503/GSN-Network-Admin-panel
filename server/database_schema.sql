-- GSN Database Schema
-- Run this SQL to create all required tables

-- Users table (already exists, but including for reference)
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL UNIQUE,
  `phone` varchar(20) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','company','business') NOT NULL DEFAULT 'business',
  `category` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `referral_code` varchar(50) DEFAULT NULL,
  `status` tinyint(1) DEFAULT 1,
  `is_blacklisted` tinyint(1) DEFAULT 0,
  `email_verified` tinyint(1) DEFAULT 0,
  `email_verification_token` varchar(255) DEFAULT NULL,
  -- Company specific fields
  `owner_name` varchar(255) DEFAULT NULL,
  `owner_phone` varchar(20) DEFAULT NULL,
  `incharge_name` varchar(255) DEFAULT NULL,
  `incharge_phone` varchar(20) DEFAULT NULL,
  `skype` varchar(100) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `facebook` varchar(255) DEFAULT NULL,
  `twitter` varchar(255) DEFAULT NULL,
  `instagram` varchar(255) DEFAULT NULL,
  `linkedin` varchar(255) DEFAULT NULL,
  `services` text DEFAULT NULL, -- JSON array of services
  `map_location` text DEFAULT NULL,
  `company_address` text DEFAULT NULL,
  `about_company` text DEFAULT NULL,
  `logo` varchar(500) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

-- Business Categories table
CREATE TABLE IF NOT EXISTS `business_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

-- Logistics Categories table
CREATE TABLE IF NOT EXISTS `logistics_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

-- Company Branches table
CREATE TABLE IF NOT EXISTS `company_branches` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `branch_name` varchar(255) NOT NULL,
  `branch_phone` varchar(20) DEFAULT NULL,
  `branch_email` varchar(255) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `skype` varchar(100) DEFAULT NULL,
  `facebook` varchar(255) DEFAULT NULL,
  `twitter` varchar(255) DEFAULT NULL,
  `instagram` varchar(255) DEFAULT NULL,
  `whatsapp` varchar(20) DEFAULT NULL,
  `linkedin` varchar(255) DEFAULT NULL,
  `map_location` text DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`company_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Company Members table
CREATE TABLE IF NOT EXISTS `company_members` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `member_name` varchar(255) NOT NULL,
  `member_phone` varchar(20) DEFAULT NULL,
  `member_email` varchar(255) DEFAULT NULL,
  `member_role` varchar(100) DEFAULT NULL,
  `skype` varchar(100) DEFAULT NULL,
  `facebook` varchar(255) DEFAULT NULL,
  `twitter` varchar(255) DEFAULT NULL,
  `instagram` varchar(255) DEFAULT NULL,
  `whatsapp` varchar(20) DEFAULT NULL,
  `linkedin` varchar(255) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`company_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`branch_id`) REFERENCES `company_branches`(`id`) ON DELETE CASCADE
);

-- Quotes table
CREATE TABLE IF NOT EXISTS `quotes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL, -- NULL for guest quotes
  `shipping_mode` varchar(50) NOT NULL,
  `arrival_date` date NOT NULL,
  `departure_country` varchar(100) NOT NULL,
  `departure_state` varchar(100) DEFAULT NULL,
  `departure_city` varchar(100) DEFAULT NULL,
  `departure_type` varchar(50) DEFAULT NULL,
  `arrival_country` varchar(100) NOT NULL,
  `arrival_state` varchar(100) DEFAULT NULL,
  `arrival_city` varchar(100) DEFAULT NULL,
  `arrival_type` varchar(50) DEFAULT NULL,
  `product_description` text NOT NULL,
  `packing` varchar(100) DEFAULT NULL,
  `incoterms` varchar(50) DEFAULT NULL,
  `quantity` varchar(100) DEFAULT NULL,
  `weight` varchar(100) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `length` varchar(20) DEFAULT NULL,
  `width` varchar(20) DEFAULT NULL,
  `height` varchar(20) DEFAULT NULL,
  `dimension_unit` varchar(10) DEFAULT NULL,
  `is_stackable` tinyint(1) DEFAULT 0,
  `is_hazardous` tinyint(1) DEFAULT 0,
  `has_insurance` tinyint(1) DEFAULT 0,
  `notes` text DEFAULT NULL,
  -- Contact info for guest quotes
  `contact_name` varchar(255) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `status` enum('pending','approved','rejected','running','closed') DEFAULT 'pending',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

-- Quote Responses table
CREATE TABLE IF NOT EXISTS `quote_responses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quote_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `transit_time` varchar(100) NOT NULL,
  `inclusions` text DEFAULT NULL,
  `value_added_services` text DEFAULT NULL,
  `valid_until` date DEFAULT NULL,
  `terms` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('pending','accepted','rejected') DEFAULT 'pending',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`company_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_company_quote` (`quote_id`, `company_id`)
);

-- Messages table
CREATE TABLE IF NOT EXISTS `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `message` text NOT NULL,
  `quote_id` int(11) DEFAULT NULL, -- Optional reference to quote
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON DELETE SET NULL
);

-- Reviews table
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `rating` int(1) NOT NULL CHECK (`rating` >= 1 AND `rating` <= 5),
  `reliability` int(1) DEFAULT NULL CHECK (`reliability` >= 1 AND `reliability` <= 5),
  `communication` int(1) DEFAULT NULL CHECK (`communication` >= 1 AND `communication` <= 5),
  `timeliness` int(1) DEFAULT NULL CHECK (`timeliness` >= 1 AND `timeliness` <= 5),
  `overall_experience` int(1) DEFAULT NULL CHECK (`overall_experience` >= 1 AND `overall_experience` <= 5),
  `review_text` text NOT NULL,
  `quote_id` int(11) DEFAULT NULL, -- Optional reference to quote
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`company_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON DELETE SET NULL,
  UNIQUE KEY `unique_user_company_review` (`user_id`, `company_id`)
);

-- Support Tickets table
CREATE TABLE IF NOT EXISTS `support_tickets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `ticket_number` varchar(50) NOT NULL UNIQUE,
  `subject` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `description` text NOT NULL,
  `admin_response` text DEFAULT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `status` enum('pending','answered','closed') DEFAULT 'pending',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `responded_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

-- Notifications table
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `target_audience` enum('all','companies','businesses') DEFAULT 'all',
  `created_by` int(11) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- User Notifications (for tracking who has seen notifications)
CREATE TABLE IF NOT EXISTS `user_notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `notification_id` int(11) NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`notification_id`) REFERENCES `notifications`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_user_notification` (`user_id`, `notification_id`)
);

-- User Quote Status (for tracking user responses to quote responses)
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

-- Email Notifications (for tracking email notifications)
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

-- Insert default categories
INSERT IGNORE INTO `business_categories` (`name`) VALUES 
('Import/Export'),
('Manufacturing'),
('Trading'),
('Retail'),
('Wholesale'),
('E-commerce'),
('Agriculture'),
('Automotive'),
('Textiles'),
('Electronics'),
('Food & Beverages'),
('Pharmaceuticals'),
('Construction'),
('Oil & Gas'),
('Mining');

INSERT IGNORE INTO `logistics_categories` (`name`) VALUES 
('Freight Forwarding'),
('Shipping Lines'),
('Airlines'),
('Trucking'),
('Rail Transport'),
('Warehousing'),
('Customs Clearance'),
('3PL Services'),
('Cold Chain'),
('Project Cargo'),
('Dangerous Goods'),
('Express Delivery'),
('Last Mile Delivery'),
('Cross Border'),
('Door to Door');