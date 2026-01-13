const mysql = require('mysql2/promise');
require('dotenv').config();

const checkDispute24 = async () => {
    try {
        console.log('🔍 Checking Dispute #24 details...');
        
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        console.log('✅ MySQL Database connected successfully!');
        
        // Get dispute details
        const [disputes] = await connection.execute(`
            SELECT 
                d.id,
                d.title,
                d.description,
                d.status,
                d.created_at,
                u.name as user_name,
                c.name as company_name
            FROM disputes d
            JOIN users u ON d.user_id = u.id
            JOIN users c ON d.company_id = c.id
            WHERE d.id = 24
        `);
        
        if (disputes.length === 0) {
            console.log('❌ Dispute #24 not found');
            return;
        }
        
        const dispute = disputes[0];
        console.log('\n📋 Dispute #24 Details:');
        console.log(`   Title: ${dispute.title}`);
        console.log(`   Description: ${dispute.description}`);
        console.log(`   Status: ${dispute.status}`);
        console.log(`   Filed by: ${dispute.user_name}`);
        console.log(`   Against: ${dispute.company_name}`);
        console.log(`   Created: ${dispute.created_at}`);
        
        // Get attachments for this dispute
        const [attachments] = await connection.execute(`
            SELECT 
                id,
                image_url,
                image_type,
                uploaded_by,
                created_at
            FROM dispute_images
            WHERE dispute_id = 24
            ORDER BY created_at DESC
        `);
        
        console.log('\n📸 Attachments for Dispute #24:');
        if (attachments.length === 0) {
            console.log('   No attachments found');
        } else {
            attachments.forEach((attachment, index) => {
                console.log(`   Attachment ${index + 1}:`);
                console.log(`     ID: ${attachment.id}`);
                console.log(`     URL: ${attachment.image_url}`);
                console.log(`     Type: ${attachment.image_type}`);
                console.log(`     Uploaded by: ${attachment.uploaded_by}`);
                console.log(`     Created: ${attachment.created_at}`);
                console.log('     ---');
            });
        }
        
        await connection.end();
        console.log('\n✅ Check completed successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

checkDispute24();