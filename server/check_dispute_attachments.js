import db from './config/db.js';

const checkDisputeAttachments = async () => {
    try {
        console.log('🔍 Checking dispute attachments in database...');
        
        // Check dispute_images table
        const [images] = await db.execute(`
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
            LIMIT 20
        `);
        
        console.log(`\n📋 Found ${images.length} attachments in dispute_images table:`);
        
        if (images.length === 0) {
            console.log('   No attachments found in database');
        } else {
            images.forEach(img => {
                console.log(`   Image ID ${img.id}:`);
                console.log(`     Dispute: #${img.dispute_id} - ${img.dispute_title}`);
                console.log(`     User: ${img.user_name}`);
                console.log(`     URL: ${img.image_url}`);
                console.log(`     Type: ${img.image_type}`);
                console.log(`     Uploaded by: ${img.uploaded_by}`);
                console.log(`     Created: ${img.created_at}`);
                console.log('');
            });
        }
        
        // Check recent disputes and their image counts
        const [disputesWithImages] = await db.execute(`
            SELECT 
                d.id,
                d.title,
                u.name as user_name,
                COUNT(di.id) as image_count
            FROM disputes d
            JOIN users u ON d.user_id = u.id
            LEFT JOIN dispute_images di ON d.id = di.dispute_id
            WHERE u.role = 'business'
            GROUP BY d.id, d.title, u.name
            ORDER BY d.created_at DESC
            LIMIT 10
        `);
        
        console.log('\n📊 Recent business disputes with image counts:');
        disputesWithImages.forEach(dispute => {
            console.log(`   Dispute #${dispute.id}: ${dispute.title}`);
            console.log(`     User: ${dispute.user_name}`);
            console.log(`     Images: ${dispute.image_count}`);
            console.log('');
        });
        
        console.log('\n✅ Attachment check completed!');
        
    } catch (error) {
        console.error('❌ Error checking dispute attachments:', error);
    } finally {
        process.exit(0);
    }
};

checkDisputeAttachments();