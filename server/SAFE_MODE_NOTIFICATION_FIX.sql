-- SAFE MODE NOTIFICATION FIX - Works with MySQL Workbench Safe Mode
-- Run these queries one by one in MySQL Workbench

-- ============================================
-- STEP 1: DISABLE SAFE MODE TEMPORARILY
-- ============================================
SET SQL_SAFE_UPDATES = 0;

-- ============================================
-- STEP 2: CLEAN UP EXISTING DATA
-- ============================================

-- Delete all existing user notification links
DELETE FROM user_notifications WHERE id > 0;

-- Delete all existing notifications  
DELETE FROM notifications WHERE id > 0;

-- Reset auto increment counters
ALTER TABLE notifications AUTO_INCREMENT = 1;
ALTER TABLE user_notifications AUTO_INCREMENT = 1;

-- ============================================
-- STEP 3: RE-ENABLE SAFE MODE
-- ============================================
SET SQL_SAFE_UPDATES = 1;

-- ============================================
-- STEP 4: VERIFY CLEANUP
-- ============================================

-- Check that tables are empty
SELECT COUNT(*) as notification_count FROM notifications;
SELECT COUNT(*) as user_notification_count FROM user_notifications;

-- ============================================
-- STEP 5: ADD INDEXES FOR PERFORMANCE
-- ============================================

-- Add indexes for better performance
ALTER TABLE user_notifications ADD INDEX idx_user_notifications_user_id (user_id);
ALTER TABLE user_notifications ADD INDEX idx_user_notifications_notification_id (notification_id);
ALTER TABLE notifications ADD INDEX idx_notifications_target_role (target_role);
ALTER TABLE notifications ADD INDEX idx_notifications_target_audience (target_audience);
ALTER TABLE notifications ADD INDEX idx_notifications_created_at (created_at);

-- ============================================
-- STEP 6: VERIFICATION QUERIES
-- ============================================

-- Verify tables are empty
SELECT 'Notifications table' as table_name, COUNT(*) as count FROM notifications
UNION ALL
SELECT 'User notifications table' as table_name, COUNT(*) as count FROM user_notifications;

-- Show table structures
DESCRIBE notifications;
DESCRIBE user_notifications;

-- ============================================
-- DONE! 
-- ============================================
-- Now when users accept/reject quotes, each company will get their own notification
-- No more shared notifications between different accounts