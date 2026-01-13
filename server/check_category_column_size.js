// Check the current size of the category column
import db from './config/db.js';

const checkCategoryColumn = async () => {
    try {
        console.log('🔍 Checking category column size...\n');

        // Check the current structure of the users table
        const [columns] = await db.execute('DESCRIBE users');
        
        console.log('📊 Users table structure:');
        columns.forEach(col => {
            if (col.Field === 'category') {
                console.log(`✅ Found category column:`);
                console.log(`   Field: ${col.Field}`);
                console.log(`   Type: ${col.Type}`);
                console.log(`   Null: ${col.Null}`);
                console.log(`   Key: ${col.Key}`);
                console.log(`   Default: ${col.Default}`);
                console.log(`   Extra: ${col.Extra}`);
            }
        });

        // Check current category values to see what we're working with
        console.log('\n📋 Current category values:');
        const [users] = await db.execute('SELECT id, name, category FROM users WHERE role = "business" LIMIT 10');
        
        users.forEach(user => {
            console.log(`ID: ${user.id}, Name: ${user.name}, Category: "${user.category}" (Length: ${user.category ? user.category.length : 0})`);
        });

        // Test what happens with a long category string
        const testCategories = 'Manufacturing,Trading,Import/Export,E-commerce,Retail,Wholesale,Agriculture,Textiles,Electronics,Automotive,Healthcare,Food & Beverages';
        console.log(`\n🧪 Test category string: "${testCategories}"`);
        console.log(`Length: ${testCategories.length} characters`);

        console.log('\n✨ Analysis completed!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await db.end();
    }
};

// Run the check
checkCategoryColumn();