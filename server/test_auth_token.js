import jwt from 'jsonwebtoken';
import db from './config/db.js';

async function testAuthToken() {
  try {
    console.log('Testing authentication token...');
    
    // Check if there are any company users in the database
    const [companies] = await db.execute(`
        SELECT id, name, email, role, country, state, city 
        FROM users 
        WHERE role IN ('company', 'business') 
        LIMIT 5
    `);
    
    console.log('✅ Found', companies.length, 'company users:');
    companies.forEach((company, index) => {
        console.log(`   ${index + 1}. ${company.name} (${company.email}) - Role: ${company.role} - Location: ${company.country || 'No country'}`);
    });
    
    if (companies.length > 0) {
        // Generate a test token for the first company
        const testCompany = companies[0];
        const token = jwt.sign(
            { id: testCompany.id, email: testCompany.email, role: testCompany.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        console.log('\n✅ Generated test token for:', testCompany.name);
        console.log('Token:', token);
        
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Token verified successfully');
        console.log('Decoded payload:', decoded);
        
        console.log('\n📋 To test the frontend:');
        console.log('1. Open browser developer tools');
        console.log('2. Go to Application/Storage > Local Storage');
        console.log('3. Set token key with this value:');
        console.log(`   localStorage.setItem('token', '${token}');`);
        console.log('4. Refresh the page and try accessing available quotes');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await db.end();
  }
}

testAuthToken();