-- Add incharge_image column to users table
ALTER TABLE `users` ADD COLUMN `incharge_image` varchar(500) DEFAULT NULL AFTER `logo`;