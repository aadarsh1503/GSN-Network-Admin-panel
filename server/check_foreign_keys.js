// Check foreign key constraints
import db from './config/db.js';

async function checkForeignKeys() {
    try {
        console.log('✅ Connected to database');
        
        // Check foreign key constraints using REFERENTIAL_CONSTRAINTS table
        const [constraints] = await db.execute(`
            SELECT 
                rc.CONSTRAINT_NAME,
                rc.TABLE_NAME,
                kcu.COLUMN_NAME,
                rc.REFERENCED_TABLE_NAME,
                kcu.REFERENCED_COLUMN_NAME,
                rc.DELETE_RULE,
                rc.UPDATE_RULE
            FROM information_schema.REFERENTIAL_CONSTRAINTS rc
            JOIN information_schema.KEY_COLUMN_USAGE kcu 
                ON rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME 
                AND rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
            WHERE rc.CONSTRAINT_SCHEMA = DATABASE()
            AND rc.REFERENCED_TABLE_NAME = 'users'
            ORDER BY rc.TABLE_NAME, kcu.COLUMN_NAME
        `);
        
        console.log('\n🔗 Foreign keys referencing users table:');
        console.log('Table.Column -> Referenced_Table.Column (Delete Rule)');
        console.log('─'.repeat(70));
        
        constraints.forEach(constraint => {
            const deleteRule = constraint.DELETE_RULE || 'NO ACTION';
            const status = deleteRule === 'CASCADE' ? '✅' : '⚠️ ';
            console.log(`${status} ${constraint.TABLE_NAME}.${constraint.COLUMN_NAME} -> ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME} (${deleteRule})`);
        });
        
        // Count CASCADE vs non-CASCADE
        const cascadeCount = constraints.filter(c => c.DELETE_RULE === 'CASCADE').length;
        const totalCount = constraints.length;
        
        console.log('\n📊 Summary:');
        console.log(`   Total foreign keys: ${totalCount}`);
        console.log(`   CASCADE deletes: ${cascadeCount}`);
        console.log(`   Non-CASCADE: ${totalCount - cascadeCount}`);
        
        if (cascadeCount === totalCount) {
            console.log('\n🎉 All foreign keys have CASCADE delete! User deletion will automatically clean up all related data.');
        } else {
            console.log('\n⚠️  Some foreign keys don\'t have CASCADE delete. Manual cleanup may be needed.');
        }
        
    } catch (error) {
        console.error('❌ Error checking foreign keys:', error);
    } finally {
        process.exit(0);
    }
}

checkForeignKeys();