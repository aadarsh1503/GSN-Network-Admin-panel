-- Update dispute status workflow: pending → running → resolved → closed

-- First, update any existing statuses to match new workflow
UPDATE disputes 
SET status = 'pending' 
WHERE status NOT IN ('pending', 'resolved', 'closed');

-- Update the enum to include 'running' status
ALTER TABLE disputes 
MODIFY COLUMN status ENUM('pending', 'running', 'resolved', 'closed') DEFAULT 'pending';

ALTER TABLE disputes 
MODIFY COLUMN company_requested_status ENUM('pending', 'running', 'resolved', 'closed') NULL;

ALTER TABLE disputes 
MODIFY COLUMN company_suggested_status ENUM('pending', 'running', 'resolved', 'closed') NULL;

-- Show the updated table structure
DESCRIBE disputes;