// Create sample data to test the modal functionality
import db from './config/db.js';

async function createSampleData() {
    try {
        console.log('✅ Connected to database');
        
        // Create sample users
        console.log('\n👥 Creating sample users...');
        const users = [
            { name: 'John Doe', email: 'john@example.com', role: 'user', country: 'USA', city: 'New York' },
            { name: 'Jane Smith', email: 'jane@example.com', role: 'user', country: 'Canada', city: 'Toronto' },
            { name: 'ABC Logistics', email: 'info@abclogistics.com', role: 'company', country: 'India', city: 'Mumbai' },
            { name: 'XYZ Shipping', email: 'contact@xyzshipping.com', role: 'company', country: 'UAE', city: 'Dubai' },
            { name: 'Business Owner', email: 'owner@business.com', role: 'business', country: 'UK', city: 'London' }
        ];

        const userIds = [];
        for (const user of users) {
            const [result] = await db.execute(`
                INSERT INTO users (name, email, phone, password, role, country, city, status, created_at)
                VALUES (?, ?, ?, 'password123', ?, ?, ?, 1, NOW())
            `, [user.name, user.email, '1234567890', user.role, user.country, user.city]);
            userIds.push(result.insertId);
            console.log(`✅ Created user: ${user.name} (ID: ${result.insertId})`);
        }

        // Create sample quotes
        console.log('\n📋 Creating sample quotes...');
        const quotes = [
            {
                user_id: userIds[0],
                shipping_mode: 'sea',
                departure_country: 'India',
                departure_city: 'Mumbai',
                arrival_country: 'USA',
                arrival_city: 'New York',
                product_description: 'Electronics components for manufacturing',
                status: 'running'
            },
            {
                user_id: userIds[1],
                shipping_mode: 'air',
                departure_country: 'Canada',
                departure_city: 'Toronto',
                arrival_country: 'Germany',
                arrival_city: 'Hamburg',
                product_description: 'Automotive parts and accessories',
                status: 'pending'
            },
            {
                user_id: userIds[4],
                shipping_mode: 'road',
                departure_country: 'UK',
                departure_city: 'London',
                arrival_country: 'France',
                arrival_city: 'Paris',
                product_description: 'Fashion and textile products',
                status: 'running'
            }
        ];

        const quoteIds = [];
        for (const quote of quotes) {
            const [result] = await db.execute(`
                INSERT INTO quotes (
                    user_id, shipping_mode, arrival_date, departure_country, departure_city,
                    arrival_country, arrival_city, product_description, status, created_at
                ) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY), ?, ?, ?, ?, ?, ?, NOW())
            `, [
                quote.user_id, quote.shipping_mode, quote.departure_country, quote.departure_city,
                quote.arrival_country, quote.arrival_city, quote.product_description, quote.status
            ]);
            quoteIds.push(result.insertId);
            console.log(`✅ Created quote: ${quote.product_description.substring(0, 30)}... (ID: ${result.insertId})`);
        }

        // Create sample quote responses
        console.log('\n💬 Creating sample quote responses...');
        for (let i = 0; i < quoteIds.length; i++) {
            const companyId = userIds[2]; // ABC Logistics
            const [result] = await db.execute(`
                INSERT INTO quote_responses (
                    quote_id, company_id, price, transit_time, inclusions, status, created_at
                ) VALUES (?, ?, ?, ?, ?, 'pending', NOW())
            `, [
                quoteIds[i], 
                companyId, 
                (1000 + Math.random() * 2000).toFixed(2),
                `${15 + Math.floor(Math.random() * 15)} days`,
                'Door to door delivery, Insurance included'
            ]);
            console.log(`✅ Created quote response for quote ${quoteIds[i]} (ID: ${result.insertId})`);
        }

        // Create sample subscriptions
        console.log('\n📦 Creating sample subscriptions...');
        for (let i = 0; i < 3; i++) {
            const [result] = await db.execute(`
                INSERT INTO user_subscriptions (
                    user_id, plan_id, start_date, end_date, status, payment_status, amount_paid, created_at
                ) VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH), 'active', 'paid', ?, NOW())
            `, [userIds[i], 2, (49.99 + Math.random() * 100).toFixed(2)]);
            console.log(`✅ Created subscription for user ${userIds[i]} (ID: ${result.insertId})`);
        }

        // Create sample transactions
        console.log('\n💳 Creating sample transactions...');
        for (let i = 0; i < 5; i++) {
            const [result] = await db.execute(`
                INSERT INTO transactions (
                    user_id, company_id, amount, payment_method, status, description, 
                    transaction_reference, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            `, [
                userIds[i % userIds.length],
                userIds[2], // Company
                (100 + Math.random() * 500).toFixed(2),
                ['credit_card', 'paypal', 'bank_transfer'][Math.floor(Math.random() * 3)],
                ['completed', 'pending', 'completed'][Math.floor(Math.random() * 3)],
                'Payment for logistics service',
                `TXN_${Date.now()}_${String(i + 1).padStart(3, '0')}`
            ]);
            console.log(`✅ Created transaction (ID: ${result.insertId})`);
        }

        // Final count
        console.log('\n📊 Sample data created successfully!');
        const [userCount] = await db.execute('SELECT COUNT(*) as count FROM users WHERE role != "admin"');
        const [quoteCount] = await db.execute('SELECT COUNT(*) as count FROM quotes');
        const [subscriptionCount] = await db.execute('SELECT COUNT(*) as count FROM user_subscriptions');
        const [transactionCount] = await db.execute('SELECT COUNT(*) as count FROM transactions');

        console.log(`   Users: ${userCount[0].count}`);
        console.log(`   Quotes: ${quoteCount[0].count}`);
        console.log(`   Subscriptions: ${subscriptionCount[0].count}`);
        console.log(`   Transactions: ${transactionCount[0].count}`);

        console.log('\n🎉 Now you can test the dashboard modal functionality!');
        console.log('Click on any of the 8 metric cards to see detailed data.');

    } catch (error) {
        console.error('❌ Error creating sample data:', error);
    } finally {
        process.exit(0);
    }
}

createSampleData();