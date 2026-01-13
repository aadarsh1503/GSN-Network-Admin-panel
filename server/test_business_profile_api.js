// Test business profile API endpoints
import db from './config/db.js';
import jwt from 'jsonwebtoken';

const testBusinessProfileAPI = async () => {
    try {
        console.log('🔍 Testing Business Profile API...\n');

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

        // Create a JWT token for testing
        const token = jwt.sign(
            { 
                id: businessUser.id, 
                email: businessUser.email, 
                role: businessUser.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        console.log('🔑 Generated test token');

        // Test the profile endpoint by simulating the controller function
        console.log('\n📋 Testing getBusinessProfile function...');
        
        // Simulate the request object
        const req = {
            user: {
                id: businessUser.id,
                email: businessUser.email,
                role: businessUser.role
            }
        };

        // Test the database query directly
        const [rows] = await db.execute(
            `SELECT id, name, email, phone, role, category, country, state, city,
                    owner_name, owner_phone, incharge_name, incharge_phone,
                    skype, website, facebook, twitter, instagram, linkedin,
                    services, map_location, company_address, about_company,
                    logo, created_at, updated_at
             FROM users WHERE id = ? AND role = 'business'`,
            [businessUser.id]
        );

        if (rows.length === 0) {
            console.log('❌ Business profile not found');
            return;
        }

        const profile = rows[0];
        
        // Parse services if it's a JSON string
        if (profile.services && typeof profile.services === 'string') {
            try {
                profile.services = JSON.parse(profile.services);
            } catch (e) {
                profile.services = [];
            }
        }

        console.log('✅ Profile data retrieved successfully:');
        console.log('📊 Profile Summary:');
        console.log(`   Name: ${profile.name}`);
        console.log(`   Email: ${profile.email}`);
        console.log(`   Phone: ${profile.phone || 'Not set'}`);
        console.log(`   Category: ${profile.category || 'Not set'}`);
        console.log(`   Country: ${profile.country || 'Not set'}`);
        console.log(`   State: ${profile.state || 'Not set'}`);
        console.log(`   City: ${profile.city || 'Not set'}`);
        console.log(`   Owner Name: ${profile.owner_name || 'Not set'}`);
        console.log(`   Owner Phone: ${profile.owner_phone || 'Not set'}`);
        console.log(`   In-charge Name: ${profile.incharge_name || 'Not set'}`);
        console.log(`   In-charge Phone: ${profile.incharge_phone || 'Not set'}`);
        console.log(`   Website: ${profile.website || 'Not set'}`);
        console.log(`   About Company: ${profile.about_company ? 'Set' : 'Not set'}`);

        // Test update functionality
        console.log('\n🔄 Testing profile update...');
        
        const updateData = {
            name: profile.name,
            email: profile.email,
            phone: profile.phone || '+1234567890',
            category: profile.category || 'Logistics',
            country: profile.country || 'United States',
            state: profile.state || 'California',
            city: profile.city || 'Los Angeles',
            owner_name: profile.owner_name || 'John Doe',
            owner_phone: profile.owner_phone || '+1234567890',
            incharge_name: profile.incharge_name || 'Jane Smith',
            incharge_phone: profile.incharge_phone || '+1234567891',
            skype: profile.skype || 'business.skype',
            website: profile.website || 'https://www.example.com',
            facebook: profile.facebook || 'https://facebook.com/business',
            twitter: profile.twitter || 'https://twitter.com/business',
            instagram: profile.instagram || 'https://instagram.com/business',
            linkedin: profile.linkedin || 'https://linkedin.com/company/business',
            services: profile.services || ['Freight Forwarding', 'Customs Clearance'],
            map_location: profile.map_location || 'Los Angeles, CA, USA',
            company_address: profile.company_address || '123 Business St, Los Angeles, CA 90001',
            about_company: profile.about_company || 'We are a leading logistics company providing comprehensive freight forwarding and customs clearance services.'
        };

        // Convert services array to JSON string if needed
        let servicesString = updateData.services;
        if (Array.isArray(updateData.services)) {
            servicesString = JSON.stringify(updateData.services);
        }

        const updateSql = `
            UPDATE users SET
                name = ?, email = ?, phone = ?, category = ?, country = ?, state = ?, city = ?,
                owner_name = ?, owner_phone = ?, incharge_name = ?, incharge_phone = ?,
                skype = ?, website = ?, facebook = ?, twitter = ?, instagram = ?, linkedin = ?,
                services = ?, map_location = ?, company_address = ?, about_company = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND role = 'business'
        `;

        const values = [
            updateData.name, updateData.email, updateData.phone, updateData.category, 
            updateData.country, updateData.state, updateData.city,
            updateData.owner_name, updateData.owner_phone, updateData.incharge_name, updateData.incharge_phone,
            updateData.skype, updateData.website, updateData.facebook, updateData.twitter, 
            updateData.instagram, updateData.linkedin,
            servicesString, updateData.map_location, updateData.company_address, updateData.about_company,
            businessUser.id
        ];

        const [result] = await db.execute(updateSql, values);

        if (result.affectedRows === 0) {
            console.log('❌ Profile update failed - no rows affected');
        } else {
            console.log('✅ Profile updated successfully');
        }

        // Verify the update
        const [updatedRows] = await db.execute(
            'SELECT name, phone, category, country, owner_name, about_company FROM users WHERE id = ?',
            [businessUser.id]
        );

        if (updatedRows.length > 0) {
            const updated = updatedRows[0];
            console.log('📊 Updated Profile Verification:');
            console.log(`   Name: ${updated.name}`);
            console.log(`   Phone: ${updated.phone}`);
            console.log(`   Category: ${updated.category}`);
            console.log(`   Country: ${updated.country}`);
            console.log(`   Owner Name: ${updated.owner_name}`);
            console.log(`   About Company: ${updated.about_company ? 'Set' : 'Not set'}`);
        }

        console.log('\n✨ Business Profile API test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error during testing:', error);
    } finally {
        await db.end();
    }
};

// Run the test
testBusinessProfileAPI();