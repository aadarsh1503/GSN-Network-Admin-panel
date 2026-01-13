const mysql = require('mysql2/promise');
require('dotenv').config();

const checkRecentAttachments = async () => {
    try {
        console.log('🔍 Checking recent dispute attachments...');
        
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        console.log('✅ MySQL Database connected successfully!');
        
        // Check recent attachments
        const [attachments] = await connection.execute(`
            SELECT 
                di.id,
                di.dispute_id,
                di.image_url,
                di.image_type,
                di.uploaded_by,
                di.created_at,
                d.title as dispute_title,
                u.name as user_name
            FROM dispute_images di
            JOIN disputes d ON di.dispute_id = d.id
            JOIN users u ON d.user_id = u.id
            ORDER BY di.created_at DESC
            LIMIT 5
        `);
        
        console.log('\n📸 Recent dispute attachments:');
        attachments.forEach(attachment => {
            console.log(`   Attachment ID: ${attachment.id}`);
            console.log(`   Dispute: #${attachment.dispute_id} - ${attachment.dispute_title}`);
            console.log(`   User: ${attachment.user_name}`);
            console.log(`   Image URL: ${attachment.image_url}`);
            console.log(`   Type: ${attachment.image_type}`);
            console.log(`   Uploaded: ${attachment.created_at}`);
            console.log('   ---');
        });
        
        await connection.end();
        console.log('\n✅ Check completed successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

checkRecentAttachments();