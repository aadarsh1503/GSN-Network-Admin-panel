// controllers/dashboardController.js
import db from '../config/db.js';

// @desc    Get admin dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        // Get user counts
        const [userStats] = await db.execute(`
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN role = 'business' THEN 1 ELSE 0 END) as business_users,
                SUM(CASE WHEN role = 'company' THEN 1 ELSE 0 END) as company_users,
                SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as active_users,
                SUM(CASE WHEN is_blacklisted = 1 THEN 1 ELSE 0 END) as blacklisted_users
            FROM users 
            WHERE role != 'admin'
        `);

        // Get quote counts
        const [quoteStats] = await db.execute(`
            SELECT 
                COUNT(*) as total_quotes,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_quotes,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_quotes,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_quotes,
                SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running_quotes,
                SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_quotes
            FROM quotes
        `);

        // Get quote response counts
        const [responseStats] = await db.execute(`
            SELECT 
                COUNT(*) as total_responses,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_responses,
                SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_responses,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_responses
            FROM quote_responses
        `);

        // Get ticket counts
        const [ticketStats] = await db.execute(`
            SELECT 
                COUNT(*) as total_tickets,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tickets,
                SUM(CASE WHEN status = 'answered' THEN 1 ELSE 0 END) as answered_tickets,
                SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_tickets
            FROM support_tickets
        `);

        // Get review counts
        const [reviewStats] = await db.execute(`
            SELECT 
                COUNT(*) as total_reviews,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_reviews,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_reviews,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_reviews,
                AVG(rating) as average_rating
            FROM reviews
        `);

        // Get recent activity (last 30 days)
        const [recentActivity] = await db.execute(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM (
                SELECT created_at FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                UNION ALL
                SELECT created_at FROM quotes WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                UNION ALL
                SELECT created_at FROM quote_responses WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            ) as activity
            GROUP BY DATE(created_at)
            ORDER BY date DESC
            LIMIT 30
        `);

        res.status(200).json({
            users: userStats[0],
            quotes: quoteStats[0],
            responses: responseStats[0],
            tickets: ticketStats[0],
            reviews: {
                ...reviewStats[0],
                average_rating: reviewStats[0].average_rating ? Math.round(reviewStats[0].average_rating * 10) / 10 : 0
            },
            recentActivity
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Server error fetching dashboard statistics' });
    }
};

// @desc    Get company dashboard statistics
// @route   GET /api/dashboard/company-stats
// @access  Private/Company
const getCompanyDashboardStats = async (req, res) => {
    const companyId = req.user.id;

    try {
        // Get quote response stats for this company
        const [responseStats] = await db.execute(`
            SELECT 
                COUNT(*) as total_responses,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_responses,
                SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_responses,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_responses,
                AVG(price) as average_quote_price
            FROM quote_responses
            WHERE company_id = ?
        `, [companyId]);

        // Get review stats for this company
        const [reviewStats] = await db.execute(`
            SELECT 
                COUNT(*) as total_reviews,
                AVG(rating) as average_rating,
                AVG(reliability) as average_reliability,
                AVG(communication) as average_communication,
                AVG(timeliness) as average_timeliness,
                AVG(overall_experience) as average_overall
            FROM reviews
            WHERE company_id = ? AND status = 'approved'
        `, [companyId]);

        // Get message stats
        const [messageStats] = await db.execute(`
            SELECT 
                COUNT(*) as total_messages,
                SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_messages
            FROM messages
            WHERE receiver_id = ?
        `, [companyId]);

        // Get branch and member counts
        const [branchCount] = await db.execute(
            'SELECT COUNT(*) as total_branches FROM company_branches WHERE company_id = ?',
            [companyId]
        );

        const [memberCount] = await db.execute(
            'SELECT COUNT(*) as total_members FROM company_members WHERE company_id = ?',
            [companyId]
        );

        // Get recent quotes available for response (last 30 days)
        // Filter by company's location - show quotes that are either from or to the company's country
        const [companyLocation] = await db.execute(`
            SELECT country FROM users WHERE id = ?
        `, [companyId]);

        const companyCountry = companyLocation[0]?.country;

        let availableQuotesQuery;
        let queryParams;

        if (companyCountry) {
            // Filter quotes based on company's country
            availableQuotesQuery = `
                SELECT COUNT(*) as available_quotes
                FROM quotes q
                WHERE q.status IN ('pending', 'approved') 
                AND q.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                AND (q.departure_country = ? OR q.arrival_country = ?)
                AND q.id NOT IN (
                    SELECT quote_id FROM quote_responses WHERE company_id = ?
                )
                AND q.id NOT IN (
                    SELECT quote_id FROM user_quote_status WHERE status = 'accepted'
                )
            `;
            queryParams = [companyCountry, companyCountry, companyId];
        } else {
            // Fallback to original query if no country specified
            availableQuotesQuery = `
                SELECT COUNT(*) as available_quotes
                FROM quotes q
                WHERE q.status IN ('pending', 'approved') 
                AND q.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                AND q.id NOT IN (
                    SELECT quote_id FROM quote_responses WHERE company_id = ?
                )
                AND q.id NOT IN (
                    SELECT quote_id FROM user_quote_status WHERE status = 'accepted'
                )
            `;
            queryParams = [companyId];
        }

        const [availableQuotes] = await db.execute(availableQuotesQuery, queryParams);

        res.status(200).json({
            responses: responseStats[0],
            reviews: {
                ...reviewStats[0],
                average_rating: reviewStats[0].average_rating ? Math.round(reviewStats[0].average_rating * 10) / 10 : 0,
                average_reliability: reviewStats[0].average_reliability ? Math.round(reviewStats[0].average_reliability * 10) / 10 : 0,
                average_communication: reviewStats[0].average_communication ? Math.round(reviewStats[0].average_communication * 10) / 10 : 0,
                average_timeliness: reviewStats[0].average_timeliness ? Math.round(reviewStats[0].average_timeliness * 10) / 10 : 0,
                average_overall: reviewStats[0].average_overall ? Math.round(reviewStats[0].average_overall * 10) / 10 : 0
            },
            messages: messageStats[0],
            branches: branchCount[0].total_branches,
            members: memberCount[0].total_members,
            availableQuotes: availableQuotes[0].available_quotes
        });

    } catch (error) {
        console.error('Error fetching company dashboard stats:', error);
        res.status(500).json({ message: 'Server error fetching company dashboard statistics' });
    }
};

export {
    getDashboardStats,
    getCompanyDashboardStats
};