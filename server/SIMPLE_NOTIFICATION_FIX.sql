-- SIMPLE NOTIFICATION FIX - Run these queries in MySQL Workbench
-- This will clean up all existing notifications and start fresh

-- ============================================
-- STEP 1: CLEAN UP EXISTING DATA
-- ============================================

-- Delete all existing user notification links
DELETE FROM user_notifications;

-- Delete all existing notifications
DELETE FROM notifications;

-- Reset auto increment counters
ALTER TABLE notifications AUTO_INCREMENT = 1;
ALTER TABLE user_notifications AUTO_INCREMENT = 1;

-- ============================================
-- STEP 2: VERIFY CLEANUP
-- ============================================

-- Check that tables are empty
SELECT COUNT(*) as notification_count FROM notifications;
SELECT COUNT(*) as user_notification_count FROM user_notifications;

-- ============================================
-- STEP 3: ADD INDEXES FOR PERFORMANCE
-- ============================================

-- Add indexes if they don't exist (ignore errors if they already exist)
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_notification_id ON user_notifications(notification_id);
CREATE INDEX IF NOT EXISTS idx_notifications_target_role ON notifications(target_role);
CREATE INDEX IF NOT EXISTS idx_notifications_target_audience ON notifications(target_audience);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- ============================================
-- DONE! 
-- ============================================
-- Now when users accept/reject quotes, each company will get their own notification
-- No more shared notifications between different accounts