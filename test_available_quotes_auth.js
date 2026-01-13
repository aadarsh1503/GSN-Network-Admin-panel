// Test script to verify available quotes authentication on backend
import jwt from 'jsonwebtoken';
import db from './server/config/db.js';

const testAvailableQuotesAuth = async () => {
    try {
        console.log('🔍 Testing Available Quotes Authentication');
        console.log('==========================================');

        // Test 1: Check if we can find a company user
        console.log('\n📋 STEP 1: Find Company Users');
        const [companyUsers] = await db.execute(
            'SELECT id, name, email, role FROM users WHERE role = "company" LIMIT 5'
        );
        
        console.log('Company users found:', companyUsers.length);
        companyUsers.forEach(user => {
            console.log(`- ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
        });

        if (companyUsers.length === 0) {
            console.log('❌ No company users found! This might be the issue.');
            return;
        }

        // Test 2: Generate a valid token for a company user
        const testUser = companyUsers[0];
        console.log(`\n📋 STEP 2: Generate Token for User ${testUser.id}`);
        
        const token = jwt.sign(
            { id: testUser.id, role: testUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        
        console.log('Generated token:', token.substring(0, 50) + '...');

        // Test 3: Verify token can be decoded
        console.log('\n📋 STEP 3: Verify Token');
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('✅ Token verified successfully:', {
                id: decoded.id,
                role: decoded.role,
                exp: new Date(decoded.exp * 1000).toISOString()
            });
        } catch (error) {
            console.log('❌ Token verification failed:', error.message);
            return;
        }

        // Test 4: Check if user exists in database (simulate middleware)
        console.log('\n📋 STEP 4: Simulate Auth Middleware');
        const [userRows] = await db.execute(
            'SELECT id, name, email, role FROM users WHERE id = ?', 
            [testUser.id]
        );
        
        if (userRows.length === 0) {
            console.log('❌ User not found in database');
            return;
        }
        
        const dbUser = userRows[0];
        console.log('✅ User found in database:', {
            id: dbUser.id,
            role: dbUser.role,
            email: dbUser.email
        });

        // Test 5: Check role authorization
        console.log('\n📋 STEP 5: Check Role Authorization');
        const allowedRoles = ['company'];
        const isAuthorized = allowedRoles.includes(dbUser.role);
        console.log('Is authorized for company role:', isAuthorized);

        if (!isAuthorized) {
            console.log('❌ User role not authorized for available quotes');
            return;
        }

        // Test 6: Test the actual query from getAvailableQuotes
        console.log('\n📋 STEP 6: Test Available Quotes Query');
        
        // Get company location
        const [companyLocationRows] = await db.execute(
            'SELECT country, state, city, latitude, longitude FROM users WHERE id = ?',
            [testUser.id]
        );
        
        if (companyLocationRows.length === 0) {
            console.log('❌ Company location not found');
            return;
        }
        
        const companyLocation = companyLocationRows[0];
        console.log('Company location:', companyLocation);

        // Test the quotes query
        let locationFilter = '';
        let locationParams = [];
        
        if (companyLocation.country) {
            locationFilter = `AND (q.departure_country = ? OR q.arrival_country = ?)`;
            locationParams = [companyLocation.country, companyLocation.country];
        }

        const quotesSql = `
            SELECT q.*, 
                   COALESCE(u.name, q.contact_name) as user_name, 
                   COALESCE(u.email, q.contact_email) as user_email,
                   q.contact_phone as user_phone
            FROM quotes q 
            LEFT JOIN users u ON q.user_id = u.id 
            WHERE q.status IN ('pending', 'approved')
            AND (q.user_id != ? OR q.user_id IS NULL)
            AND NOT EXISTS (
                SELECT 1 FROM quote_responses qr 
                WHERE qr.quote_id = q.id AND qr.company_id = ?
            )
            AND NOT EXISTS (
                SELECT 1 FROM user_quote_status uqs 
                WHERE uqs.quote_id = q.id AND uqs.status = 'accepted'
            )
            ${locationFilter}
            ORDER BY q.created_at DESC
            LIMIT 10
        `;

        const finalParams = [
            testUser.id, testUser.id,
            ...locationParams
        ];

        const [quotes] = await db.execute(quotesSql, finalParams);
        console.log(`✅ Found ${quotes.length} available quotes`);
        
        if (quotes.length > 0) {
            console.log('Sample quote:', {
                id: quotes[0].id,
                departure_country: quotes[0].departure_country,
                arrival_country: quotes[0].arrival_country,
                product_description: quotes[0].product_description
            });
        }

        console.log('\n🎉 AUTHENTICATION TEST COMPLETED SUCCESSFULLY');
        console.log('The backend authentication should be working.');
        console.log('Issue might be on the frontend side.');

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        process.exit(0);
    }
};

testAvailableQuotesAuth();