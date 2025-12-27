// Test user deletion with cascading deletes
import db from './config/db.js';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testUserDeletionCascade() {
    try {
        console.log('🔐 Testing admin login...');
        
        // Login as admin
        const loginResponse = await fetch(`${BASE_URL}/api/user/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@gmail.com',
                password: 'admin123'
            })
        });

        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('✅ Admin login successful');

        // Create a test user first
        console.log('\n👤 Creating test user...');
        const timestamp = Date.now();
        const testUser = {
            name: 'Test User for Deletion',
            email: `testdelete${timestamp}@example.com`,
            phone: '1234567890',
            password: 'password123',
            role: 'user',
            country: 'India',
            city: 'Mumbai'
        };

        const [userResult] = await db.execute(`
            INSERT INTO users (name, email, phone, password, role, country, city, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `, [testUser.name, testUser.email, testUser.phone, testUser.password, testUser.role, testUser.country, testUser.city]);

        const testUserId = userResult.insertId;
        console.log(`✅ Created test user with ID: ${testUserId}`);

        // Create related data for this user
        console.log('\n📋 Creating related data...');

        // 1. Create a quote
        const [quoteResult] = await db.execute(`
            INSERT INTO quotes (user_id, shipping_mode, arrival_date, departure_country, arrival_country, product_description, created_at)
            VALUES (?, 'sea', '2025-02-01', 'India', 'USA', 'Test product for deletion', NOW())
        `, [testUserId]);
        const quoteId = quoteResult.insertId;
        console.log(`✅ Created quote with ID: ${quoteId}`);

        // 2. Create a subscription
        const [subscriptionResult] = await db.execute(`
            INSERT INTO user_subscriptions (user_id, plan_id, start_date, end_date, status, payment_status, amount_paid, created_at)
            VALUES (?, 1, NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH), 'active', 'paid', 49.99, NOW())
        `, [testUserId]);
        const subscriptionId = subscriptionResult.insertId;
        console.log(`✅ Created subscription with ID: ${subscriptionId}`);

        // 3. Create a transaction
        const [transactionResult] = await db.execute(`
            INSERT INTO transactions (user_id, subscription_id, amount, payment_method, status, description, created_at)
            VALUES (?, ?, 49.99, 'credit_card', 'completed', 'Test transaction for deletion', NOW())
        `, [testUserId, subscriptionId]);
        const transactionId = transactionResult.insertId;
        console.log(`✅ Created transaction with ID: ${transactionId}`);

        // 4. Create a message
        const [messageResult] = await db.execute(`
            INSERT INTO messages (sender_id, receiver_id, subject, message, created_at)
            VALUES (?, 1, 'Test Message', 'This is a test message for deletion', NOW())
        `, [testUserId]);
        const messageId = messageResult.insertId;
        console.log(`✅ Created message with ID: ${messageId}`);

        // Count related records before deletion
        console.log('\n📊 Counting related records before deletion...');
        
        const [quotesCount] = await db.execute('SELECT COUNT(*) as count FROM quotes WHERE user_id = ?', [testUserId]);
        const [subscriptionsCount] = await db.execute('SELECT COUNT(*) as count FROM user_subscriptions WHERE user_id = ?', [testUserId]);
        const [transactionsCount] = await db.execute('SELECT COUNT(*) as count FROM transactions WHERE user_id = ?', [testUserId]);
        const [messagesCount] = await db.execute('SELECT COUNT(*) as count FROM messages WHERE sender_id = ? OR receiver_id = ?', [testUserId, testUserId]);

        console.log(`   Quotes: ${quotesCount[0].count}`);
        console.log(`   Subscriptions: ${subscriptionsCount[0].count}`);
        console.log(`   Transactions: ${transactionsCount[0].count}`);
        console.log(`   Messages: ${messagesCount[0].count}`);

        // Now delete the user using the admin API
        console.log(`\n🗑️  Deleting user ${testUserId} via admin API...`);
        
        const deleteResponse = await fetch(`${BASE_URL}/api/admin-panel/users/${testUserId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reason: 'Testing cascading delete functionality'
            })
        });

        if (deleteResponse.ok) {
            const deleteResult = await deleteResponse.json();
            console.log('✅ User deleted successfully:', deleteResult.message);
        } else {
            const errorData = await deleteResponse.json();
            console.log('❌ User deletion failed:', errorData.message);
            return;
        }

        // Count related records after deletion
        console.log('\n📊 Counting related records after deletion...');
        
        const [quotesCountAfter] = await db.execute('SELECT COUNT(*) as count FROM quotes WHERE user_id = ?', [testUserId]);
        const [subscriptionsCountAfter] = await db.execute('SELECT COUNT(*) as count FROM user_subscriptions WHERE user_id = ?', [testUserId]);
        const [transactionsCountAfter] = await db.execute('SELECT COUNT(*) as count FROM transactions WHERE user_id = ?', [testUserId]);
        const [messagesCountAfter] = await db.execute('SELECT COUNT(*) as count FROM messages WHERE sender_id = ? OR receiver_id = ?', [testUserId, testUserId]);

        console.log(`   Quotes: ${quotesCountAfter[0].count}`);
        console.log(`   Subscriptions: ${subscriptionsCountAfter[0].count}`);
        console.log(`   Transactions: ${transactionsCountAfter[0].count}`);
        console.log(`   Messages: ${messagesCountAfter[0].count}`);

        // Verify user is deleted
        const [userCheck] = await db.execute('SELECT COUNT(*) as count FROM users WHERE id = ?', [testUserId]);
        console.log(`   User exists: ${userCheck[0].count > 0 ? 'Yes' : 'No'}`);

        // Summary
        console.log('\n🎉 Cascading Delete Test Results:');
        const allDeleted = quotesCountAfter[0].count === 0 && 
                          subscriptionsCountAfter[0].count === 0 && 
                          transactionsCountAfter[0].count === 0 && 
                          messagesCountAfter[0].count === 0 &&
                          userCheck[0].count === 0;

        if (allDeleted) {
            console.log('✅ SUCCESS: User and all related data deleted automatically!');
            console.log('   - User deleted: ✅');
            console.log('   - Quotes deleted: ✅');
            console.log('   - Subscriptions deleted: ✅');
            console.log('   - Transactions deleted: ✅');
            console.log('   - Messages deleted: ✅');
        } else {
            console.log('❌ PARTIAL: Some related data was not deleted automatically');
            console.log(`   - User deleted: ${userCheck[0].count === 0 ? '✅' : '❌'}`);
            console.log(`   - Quotes deleted: ${quotesCountAfter[0].count === 0 ? '✅' : '❌'}`);
            console.log(`   - Subscriptions deleted: ${subscriptionsCountAfter[0].count === 0 ? '✅' : '❌'}`);
            console.log(`   - Transactions deleted: ${transactionsCountAfter[0].count === 0 ? '✅' : '❌'}`);
            console.log(`   - Messages deleted: ${messagesCountAfter[0].count === 0 ? '✅' : '❌'}`);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        process.exit(0);
    }
}

testUserDeletionCascade();