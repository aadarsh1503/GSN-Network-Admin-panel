-- Fix Admin Emails for Email Notifications
-- This script updates admin emails to valid addresses

-- Check current admin emails
SELECT id, name, email, role FROM users WHERE role = 'admin';

-- Update admin ID 1 to use valid email from .env
UPDATE users SET email = 'root@khaleeji.app' WHERE id = 1 AND role = 'admin';

-- Verify the update
SELECT id, name, email, role FROM users WHERE role = 'admin';

-- The result should show:
-- ID 1: root@khaleeji.app (valid email from .env)
-- ID 32: dzero169@gmail.com (existing valid email)