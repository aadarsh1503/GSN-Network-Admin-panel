// Run the category column size fix
import db from './config/db.js';
import fs from 'fs';

const runCategoryColumnFix = async () => {
    try {
        console.log('🔧 Fixing category column size...\n');

        // Read the SQL file
        const sql = fs.readFileSync('./fix_category_column_size.sql', 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = sql.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                console.log(`📝 Executing: ${statement.trim()}`);
                await db.execute(statement);
                console.log('✅ Success');
            }
        }

        // Verify the fix
        console.log('\n🔍 Verifying the fix...');
        const [columns] = await db.execute('DESCRIBE users');
        
        const categoryColumn = columns.find(col => col.Field === 'category');
        if (categoryColumn) {
            console.log(`✅ Category column updated:`);
            console.log(`   Type: ${categoryColumn.Type}`);
            console.log(`   Previous: varchar(100)`);
            console.log(`   Current: ${categoryColumn.Type}`);
        }

        // Test with a long category string
        console.log('\n🧪 Testing with long category string...');
        const testCategories = 'Manufacturing,Trading,Import/Export,E-commerce,Retail,Wholesale,Agriculture,Textiles,Electronics,Automotive,Healthcare,Food & Beverages';
        console.log(`Test string length: ${testCategories.length} characters`);
        
        // Find a business user to test with
        const [users] = await db.execute('SELECT id FROM users WHERE role = "business" LIMIT 1');
        
        if (users.length > 0) {
            const userId = users[0].id;
            console.log(`Testing with user ID: ${userId}`);
            
            // Test the update
            await db.execute('UPDATE users SET category = ? WHERE id = ?', [testCategories, userId]);
            console.log('✅ Long category string update successful!');
            
            // Verify
            const [result] = await db.execute('SELECT category FROM users WHERE id = ?', [userId]);
            console.log(`Stored category: "${result[0].category}"`);
            console.log(`Length: ${result[0].category.length} characters`);
        }

        console.log('\n✨ Category column fix completed successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await db.end();
    }
};

// Run the fix
runCategoryColumnFix();