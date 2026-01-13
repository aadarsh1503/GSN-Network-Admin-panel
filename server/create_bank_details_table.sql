-- Create bank_details table
CREATE TABLE IF NOT EXISTS bank_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bank_name VARCHAR(255) NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    branch_address TEXT,
    ifsc_code VARCHAR(20) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_holder_name VARCHAR(255) NOT NULL,
    instructions TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default bank details
INSERT INTO bank_details (
    bank_name, 
    branch_name, 
    branch_address, 
    ifsc_code, 
    account_number, 
    account_holder_name, 
    instructions, 
    is_active
) VALUES (
    'Indian Bank',
    'XYZ Branch',
    'XYZ Address, City - 123456',
    'IDIB000X048',
    '89798765463498',
    'GSN Network Services',
    'Please ensure to enter the correct branch name where the account is held to avoid any confusion. After making the payment, please contact our support team with the transaction reference number.',
    TRUE
);