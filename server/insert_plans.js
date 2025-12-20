import db from './config/db.js';

const insertPlans = async () => {
  try {
    console.log('🚀 Inserting membership plans...');
    
    const plans = [
      {
        id: 1,
        name: 'Guest',
        description: 'Free basic access for new users to explore the platform',
        price: 0.00,
        duration_months: 0,
        features: JSON.stringify(['Browse company directory', 'View company profiles', 'Submit up to 5 quote requests', 'Basic email support', 'Access to help documentation', 'Mobile app access']),
        max_quotes: 5,
        max_responses: 0,
        directory_listing: 0,
        priority_support: 0,
        is_active: 1
      },
      {
        id: 2,
        name: 'Starter',
        description: 'Perfect for small businesses and individual entrepreneurs',
        price: 29.99,
        duration_months: 1,
        features: JSON.stringify(['Basic directory listing', 'Unlimited quote submissions', '15 quote responses per month', 'Email support', 'Basic analytics dashboard', 'Mobile app access', 'Quote tracking', 'Company profile customization']),
        max_quotes: -1,
        max_responses: 15,
        directory_listing: 1,
        priority_support: 0,
        is_active: 1
      },
      {
        id: 3,
        name: 'Basic',
        description: 'Essential features for growing businesses with moderate volume',
        price: 49.99,
        duration_months: 1,
        features: JSON.stringify(['Enhanced directory listing', 'Unlimited quote submissions', '50 quote responses per month', 'Priority email support', 'Advanced analytics dashboard', 'Mobile app access', 'Quote tracking & management', 'Company profile with gallery', 'Customer review management', 'Basic API access']),
        max_quotes: -1,
        max_responses: 50,
        directory_listing: 1,
        priority_support: 0,
        is_active: 1
      },
      {
        id: 4,
        name: 'Professional',
        description: 'Advanced features for established businesses with high volume',
        price: 99.99,
        duration_months: 1,
        features: JSON.stringify(['Premium directory listing', 'Unlimited quote submissions', '150 quote responses per month', 'Priority phone & email support', 'Advanced analytics & reporting', 'Mobile app access', 'Quote automation tools', 'Enhanced company profile', 'Customer review management', 'Full API access', 'Integration support', 'Custom branding options']),
        max_quotes: -1,
        max_responses: 150,
        directory_listing: 1,
        priority_support: 1,
        is_active: 1
      },
      {
        id: 5,
        name: 'Enterprise',
        description: 'Complete solution for large organizations and enterprises',
        price: 199.99,
        duration_months: 1,
        features: JSON.stringify(['Featured directory listing', 'Unlimited quote submissions', 'Unlimited quote responses', '24/7 priority support', 'Dedicated account manager', 'Advanced analytics & custom reports', 'Mobile app access', 'Quote automation & AI tools', 'Premium company profile', 'Review management system', 'Full API access', 'Custom integrations', 'White-label options', 'Multi-location support', 'Team collaboration tools']),
        max_quotes: -1,
        max_responses: -1,
        directory_listing: 1,
        priority_support: 1,
        is_active: 1
      }
    ];

    // Clear existing plans (optional)
    console.log('🗑️ Clearing existing plans...');
    await db.execute('DELETE FROM user_subscriptions');
    await db.execute('DELETE FROM membership_plans');
    await db.execute('ALTER TABLE membership_plans AUTO_INCREMENT = 1');

    // Insert new plans
    console.log('📝 Inserting new plans...');
    for (const plan of plans) {
      await db.execute(
        `INSERT INTO membership_plans 
         (id, name, description, price, duration_months, features, max_quotes, max_responses, directory_listing, priority_support, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [plan.id, plan.name, plan.description, plan.price, plan.duration_months, plan.features, plan.max_quotes, plan.max_responses, plan.directory_listing, plan.priority_support, plan.is_active]
      );
      console.log(`✅ Inserted: ${plan.name}`);
    }

    console.log('🎉 Successfully inserted', plans.length, 'membership plans');
    
    // Verify
    console.log('\n📊 Current plans in database:');
    const [result] = await db.execute('SELECT id, name, price, max_responses, is_active FROM membership_plans ORDER BY price ASC');
    console.table(result);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.end();
    process.exit(0);
  }
};

insertPlans();