-- Remove 'investigating' status from disputes table enum

-- First, update any existing 'investigating' disputes to 'pending'
UPDATE disputes 
SET status = 'pending' 
WHERE status = 'investigating';

UPDATE disputes 
SET company_requested_status = 'pending' 
WHERE company_requested_status = 'investigating';

UPDATE disputes 
SET company_suggested_status = 'pending' 
WHERE company_suggested_status = 'investigating';

-- Now modify the enum to remove 'investigating'
ALTER TABLE disputes 
MODIFY COLUMN status ENUM('pending', 'resolved', 'closed') DEFAULT 'pending';

ALTER TABLE disputes 
MODIFY COLUMN company_requested_status ENUM('pending', 'resolved', 'closed') NULL;

ALTER TABLE disputes 
MODIFY COLUMN company_suggested_status ENUM('pending', 'resolved', 'closed') NULL;

-- Show the updated table structure
DESCRIBE disputes;