-- Create subscription_requests table for bank transfer requests
CREATE TABLE IF NOT EXISTS subscription_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    transaction_id VARCHAR(255) NOT NULL,
    payment_method ENUM('bank_transfer', 'online', 'cash') DEFAULT 'bank_transfer',
    payment_proof_url TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    rejection_reason TEXT,
    processed_at TIMESTAMP NULL,
    
    -- Cached user and plan data for admin display
    company_name VARCHAR(255),
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_phone VARCHAR(20),
    plan_name VARCHAR(100) NOT NULL,
    plan_price DECIMAL(10, 2) NOT NULL,
    duration_months INT NOT NULL DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES membership_plans(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_plan_id (plan_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Create admin_bank_details table for storing admin bank account information
CREATE TABLE IF NOT EXISTS admin_bank_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bank_name VARCHAR(255) NOT NULL,
    branch_name VARCHAR(255),
    branch_address TEXT,
    ifsc_code VARCHAR(20) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_holder_name VARCHAR(255) NOT NULL,
    instructions TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_is_active (is_active)
);

-- Insert sample admin bank details
INSERT INTO admin_bank_details (
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
) ON DUPLICATE KEY UPDATE id=id;