import db from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const checkCompanies = async () => {
  try {
    console.log('🔍 Checking companies in database...');
    
    const [companies] = await db.execute(`
      SELECT id, name, email, country, state, city, role, status, is_blacklisted
      FROM users 
      WHERE role = 'company'
      ORDER BY id
    `);
    
    console.log(`\n📊 Found ${companies.length} companies:`);
    
    companies.forEach((company, index) => {
      console.log(`\n${index + 1}. ${company.name || 'No Name'}`);
      console.log(`   Email: ${company.email || 'No Email'}`);
      console.log(`   Location: ${company.country || 'N/A'}, ${company.state || 'N/A'}, ${company.city || 'N/A'}`);
      console.log(`   Status: ${company.status === 1 ? 'Active' : 'Inactive'}`);
      console.log(`   Blacklisted: ${company.is_blacklisted ? 'Yes' : 'No'}`);
    });
    
    // Check active companies that would receive emails
    const [activeCompanies] = await db.execute(`
      SELECT id, name, email, country
      FROM users 
      WHERE role = 'company' 
      AND status = 1 
      AND is_blacklisted = 0
      AND email IS NOT NULL
    `);
    
    console.log(`\n✅ Active companies eligible for emails: ${activeCompanies.length}`);
    
    if (activeCompanies.length > 0) {
      console.log('\n📧 Companies that would receive quote emails:');
      activeCompanies.forEach((company, index) => {
        console.log(`${index + 1}. ${company.name} (${company.email}) - ${company.country}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkCompanies();