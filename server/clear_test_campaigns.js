// Clear existing test campaign records
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function clearTestCampaigns() {
    let connection;
    
    try {
        console.log('🔍 Connecting to database...');
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        console.log('✅ Database connected successfully!');
        
        // Show existing records
        const [existing] = await connection.execute("SELECT * FROM email_campaigns ORDER BY created_at DESC");
        console.log(`\n📋 Found ${existing.length} existing campaign records:`);
        existing.forEach((record, index) => {
            console.log(`  ${index + 1}. ID: ${record.id}, Subject: "${record.subject}", UserType: ${record.user_type}, Method: ${record.method}`);
        });
        
        // Clear all records
        console.log('\n🗑️ Clearing all campaign records...');
        const [deleteResult] = await connection.execute("DELETE FROM email_campaigns");
        console.log(`✅ Deleted ${deleteResult.affectedRows} records`);
        
        // Verify deletion
        const [afterDelete] = await connection.execute("SELECT COUNT(*) as count FROM email_campaigns");
        console.log(`📊 Records remaining: ${afterDelete[0].count}`);
        
    } catch (error) {
        console.error('❌ Error clearing campaigns:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

clearTestCampaigns();