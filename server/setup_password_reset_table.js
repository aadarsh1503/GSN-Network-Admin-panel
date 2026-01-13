import db from './config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const setupPasswordResetTable = async () => {
  try {
    console.log('🔧 Setting up password reset tokens table...');
    
    // Create the table with separate queries
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        used TINYINT(1) DEFAULT 0,
        used_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        
        INDEX idx_token (token),
        INDEX idx_user_id (user_id),
        INDEX idx_expires_at (expires_at),
        INDEX idx_used (used)
      )
    `;
    
    // Execute the create table query
    await db.execute(createTableSQL);
    
    // Add comment to table (separate query)
    const commentSQL = `ALTER TABLE password_reset_tokens COMMENT = 'Stores password reset tokens for user password recovery'`;
    await db.execute(commentSQL);
    
    console.log('✅ Password reset tokens table created successfully!');
    console.log('📋 Table structure:');
    console.log('   - id: Primary key');
    console.log('   - user_id: Foreign key to users table');
    console.log('   - token: Unique reset token');
    console.log('   - expires_at: Token expiration time');
    console.log('   - used: Whether token has been used');
    console.log('   - used_at: When token was used');
    console.log('   - created_at: Token creation time');
    console.log('   - updated_at: Last update time');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up password reset table:', error);
    process.exit(1);
  }
};

setupPasswordResetTable();