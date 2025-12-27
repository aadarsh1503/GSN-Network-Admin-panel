// Create test quote-related transactions
import db from './config/db.js';

async function createQuoteTransactions() {
    try {
        console.log('✅ Connected to database');
        
        // Get available users and companies
        const [users] = await db.execute('SELECT id, name, email FROM users WHERE role = "user" LIMIT 3');
        const [companies] = await db.execute('SELECT id, name, email FROM users WHERE role = "company" LIMIT 3');
        const [quotes] = await db.execute('SELECT id FROM quotes LIMIT 3');
        const [quoteResponses] = await db.execute('SELECT id, quote_id, company_id FROM quote_responses LIMIT 3');
        
        console.log(`👥 Available users: ${users.length}`);
        console.log(`🏢 Available companies: ${companies.length}`);
        console.log(`📋 Available quotes: ${quotes.length}`);
        console.log(`💬 Available quote responses: ${quoteResponses.length}`);
        
        if (users.length === 0 || companies.length === 0 || quoteResponses.length === 0) {
            console.log('❌ Not enough data to create quote transactions');
            return;
        }
        
        console.log('\n💳 Creating quote-related transactions...');
        
        const testTransactions = [
            {
                user_id: users[0].id,
                company_id: companies[0].id,
                quote_response_id: quoteResponses[0].id,
                amount: 1250.00,
                payment_method: 'credit_card',
                status: 'completed',
                description: 'Payment for accepted shipping quote'
            },
            {
                user_id: users[1] ? users[1].id : users[0].id,
                company_id: companies[1] ? companies[1].id : companies[0].id,
                quote_response_id: quoteResponses[1] ? quoteResponses[1].id : quoteResponses[0].id,
                amount: 850.50,
                payment_method: 'paypal',
                status: 'completed',
                description: 'Payment for logistics service'
            },
            {
                user_id: users[2] ? users[2].id : users[0].id,
                company_id: companies[2] ? companies[2].id : companies[0].id,
                quote_response_id: quoteResponses[2] ? quoteResponses[2].id : quoteResponses[0].id,
                amount: 2100.75,
                payment_method: 'bank_transfer',
                status: 'pending',
                description: 'Payment for freight forwarding service'
            }
        ];
        
        for (let i = 0; i < testTransactions.length; i++) {
            const txn = testTransactions[i];
            const reference = `QTX_${Date.now()}_${String(i + 1).padStart(3, '0')}`;
            
            const sql = `
                INSERT INTO transactions (
                    user_id, company_id, quote_response_id, amount, payment_method, 
                    transaction_reference, status, description, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `;
            
            await db.execute(sql, [
                txn.user_id,
                txn.company_id,
                txn.quote_response_id,
                txn.amount,
                txn.payment_method,
                reference,
                txn.status,
                txn.description
            ]);
            
            console.log(`✅ Created quote transaction ${reference} - $${txn.amount} (${txn.status})`);
        }
        
        // Check total transactions
        const [totalResult] = await db.execute('SELECT COUNT(*) as total FROM transactions');
        console.log(`\n📊 Total transactions in database: ${totalResult[0].total}`);
        
        // Check quote transactions specifically
        const [quoteTransactions] = await db.execute(`
            SELECT COUNT(*) as total 
            FROM transactions 
            WHERE quote_response_id IS NOT NULL
        `);
        console.log(`📋 Quote-related transactions: ${quoteTransactions[0].total}`);
        
    } catch (error) {
        console.error('❌ Error creating quote transactions:', error);
    } finally {
        process.exit(0);
    }
}

createQuoteTransactions();