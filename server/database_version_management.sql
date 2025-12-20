-- System Version Management Table
CREATE TABLE IF NOT EXISTS `system_versions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `version_number` varchar(20) NOT NULL,
  `description` text DEFAULT NULL,
  `is_current` tinyint(1) DEFAULT 0,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_version` (`version_number`)
);

-- Insert initial version
INSERT IGNORE INTO `system_versions` (`version_number`, `description`, `is_current`, `created_by`) 
VALUES ('1.0.0', 'Initial system version', 1, 1);