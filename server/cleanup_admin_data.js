// Clean up all data related to admin user except the admin account itself
import db from './config/db.js';

async function cleanupAdminData() {
    try {
        console.log('✅ Connected to database');
        
        // Get admin user ID
        const [adminUser] = await db.execute('SELECT id FROM users WHERE role = "admin" LIMIT 1');
        if (adminUser.length === 0) {
            console.log('❌ No admin user found');
            return;
        }
        
        const adminId = adminUser[0].id;
        console.log(`🔧 Cleaning up data for admin user ID: ${adminId}`);
        
        // Count data before cleanup
        console.log('\n📊 Data before cleanup:');
        const [transactionsBefore] = await db.execute('SELECT COUNT(*) as count FROM transactions WHERE user_id = ?', [adminId]);
        const [subscriptionsBefore] = await db.execute('SELECT COUNT(*) as count FROM user_subscriptions WHERE user_id = ?', [adminId]);
        const [quotesBefore] = await db.execute('SELECT COUNT(*) as count FROM quotes WHERE user_id = ?', [adminId]);
        const [messagesBefore] = await db.execute('SELECT COUNT(*) as count FROM messages WHERE sender_id = ? OR receiver_id = ?', [adminId, adminId]);
        
        console.log(`  Admin transactions: ${transactionsBefore[0].count}`);
        console.log(`  Admin subscriptions: ${subscriptionsBefore[0].count}`);
        console.log(`  Admin quotes: ${quotesBefore[0].count}`);
        console.log(`  Admin messages: ${messagesBefore[0].count}`);
        
        // Delete admin-related data (but keep the admin account)
        console.log('\n🗑️  Deleting admin-related data...');
        
        // 1. Delete transactions where admin is user or company
        const [deletedTransactions] = await db.execute('DELETE FROM transactions WHERE user_id = ? OR company_id = ?', [adminId, adminId]);
        console.log(`✅ Deleted ${deletedTransactions.affectedRows} admin transactions`);
        
        // 2. Delete admin subscriptions
        const [deletedSubscriptions] = await db.execute('DELETE FROM user_subscriptions WHERE user_id = ?', [adminId]);
        console.log(`✅ Deleted ${deletedSubscriptions.affectedRows} admin subscriptions`);
        
        // 3. Delete admin quotes
        const [deletedQuotes] = await db.execute('DELETE FROM quotes WHERE user_id = ?', [adminId]);
        console.log(`✅ Deleted ${deletedQuotes.affectedRows} admin quotes`);
        
        // 4. Delete admin messages (sent or received)
        const [deletedMessages] = await db.execute('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?', [adminId, adminId]);
        console.log(`✅ Deleted ${deletedMessages.affectedRows} admin messages`);
        
        // 5. Delete admin reviews
        const [deletedReviews] = await db.execute('DELETE FROM reviews WHERE user_id = ? OR company_id = ?', [adminId, adminId]);
        console.log(`✅ Deleted ${deletedReviews.affectedRows} admin reviews`);
        
        // 6. Delete admin support tickets
        const [deletedTickets] = await db.execute('DELETE FROM support_tickets WHERE user_id = ?', [adminId]);
        console.log(`✅ Deleted ${deletedTickets.affectedRows} admin support tickets`);
        
        // 7. Delete admin user notifications
        const [deletedNotifications] = await db.execute('DELETE FROM user_notifications WHERE user_id = ?', [adminId]);
        console.log(`✅ Deleted ${deletedNotifications.affectedRows} admin user notifications`);
        
        // 8. Delete admin quote status
        const [deletedQuoteStatus] = await db.execute('DELETE FROM user_quote_status WHERE user_id = ? OR company_id = ?', [adminId, adminId]);
        console.log(`✅ Deleted ${deletedQuoteStatus.affectedRows} admin quote status records`);
        
        // Also clean up any remaining test users (except admin)
        console.log('\n🧹 Cleaning up remaining test users...');
        const [deletedUsers] = await db.execute('DELETE FROM users WHERE role != "admin"');
        console.log(`✅ Deleted ${deletedUsers.affectedRows} non-admin users`);
        
        // Clean up any orphaned data
        console.log('\n🔍 Cleaning up orphaned data...');
        
        // Delete quotes with null user_id or non-existent user_id
        const [orphanedQuotes] = await db.execute(`
            DELETE q FROM quotes q 
            LEFT JOIN users u ON q.user_id = u.id 
            WHERE q.user_id IS NULL OR (q.user_id IS NOT NULL AND u.id IS NULL)
        `);
        console.log(`✅ Deleted ${orphanedQuotes.affectedRows} orphaned quotes`);
        
        // Delete transactions with non-existent user_id or company_id
        const [orphanedTransactions] = await db.execute(`
            DELETE t FROM transactions t 
            LEFT JOIN users u1 ON t.user_id = u1.id 
            LEFT JOIN users u2 ON t.company_id = u2.id 
            WHERE (t.user_id IS NOT NULL AND u1.id IS NULL) 
            OR (t.company_id IS NOT NULL AND u2.id IS NULL)
        `);
        console.log(`✅ Deleted ${orphanedTransactions.affectedRows} orphaned transactions`);
        
        // Delete subscriptions with non-existent user_id
        const [orphanedSubscriptions] = await db.execute(`
            DELETE s FROM user_subscriptions s 
            LEFT JOIN users u ON s.user_id = u.id 
            WHERE s.user_id IS NOT NULL AND u.id IS NULL
        `);
        console.log(`✅ Deleted ${orphanedSubscriptions.affectedRows} orphaned subscriptions`);
        
        // Final count
        console.log('\n📊 Final data count:');
        const [finalUsers] = await db.execute('SELECT COUNT(*) as count FROM users');
        const [finalTransactions] = await db.execute('SELECT COUNT(*) as count FROM transactions');
        const [finalSubscriptions] = await db.execute('SELECT COUNT(*) as count FROM user_subscriptions');
        const [finalQuotes] = await db.execute('SELECT COUNT(*) as count FROM quotes');
        const [finalMessages] = await db.execute('SELECT COUNT(*) as count FROM messages');
        
        console.log(`  Total users: ${finalUsers[0].count} (should be 1 - admin only)`);
        console.log(`  Total transactions: ${finalTransactions[0].count} (should be 0)`);
        console.log(`  Total subscriptions: ${finalSubscriptions[0].count} (should be 0)`);
        console.log(`  Total quotes: ${finalQuotes[0].count} (should be 0)`);
        console.log(`  Total messages: ${finalMessages[0].count} (should be 0)`);
        
        console.log('\n🎉 Database cleanup completed! Only admin account remains with no associated data.');
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        process.exit(0);
    }
}

cleanupAdminData();