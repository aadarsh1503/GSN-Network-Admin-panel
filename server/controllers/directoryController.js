// controllers/directoryController.js
import db from '../config/db.js';

// @desc    Get membership directory (all active companies)
// @route   GET /api/directory/companies
// @access  Public
const getMembershipDirectory = async (req, res) => {
    const { 
        search, category, country, state, city, 
        serviceType, page = 1, limit = 12 
    } = req.query;

    try {
        let sql = `
            SELECT u.id, u.name, u.email, u.phone, u.logo, u.about_company,
                   u.category, u.country, u.state, u.city, u.services,
                   u.website, u.facebook, u.twitter, u.instagram, u.linkedin,
                   AVG(r.rating) as average_rating,
                   COUNT(r.id) as total_reviews
            FROM users u
            LEFT JOIN reviews r ON u.id = r.company_id AND r.status = 'approved'
            WHERE u.role = 'company' AND u.status = 1 AND u.is_blacklisted = 0
        `;

        const queryParams = [];

        // Add search filters
        if (search) {
            sql += ` AND (u.name LIKE ? OR u.about_company LIKE ?)`;
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        if (category) {
            sql += ` AND u.category = ?`;
            queryParams.push(category);
        }

        if (country) {
            sql += ` AND u.country = ?`;
            queryParams.push(country);
        }

        if (state) {
            sql += ` AND u.state = ?`;
            queryParams.push(state);
        }

        if (city) {
            sql += ` AND u.city = ?`;
            queryParams.push(city);
        }

        if (serviceType) {
            sql += ` AND u.services LIKE ?`;
            queryParams.push(`%${serviceType}%`);
        }

        sql += ` GROUP BY u.id ORDER BY average_rating DESC, total_reviews DESC`;

        // Add pagination
        const offset = (page - 1) * limit;
        sql += ` LIMIT ? OFFSET ?`;
        queryParams.push(parseInt(limit), parseInt(offset));

        const [rows] = await db.execute(sql, queryParams);

        // Get total count for pagination
        let countSql = `
            SELECT COUNT(DISTINCT u.id) as total
            FROM users u
            WHERE u.role = 'company' AND u.status = 1 AND u.is_blacklisted = 0
        `;

        const countParams = [];
        if (search) {
            countSql += ` AND (u.name LIKE ? OR u.about_company LIKE ?)`;
            countParams.push(`%${search}%`, `%${search}%`);
        }
        if (category) {
            countSql += ` AND u.category = ?`;
            countParams.push(category);
        }
        if (country) {
            countSql += ` AND u.country = ?`;
            countParams.push(country);
        }
        if (state) {
            countSql += ` AND u.state = ?`;
            countParams.push(state);
        }
        if (city) {
            countSql += ` AND u.city = ?`;
            countParams.push(city);
        }
        if (serviceType) {
            countSql += ` AND u.services LIKE ?`;
            countParams.push(`%${serviceType}%`);
        }

        const [countRows] = await db.execute(countSql, countParams);
        const totalCompanies = countRows[0].total;

        // Parse services JSON for each company
        const companies = rows.map(company => ({
            ...company,
            services: company.services ? JSON.parse(company.services) : [],
            average_rating: company.average_rating ? Math.round(company.average_rating * 10) / 10 : 0
        }));

        res.status(200).json({
            companies,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCompanies / limit),
                totalCompanies,
                hasNext: page * limit < totalCompanies,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Error fetching membership directory:', error);
        res.status(500).json({ message: 'Server error fetching directory' });
    }
};

// @desc    Get company profile details
// @route   GET /api/directory/company/:id
// @access  Public
const getCompanyProfile = async (req, res) => {
    const { id } = req.params;

    try {
        // Get company details
        const [companyRows] = await db.execute(`
            SELECT u.*, 
                   AVG(r.rating) as average_rating,
                   COUNT(r.id) as total_reviews
            FROM users u
            LEFT JOIN reviews r ON u.id = r.company_id AND r.status = 'approved'
            WHERE u.id = ? AND u.role = 'company' AND u.status = 1 AND u.is_blacklisted = 0
            GROUP BY u.id
        `, [id]);

        if (companyRows.length === 0) {
            return res.status(404).json({ message: 'Company not found' });
        }

        const company = companyRows[0];

        // Get company branches
        const [branches] = await db.execute(
            'SELECT * FROM company_branches WHERE company_id = ?', 
            [id]
        );

        // Get company members
        const [members] = await db.execute(`
            SELECT cm.*, cb.branch_name 
            FROM company_members cm
            JOIN company_branches cb ON cm.branch_id = cb.id
            WHERE cm.company_id = ?
        `, [id]);

        // Get recent reviews
        const [reviews] = await db.execute(`
            SELECT r.*, u.name as reviewer_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.company_id = ? AND r.status = 'approved'
            ORDER BY r.created_at DESC
            LIMIT 10
        `, [id]);

        res.status(200).json({
            company: {
                ...company,
                services: company.services ? JSON.parse(company.services) : [],
                average_rating: company.average_rating ? Math.round(company.average_rating * 10) / 10 : 0
            },
            branches,
            members,
            reviews
        });

    } catch (error) {
        console.error('Error fetching company profile:', error);
        res.status(500).json({ message: 'Server error fetching company profile' });
    }
};

// @desc    Get directory filters/options
// @route   GET /api/directory/filters
// @access  Public
const getDirectoryFilters = async (req, res) => {
    try {
        // Get unique categories
        const [categories] = await db.execute(`
            SELECT DISTINCT category 
            FROM users 
            WHERE role = 'company' AND status = 1 AND is_blacklisted = 0 AND category IS NOT NULL
            ORDER BY category
        `);

        // Get unique countries
        const [countries] = await db.execute(`
            SELECT DISTINCT country 
            FROM users 
            WHERE role = 'company' AND status = 1 AND is_blacklisted = 0 AND country IS NOT NULL
            ORDER BY country
        `);

        // Get unique states
        const [states] = await db.execute(`
            SELECT DISTINCT state 
            FROM users 
            WHERE role = 'company' AND status = 1 AND is_blacklisted = 0 AND state IS NOT NULL
            ORDER BY state
        `);

        res.status(200).json({
            categories: categories.map(c => c.category),
            countries: countries.map(c => c.country),
            states: states.map(s => s.state)
        });

    } catch (error) {
        console.error('Error fetching directory filters:', error);
        res.status(500).json({ message: 'Server error fetching filters' });
    }
};

export {
    getMembershipDirectory,
    getCompanyProfile,
    getDirectoryFilters
};