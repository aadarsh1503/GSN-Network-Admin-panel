-- Create tables for secure payment flow with bank details and verification

-- 1. Company Bank Details table (for companies to manage their bank details)
CREATE TABLE IF NOT EXISTS company_bank_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    branch_address TEXT,
    ifsc_code VARCHAR(20) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_holder_name VARCHAR(255) NOT NULL,
    swift_code VARCHAR(20) DEFAULT NULL,
    routing_number VARCHAR(20) DEFAULT NULL,
    instructions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_company_id (company_id),
    INDEX idx_is_active (is_active)
);

-- 2. Quote Response Bank Details (linking quote responses to specific bank details)
CREATE TABLE IF NOT EXISTS quote_response_bank_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quote_response_id INT NOT NULL,
    company_bank_details_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quote_response_id) REFERENCES quote_responses(id) ON DELETE CASCADE,
    FOREIGN KEY (company_bank_details_id) REFERENCES company_bank_details(id) ON DELETE CASCADE,
    UNIQUE KEY unique_quote_response_bank (quote_response_id)
);

-- 3. Payment Proofs table (for user uploaded payment attachments)
CREATE TABLE IF NOT EXISTS payment_proofs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quote_id INT NOT NULL,
    quote_response_id INT NOT NULL,
    user_id INT NOT NULL,
    company_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT DEFAULT NULL,
    file_type VARCHAR(100) DEFAULT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT DEFAULT NULL,
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
    FOREIGN KEY (quote_response_id) REFERENCES quote_responses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_quote_id (quote_id),
    INDEX idx_quote_response_id (quote_response_id),
    INDEX idx_user_id (user_id),
    INDEX idx_company_id (company_id)
);

-- 4. Payment Verifications table (for company payment verification)
CREATE TABLE IF NOT EXISTS payment_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quote_id INT NOT NULL,
    quote_response_id INT NOT NULL,
    user_id INT NOT NULL,
    company_id INT NOT NULL,
    payment_proof_id INT NOT NULL,
    verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    verified_by INT DEFAULT NULL, -- company member who verified
    verification_date TIMESTAMP NULL DEFAULT NULL,
    rejection_reason TEXT DEFAULT NULL,
    company_notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
    FOREIGN KEY (quote_response_id) REFERENCES quote_responses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_proof_id) REFERENCES payment_proofs(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_payment_verification (quote_response_id),
    INDEX idx_verification_status (verification_status),
    INDEX idx_company_id (company_id),
    INDEX idx_verified_by (verified_by)
);

-- 5. Update user_quote_status table to include payment proof requirement
ALTER TABLE user_quote_status 
ADD COLUMN payment_proof_id INT DEFAULT NULL,
ADD COLUMN payment_verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
ADD FOREIGN KEY (payment_proof_id) REFERENCES payment_proofs(id) ON DELETE SET NULL;

-- 6. Add payment-related fields to quote_responses table
ALTER TABLE quote_responses 
ADD COLUMN requires_payment_proof BOOLEAN DEFAULT TRUE,
ADD COLUMN payment_amount DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN payment_currency VARCHAR(10) DEFAULT 'USD';

-- Update existing quote_responses to set payment_amount from price
UPDATE quote_responses SET payment_amount = price WHERE payment_amount IS NULL;

-- 7. Create indexes for better performance
CREATE INDEX idx_payment_proofs_upload_date ON payment_proofs(upload_date);
CREATE INDEX idx_payment_verifications_created_at ON payment_verifications(created_at);
CREATE INDEX idx_user_quote_status_payment ON user_quote_status(payment_proof_id, payment_verification_status);