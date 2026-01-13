import db from './config/db.js';

const testDisputeWithAttachment = async () => {
    try {
        console.log('🔍 Testing dispute creation with attachment simulation...');
        
        // Simulate creating a dispute and adding an attachment
        const businessUserId = 21; // adaersh user ID
        const companyId = 10; // Aadarsh-company
        const disputeReasonId = 1; // Breach of Contract
        
        console.log(`\n📋 Creating test dispute...`);
        console.log(`   Business User ID: ${businessUserId}`);
        console.log(`   Company ID: ${companyId}`);
        console.log(`   Dispute Reason ID: ${disputeReasonId}`);
        
        // Create a test dispute
        const [disputeResult] = await db.execute(`
            INSERT INTO disputes (
                user_id, company_id, dispute_reason_id, 
                title, description, priority
            ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
            businessUserId, 
            companyId, 
            disputeReasonId,
            'Test Dispute with Attachment',
            'This is a test dispute to verify attachment functionality',
            'medium'
        ]);
        
        const disputeId = disputeResult.insertId;
        console.log(`✅ Created dispute #${disputeId}`);
        
        // Add a test attachment
        const testImageUrl = 'https://res.cloudinary.com/ds1dt3qub/image/upload/v1234567890/dispute_attachments/test_image.jpg';
        
        const [attachmentResult] = await db.execute(`
            INSERT INTO dispute_images (dispute_id, image_url, image_type, uploaded_by, created_at)
            VALUES (?, ?, ?, 'user', NOW())
        `, [disputeId, testImageUrl, 'evidence']);
        
        console.log(`✅ Added attachment with ID: ${attachmentResult.insertId}`);
        
        // Verify the dispute shows up with attachment count
        const [verifyResult] = await db.execute(`
            SELECT 
                d.id,
                d.title,
                COUNT(di.id) as attachment_count
            FROM disputes d
            LEFT JOIN dispute_images di ON d.id = di.dispute_id
            WHERE d.id = ?
            GROUP BY d.id, d.title
        `, [disputeId]);
        
        if (verifyResult.length > 0) {
            const dispute = verifyResult[0];
            console.log(`\n✅ Verification successful:`);
            console.log(`   Dispute #${dispute.id}: ${dispute.title}`);
            console.log(`   Attachment count: ${dispute.attachment_count}`);
        }
        
        // Test the API query that the frontend uses
        console.log(`\n🔍 Testing frontend API query...`);
        const [apiResult] = await db.execute(`
            SELECT 
                d.id,
                d.title,
                d.description,
                d.status,
                d.priority,
                d.created_at,
                d.updated_at,
                c.name as company_name,
                dr.title as reason_title
            FROM disputes d
            JOIN users c ON d.company_id = c.id
            JOIN dispute_reasons dr ON d.dispute_reason_id = dr.id
            WHERE d.user_id = ? AND d.id = ?
            ORDER BY d.created_at DESC
        `, [businessUserId, disputeId]);
        
        if (apiResult.length > 0) {
            const dispute = apiResult[0];
            console.log(`✅ API query successful:`);
            console.log(`   Dispute: ${dispute.title}`);
            console.log(`   Company: ${dispute.company_name}`);
            console.log(`   Status: ${dispute.status}`);
            
            // Get images for this dispute
            const [images] = await db.execute(`
                SELECT id, image_url, image_type, created_at
                FROM dispute_images 
                WHERE dispute_id = ?
                ORDER BY created_at ASC
            `, [disputeId]);
            
            console.log(`   Images: ${images.length}`);
            images.forEach(img => {
                console.log(`     - ${img.image_url} (${img.image_type})`);
            });
        }
        
        console.log('\n✅ Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error testing dispute with attachment:', error);
    } finally {
        process.exit(0);
    }
};

testDisputeWithAttachment();