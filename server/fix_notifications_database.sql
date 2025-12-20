-- Fix Notifications Database - Clean up and create proper user-specific notifications
-- Run these queries in MySQL Workbench

-- Step 1: Clear all existing notifications and user_notifications
-- This removes all the shared notifications that were showing to everyone
DELETE FROM user_notifications;
DELETE FROM notifications;

-- Step 2: Reset auto increment to start fresh
ALTER TABLE notifications AUTO_INCREMENT = 1;
ALTER TABLE user_notifications AUTO_INCREMENT = 1;

-- Step 3: Update the notifications table structure to ensure proper columns
-- Add any missing columns if needed (check current structure first)
ALTER TABLE notifications 
MODIFY COLUMN target_role varchar(50) NOT NULL DEFAULT 'user_specific',
MODIFY COLUMN target_audience enum('all','companies','businesses','users') DEFAULT 'companies';

-- Step 4: Create a procedure to generate user-specific notifications for testing
-- This creates separate notification entries for each company

DELIMITER //

CREATE PROCEDURE CreateUserSpecificNotification(
    IN p_user_id INT,
    IN p_title VARCHAR(255),
    IN p_message TEXT,
    IN p_target_audience ENUM('all','companies','businesses','users')
)
BEGIN
    DECLARE notification_id INT;
    
    -- Create the notification
    INSERT INTO notifications (target_role, title, message, target_audience, created_at)
    VALUES ('user_specific', p_title, p_message, p_target_audience, NOW());
    
    -- Get the inserted notification ID
    SET notification_id = LAST_INSERT_ID();
    
    -- Link it to the specific user
    INSERT INTO user_notifications (user_id, notification_id, is_read)
    VALUES (p_user_id, notification_id, 0);
    
END //

DELIMITER ;

-- Step 5: Create sample user-specific notifications for testing
-- Replace these user IDs with actual company IDs from your users table

-- For Company ID 8 (replace with actual company ID)
CALL CreateUserSpecificNotification(
    8, 
    'Welcome to Your Dashboard', 
    'This is a test notification specifically for your company account.',
    'companies'
);

-- For Company ID 2 (replace with actual company ID)  
CALL CreateUserSpecificNotification(
    2,
    'Your Account Setup Complete',
    'This notification is only visible to your company account.',
    'companies'
);

-- Step 6: Verify the fix
-- Check that notifications are properly linked to users
SELECT 
    n.id as notification_id,
    n.title,
    n.target_role,
    n.target_audience,
    un.user_id,
    un.is_read,
    u.name as company_name
FROM notifications n
JOIN user_notifications un ON n.id = un.notification_id
JOIN users u ON un.user_id = u.id
ORDER BY n.created_at DESC;

-- Step 7: Check that each user only sees their own notifications
-- Test query for user ID 8
SELECT DISTINCT n.*, 
       un.is_read, 
       un.read_at,
       CASE 
           WHEN un.user_id IS NOT NULL THEN 1 
           ELSE 0 
       END as is_user_specific
FROM notifications n
LEFT JOIN user_notifications un ON (n.id = un.notification_id AND un.user_id = 8)
WHERE (
    -- User-specific notifications
    un.user_id = 8
    OR 
    -- General notifications for companies
    (n.target_audience = 'all' OR n.target_audience = 'companies')
    AND n.target_role != 'user_specific'
)
ORDER BY n.created_at DESC;

-- Step 8: Clean up the procedure (optional)
-- DROP PROCEDURE IF EXISTS CreateUserSpecificNotification;

-- Step 9: Add indexes for better performance
CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_notification_id ON user_notifications(notification_id);
CREATE INDEX idx_notifications_target_role ON notifications(target_role);
CREATE INDEX idx_notifications_target_audience ON notifications(target_audience);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Step 10: Verify no shared notifications exist
-- This should return 0 rows if fix is successful
SELECT n.* 
FROM notifications n
LEFT JOIN user_notifications un ON n.id = un.notification_id
WHERE n.target_role != 'user_specific' 
AND n.target_audience != 'all'
AND un.notification_id IS NULL;