-- Add columns for company responses and status change requests to disputes table

ALTER TABLE disputes 
ADD COLUMN company_response TEXT NULL AFTER admin_response,
ADD COLUMN company_suggested_status ENUM('pending', 'investigating', 'resolved', 'closed') NULL AFTER company_response,
ADD COLUMN company_responded_at TIMESTAMP NULL AFTER company_suggested_status,
ADD COLUMN company_requested_status ENUM('pending', 'investigating', 'resolved', 'closed') NULL AFTER company_responded_at,
ADD COLUMN company_status_reason TEXT NULL AFTER company_requested_status,
ADD COLUMN company_status_requested_at TIMESTAMP NULL AFTER company_status_reason;

-- Add indexes for better performance
CREATE INDEX idx_disputes_company_responded_at ON disputes(company_responded_at);
CREATE INDEX idx_disputes_company_status_requested_at ON disputes(company_status_requested_at);

-- Show the updated table structure
DESCRIBE disputes;