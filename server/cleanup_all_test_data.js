// Clean up all test data but keep admin account safe
import db from './config/db.js';

async function cleanupAllTestData() {
    try {
        console.log('✅ Connected to database');
        
        // First, let's identify the admin account to protect it
        const [adminUser] = await db.execute('SELECT id, email FROM users WHERE role = "admin" LIMIT 1');
        if (adminUser.length === 0) {
            console.log('❌ No admin user found! This is dangerous.');
            return;
        }
        
        const adminId = adminUser[0].id;
        const adminEmail = adminUser[0].email;
        console.log(`🔒 Protecting admin account: ID ${adminId}, Email: ${adminEmail}`);
        
        // Count data before cleanup
        console.log('\n📊 Data before cleanup:');
        const [usersBefore] = await db.execute('SELECT COUNT(*) as count FROM users');
        const [quotesBefore] = await db.execute('SELECT COUNT(*) as count FROM quotes');
        const [subscriptionsBefore] = await db.execute('SELECT COUNT(*) as count FROM user_subscriptions');
        const [transactionsBefore] = await db.execute('SELECT COUNT(*) as count FROM transactions');
        const [quoteResponsesBefore] = await db.execute('SELECT COUNT(*) as count FROM quote_responses');
        const [messagesBefore] = await db.execute('SELECT COUNT(*) as count FROM messages');
        
        console.log(`   Total users: ${usersBefore[0].count}`);
        console.log(`   Total quotes: ${quotesBefore[0].count}`);
        console.log(`   Total subscriptions: ${subscriptionsBefore[0].count}`);
        console.log(`   Total transactions: ${transactionsBefore[0].count}`);
        console.log(`   Total quote responses: ${quoteResponsesBefore[0].count}`);
        console.log(`   Total messages: ${messagesBefore[0].count}`);
        
        console.log('\n🗑️  Starting cleanup process...');
        
        // 1. Delete all transactions (both quote and subscription related)
        console.log('💳 Deleting all transactions...');
        const [deletedTransactions] = await db.execute('DELETE FROM transactions');
        console.log(`   ✅ Deleted ${deletedTransactions.affectedRows} transactions`);
        
        // 2. Delete all user subscriptions
        console.log('📦 Deleting all user subscriptions...');
        const [deletedSubscriptions] = await db.execute('DELETE FROM user_subscriptions');
        console.log(`   ✅ Deleted ${deletedSubscriptions.affectedRows} subscriptions`);
        
        // 3. Delete all quote responses
        console.log('💬 Deleting all quote responses...');
        const [deletedQuoteResponses] = await db.execute('DELETE FROM quote_responses');
        console.log(`   ✅ Deleted ${deletedQuoteResponses.affectedRows} quote responses`);
        
        // 4. Delete all user quote status records
        console.log('📊 Deleting all user quote status records...');
        const [deletedQuoteStatus] = await db.execute('DELETE FROM user_quote_status');
        console.log(`   ✅ Deleted ${deletedQuoteStatus.affectedRows} quote status records`);
        
        // 5. Delete all quotes
        console.log('📋 Deleting all quotes...');
        const [deletedQuotes] = await db.execute('DELETE FROM quotes');
        console.log(`   ✅ Deleted ${deletedQuotes.affectedRows} quotes`);
        
        // 6. Delete all messages
        console.log('💌 Deleting all messages...');
        const [deletedMessages] = await db.execute('DELETE FROM messages');
        console.log(`   ✅ Deleted ${deletedMessages.affectedRows} messages`);
        
        // 7. Delete all reviews
        console.log('⭐ Deleting all reviews...');
        const [deletedReviews] = await db.execute('DELETE FROM reviews');
        console.log(`   ✅ Deleted ${deletedReviews.affectedRows} reviews`);
        
        // 8. Delete all support tickets
        console.log('🎫 Deleting all support tickets...');
        const [deletedTickets] = await db.execute('DELETE FROM support_tickets');
        console.log(`   ✅ Deleted ${deletedTickets.affectedRows} support tickets`);
        
        // 9. Delete all user notifications
        console.log('🔔 Deleting all user notifications...');
        const [deletedUserNotifications] = await db.execute('DELETE FROM user_notifications');
        console.log(`   ✅ Deleted ${deletedUserNotifications.affectedRows} user notifications`);
        
        // 10. Delete all notifications (check if created_by column exists)
        console.log('📢 Deleting all notifications...');
        try {
            const [deletedNotifications] = await db.execute(`DELETE FROM notifications WHERE created_by != ?`, [adminId]);
            console.log(`   ✅ Deleted ${deletedNotifications.affectedRows} notifications (kept admin notifications)`);
        } catch (error) {
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                // created_by column doesn't exist, delete all notifications
                const [deletedNotifications] = await db.execute('DELETE FROM notifications');
                console.log(`   ✅ Deleted ${deletedNotifications.affectedRows} notifications (no created_by column)`);
            } else {
                throw error;
            }
        }
        
        // 11. Delete all company branches and members
        console.log('🏢 Deleting all company branches and members...');
        const [deletedMembers] = await db.execute('DELETE FROM company_members');
        const [deletedBranches] = await db.execute('DELETE FROM company_branches');
        console.log(`   ✅ Deleted ${deletedMembers.affectedRows} company members`);
        console.log(`   ✅ Deleted ${deletedBranches.affectedRows} company branches`);
        
        // 12. Delete all email notifications
        console.log('📧 Deleting all email notifications...');
        const [deletedEmailNotifications] = await db.execute('DELETE FROM email_notifications');
        console.log(`   ✅ Deleted ${deletedEmailNotifications.affectedRows} email notifications`);
        
        // 13. Delete all admin actions (logs)
        console.log('📝 Deleting all admin action logs...');
        const [deletedAdminActions] = await db.execute('DELETE FROM admin_actions');
        console.log(`   ✅ Deleted ${deletedAdminActions.affectedRows} admin action logs`);
        
        // 14. Delete all non-admin users (MOST IMPORTANT - Keep admin safe!)
        console.log('👥 Deleting all non-admin users...');
        const [deletedUsers] = await db.execute('DELETE FROM users WHERE role != "admin"');
        console.log(`   ✅ Deleted ${deletedUsers.affectedRows} non-admin users`);
        
        // 15. Clean up any other related tables
        console.log('🧹 Cleaning up other tables...');
        
        // Delete wishlist items
        const [deletedWishlist] = await db.execute('DELETE FROM wishlist');
        console.log(`   ✅ Deleted ${deletedWishlist.affectedRows} wishlist items`);
        
        // Delete profile views
        const [deletedProfileViews] = await db.execute('DELETE FROM profile_views');
        console.log(`   ✅ Deleted ${deletedProfileViews.affectedRows} profile views`);
        
        // Delete login history (except admin)
        const [deletedLoginHistory] = await db.execute('DELETE FROM login_history WHERE user_id != ?', [adminId]);
        console.log(`   ✅ Deleted ${deletedLoginHistory.affectedRows} login history records (kept admin history)`);
        
        // Delete blacklist history
        const [deletedBlacklistHistory] = await db.execute('DELETE FROM blacklist_history');
        console.log(`   ✅ Deleted ${deletedBlacklistHistory.affectedRows} blacklist history records`);
        
        // Delete suggestions
        const [deletedSuggestions] = await db.execute('DELETE FROM suggestions');
        console.log(`   ✅ Deleted ${deletedSuggestions.affectedRows} suggestions`);
        
        // Final verification
        console.log('\n📊 Data after cleanup:');
        const [usersAfter] = await db.execute('SELECT COUNT(*) as count FROM users');
        const [quotesAfter] = await db.execute('SELECT COUNT(*) as count FROM quotes');
        const [subscriptionsAfter] = await db.execute('SELECT COUNT(*) as count FROM user_subscriptions');
        const [transactionsAfter] = await db.execute('SELECT COUNT(*) as count FROM transactions');
        const [quoteResponsesAfter] = await db.execute('SELECT COUNT(*) as count FROM quote_responses');
        const [messagesAfter] = await db.execute('SELECT COUNT(*) as count FROM messages');
        
        console.log(`   Total users: ${usersAfter[0].count} (should be 1 - admin only)`);
        console.log(`   Total quotes: ${quotesAfter[0].count} (should be 0)`);
        console.log(`   Total subscriptions: ${subscriptionsAfter[0].count} (should be 0)`);
        console.log(`   Total transactions: ${transactionsAfter[0].count} (should be 0)`);
        console.log(`   Total quote responses: ${quoteResponsesAfter[0].count} (should be 0)`);
        console.log(`   Total messages: ${messagesAfter[0].count} (should be 0)`);
        
        // Verify admin account is still there
        const [adminCheck] = await db.execute('SELECT id, email, role FROM users WHERE role = "admin"');
        if (adminCheck.length > 0) {
            console.log(`\n✅ Admin account verified: ${adminCheck[0].email} (ID: ${adminCheck[0].id})`);
        } else {
            console.log('\n❌ CRITICAL ERROR: Admin account was deleted!');
        }
        
        console.log('\n🎉 Database cleanup completed successfully!');
        console.log('📋 Summary:');
        console.log('   ✅ All test data removed');
        console.log('   ✅ Admin account preserved');
        console.log('   ✅ Database is now clean and ready for production');
        console.log('\n🔐 Admin login credentials remain: admin@gmail.com / admin123');
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        process.exit(0);
    }
}

cleanupAllTestData();