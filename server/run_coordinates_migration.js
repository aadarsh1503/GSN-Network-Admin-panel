import db from './config/db.js';
import fs from 'fs';

async function runCoordinatesMigration() {
    try {
        console.log('Running coordinates migration...\n');

        // Check if columns already exist
        console.log('1. Checking if longitude and latitude columns exist...');
        const [columns] = await db.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME IN ('longitude', 'latitude')
        `);

        if (columns.length > 0) {
            console.log('✅ Longitude and latitude columns already exist');
            console.log('   Existing columns:', columns.map(col => col.COLUMN_NAME).join(', '));
        } else {
            console.log('   Columns do not exist, adding them...');
            
            // Add longitude column
            await db.execute(`
                ALTER TABLE users 
                ADD COLUMN longitude DECIMAL(10, 8) DEFAULT NULL COMMENT 'Longitude coordinate for precise location'
            `);
            console.log('   ✅ Added longitude column');

            // Add latitude column
            await db.execute(`
                ALTER TABLE users 
                ADD COLUMN latitude DECIMAL(10, 8) DEFAULT NULL COMMENT 'Latitude coordinate for precise location'
            `);
            console.log('   ✅ Added latitude column');

            // Add index for better performance
            await db.execute(`
                CREATE INDEX idx_users_coordinates ON users(latitude, longitude)
            `);
            console.log('   ✅ Added coordinate index');
        }

        // Test the new columns
        console.log('\n2. Testing the new columns...');
        const [testResult] = await db.execute(`
            SELECT id, name, country, longitude, latitude 
            FROM users 
            WHERE role IN ('company', 'business') 
            LIMIT 3
        `);

        console.log('✅ Test query successful');
        console.log('   Sample data:');
        testResult.forEach((row, index) => {
            console.log(`   ${index + 1}. ${row.name} (${row.country}) - Lat: ${row.latitude || 'null'}, Lng: ${row.longitude || 'null'}`);
        });

        console.log('\n✅ Coordinates migration completed successfully!');
        console.log('   Companies can now add precise GPS coordinates to their profiles.');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Error details:', error);
    } finally {
        await db.end();
    }
}

// Run the migration
runCoordinatesMigration();