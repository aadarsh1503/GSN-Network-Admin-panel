// controllers/adminPanelController.js
import db from '../config/db.js';

// ==================== SUBSCRIPTION MANAGEMENT ====================

// @desc    Get all subscriptions with user and plan details
// @route   GET /api/admin-panel/subscriptions
// @access  Admin
export const getAllSubscriptionsAdmin = async (req, res) => {
    try {
        const sql = `
            SELECT 
                us.id,
                us.user_id,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone,
                u.role as user_role,
                us.plan_id,
                mp.name as plan_name,
                mp.price as plan_price,
                mp.duration_months,
                us.start_date,
                us.end_date,
                us.status,
                us.payment_status,
                us.transaction_id,
                us.amount_paid,
                us.created_at
            FROM user_subscriptions us
            JOIN users u ON us.user_id = u.id
            JOIN membership_plans mp ON us.plan_id = mp.id
            ORDER BY us.created_at DESC
        `;
        
        const [subscriptions] = await db.execute(sql);
        res.status(200).json(subscriptions);
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        res.status(500).json({ message: 'Server error fetching subscriptions' });
    }
};

// @desc    Get subscription by ID with full details
// @route   GET /api/admin-panel/subscriptions/:id
// @access  Admin
export const getSubscriptionById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const sql = `
            SELECT 
                us.*,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone,
                u.role as user_role,
                u.country,
                mp.name as plan_name,
                mp.price as plan_price,
                mp.duration_months,
                mp.features
            FROM user_subscriptions us
            JOIN users u ON us.user_id = u.id
            JOIN membership_plans mp ON us.plan_id = mp.id
            WHERE us.id = ?
        `;
        
        const [rows] = await db.execute(sql, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Subscription not found' });
        }
        
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching subscription:', error);
        res.status(500).json({ message: 'Server error fetching subscription' });
    }
};

// @desc    Get quote-related transactions (user payments to companies)
// @route   GET /api/admin-panel/transactions
// @access  Admin
export const getAllTransactions = async (req, res) => {
    try {
        const sql = `
            SELECT 
                t.id,
                t.user_id,
                u.name as user_name,
                u.email as user_email,
                t.company_id,
                c.name as company_name,
                c.email as company_email,
                t.quote_response_id,
                qr.quote_id,
                q.product_description,
                t.amount,
                t.payment_method,
                t.transaction_reference,
                t.status,
                t.description,
                t.created_at
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN users c ON t.company_id = c.id
            LEFT JOIN quote_responses qr ON t.quote_response_id = qr.id
            LEFT JOIN quotes q ON qr.quote_id = q.id
            WHERE t.quote_response_id IS NOT NULL
            ORDER BY t.created_at DESC
        `;
        
        const [transactions] = await db.execute(sql);
        res.status(200).json(transactions);
    } catch (error) {
        console.error('Error fetching quote transactions:', error);
        res.status(500).json({ message: 'Server error fetching quote transactions' });
    }
};

// @desc    Get subscription transactions (member subscription payments)
// @route   GET /api/admin-panel/subscription-transactions
// @access  Admin
export const getSubscriptionTransactions = async (req, res) => {
    try {
        const sql = `
            SELECT 
                t.id,
                t.user_id,
                u.name as user_name,
                u.email as user_email,
                u.role as user_role,
                t.subscription_id,
                us.plan_id,
                mp.name as plan_name,
                t.amount,
                t.payment_method,
                t.transaction_reference,
                t.status,
                t.description,
                t.created_at
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN user_subscriptions us ON t.subscription_id = us.id
            LEFT JOIN membership_plans mp ON us.plan_id = mp.id
            WHERE t.subscription_id IS NOT NULL
            ORDER BY t.created_at DESC
        `;
        
        const [transactions] = await db.execute(sql);
        res.status(200).json(transactions);
    } catch (error) {
        console.error('Error fetching subscription transactions:', error);
        res.status(500).json({ message: 'Server error fetching subscription transactions' });
    }
};

// ==================== QUOTE MANAGEMENT ====================

// @desc    Get all quotes with user and company details
// @route   GET /api/admin-panel/quotes
// @access  Admin
export const getAllQuotesAdmin = async (req, res) => {
    try {
        const sql = `
            SELECT 
                q.id,
                q.user_id,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone,
                q.shipping_mode,
                q.departure_country,
                q.departure_city,
                q.arrival_country,
                q.arrival_city,
                q.product_description,
                q.status,
                q.created_at,
                q.updated_at,
                COUNT(DISTINCT qr.id) as response_count,
                COUNT(DISTINCT CASE WHEN qr.status = 'accepted' THEN qr.id END) as accepted_count
            FROM quotes q
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN quote_responses qr ON q.id = qr.quote_id
            GROUP BY q.id
            ORDER BY q.created_at DESC
        `;
        
        const [quotes] = await db.execute(sql);
        res.status(200).json(quotes);
    } catch (error) {
        console.error('Error fetching quotes:', error);
        res.status(500).json({ message: 'Server error fetching quotes' });
    }
};

// @desc    Get quote by ID with full details including responses
// @route   GET /api/admin-panel/quotes/:id
// @access  Admin
export const getQuoteByIdAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get quote details
        const quoteSql = `
            SELECT 
                q.*,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone,
                u.country as user_country
            FROM quotes q
            LEFT JOIN users u ON q.user_id = u.id
            WHERE q.id = ?
        `;
        
        const [quoteRows] = await db.execute(quoteSql, [id]);
        
        if (quoteRows.length === 0) {
            return res.status(404).json({ message: 'Quote not found' });
        }
        
        const quote = quoteRows[0];
        
        // Get quote responses
        const responsesSql = `
            SELECT 
                qr.*,
                u.name as company_name,
                u.email as company_email,
                u.phone as company_phone,
                u.logo as company_logo,
                uqs.status as user_response_status,
                uqs.accepted_at,
                uqs.rejected_at
            FROM quote_responses qr
            JOIN users u ON qr.company_id = u.id
            LEFT JOIN user_quote_status uqs ON qr.id = uqs.quote_response_id
            WHERE qr.quote_id = ?
            ORDER BY qr.created_at DESC
        `;
        
        const [responses] = await db.execute(responsesSql, [id]);
        
        quote.responses = responses;
        
        res.status(200).json(quote);
    } catch (error) {
        console.error('Error fetching quote details:', error);
        res.status(500).json({ message: 'Server error fetching quote details' });
    }
};

// @desc    Delete quote (admin action)
// @route   DELETE /api/admin-panel/quotes/:id
// @access  Admin
export const deleteQuote = async (req, res) => {
    try {
        const { id } = req.params;
        
        const sql = 'DELETE FROM quotes WHERE id = ?';
        const [result] = await db.execute(sql, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Quote not found' });
        }
        
        res.status(200).json({ message: 'Quote deleted successfully' });
    } catch (error) {
        console.error('Error deleting quote:', error);
        res.status(500).json({ message: 'Server error deleting quote' });
    }
};

// @desc    Update quote status (admin action)
// @route   PUT /api/admin-panel/quotes/:id/status
// @access  Admin
export const updateQuoteStatusAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const validStatuses = ['pending', 'approved', 'rejected', 'running', 'closed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        
        const sql = 'UPDATE quotes SET status = ?, updated_at = NOW() WHERE id = ?';
        const [result] = await db.execute(sql, [status, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Quote not found' });
        }
        
        res.status(200).json({ message: 'Quote status updated successfully' });
    } catch (error) {
        console.error('Error updating quote status:', error);
        res.status(500).json({ message: 'Server error updating quote status' });
    }
};

// ==================== USER MANAGEMENT (Enhanced) ====================

// @desc    Get user with subscription details
// @route   GET /api/admin-panel/users/:id/subscriptions
// @access  Admin
export const getUserSubscriptions = async (req, res) => {
    try {
        const { id } = req.params;
        
        const sql = `
            SELECT 
                us.*,
                mp.name as plan_name,
                mp.price as plan_price,
                mp.duration_months
            FROM user_subscriptions us
            JOIN membership_plans mp ON us.plan_id = mp.id
            WHERE us.user_id = ?
            ORDER BY us.created_at DESC
        `;
        
        const [subscriptions] = await db.execute(sql, [id]);
        res.status(200).json(subscriptions);
    } catch (error) {
        console.error('Error fetching user subscriptions:', error);
        res.status(500).json({ message: 'Server error fetching user subscriptions' });
    }
};

// @desc    Get user quotes
// @route   GET /api/admin-panel/users/:id/quotes
// @access  Admin
export const getUserQuotes = async (req, res) => {
    try {
        const { id } = req.params;
        
        const sql = `
            SELECT 
                q.*,
                COUNT(DISTINCT qr.id) as response_count
            FROM quotes q
            LEFT JOIN quote_responses qr ON q.id = qr.quote_id
            WHERE q.user_id = ?
            GROUP BY q.id
            ORDER BY q.created_at DESC
        `;
        
        const [quotes] = await db.execute(sql, [id]);
        res.status(200).json(quotes);
    } catch (error) {
        console.error('Error fetching user quotes:', error);
        res.status(500).json({ message: 'Server error fetching user quotes' });
    }
};

// @desc    Get company quote responses
// @route   GET /api/admin-panel/companies/:id/responses
// @access  Admin
export const getCompanyResponses = async (req, res) => {
    try {
        const { id } = req.params;
        
        const sql = `
            SELECT 
                qr.*,
                q.product_description,
                q.departure_country,
                q.arrival_country,
                q.status as quote_status,
                u.name as user_name,
                u.email as user_email
            FROM quote_responses qr
            JOIN quotes q ON qr.quote_id = q.id
            LEFT JOIN users u ON q.user_id = u.id
            WHERE qr.company_id = ?
            ORDER BY qr.created_at DESC
        `;
        
        const [responses] = await db.execute(sql, [id]);
        res.status(200).json(responses);
    } catch (error) {
        console.error('Error fetching company responses:', error);
        res.status(500).json({ message: 'Server error fetching company responses' });
    }
};

// ==================== DASHBOARD STATS ====================

// @desc    Get comprehensive admin dashboard statistics
// @route   GET /api/admin-panel/dashboard-stats
// @access  Admin
export const getAdminDashboardStats = async (req, res) => {
    try {
        const stats = {};
        
        // User statistics
        const userStatsSql = `
            SELECT 
                role,
                COUNT(*) as count,
                SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as active_count,
                SUM(CASE WHEN is_blacklisted = 1 THEN 1 ELSE 0 END) as blacklisted_count
            FROM users
            WHERE role != 'admin'
            GROUP BY role
        `;
        const [userStats] = await db.execute(userStatsSql);
        stats.users = userStats;
        
        // Quote statistics
        const quoteStatsSql = `
            SELECT 
                status,
                COUNT(*) as count
            FROM quotes
            GROUP BY status
        `;
        const [quoteStats] = await db.execute(quoteStatsSql);
        stats.quotes = quoteStats;
        
        // Subscription statistics
        const subscriptionStatsSql = `
            SELECT 
                status,
                COUNT(*) as count,
                SUM(amount_paid) as total_revenue
            FROM user_subscriptions
            GROUP BY status
        `;
        const [subscriptionStats] = await db.execute(subscriptionStatsSql);
        stats.subscriptions = subscriptionStats;
        
        // Transaction statistics
        const transactionStatsSql = `
            SELECT 
                status,
                COUNT(*) as count,
                SUM(amount) as total_amount
            FROM transactions
            GROUP BY status
        `;
        const [transactionStats] = await db.execute(transactionStatsSql);
        stats.transactions = transactionStats;

        // Dispute statistics
        const disputeStatsSql = `
            SELECT 
                status,
                COUNT(*) as count,
                AVG(CASE 
                    WHEN priority = 'urgent' THEN 4
                    WHEN priority = 'high' THEN 3
                    WHEN priority = 'medium' THEN 2
                    WHEN priority = 'low' THEN 1
                    ELSE 2
                END) as avg_priority_score
            FROM disputes
            GROUP BY status
        `;
        const [disputeStats] = await db.execute(disputeStatsSql);
        stats.disputes = disputeStats;

        // Monthly revenue data for charts (last 6 months)
        const monthlyRevenueSql = `
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                DATE_FORMAT(created_at, '%b %Y') as month_name,
                SUM(CASE WHEN quote_response_id IS NOT NULL THEN amount ELSE 0 END) as quote_revenue,
                SUM(CASE WHEN subscription_id IS NOT NULL THEN amount ELSE 0 END) as subscription_revenue,
                SUM(amount) as total_revenue,
                COUNT(*) as transaction_count
            FROM transactions 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            AND status = 'completed'
            GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b %Y')
            ORDER BY month ASC
        `;
        const [monthlyRevenue] = await db.execute(monthlyRevenueSql);
        stats.monthlyRevenue = monthlyRevenue;

        // Monthly user growth data (last 6 months)
        const monthlyUserGrowthSql = `
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                DATE_FORMAT(created_at, '%b %Y') as month_name,
                COUNT(*) as new_users,
                SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as new_regular_users,
                SUM(CASE WHEN role = 'company' THEN 1 ELSE 0 END) as new_companies,
                SUM(CASE WHEN role = 'business' THEN 1 ELSE 0 END) as new_businesses
            FROM users 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            AND role != 'admin'
            GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b %Y')
            ORDER BY month ASC
        `;
        const [monthlyUserGrowth] = await db.execute(monthlyUserGrowthSql);
        stats.monthlyUserGrowth = monthlyUserGrowth;

        // Top performing metrics
        const topMetricsSql = `
            SELECT 
                (SELECT COUNT(*) FROM quotes WHERE status = 'running') as active_quotes,
                (SELECT COUNT(*) FROM user_subscriptions WHERE status = 'active') as active_subscriptions,
                (SELECT COUNT(*) FROM users WHERE status = 1 AND role != 'admin') as active_users,
                (SELECT COUNT(*) FROM transactions WHERE status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as monthly_transactions,
                (SELECT AVG(amount) FROM transactions WHERE status = 'completed') as avg_transaction_value,
                (SELECT COUNT(*) FROM quotes WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as weekly_quotes,
                (SELECT COUNT(*) FROM disputes WHERE status = 'pending') as pending_disputes,
                (SELECT COUNT(*) FROM disputes WHERE status = 'resolved' AND resolved_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as monthly_resolved_disputes,
                (SELECT COUNT(*) FROM disputes) as total_disputes
        `;
        const [topMetrics] = await db.execute(topMetricsSql);
        stats.topMetrics = topMetrics[0];

        // Recent activity with more details (simplified)
        const recentActivitySql = `
            SELECT 
                'user_registration' as type,
                name as title,
                email as description,
                created_at,
                role as metadata
            FROM users
            WHERE role != 'admin'
            AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ORDER BY created_at DESC
            LIMIT 10
        `;
        const [recentActivity] = await db.execute(recentActivitySql);
        stats.recentActivity = recentActivity;

        // Performance metrics
        const performanceMetricsSql = `
            SELECT 
                (SELECT COUNT(*) FROM quotes WHERE status = 'running') / NULLIF((SELECT COUNT(*) FROM quotes), 0) * 100 as quote_success_rate,
                (SELECT COUNT(*) FROM user_subscriptions WHERE status = 'active') / NULLIF((SELECT COUNT(*) FROM users WHERE role != 'admin'), 0) * 100 as subscription_rate,
                (SELECT COUNT(*) FROM transactions WHERE status = 'completed') / NULLIF((SELECT COUNT(*) FROM transactions), 0) * 100 as transaction_success_rate
        `;
        const [performanceMetrics] = await db.execute(performanceMetricsSql);
        stats.performanceMetrics = performanceMetrics[0];
        
        res.status(200).json(stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Server error fetching dashboard stats' });
    }
};

// ==================== FRAUD MANAGEMENT ====================

// @desc    Block/Unblock user (enhanced blacklist)
// @route   PUT /api/admin-panel/users/:id/block
// @access  Admin
export const blockUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { blocked, reason } = req.body;
        
        const sql = `
            UPDATE users 
            SET is_blacklisted = ?, 
                status = ?,
                updated_at = NOW()
            WHERE id = ?
        `;
        
        const [result] = await db.execute(sql, [blocked ? 1 : 0, blocked ? 0 : 1, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Log the action
        if (blocked && reason) {
            const logSql = `
                INSERT INTO admin_actions (admin_id, action_type, target_user_id, reason, created_at)
                VALUES (?, 'block_user', ?, ?, NOW())
            `;
            await db.execute(logSql, [req.user.id, id, reason]);
        }
        
        res.status(200).json({ 
            message: blocked ? 'User blocked successfully' : 'User unblocked successfully' 
        });
    } catch (error) {
        console.error('Error blocking/unblocking user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete transaction (admin action)
// @route   DELETE /api/admin-panel/transactions/:id
// @access  Admin
export const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        
        // First check if transaction exists
        const checkSql = 'SELECT id, user_id, amount, status FROM transactions WHERE id = ?';
        const [existingTransaction] = await db.execute(checkSql, [id]);
        
        if (existingTransaction.length === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        
        // Delete the transaction
        const deleteSql = 'DELETE FROM transactions WHERE id = ?';
        const [result] = await db.execute(deleteSql, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        
        res.status(200).json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ message: 'Server error deleting transaction' });
    }
};

// @desc    Delete user account (permanent)
// @route   DELETE /api/admin-panel/users/:id
// @access  Admin
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        
        // Log the deletion before deleting
        const logSql = `
            INSERT INTO admin_actions (admin_id, action_type, target_user_id, reason, created_at)
            VALUES (?, 'delete_user', ?, ?, NOW())
        `;
        await db.execute(logSql, [req.user.id, id, reason || 'No reason provided']);
        
        // Delete user (cascading will handle related records)
        const sql = 'DELETE FROM users WHERE id = ? AND role != "admin"';
        const [result] = await db.execute(sql, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found or cannot delete admin' });
        }
        
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error deleting user' });
    }
};

export default {
    getAllSubscriptionsAdmin,
    getSubscriptionById,
    getAllTransactions,
    getAllQuotesAdmin,
    getQuoteByIdAdmin,
    deleteQuote,
    updateQuoteStatusAdmin,
    getUserSubscriptions,
    getUserQuotes,
    getCompanyResponses,
    getAdminDashboardStats,
    blockUser,
    deleteUser,
    deleteTransaction
};
