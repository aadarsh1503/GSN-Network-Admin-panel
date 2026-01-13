-- Cleanup Old Admin Notifications
-- This script removes old format notifications and keeps only the new formatted ones

-- First, let's see what we have
SELECT 
    id,
    title,
    LEFT(message, 100) as message_preview,
    created_at,
    is_read
FROM admin_notifications 
ORDER BY created_at DESC 
LIMIT 10;

-- Delete old format notifications (those without emojis)
-- Keep only notifications that have the new format with emojis
DELETE FROM admin_notifications 
WHERE message NOT LIKE '%📋%' 
  AND message NOT LIKE '%🔄%'
  AND message NOT LIKE '%🏢%';

-- Check remaining notifications
SELECT 
    COUNT(*) as remaining_notifications,
    SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_count
FROM admin_notifications;

-- Show remaining notifications
SELECT 
    id,
    title,
    LEFT(message, 150) as message_preview,
    created_at,
    is_read
FROM admin_notifications 
ORDER BY created_at DESC;