import db from './config/db.js';

async function addQuotesCoordinates() {
  try {
    console.log('Connected to database successfully!');
    
    // Check if columns already exist
    console.log('Checking if longitude and latitude columns exist in quotes table...');
    const [columns] = await db.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'quotes' 
        AND COLUMN_NAME IN ('longitude', 'latitude')
    `);

    if (columns.length > 0) {
        console.log('✅ Longitude and latitude columns already exist in quotes table');
        console.log('   Existing columns:', columns.map(col => col.COLUMN_NAME).join(', '));
    } else {
        console.log('   Columns do not exist, adding them...');
        
        // Add longitude column
        await db.execute(`
            ALTER TABLE quotes 
            ADD COLUMN longitude DECIMAL(10, 8) DEFAULT NULL COMMENT 'Longitude coordinate for quote location'
        `);
        console.log('   ✅ Added longitude column to quotes table');

        // Add latitude column
        await db.execute(`
            ALTER TABLE quotes 
            ADD COLUMN latitude DECIMAL(10, 8) DEFAULT NULL COMMENT 'Latitude coordinate for quote location'
        `);
        console.log('   ✅ Added latitude column to quotes table');

        // Add index for better performance
        await db.execute(`
            CREATE INDEX idx_quotes_coordinates ON quotes(latitude, longitude)
        `);
        console.log('   ✅ Added coordinate index to quotes table');
    }
    
    console.log('\n✅ Quotes coordinates migration completed successfully!');
    
  } catch (error) {
    console.error('Migration error:', error.message);
  } finally {
    await db.end();
  }
}

addQuotesCoordinates();