// Setup cascading delete constraints
import db from './config/db.js';
import fs from 'fs';

async function setupCascadingDeletes() {
    try {
        console.log('✅ Connected to database');
        
        // Read the SQL file
        const sqlContent = fs.readFileSync('./add_cascading_deletes.sql', 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('SELECT'));
        
        console.log(`📋 Executing ${statements.length} SQL statements...`);
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                try {
                    await db.execute(statement);
                    console.log(`✅ Statement ${i + 1} executed successfully`);
                } catch (error) {
                    // Some errors are expected (like dropping non-existent constraints)
                    if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY' || 
                        error.code === 'ER_DROP_INDEX_FK' ||
                        error.message.includes('check that column/key exists')) {
                        console.log(`ℹ️  Statement ${i + 1} skipped (constraint doesn't exist)`);
                    } else {
                        console.log(`⚠️  Statement ${i + 1} warning:`, error.message);
                    }
                }
            }
        }
        
        console.log('\n🎉 Cascading delete setup completed!');
        
        // Test the constraints by showing current foreign keys
        console.log('\n📋 Checking foreign key constraints...');
        
        const [constraints] = await db.execute(`
            SELECT 
                TABLE_NAME,
                COLUMN_NAME,
                CONSTRAINT_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME,
                DELETE_RULE
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE REFERENCED_TABLE_SCHEMA = DATABASE()
            AND REFERENCED_TABLE_NAME = 'users'
            ORDER BY TABLE_NAME, COLUMN_NAME
        `);
        
        console.log('\n🔗 Foreign keys referencing users table:');
        constraints.forEach(constraint => {
            console.log(`  ${constraint.TABLE_NAME}.${constraint.COLUMN_NAME} -> ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME} (${constraint.DELETE_RULE || 'NO ACTION'})`);
        });
        
    } catch (error) {
        console.error('❌ Error setting up cascading deletes:', error);
    } finally {
        process.exit(0);
    }
}

setupCascadingDeletes();