-- Create Dispute System Tables

-- 1. Dispute Reasons Table (Admin manages these)
CREATE TABLE IF NOT EXISTS dispute_reasons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Disputes Table (Actual disputes between users and companies)
CREATE TABLE IF NOT EXISTS disputes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    company_id INT NOT NULL,
    quote_id INT NULL, -- Optional: if dispute is related to a specific quote
    transaction_id INT NULL, -- Optional: if dispute is related to a transaction
    dispute_reason_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('pending', 'investigating', 'resolved', 'closed') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    admin_response TEXT NULL,
    resolution_notes TEXT NULL,
    resolved_by INT NULL, -- Admin user who resolved it
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    FOREIGN KEY (dispute_reason_id) REFERENCES dispute_reasons(id) ON DELETE RESTRICT,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. Dispute Images Table (For evidence/attachments)
CREATE TABLE IF NOT EXISTS dispute_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dispute_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    image_type ENUM('evidence', 'screenshot', 'document', 'other') DEFAULT 'evidence',
    uploaded_by ENUM('user', 'company', 'admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE
);

-- 4. Dispute Messages Table (Communication thread)
CREATE TABLE IF NOT EXISTS dispute_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dispute_id INT NOT NULL,
    sender_id INT NOT NULL,
    sender_type ENUM('user', 'company', 'admin') NOT NULL,
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE, -- Internal admin notes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default dispute reasons
INSERT INTO dispute_reasons (title, description) VALUES
('Breach of Contract', 'One party failed to fulfill contractual obligations'),
('Non-payment or Late Payment', 'Payment issues or delays in payment processing'),
('Misrepresentation or Fraud', 'False information or fraudulent activities'),
('Quality or Performance Issues', 'Service or product quality below expectations'),
('Delivery Delays', 'Late delivery or failure to meet agreed timelines'),
('Termination of Agreement', 'Disputes related to contract termination'),
('Intellectual Property Infringement', 'Unauthorized use of intellectual property'),
('Scope Creep or Change Orders', 'Disagreements about project scope changes'),
('Confidentiality Breach', 'Violation of confidentiality agreements'),
('Disagreement Over Terms', 'Disputes about contract terms and conditions'),
('Communication Issues', 'Poor communication or lack of responsiveness'),
('Refund Request', 'Request for refund due to unsatisfactory service');

-- Create indexes for better performance
CREATE INDEX idx_disputes_user_id ON disputes(user_id);
CREATE INDEX idx_disputes_company_id ON disputes(company_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_created_at ON disputes(created_at);
CREATE INDEX idx_dispute_messages_dispute_id ON dispute_messages(dispute_id);
CREATE INDEX idx_dispute_images_dispute_id ON dispute_images(dispute_id);