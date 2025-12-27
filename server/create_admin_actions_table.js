// Create admin_actions table for logging admin activities
import db from './config/db.js';

async function createAdminActionsTable() {
    try {
        console.log('✅ Connected to database');
        
        // Create admin_actions table
        const createTableSql = `
            CREATE TABLE IF NOT EXISTS admin_actions (
                id int(11) NOT NULL AUTO_INCREMENT,
                admin_id int(11) NOT NULL,
                action_type varchar(100) NOT NULL,
                target_user_id int(11) DEFAULT NULL,
                reason text DEFAULT NULL,
                created_at timestamp DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_admin_id (admin_id),
                INDEX idx_action_type (action_type),
                INDEX idx_created_at (created_at)
            )
        `;
        
        await db.execute(createTableSql);
        console.log('✅ admin_actions table created successfully');
        
        // Check if table exists and show structure
        const [tableInfo] = await db.execute('DESCRIBE admin_actions');
        console.log('\n📋 admin_actions table structure:');
        tableInfo.forEach(column => {
            console.log(`  ${column.Field}: ${column.Type} ${column.Null === 'NO' ? '(NOT NULL)' : ''} ${column.Key ? `(${column.Key})` : ''}`);
        });
        
    } catch (error) {
        console.error('❌ Error creating admin_actions table:', error);
    } finally {
        process.exit(0);
    }
}

createAdminActionsTable();