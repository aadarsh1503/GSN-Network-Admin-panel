// Check user_subscriptions table schema to see payment_status column constraints
import dotenv from 'dotenv';
dotenv.config();

import db from './config/db.js';

async function checkSubscriptionTableSchema() {
  try {
    console.log('🔍 Checking user_subscriptions table structure...');
    
    // Get table structure
    const [columns] = await db.execute('SHOW COLUMNS FROM user_subscriptions');
    
    console.log('📋 Table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}) ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
      if (col.Type.includes('enum')) {
        console.log(`    Enum values: ${col.Type}`);
      }
    });
    
    // Check existing payment_status values
    const [statusValues] = await db.execute(`
      SELECT DISTINCT payment_status, COUNT(*) as count 
      FROM user_subscriptions 
      GROUP BY payment_status
    `);
    
    console.log('\n📊 Existing payment_status values:');
    statusValues.forEach(status => {
      console.log(`  - "${status.payment_status}": ${status.count} records`);
    });
    
    // Check membership plans
    const [plans] = await db.execute('SELECT id, name, price FROM membership_plans ORDER BY price ASC');
    
    console.log('\n📦 Available membership plans:');
    plans.forEach(plan => {
      console.log(`  - ID: ${plan.id}, Name: ${plan.name}, Price: $${plan.price}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
  } finally {
    await db.end();
  }
}

checkSubscriptionTableSchema();