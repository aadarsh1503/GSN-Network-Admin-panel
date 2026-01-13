// Test subscription deletion to identify the 500 error
import db from './server/config/db.js';

async function testSubscriptionDeletion() {
    try {
        console.log('🧪 Testing subscription deletion for ID 33...\n');
        
        // First, check if subscription 33 exists
        const [subscription] = await db.execute(`
            SELECT us.*, u.name as user_name, u.email as user_email, u.role as user_role
            FROM user_subscriptions us
            JOIN users u ON us.user_id = u.id
            WHERE us.id = 33
        `);
        
        if (subscription.length === 0) {
            console.log('❌ Subscription ID 33 not found');
            return;
        }
        
        console.log('📋 Found subscription:');
        console.log(`  - ID: ${subscription[0].id}`);
        console.log(`  - User: ${subscription[0].user_name} (${subscription[0].user_email})`);
        console.log(`  - Amount: $${subscription[0].amount_paid}`);
        console.log('');
        
        // Test the deletion process step by step
        console.log('🔍 Testing deletion process...');
        
        // Get a connection for transaction
        const connection = await db.getConnection();
        
        try {
            // Start transaction
            await connection.beginTransaction();
            console.log('✅ Transaction started');
            
            // Try to delete the subscription
            const deleteSubscriptionSql = 'DELETE FROM user_subscriptions WHERE id = ?';
            const [deleteResult] = await connection.execute(deleteSubscriptionSql, [33]);
            
            console.log(`✅ Deletion successful: ${deleteResult.affectedRows} rows affected`);
            
            // Rollback to not actually delete it
            await connection.rollback();
            console.log('✅ Transaction rolled back (subscription preserved)');
            
        } catch (error) {
            await connection.rollback();
            console.error('❌ Error during deletion:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
        } finally {
            connection.release();
        }
        
        // Check if there are any foreign key constraints
        console.log('\n🔍 Checking foreign key constraints...');
        const [constraints] = await db.execute(`
            SELECT 
                CONSTRAINT_NAME,
                TABLE_NAME,
                COLUMN_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE REFERENCED_TABLE_NAME = 'user_subscriptions'
            AND TABLE_SCHEMA = DATABASE()
        `);
        
        if (constraints.length > 0) {
            console.log('⚠️ Found foreign key constraints:');
            constraints.forEach(constraint => {
                console.log(`  - ${constraint.TABLE_NAME}.${constraint.COLUMN_NAME} → ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}`);
            });
        } else {
            console.log('✅ No foreign key constraints found');
        }
        
        // Check if there are any check constraints
        console.log('\n🔍 Checking check constraints...');
        const [checkConstraints] = await db.execute(`
            SELECT 
                CONSTRAINT_NAME,
                CHECK_CLAUSE
            FROM information_schema.CHECK_CONSTRAINTS 
            WHERE CONSTRAINT_SCHEMA = DATABASE()
            AND TABLE_NAME = 'user_subscriptions'
        `);
        
        if (checkConstraints.length > 0) {
            console.log('⚠️ Found check constraints:');
            checkConstraints.forEach(constraint => {
                console.log(`  - ${constraint.CONSTRAINT_NAME}: ${constraint.CHECK_CLAUSE}`);
            });
        } else {
            console.log('✅ No check constraints found');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testSubscriptionDeletion();