// Update email_notifications enum to include new types
import db from './config/db.js';

async function updateEmailEnum() {
    try {
        console.log('Updating email_notifications type enum...');
        
        await db.execute(`
            ALTER TABLE email_notifications 
            MODIFY COLUMN type ENUM('quote_response','status_update','acceptance','rejection','user_acceptance','general') 
            DEFAULT 'general'
        `);
        
        console.log('✅ Email type enum updated successfully!');
        
        // Verify the change
        const [rows] = await db.execute('DESCRIBE email_notifications');
        const typeField = rows.find(row => row.Field === 'type');
        console.log('New type field definition:', typeField.Type);
        
    } catch (error) {
        console.error('❌ Error updating email enum:', error);
    } finally {
        process.exit(0);
    }
}

updateEmailEnum();