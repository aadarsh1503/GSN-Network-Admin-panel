// Debug script to test business profile save functionality
import db from './config/db.js';
import jwt from 'jsonwebtoken';

const debugBusinessProfileSave = async () => {
    try {
        console.log('🔍 Debugging Business Profile Save Issue...\n');

        // Get a business user
        const [businessUsers] = await db.execute(
            'SELECT * FROM users WHERE role = "business" LIMIT 1'
        );

        if (businessUsers.length === 0) {
            console.log('❌ No business users found');
            return;
        }

        const businessUser = businessUsers[0];
        console.log(`📊 Testing with business user: ${businessUser.name} (ID: ${businessUser.id})`);

        // Test the current profile structure
        console.log('\n📋 Current Profile Data:');
        console.log('Name:', businessUser.name);
        console.log('Email:', businessUser.email);
        console.log('Phone:', businessUser.phone);
        console.log('Category:', businessUser.category);
        console.log('Country:', businessUser.country);
        console.log('State:', businessUser.state);
        console.log('City:', businessUser.city);
        console.log('About Company:', businessUser.about_company);

        // Test update with minimal data
        console.log('\n🔄 Testing minimal profile update...');
        
        const testUpdateData = {
            name: businessUser.name || 'Test Business',
            email: businessUser.email,
            phone: businessUser.phone || '+1234567890',
            category: 'Manufacturing,Trading', // Test comma-separated categories
            country: businessUser.country || 'United States',
            state: businessUser.state || 'California',
            city: businessUser.city || 'Los Angeles',
            owner_name: businessUser.owner_name || null,
            owner_phone: businessUser.owner_phone || null,
            incharge_name: businessUser.incharge_name || null,
            incharge_phone: businessUser.incharge_phone || null,
            skype: businessUser.skype || null,
            website: businessUser.website || null,
            facebook: businessUser.facebook || null,
            twitter: businessUser.twitter || null,
            instagram: businessUser.instagram || null,
            linkedin: businessUser.linkedin || null,
            services: businessUser.services || null,
            map_location: businessUser.map_location || null,
            company_address: businessUser.company_address || null,
            about_company: businessUser.about_company || 'Test business description'
        };

        console.log('Test data to update:', JSON.stringify(testUpdateData, null, 2));

        // Simulate the update query
        const sql = `
            UPDATE users SET
                name = ?, email = ?, phone = ?, category = ?, country = ?, state = ?, city = ?,
                owner_name = ?, owner_phone = ?, incharge_name = ?, incharge_phone = ?,
                skype = ?, website = ?, facebook = ?, twitter = ?, instagram = ?, linkedin = ?,
                services = ?, map_location = ?, company_address = ?, about_company = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND role = 'business'
        `;

        const values = [
            testUpdateData.name, testUpdateData.email, testUpdateData.phone, testUpdateData.category, 
            testUpdateData.country, testUpdateData.state, testUpdateData.city,
            testUpdateData.owner_name, testUpdateData.owner_phone, testUpdateData.incharge_name, testUpdateData.incharge_phone,
            testUpdateData.skype, testUpdateData.website, testUpdateData.facebook, testUpdateData.twitter, 
            testUpdateData.instagram, testUpdateData.linkedin,
            testUpdateData.services, testUpdateData.map_location, testUpdateData.company_address, testUpdateData.about_company,
            businessUser.id
        ];

        console.log('\n📝 Executing SQL update...');
        console.log('SQL:', sql);
        console.log('Values:', values);

        const [result] = await db.execute(sql, values);

        if (result.affectedRows === 0) {
            console.log('❌ Profile update failed - no rows affected');
            console.log('Checking if user exists...');
            
            const [checkUser] = await db.execute(
                'SELECT id, role FROM users WHERE id = ?',
                [businessUser.id]
            );
            
            if (checkUser.length === 0) {
                console.log('❌ User not found in database');
            } else {
                console.log('✅ User exists:', checkUser[0]);
            }
        } else {
            console.log('✅ Profile updated successfully');
            console.log('Affected rows:', result.affectedRows);
        }

        // Verify the update
        console.log('\n🔍 Verifying update...');
        const [updatedRows] = await db.execute(
            'SELECT name, email, phone, category, country, about_company, updated_at FROM users WHERE id = ?',
            [businessUser.id]
        );

        if (updatedRows.length > 0) {
            const updated = updatedRows[0];
            console.log('📊 Updated Profile:');
            console.log('Name:', updated.name);
            console.log('Email:', updated.email);
            console.log('Phone:', updated.phone);
            console.log('Category:', updated.category);
            console.log('Country:', updated.country);
            console.log('About Company:', updated.about_company);
            console.log('Updated At:', updated.updated_at);
        }

        // Test email uniqueness check
        console.log('\n📧 Testing email uniqueness check...');
        const [emailCheck] = await db.execute(
            'SELECT id FROM users WHERE email = ? AND id != ?',
            [businessUser.email, businessUser.id]
        );

        if (emailCheck.length > 0) {
            console.log('❌ Email conflict detected:', emailCheck);
        } else {
            console.log('✅ Email is unique');
        }

        console.log('\n✨ Debug test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error during debugging:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        });
    } finally {
        await db.end();
    }
};

// Run the debug test
debugBusinessProfileSave();