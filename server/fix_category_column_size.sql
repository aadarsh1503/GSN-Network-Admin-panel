-- Fix category column size to accommodate multiple categories
-- Current: varchar(100) - Too small for comma-separated categories
-- New: varchar(500) - Enough space for multiple categories

ALTER TABLE users MODIFY COLUMN category varchar(500) DEFAULT NULL;

-- Verify the change
DESCRIBE users;