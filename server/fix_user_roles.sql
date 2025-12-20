-- Fix User Roles Database Update
-- This script updates the user role enum to include 'user' role as used in the application

-- 1. Update the role enum to include 'user' role
ALTER TABLE `users` 
MODIFY COLUMN `role` enum('admin','company','business','user') NOT NULL DEFAULT 'business';

-- 2. Update notifications target_audience to include 'users'
ALTER TABLE `notifications` 
MODIFY COLUMN `target_audience` enum('all','companies','businesses','users','admins') DEFAULT 'all';

-- 3. Optional: Update existing business users who should be regular users
-- Uncomment the following line if you want to convert some business users to regular users
-- UPDATE `users` SET `role` = 'user' WHERE `role` = 'business' AND `category` IS NULL;

-- Note: This update ensures the database schema matches the application logic
-- where 'user' role is used for regular users who don't need admin approval