import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
    host: '92.112.181.224',
    user: 'gsnuser',
    password: 'sCp@/2I1D3w',
    database: 'GSN'
};

async function checkSubscriptionTable() {
    let connection;
    
    try {
        console.log('🔍 Checking user_subscriptions table structure...\n');
        
        // Connect to database
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Database connected successfully\n');
        
        // Check table structure
        const [tableInfo] = await connection.execute(`
            DESCRIBE user_subscriptions
        `);
        
        console.log('📋 User_subscriptions table structure:');
        tableInfo.forEach(column => {
            console.log(`  - ${column.Field}: ${column.Type} ${column.Null === 'YES' ? '(nullable)' : '(not null)'} ${column.Key ? `[${column.Key}]` : ''}`);
        });
        
        // Check sample data
        console.log('\n📊 Sample subscription data:');
        const [sampleData] = await connection.execute(`
            SELECT * FROM user_subscriptions LIMIT 3
        `);
        
        if (sampleData.length > 0) {
            console.log('Sample records:');
            sampleData.forEach((record, index) => {
                console.log(`  Record ${index + 1}:`, record);
            });
        } else {
            console.log('  No subscription records found');
        }
        
        // Check if there's a membership_plans table
        console.log('\n🔍 Checking for membership_plans table...');
        try {
            const [plansInfo] = await connection.execute(`
                DESCRIBE membership_plans
            `);
            console.log('✅ Membership_plans table exists:');
            plansInfo.forEach(column => {
                console.log(`  - ${column.Field}: ${column.Type}`);
            });
            
            // Check sample plans data
            const [plansData] = await connection.execute(`
                SELECT * FROM membership_plans LIMIT 3
            `);
            if (plansData.length > 0) {
                console.log('\nSample plans:');
                plansData.forEach((plan, index) => {
                    console.log(`  Plan ${index + 1}:`, plan);
                });
            }
        } catch (error) {
            console.log('⚠️ Membership_plans table might not exist:', error.message);
        }
        
        console.log('\n🎉 Table structure check completed!');
        
    } catch (error) {
        console.error('❌ Error during checking:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run the check
checkSubscriptionTable();