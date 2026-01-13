// Temporarily remove the constraint to allow debugging
import db from './server/config/db.js';

async function removeConstraintTemporarily() {
    try {
        console.log('🔧 Temporarily removing constraint to debug the issue...\n');
        
        // Remove the constraint
        try {
            await db.execute(`
                ALTER TABLE user_subscriptions 
                DROP CONSTRAINT chk_no_guest_subscriptions
            `);
            console.log('✅ Constraint removed successfully');
        } catch (error) {
            if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
                console.log('ℹ️ Constraint does not exist or already removed');
            } else {
                console.log('⚠️ Error removing constraint:', error.message);
            }
        }
        
        console.log('\n💡 Now you can test the deletion to see what happens');
        console.log('💡 After testing, run the comprehensive fix again to add the constraint back');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

removeConstraintTemporarily();