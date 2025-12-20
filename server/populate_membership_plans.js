// populate_membership_plans.js
// Script to populate membership plans data

import db from './config/db.js';
import fs from 'fs';
import path from 'path';

const populateMembershipPlans = async () => {
    try {
        console.log('🚀 Starting membership plans population...');

        // Read the SQL file
        const sqlFile = fs.readFileSync('./MEMBERSHIP_PLANS_DATA.sql', 'utf8');
        
        // Split by semicolons and filter out empty statements
        const statements = sqlFile
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));

        console.log(`📝 Found ${statements.length} SQL statements to execute`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            // Skip comments and empty lines
            if (statement.startsWith('--') || statement.startsWith('/*') || statement.trim() === '') {
                continue;
            }

            try {
                console.log(`⚡ Executing statement ${i + 1}/${statements.length}`);
                await db.execute(statement);
                console.log(`✅ Statement ${i + 1} executed successfully`);
            } catch (error) {
                console.error(`❌ Error executing statement ${i + 1}:`, error.message);
                console.log('Statement:', statement.substring(0, 100) + '...');
            }
        }

        // Verify the data
        console.log('\n📊 Verifying membership plans data...');
        const [plans] = await db.execute('SELECT id, name, price, duration_months, is_active FROM membership_plans ORDER BY price ASC');
        
        console.log('\n🎯 Current Membership Plans:');
        console.table(plans);

        console.log('\n✨ Membership plans population completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Visit /admin/manage-Subscription to view all plans');
        console.log('2. Visit /subscriptions to see user-facing plans');
        console.log('3. Test creating/editing plans through admin interface');

    } catch (error) {
        console.error('💥 Error populating membership plans:', error);
    } finally {
        // Close database connection
        await db.end();
        process.exit(0);
    }
};

// Run the script
populateMembershipPlans();