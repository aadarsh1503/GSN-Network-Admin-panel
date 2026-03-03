/**
 * Generate bcrypt hash for admin password
 * Run this with: node generate_admin_password.js
 */

import bcrypt from 'bcrypt';

const password = 'Global@123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error('Error generating hash:', err);
        return;
    }
    
    console.log('\n=== Admin User Creation ===\n');
    console.log('Email: info@gulfstarnetwork.com');
    console.log('Password: Global@123');
    console.log('Hashed Password:', hash);
    console.log('\n=== SQL Query ===\n');
    console.log(`
INSERT INTO users (
    name, 
    email, 
    password, 
    role, 
    status, 
    email_verified,
    created_at,
    updated_at
) VALUES (
    'Gulf Star Network Admin',
    'info@gulfstarnetwork.com',
    '${hash}',
    'admin',
    1,
    1,
    NOW(),
    NOW()
);
    `);
    console.log('\n=== Copy the above SQL query and run it in MySQL Workbench ===\n');
});
