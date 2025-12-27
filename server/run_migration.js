import db from './config/db.js';
import fs from 'fs';
import path from 'path';

const runMigration = async () => {
    try {
        console.log('Running database migration...');
        
        // Read the SQL file
        const sqlFile = fs.readFileSync('./add_incharge_image_column.sql', 'utf8');
        
        // Execute the SQL
        await db.execute(sqlFile);
        
        console.log('Migration completed successfully!');
        console.log('Added incharge_image column to users table.');
        
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

runMigration();