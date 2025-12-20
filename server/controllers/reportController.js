// controllers/reportController.js
import db from '../config/db.js';

// @desc    Get membership report
// @route   GET /api/reports/membership
// @access  Private/Admin
const getMembershipReport = async (req, res) => {
    const { startDate, endDate } = req.query;

    try {
        let dateFilter = '';
        const params = [];

        if (startDate && endDate) {
            dateFilter = 'AND u.created_at BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        const sql = `
            SELECT 
                DATE(u.created_at) as date,
                COUNT(*) as total_registrations,
                SUM(CASE WHEN u.role = 'company' THEN 1 ELSE 0 END) as companies,
                SUM(CASE WHEN u.role = 'business' THEN 1 ELSE 0 END) as businesses,
                SUM(CASE WHEN u.status = 1 THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN u.is_blacklisted = 1 THEN 1 ELSE 0 END) as blacklisted
            FROM users u
            WHERE u.role != 'admin' ${dateFilter}
            GROUP BY DATE(u.created_at)
            ORDER BY date DESC
            LIMIT 100
        `;

        const [rows] = await db.execute(sql, params);

        // Get summary
        const [summary] = await db.execute(`
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN role = 'company' THEN 1 ELSE 0 END) as total_companies,
                SUM(CASE WHEN role = 'business' THEN 1 ELSE 0 END) as total_businesses,
                SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as total_active,
                SUM(CASE WHEN is_blacklisted = 1 THEN 1 ELSE 0 END) as total_blacklisted
            FROM users WHERE role != 'admin'
        `);

        res.status(200).json({
            report: rows,
            summary: summary[0]
        });
    } catch (error) {
        console.error('Error generating membership report:', error);
        res.status(500).json({ message: 'Server error generating report' });
    }
};

// @desc    Get transactions report
// @route   GET /api/reports/transactions
// @access  Private/Admin
const getTransactionsReport = async (req, res) => {
    const { startDate, endDate } = req.query;

    try {
        let dateFilter = '';
        const params = [];

        if (startDate && endDate) {
            dateFilter = 'WHERE t.created_at BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        const sql = `
            SELECT 
                DATE(t.created_at) as date,
                COUNT(*) as total_transactions,
                SUM(t.amount) as total_amount,
                SUM(CASE WHEN t.status = 'completed' THEN t.amount ELSE 0 END) as completed_amount,
                SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) as pending_count,
                SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
                SUM(CASE WHEN t.status = 'failed' THEN 1 ELSE 0 END) as failed_count
            FROM transactions t
            ${dateFilter}
            GROUP BY DATE(t.created_at)
            ORDER BY date DESC
            LIMIT 100
        `;

        const [rows] = await db.execute(sql, params);

        // Get summary
        const [summary] = await db.execute(`
            SELECT 
                COUNT(*) as total_transactions,
                COALESCE(SUM(amount), 0) as total_amount,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_completed
            FROM transactions
        `);

        res.status(200).json({
            report: rows,
            summary: summary[0]
        });
    } catch (error) {
        console.error('Error generating transactions report:', error);
        res.status(500).json({ message: 'Server error generating report' });
    }
};

// @desc    Get quotes report
// @route   GET /api/reports/quotes
// @access  Private/Admin
const getQuotesReport = async (req, res) => {
    const { startDate, endDate } = req.query;

    try {
        let dateFilter = '';
        const params = [];

        if (startDate && endDate) {
            dateFilter = 'WHERE q.created_at BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        const sql = `
            SELECT 
                DATE(q.created_at) as date,
                COUNT(*) as total_quotes,
                SUM(CASE WHEN q.status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN q.status = 'approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN q.status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                SUM(CASE WHEN q.status = 'running' THEN 1 ELSE 0 END) as running,
                SUM(CASE WHEN q.status = 'closed' THEN 1 ELSE 0 END) as closed
            FROM quotes q
            ${dateFilter}
            GROUP BY DATE(q.created_at)
            ORDER BY date DESC
            LIMIT 100
        `;

        const [rows] = await db.execute(sql, params);

        // Get summary
        const [summary] = await db.execute(`
            SELECT 
                COUNT(*) as total_quotes,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as total_pending,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as total_approved,
                SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as total_closed
            FROM quotes
        `);

        // Get response stats
        const [responseStats] = await db.execute(`
            SELECT 
                COUNT(*) as total_responses,
                SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_responses
            FROM quote_responses
        `);

        res.status(200).json({
            report: rows,
            summary: { ...summary[0], ...responseStats[0] }
        });
    } catch (error) {
        console.error('Error generating quotes report:', error);
        res.status(500).json({ message: 'Server error generating report' });
    }
};

// @desc    Get logins report
// @route   GET /api/reports/logins
// @access  Private/Admin
const getLoginsReport = async (req, res) => {
    const { startDate, endDate } = req.query;

    try {
        let dateFilter = '';
        const params = [];

        if (startDate && endDate) {
            dateFilter = 'WHERE lh.login_time BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        const sql = `
            SELECT 
                DATE(lh.login_time) as date,
                COUNT(*) as total_logins,
                COUNT(DISTINCT lh.user_id) as unique_users,
                SUM(CASE WHEN lh.status = 'success' THEN 1 ELSE 0 END) as successful,
                SUM(CASE WHEN lh.status = 'failed' THEN 1 ELSE 0 END) as failed
            FROM login_history lh
            ${dateFilter}
            GROUP BY DATE(lh.login_time)
            ORDER BY date DESC
            LIMIT 100
        `;

        const [rows] = await db.execute(sql, params);

        // Get recent logins
        const [recentLogins] = await db.execute(`
            SELECT lh.*, u.name as user_name, u.email as user_email, u.role as user_role
            FROM login_history lh
            JOIN users u ON lh.user_id = u.id
            ORDER BY lh.login_time DESC
            LIMIT 50
        `);

        res.status(200).json({
            report: rows,
            recentLogins
        });
    } catch (error) {
        console.error('Error generating logins report:', error);
        res.status(500).json({ message: 'Server error generating report' });
    }
};

export {
    getMembershipReport,
    getTransactionsReport,
    getQuotesReport,
    getLoginsReport
};
