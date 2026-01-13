-- Create transaction_invoices table for storing invoices generated when payments are approved
CREATE TABLE IF NOT EXISTS transaction_invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    quote_id INT NOT NULL,
    user_id INT NOT NULL,
    company_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    service_fee DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('paid', 'pending', 'completed', 'cancelled') DEFAULT 'paid',
    payment_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes for better performance
    INDEX idx_quote_id (quote_id),
    INDEX idx_user_id (user_id),
    INDEX idx_company_id (company_id),
    INDEX idx_invoice_number (invoice_number),
    INDEX idx_created_at (created_at)
);

-- Add some sample data (optional - remove if not needed)
-- INSERT INTO transaction_invoices (invoice_number, quote_id, user_id, company_id, amount, service_fee, total_amount, status, payment_date) 
-- VALUES 
-- ('TXN-INV-2026-001', 1, 2, 3, 100.00, 5.00, 105.00, 'paid', NOW()),
-- ('TXN-INV-2026-002', 2, 4, 5, 250.00, 12.50, 262.50, 'completed', NOW());