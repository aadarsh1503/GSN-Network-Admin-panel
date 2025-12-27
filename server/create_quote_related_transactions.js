// Create quote-related transactions for proper testing
import db from './config/db.js';

async function createQuoteRelatedTransactions() {
    try {
        console.log('✅ Connected to database');
        
        // Get existing quote responses
        const [quoteResponses] = await db.execute(`
            SELECT qr.id, qr.quote_id, qr.company_id, qr.price, q.user_id, u.name as user_name, c.name as company_name
            FROM quote_responses qr
            JOIN quotes q ON qr.quote_id = q.id
            JOIN users u ON q.user_id = u.id
            JOIN users c ON qr.company_id = c.id
        `);
        
        console.log(`📋 Found ${quoteResponses.length} quote responses to create transactions for`);
        
        if (quoteResponses.length === 0) {
            console.log('❌ No quote responses found. Creating some first...');
            return;
        }
        
        // Create transactions for each quote response
        console.log('\n💳 Creating quote-related transactions...');
        
        for (const qr of quoteResponses) {
            const [result] = await db.execute(`
                INSERT INTO transactions (
                    user_id, company_id, quote_response_id, amount, payment_method, 
                    status, description, transaction_reference, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `, [
                qr.user_id,
                qr.company_id,
                qr.id,
                qr.price,
                ['credit_card', 'paypal', 'bank_transfer'][Math.floor(Math.random() * 3)],
                ['completed', 'pending'][Math.floor(Math.random() * 2)],
                `Payment for quote #${qr.quote_id} - ${qr.company_name}`,
                `QTX_${Date.now()}_${qr.id}`
            ]);
            
            console.log(`✅ Created quote transaction: User ${qr.user_name} → ${qr.company_name} ($${qr.price})`);
        }
        
        // Check final counts
        console.log('\n📊 Final transaction counts:');
        const [quoteTransactions] = await db.execute('SELECT COUNT(*) as count FROM transactions WHERE quote_response_id IS NOT NULL');
        const [subscriptionTransactions] = await db.execute('SELECT COUNT(*) as count FROM transactions WHERE subscription_id IS NOT NULL');
        const [totalTransactions] = await db.execute('SELECT COUNT(*) as count FROM transactions');
        
        console.log(`   Quote-related transactions: ${quoteTransactions[0].count}`);
        console.log(`   Subscription transactions: ${subscriptionTransactions[0].count}`);
        console.log(`   Total transactions: ${totalTransactions[0].count}`);
        
        console.log('\n🎉 Quote-related transactions created successfully!');
        console.log('Now the transaction cards should show data properly.');
        
    } catch (error) {
        console.error('❌ Error creating quote transactions:', error);
    } finally {
        process.exit(0);
    }
}

createQuoteRelatedTransactions();