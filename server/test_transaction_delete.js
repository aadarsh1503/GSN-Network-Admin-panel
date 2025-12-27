// Test script for transaction delete functionality
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Test admin login and transaction deletion
async function testTransactionDelete() {
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

        if (!loginResponse.ok) {
            const errorText = await loginResponse.text();
            throw new Error(`Login failed: ${loginResponse.status} - ${errorText}`);
        }

        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('✅ Admin login successful');

        // Get all transactions
        console.log('\n📋 Fetching all transactions...');
        const transactionsResponse = await fetch(`${BASE_URL}/api/admin-panel/transactions`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!transactionsResponse.ok) {
            const errorText = await transactionsResponse.text();
            throw new Error(`Failed to fetch transactions: ${transactionsResponse.status} - ${errorText}`);
        }

        const transactions = await transactionsResponse.json();
        console.log(`✅ Found ${transactions.length} transactions`);

        if (transactions.length > 0) {
            const firstTransaction = transactions[0];
            console.log(`\n🎯 Testing delete for transaction ID: ${firstTransaction.id}`);
            console.log(`   User: ${firstTransaction.user_name}`);
            console.log(`   Amount: $${firstTransaction.amount}`);
            console.log(`   Status: ${firstTransaction.status}`);

            // Test delete transaction
            const deleteResponse = await fetch(`${BASE_URL}/api/admin-panel/transactions/${firstTransaction.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!deleteResponse.ok) {
                const errorData = await deleteResponse.json();
                throw new Error(`Delete failed: ${deleteResponse.status} - ${errorData.message}`);
            }

            const deleteResult = await deleteResponse.json();
            console.log('✅ Transaction deleted successfully:', deleteResult.message);

            // Verify deletion by fetching transactions again
            console.log('\n🔍 Verifying deletion...');
            const verifyResponse = await fetch(`${BASE_URL}/api/admin-panel/transactions`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const updatedTransactions = await verifyResponse.json();
            console.log(`✅ Updated transaction count: ${updatedTransactions.length}`);

            const deletedTransaction = updatedTransactions.find(t => t.id === firstTransaction.id);
            if (!deletedTransaction) {
                console.log('✅ Transaction successfully removed from database');
            } else {
                console.log('❌ Transaction still exists in database');
            }
        } else {
            console.log('ℹ️  No transactions found to test deletion');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testTransactionDelete();