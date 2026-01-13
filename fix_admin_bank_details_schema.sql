-- Fix admin_bank_details table schema to match API expectations
-- Add missing columns: iban_number, swift_code, payment_instructions

-- Add iban_number column
ALTER TABLE admin_bank_details 
ADD COLUMN iban_number VARCHAR(50) DEFAULT NULL AFTER account_holder_name;

-- Add swift_code column  
ALTER TABLE admin_bank_details 
ADD COLUMN swift_code VARCHAR(20) DEFAULT NULL AFTER iban_number;

-- Rename instructions to payment_instructions to match API
ALTER TABLE admin_bank_details 
CHANGE COLUMN instructions payment_instructions TEXT DEFAULT NULL;

-- Update existing records to have some default values if needed
-- (Optional: You can remove this if you want to keep existing data as is)
UPDATE admin_bank_details 
SET 
    iban_number = CASE 
        WHEN iban_number IS NULL THEN 'UPDATE_REQUIRED' 
        ELSE iban_number 
    END,
    swift_code = CASE 
        WHEN swift_code IS NULL THEN 'UPDATE_REQUIRED' 
        ELSE swift_code 
    END
WHERE iban_number IS NULL OR swift_code IS NULL;

-- Add indexes for better performance
CREATE INDEX idx_admin_bank_iban ON admin_bank_details(iban_number);
CREATE INDEX idx_admin_bank_swift ON admin_bank_details(swift_code);