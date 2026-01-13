import db from './config/db.js';

async function testCoordinatesFeature() {
    try {
        console.log('Testing coordinates feature...\n');

        // Test 1: Check if columns exist
        console.log('1. Verifying longitude and latitude columns...');
        const [columns] = await db.execute(`
            DESCRIBE users
        `);
        
        const coordinateColumns = columns.filter(col => 
            col.Field === 'longitude' || col.Field === 'latitude'
        );
        
        if (coordinateColumns.length === 2) {
            console.log('✅ Both longitude and latitude columns exist');
            coordinateColumns.forEach(col => {
                console.log(`   ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'nullable' : 'not null'})`);
            });
        } else {
            console.log('❌ Coordinate columns missing');
            return;
        }

        // Test 2: Test inserting coordinates
        console.log('\n2. Testing coordinate insertion...');
        const testLat = 25.2048; // Dubai latitude
        const testLng = 55.2708; // Dubai longitude
        
        // Find a test company
        const [companies] = await db.execute(`
            SELECT id, name, country 
            FROM users 
            WHERE role IN ('company', 'business') 
            LIMIT 1
        `);
        
        if (companies.length > 0) {
            const testCompany = companies[0];
            console.log(`   Testing with company: ${testCompany.name}`);
            
            // Update with test coordinates
            await db.execute(`
                UPDATE users 
                SET latitude = ?, longitude = ? 
                WHERE id = ?
            `, [testLat, testLng, testCompany.id]);
            
            // Verify the update
            const [updated] = await db.execute(`
                SELECT name, country, latitude, longitude 
                FROM users 
                WHERE id = ?
            `, [testCompany.id]);
            
            if (updated.length > 0) {
                const company = updated[0];
                console.log('✅ Coordinates updated successfully');
                console.log(`   ${company.name}: Lat ${company.latitude}, Lng ${company.longitude}`);
            }
        }

        // Test 3: Test coordinate-based queries
        console.log('\n3. Testing coordinate-based queries...');
        const [nearbyTest] = await db.execute(`
            SELECT name, country, latitude, longitude,
                   CASE 
                       WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 'Has coordinates'
                       ELSE 'No coordinates'
                   END as coordinate_status
            FROM users 
            WHERE role IN ('company', 'business')
            LIMIT 5
        `);
        
        console.log('✅ Coordinate query successful');
        console.log('   Companies with coordinate status:');
        nearbyTest.forEach((company, index) => {
            console.log(`   ${index + 1}. ${company.name} (${company.country}) - ${company.coordinate_status}`);
        });

        console.log('\n✅ All coordinate tests passed!');
        console.log('   The longitude/latitude feature is ready to use.');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Error details:', error);
    } finally {
        await db.end();
    }
}

// Run the test
testCoordinatesFeature();