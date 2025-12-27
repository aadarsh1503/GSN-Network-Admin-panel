// Check what data remains in database after user deletion
import db from './config/db.js';

async function checkRemainingData() {
    try {
        console.log('✅ Connected to database');
        
        // Check users table
        console.log('\n👥 USERS TABLE:');
        const [users] = await db.execute('SELECT id, name, email, role FROM users ORDER BY id');
        console.log(`Total users: ${users.length}`);
        users.forEach(user => {
            console.log(`  ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
        });
        
        // Check quotes table
        console.log('\n📋 QUOTES TABLE:');
        const [quotes] = await db.execute('SELECT id, user_id, product_description, status FROM quotes ORDER BY id');
        console.log(`Total quotes: ${quotes.length}`);
        quotes.forEach(quote => {
            console.log(`  ID: ${quote.id}, User ID: ${quote.user_id}, Product: ${quote.product_description?.substring(0, 50)}..., Status: ${quote.status}`);
        });
        
        // Check transactions table
        console.log('\n💳 TRANSACTIONS TABLE:');
        const [transactions] = await db.execute('SELECT id, user_id, company_id, amount, status, description FROM transactions ORDER BY id');
        console.log(`Total transactions: ${transactions.length}`);
        transactions.forEach(txn => {
            console.log(`  ID: ${txn.id}, User ID: ${txn.user_id}, Company ID: ${txn.company_id}, Amount: $${txn.amount}, Status: ${txn.status}`);
        });
        
        // Check subscriptions table
        console.log('\n📦 USER_SUBSCRIPTIONS TABLE:');
        const [subscriptions] = await db.execute('SELECT id, user_id, plan_id, status, amount_paid FROM user_subscriptions ORDER BY id');
        console.log(`Total subscriptions: ${subscriptions.length}`);
        subscriptions.forEach(sub => {
            console.log(`  ID: ${sub.id}, User ID: ${sub.user_id}, Plan ID: ${sub.plan_id}, Status: ${sub.status}, Amount: $${sub.amount_paid}`);
        });
        
        // Check quote responses table
        console.log('\n💬 QUOTE_RESPONSES TABLE:');
        const [responses] = await db.execute('SELECT id, quote_id, company_id, price, status FROM quote_responses ORDER BY id');
        console.log(`Total quote responses: ${responses.length}`);
        responses.forEach(resp => {
            console.log(`  ID: ${resp.id}, Quote ID: ${resp.quote_id}, Company ID: ${resp.company_id}, Price: $${resp.price}, Status: ${resp.status}`);
        });
        
        // Check messages table
        console.log('\n💌 MESSAGES TABLE:');
        const [messages] = await db.execute('SELECT id, sender_id, receiver_id, subject FROM messages ORDER BY id');
        console.log(`Total messages: ${messages.length}`);
        messages.forEach(msg => {
            console.log(`  ID: ${msg.id}, Sender ID: ${msg.sender_id}, Receiver ID: ${msg.receiver_id}, Subject: ${msg.subject}`);
        });
        
        // Check user_quote_status table
        console.log('\n📊 USER_QUOTE_STATUS TABLE:');
        const [quoteStatus] = await db.execute('SELECT id, user_id, company_id, quote_id, status FROM user_quote_status ORDER BY id');
        console.log(`Total quote status records: ${quoteStatus.length}`);
        quoteStatus.forEach(qs => {
            console.log(`  ID: ${qs.id}, User ID: ${qs.user_id}, Company ID: ${qs.company_id}, Quote ID: ${qs.quote_id}, Status: ${qs.status}`);
        });
        
        // Check for orphaned data (data with user_id that doesn't exist)
        console.log('\n🔍 CHECKING FOR ORPHANED DATA:');
        
        const [orphanedQuotes] = await db.execute(`
            SELECT q.id, q.user_id, q.product_description 
            FROM quotes q 
            LEFT JOIN users u ON q.user_id = u.id 
            WHERE q.user_id IS NOT NULL AND u.id IS NULL
        `);
        console.log(`Orphaned quotes: ${orphanedQuotes.length}`);
        
        const [orphanedTransactions] = await db.execute(`
            SELECT t.id, t.user_id, t.amount 
            FROM transactions t 
            LEFT JOIN users u ON t.user_id = u.id 
            WHERE t.user_id IS NOT NULL AND u.id IS NULL
        `);
        console.log(`Orphaned transactions: ${orphanedTransactions.length}`);
        
        const [orphanedSubscriptions] = await db.execute(`
            SELECT s.id, s.user_id, s.amount_paid 
            FROM user_subscriptions s 
            LEFT JOIN users u ON s.user_id = u.id 
            WHERE s.user_id IS NOT NULL AND u.id IS NULL
        `);
        console.log(`Orphaned subscriptions: ${orphanedSubscriptions.length}`);
        
    } catch (error) {
        console.error('❌ Error checking data:', error);
    } finally {
        process.exit(0);
    }
}

checkRemainingData();