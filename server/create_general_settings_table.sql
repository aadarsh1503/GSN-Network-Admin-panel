-- Create general_settings table for admin configuration
CREATE TABLE IF NOT EXISTS general_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('text', 'email', 'phone', 'image', 'html') DEFAULT 'text',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO general_settings (setting_key, setting_value, setting_type) VALUES
('admin_logo', 'https://i.imgur.com/3Y1Dk6H.png', 'image'),
('favicon', 'https://i.imgur.com/sCEw22l.png', 'image'),
('contact_email', 'dinfo@gulfstarnetwork.com', 'email'),
('contact_phone', '+973 17491222', 'phone'),
('contact_details', '<p>dinfo@gulfstarnetwork.com</p><p>+973 17491222</p>', 'html'),
('company_name', 'Gulf Star Network', 'text'),
('support_hours', 'Monday - Friday: 9:00 AM - 6:00 PM', 'text'),
('address', 'Bahrain', 'text')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);